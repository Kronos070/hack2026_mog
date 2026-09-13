package com.hack2026.mog.services;

import com.hack2026.mog.dto.config.BoosterTierPricingDto;
import com.hack2026.mog.dto.config.GameConfigDto;
import com.hack2026.mog.dto.game.GameRoundStartResult;
import com.hack2026.mog.dto.game.StartRoundRequest;
import com.hack2026.mog.entities.GameRound;
import com.hack2026.mog.entities.User;
import com.hack2026.mog.exceptions.BadRequestException;
import com.hack2026.mog.math.CrashGenerator;
import com.hack2026.mog.math.HouseEdgeCalculator;
import com.hack2026.mog.repositories.GameRoundRepository;
import com.hack2026.mog.repositories.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GameServiceBoosterTest {

    static class StubUserRepository extends UserRepository {
        Map<Long, User> users = new HashMap<>();

        @Override
        public Optional<User> findByIdOptional(Long id) {
            return Optional.ofNullable(users.get(id));
        }

        @Override
        public User findById(Long id) {
            return users.get(id);
        }
    }

    static class StubGameRoundRepository extends GameRoundRepository {
        @Override
        public Optional<GameRound> findActiveByUserId(Long userId) {
            return Optional.empty();
        }

        @Override
        public void persist(GameRound entity) {
            // no-op stub
        }
    }

    static class StubGameConfigService extends GameConfigService {
        GameConfigDto config = GameConfigDto.defaultConfig();

        @Override
        public GameConfigDto getCurrentConfig() {
            return config;
        }

        @Override
        public GameConfigDto saveConfig(GameConfigDto newConfig) {
            this.config = newConfig;
            return newConfig;
        }
    }

    private StubUserRepository stubUserRepository;
    private StubGameRoundRepository stubGameRoundRepository;
    private StubGameConfigService stubGameConfigService;
    private GameService gameService;

    @BeforeEach
    void setUp() {
        stubUserRepository = new StubUserRepository();
        stubGameRoundRepository = new StubGameRoundRepository();
        stubGameConfigService = new StubGameConfigService();

        gameService = new GameService(
                stubUserRepository,
                stubGameRoundRepository,
                stubGameConfigService,
                new CrashGenerator(),
                new HouseEdgeCalculator(),
                null,
                null
        );
    }

    @Test
    void testStartRoundWithBoosterX2Deducts2Fragments() {
        User user = new User("pilot", "pilot@example.com", "hash");
        user.setId(1L);
        user.setBonusBalance(1000L);
        user.setFragmentBalance(6);
        stubUserRepository.users.put(1L, user);

        StartRoundRequest request = new StartRoundRequest(100L, "green", 2);
        GameRoundStartResult result = gameService.startRound(1L, request);

        assertNotNull(result);
        assertEquals(2, result.boosterMultiplier());
        assertEquals(900L, user.getBonusBalance());
        assertEquals(4, user.getFragmentBalance()); // 6 - 2 = 4
    }

    @Test
    void testStartRoundWithBoosterX4Deducts6Fragments() {
        User user = new User("pilot", "pilot@example.com", "hash");
        user.setId(1L);
        user.setBonusBalance(1000L);
        user.setFragmentBalance(6);
        stubUserRepository.users.put(1L, user);

        StartRoundRequest request = new StartRoundRequest(100L, "green", 4);
        GameRoundStartResult result = gameService.startRound(1L, request);

        assertNotNull(result);
        assertEquals(4, result.boosterMultiplier());
        assertEquals(0, user.getFragmentBalance()); // 6 - 6 = 0
    }

    @Test
    void testStartRoundWithBoosterInsufficientFragmentsThrowsBadRequest() {
        User user = new User("pilot", "pilot@example.com", "hash");
        user.setId(1L);
        user.setBonusBalance(1000L);
        user.setFragmentBalance(1); // Only 1 fragment, x2 needs 2
        stubUserRepository.users.put(1L, user);

        StartRoundRequest request = new StartRoundRequest(100L, "green", 2);
        BadRequestException ex = assertThrows(BadRequestException.class, () -> gameService.startRound(1L, request));
        assertTrue(ex.getMessage().contains("Недостаточно фрагментов"));
        assertEquals(1, user.getFragmentBalance()); // not deducted
    }

    @Test
    void testStartRoundWithoutBoosterDoesNotDeductFragments() {
        User user = new User("pilot", "pilot@example.com", "hash");
        user.setId(1L);
        user.setBonusBalance(1000L);
        user.setFragmentBalance(6);
        stubUserRepository.users.put(1L, user);

        StartRoundRequest request = new StartRoundRequest(100L, "green", 1);
        GameRoundStartResult result = gameService.startRound(1L, request);

        assertNotNull(result);
        assertEquals(1, result.boosterMultiplier());
        assertEquals(6, user.getFragmentBalance()); // 6 unchanged
    }

    @Test
    void testBoosterPricingDefaultConfigAndCustom() {
        GameConfigDto config = GameConfigDto.defaultConfig();
        assertEquals(0, config.getBoosterCost(1));
        assertEquals(2, config.getBoosterCost(2));
        assertEquals(4, config.getBoosterCost(3));
        assertEquals(6, config.getBoosterCost(4));

        List<BoosterTierPricingDto> pricing = stubGameConfigService.getBoosterPricing();
        assertEquals(4, pricing.size());
        assertEquals(0, pricing.get(0).costFragments());
        assertEquals(2, pricing.get(1).costFragments());
        assertEquals(4, pricing.get(2).costFragments());
        assertEquals(6, pricing.get(3).costFragments());

        // Update pricing
        List<BoosterTierPricingDto> updated = stubGameConfigService.updateBoosterPricing(List.of(0, 3, 5, 7));
        assertEquals(3, updated.get(1).costFragments());
        assertEquals(5, updated.get(2).costFragments());
        assertEquals(7, updated.get(3).costFragments());
    }
}
