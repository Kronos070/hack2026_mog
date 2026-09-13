package com.hack2026.mog.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hack2026.mog.dto.config.BoosterTierPricingDto;
import com.hack2026.mog.dto.config.GameConfigDto;
import com.hack2026.mog.entities.GameConfigEntity;
import com.hack2026.mog.repositories.GameConfigRepository;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Сервис управления динамической конфигурацией игры (GameConfig).
 * <p>
 * Обеспечивает:
 * <ul>
 *   <li>Потокобезопасное хранение в оперативной памяти через {@link AtomicReference}</li>
 *   <li>Чтение параметров без нагрузки на БД на тиках игрового цикла (O(1))</li>
 *   <li>Персистентность в PostgreSQL (таблица game_configs, JSONB)</li>
 *   <li>Self-healing при старте сервера: автоматическое сидирование дефолтного конфига при отсутствии/повреждении</li>
 * </ul>
 */
@ApplicationScoped
public class GameConfigService {

    private static final Logger LOG = Logger.getLogger(GameConfigService.class);
    public static final String PRIMARY_CONFIG_ID = "air-balloon";
    public static final String FALLBACK_CONFIG_ID = "default";

    private final AtomicReference<GameConfigDto> currentConfig = new AtomicReference<>(GameConfigDto.defaultConfig());

    @Inject
    GameConfigRepository configRepository;

    @Inject
    ObjectMapper objectMapper;

    void onStart(@Observes StartupEvent ev) {
        loadConfigFromDatabase();
    }

    /**
     * Загружает конфигурацию из БД при старте или выполняет self-healing.
     */
    @Transactional
    public void loadConfigFromDatabase() {
        try {
            GameConfigEntity entity = configRepository.findById(PRIMARY_CONFIG_ID);
            if (entity == null) {
                entity = configRepository.findById(FALLBACK_CONFIG_ID);
            }

            if (entity != null && entity.getConfigData() != null) {
                GameConfigDto parsed = objectMapper.readValue(entity.getConfigData(), GameConfigDto.class);
                currentConfig.set(parsed);
                LOG.infof("Loaded game config from database: gameId=%s, growthRate=%.2f, minCrash=%.2f",
                        parsed.gameId(), parsed.multiplierGrowthRate(), parsed.minCrashMultiplier());
                return;
            }
        } catch (Exception e) {
            LOG.warnf(e, "Could not load or parse existing game config from DB, applying self-healing");
        }

        // Self-healing: persist default canonical config
        try {
            resetConfig();
            LOG.info("Self-healing complete: default game config persisted to database");
        } catch (Exception e) {
            LOG.errorf(e, "Failed to persist default game config during self-healing, running on in-memory defaults");
            currentConfig.set(GameConfigDto.defaultConfig());
        }
    }

    /**
     * Получить актуальный снапшот конфигурации из памяти (O(1), без обращения к БД).
     */
    public GameConfigDto getCurrentConfig() {
        return currentConfig.get();
    }

    /**
     * Сохранить обновленную конфигурацию (транзакционно в БД + атомарно в память).
     */
    @Transactional
    public GameConfigDto saveConfig(GameConfigDto newConfig) {
        Objects.requireNonNull(newConfig, "newConfig must not be null");

        try {
            String json = objectMapper.writeValueAsString(newConfig);

            GameConfigEntity entity = configRepository.findById(PRIMARY_CONFIG_ID);
            if (entity == null) {
                entity = new GameConfigEntity(PRIMARY_CONFIG_ID, json);
                configRepository.persist(entity);
            } else {
                entity.setConfigData(json);
            }

            // Keep 'default' alias updated as well
            GameConfigEntity fallbackEntity = configRepository.findById(FALLBACK_CONFIG_ID);
            if (fallbackEntity != null) {
                fallbackEntity.setConfigData(json);
            }

            currentConfig.set(newConfig);
            LOG.infof("Game config updated successfully: gameId=%s, growthRate=%.2f, maxMultiplier=%.2f",
                    newConfig.gameId(), newConfig.multiplierGrowthRate(), newConfig.maxMultiplier());
            return newConfig;
        } catch (Exception e) {
            LOG.errorf(e, "Failed to save game config");
            throw new RuntimeException("Не удалось сохранить конфигурацию игры: " + e.getMessage(), e);
        }
    }

    /**
     * Сброс параметров к эталонным настройкам по умолчанию.
     */
    @Transactional
    public GameConfigDto resetConfig() {
        GameConfigDto defaults = GameConfigDto.defaultConfig();
        return saveConfig(defaults);
    }

    /**
     * Получить список стоимости бустеров во фрагментах по тирам.
     */
    public List<BoosterTierPricingDto> getBoosterPricing() {
        GameConfigDto cfg = getCurrentConfig();
        List<Double> mults = cfg.boosterTierValues();
        List<Integer> costs = cfg.boosterCostFragments();
        List<BoosterTierPricingDto> result = new ArrayList<>();
        for (int i = 0; i < mults.size(); i++) {
            int tier = i + 1;
            double mult = mults.get(i);
            int cost = (costs != null && i < costs.size()) ? costs.get(i) : 0;
            result.add(new BoosterTierPricingDto(tier, mult, cost));
        }
        return result;
    }

    /**
     * Обновить стоимость бустеров во фрагментах.
     */
    @Transactional
    public List<BoosterTierPricingDto> updateBoosterPricing(List<Integer> newCosts) {
        Objects.requireNonNull(newCosts, "newCosts must not be null");
        if (newCosts.size() != 4) {
            throw new IllegalArgumentException("Требуется список ровно из 4 стоимостей бустеров (для тиров 1..4)");
        }
        GameConfigDto current = getCurrentConfig();
        GameConfigDto updated = new GameConfigDto(
                current.gameId(),
                current.gameName(),
                current.isActive(),
                current.alpha(),
                current.maxMultiplier(),
                current.minCrashMultiplier(),
                current.multiplierGrowthRate(),
                current.growthAcceleration(),
                current.pointsPerLine(),
                current.pointsCashoutBonus(),
                current.pointsBoosterBonus(),
                current.boosterTierValues(),
                newCosts,
                current.lootProbabilities(),
                current.minWinAmount(),
                current.popupTimeout()
        );
        saveConfig(updated);
        return getBoosterPricing();
    }
}
