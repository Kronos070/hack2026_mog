package com.hack2026.mog.services;

import com.hack2026.mog.dto.config.GameConfigDto;
import com.hack2026.mog.dto.game.ActiveGameRound;
import com.hack2026.mog.dto.game.GameRoundCashoutResult;
import com.hack2026.mog.dto.game.GameRoundStartResult;
import com.hack2026.mog.dto.game.GameRoundStateResult;
import com.hack2026.mog.dto.game.StartRoundRequest;
import com.hack2026.mog.entities.GameRound;
import com.hack2026.mog.entities.User;
import com.hack2026.mog.exceptions.BadRequestException;
import com.hack2026.mog.exceptions.NotFoundException;
import com.hack2026.mog.math.CrashGenerator;
import com.hack2026.mog.math.CrashResult;
import com.hack2026.mog.math.HouseEdgeCalculator;
import com.hack2026.mog.math.RoundOutcome;
import com.hack2026.mog.repositories.GameRoundRepository;
import com.hack2026.mog.repositories.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Внутренний сервис игрового цикла (Game Lifecycle) для одного игрока.
 * <p>
 * Ответственность:
 * <ul>
 *   <li>Server-Authoritative расчет точки краха через {@link CrashGenerator}</li>
 *   <li>Динамический расчет и сохранение персонального House Edge игрока через {@link HouseEdgeCalculator}</li>
 *   <li>Пассивный расчет времени по timestamp с экспоненциальным ростом множителя M(t) = 1.00 * e^(k * t)</li>
 *   <li>Гибридное хранение: in-memory кэш {@link ActiveGameRound} + персистентность в БД {@link GameRound}</li>
 * </ul>
 */
@ApplicationScoped
public class GameService {

    private static final org.jboss.logging.Logger LOG = org.jboss.logging.Logger.getLogger(GameService.class);

    /**
     * Константа экспоненциального роста множителя в секунду (fallback): M(t) = 1.00 * e^(GROWTH_RATE * t).
     */
    public static final double DEFAULT_GROWTH_RATE = 0.22;

    private final UserRepository userRepository;
    private final GameRoundRepository gameRoundRepository;
    private final CrashGenerator crashGenerator;
    private final HouseEdgeCalculator houseEdgeCalculator;
    private final GameConfigService gameConfigService;

    /**
     * In-memory кэш активных раундов: userId -> ActiveGameRound
     */
    private final Map<Long, ActiveGameRound> activeRounds = new ConcurrentHashMap<>();

    @Inject
    public GameService(UserRepository userRepository,
                       GameRoundRepository gameRoundRepository,
                       GameConfigService gameConfigService) {
        this.userRepository = userRepository;
        this.gameRoundRepository = gameRoundRepository;
        this.gameConfigService = gameConfigService;
        this.crashGenerator = new CrashGenerator();
        this.houseEdgeCalculator = new HouseEdgeCalculator();
    }

    /**
     * Конструктор для тестирования с кастомными генератором и калькулятором.
     */
    public GameService(UserRepository userRepository,
                       GameRoundRepository gameRoundRepository,
                       GameConfigService gameConfigService,
                       CrashGenerator crashGenerator,
                       HouseEdgeCalculator houseEdgeCalculator) {
        this.userRepository = userRepository;
        this.gameRoundRepository = gameRoundRepository;
        this.gameConfigService = gameConfigService;
        this.crashGenerator = crashGenerator;
        this.houseEdgeCalculator = houseEdgeCalculator;
    }

    public GameService(UserRepository userRepository,
                       GameRoundRepository gameRoundRepository,
                       CrashGenerator crashGenerator,
                       HouseEdgeCalculator houseEdgeCalculator) {
        this(userRepository, gameRoundRepository, null, crashGenerator, houseEdgeCalculator);
    }

    public GameService(UserRepository userRepository, GameRoundRepository gameRoundRepository) {
        this(userRepository, gameRoundRepository, null);
    }

    private GameConfigDto getCurrentConfigOrDefault() {
        return gameConfigService != null ? gameConfigService.getCurrentConfig() : GameConfigDto.defaultConfig();
    }

    /**
     * Запуск нового раунда игры для одного игрока.
     *
     * @param userId  ID игрока
     * @param request Параметры раунда (ставка, тема, бустер)
     * @return {@link GameRoundStartResult} с ID раунда, Provably Fair хэшем и параметрами кривой
     */
    @Transactional
    public GameRoundStartResult startRound(Long userId, StartRoundRequest request) {
        Objects.requireNonNull(userId, "userId must not be null");
        Objects.requireNonNull(request, "request must not be null");

        User user = userRepository.findByIdOptional(userId)
                .orElseThrow(() -> new NotFoundException("User not found with id: " + userId));

        // Проверяем, нет ли уже активного раунда у этого пользователя
        ActiveGameRound existingActive = activeRounds.get(userId);
        Instant now = Instant.now();
        if (existingActive != null) {
            if (existingActive.isExpiredAt(now)) {
                // Если раунд уже крашнулся по времени, автоматически закрываем его
                resolveCrash(existingActive, now);
            } else {
                throw new BadRequestException("You already have an active game round in progress: " + existingActive.roundId());
            }
        }

        GameConfigDto currentConfig = getCurrentConfigOrDefault();
        double growthRate = currentConfig.multiplierGrowthRate();
        int pointsPerLine = currentConfig.pointsPerLine();
        int pointsCashoutBonus = currentConfig.pointsCashoutBonus();
        int pointsBoosterBonus = currentConfig.pointsBoosterBonus();

        // Дополнительная проверка в БД
        Optional<GameRound> dbActive = gameRoundRepository.findActiveByUserId(userId);
        if (dbActive.isPresent()) {
            GameRound round = dbActive.get();
            Instant roundCrashTime = calculateCrashTime(round.getStartTime(), round.getCrashMultiplier(), growthRate);
            if (now.isAfter(roundCrashTime)) {
                resolveDbCrash(round, user, roundCrashTime);
            } else {
                throw new BadRequestException("Active game round exists in database: " + round.getId());
            }
        }

        // Проверка баланса
        long betAmount = request.betAmount();
        if (user.getBonusBalance() < betAmount) {
            throw new BadRequestException("Insufficient bonus balance: required " + betAmount + ", available " + user.getBonusBalance());
        }

        // Списание ставки с баланса
        user.setBonusBalance(user.getBonusBalance() - betAmount);

        // Получаем персональный House Edge игрока
        double playerHouseEdge = user.getCurrentHouseEdge();
        Long previousBet = user.getLastBetAmount();

        // Генерация параметров Provably Fair и расчет краха
        String serverSeed = CrashGenerator.generateSecureSeed();
        String clientSeed = UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        long nonce = System.currentTimeMillis();

        CrashResult crashResult = crashGenerator.generateCrash(serverSeed, clientSeed, nonce, playerHouseEdge);
        double crashMultiplier = crashResult.multiplier();

        // Расчет времени краха по экспоненциальной формуле
        Instant startTime = now;
        Instant crashTime = calculateCrashTime(startTime, crashMultiplier, growthRate);
        UUID roundId = UUID.randomUUID();

        // Конфигурация уровней и бустера для выбранной темы
        String theme = request.theme();
        int totalLevels = GameLevelConfig.getTotalLevels(theme);
        double unlockMultiplier = GameLevelConfig.getUnlockMultiplier(theme);

        int boosterMult = request.boosterMultiplier() != null ? request.boosterMultiplier() : 1;
        Integer boosterLevel = null;
        Double boosterThreshold = null;

        if (boosterMult > 1) {
            boosterLevel = GameLevelConfig.determineBoosterLevel(theme, crashResult.hashHex());
            boosterThreshold = GameLevelConfig.getThresholdForLevel(theme, boosterLevel);
        }

        // Создаем и сохраняем сущность раунда со статусом IN_PROGRESS
        GameRound gameRound = new GameRound(
                roundId,
                user,
                theme,
                betAmount,
                boosterMult,
                crashMultiplier,
                playerHouseEdge,
                serverSeed,
                clientSeed,
                crashResult.hashHex(),
                nonce,
                startTime
        );
        gameRound.setBoosterLevel(boosterLevel);
        gameRoundRepository.persist(gameRound);

        // Помещаем в in-memory кэш со снапшотом параметров для мгновенной валидации cashout
        ActiveGameRound activeRound = new ActiveGameRound(
                roundId,
                userId,
                betAmount,
                boosterMult,
                boosterLevel,
                boosterThreshold,
                theme,
                crashMultiplier,
                playerHouseEdge,
                previousBet,
                startTime,
                crashTime,
                serverSeed,
                clientSeed,
                crashResult.hashHex(),
                nonce,
                totalLevels,
                unlockMultiplier,
                growthRate,
                pointsPerLine,
                pointsCashoutBonus,
                pointsBoosterBonus
        );
        activeRounds.put(userId, activeRound);
        LOG.infof("Round started: roundId=%s, userId=%d, bet=%d, theme=%s, booster=x%d, growthRate=%.2f",
                roundId, userId, betAmount, theme, boosterMult, growthRate);

        return new GameRoundStartResult(
                roundId,
                startTime,
                CrashGenerator.MIN_CRASH,
                growthRate,
                crashResult.hashHex(),
                betAmount,
                boosterMult,
                boosterLevel,
                totalLevels,
                unlockMultiplier,
                user.getBonusBalance()
        );
    }

    /**
     * Завершение раунда игроком (Cashout) по текущему серверному времени.
     *
     * @param userId  ID игрока
     * @param roundId UUID раунда
     * @return {@link GameRoundCashoutResult} с исходом раунда, множителем и обновленным балансом
     */
    @Transactional
    public GameRoundCashoutResult cashout(Long userId, UUID roundId) {
        Objects.requireNonNull(userId, "userId must not be null");
        Objects.requireNonNull(roundId, "roundId must not be null");

        Instant now = Instant.now();

        // Ищем активный раунд в in-memory кэше
        ActiveGameRound activeRound = activeRounds.get(userId);

        if (activeRound == null || !activeRound.roundId().equals(roundId)) {
            // Если в кэше нет, ищем в БД
            GameRound dbRound = gameRoundRepository.findByIdOptional(roundId)
                    .orElseThrow(() -> new NotFoundException("Game round not found: " + roundId));

            if (!dbRound.getUser().getId().equals(userId)) {
                throw new BadRequestException("Round does not belong to user: " + userId);
            }

            if (!GameRound.STATUS_IN_PROGRESS.equals(dbRound.getStatus())) {
                throw new BadRequestException("Game round is already finished with status: " + dbRound.getStatus());
            }

            // Восстанавливаем ActiveGameRound из БД с актуальным конфигом
            GameConfigDto cfg = getCurrentConfigOrDefault();
            Instant crashTime = calculateCrashTime(dbRound.getStartTime(), dbRound.getCrashMultiplier(), cfg.multiplierGrowthRate());
            String theme = dbRound.getTheme();
            int totalLevels = GameLevelConfig.getTotalLevels(theme);
            double unlockMultiplier = GameLevelConfig.getUnlockMultiplier(theme);
            int boosterMult = dbRound.getBoosterMultiplier() != null ? dbRound.getBoosterMultiplier() : 1;
            Integer boosterLevel = dbRound.getBoosterLevel();
            Double boosterThreshold = (boosterMult > 1 && boosterLevel != null)
                    ? GameLevelConfig.getThresholdForLevel(theme, boosterLevel)
                    : null;

            activeRound = new ActiveGameRound(
                    dbRound.getId(),
                    userId,
                    dbRound.getBetAmount(),
                    boosterMult,
                    boosterLevel,
                    boosterThreshold,
                    theme,
                    dbRound.getCrashMultiplier(),
                    dbRound.getHouseEdge(),
                    dbRound.getUser() != null ? dbRound.getUser().getLastBetAmount() : null,
                    dbRound.getStartTime(),
                    crashTime,
                    dbRound.getServerSeed(),
                    dbRound.getClientSeed(),
                    dbRound.getCombinedHash(),
                    dbRound.getNonce(),
                    totalLevels,
                    unlockMultiplier,
                    cfg.multiplierGrowthRate(),
                    cfg.pointsPerLine(),
                    cfg.pointsCashoutBonus(),
                    cfg.pointsBoosterBonus()
            );
        }

        User user = userRepository.findByIdOptional(userId)
                .orElseThrow(() -> new NotFoundException("User not found with id: " + userId));

        // Проверяем: крашнулся ли шар к моменту прихода запроса на сервер
        if (activeRound.isExpiredAt(now)) {
            // Игрок опоздал — краш!
            return resolveCrash(activeRound, now);
        }

        // Базовый множитель полета на текущий момент
        double rawBaseMultiplier = calculateMultiplierAt(activeRound.startTime(), now, activeRound.growthRate());
        double baseMultiplier = CrashGenerator.floorTo2Decimals(rawBaseMultiplier);

        // Проверка прохождения 1-го уровня для разблокировки кнопки «Забрать» (по CASE.md)
        if (baseMultiplier < activeRound.unlockMultiplier()) {
            throw new BadRequestException("Вывод доступен только после прохождения 1-го уровня (коэффициент не ниже " + activeRound.unlockMultiplier() + "x)");
        }

        // Проверка краха
        if (baseMultiplier >= activeRound.crashMultiplier()) {
            return resolveCrash(activeRound, now);
        }

        // Фиксируем факт кэшаута до возможного достижения бустера позже
        activeRound.markCashedOut();

        // Проверяем применение бустера: активируется, если шар достиг уровня бустера до нажатия cashout
        boolean boosterActivated = false;
        double currentMultiplier = baseMultiplier;
        if (activeRound.hasBooster()) {
            if (activeRound.isBoosterActivated() || baseMultiplier >= activeRound.boosterThreshold()) {
                activeRound.markBoosterActivated();
                boosterActivated = true;
                currentMultiplier = CrashGenerator.floorTo2Decimals(baseMultiplier * activeRound.boosterMultiplier());
            }
        }

        if (currentMultiplier < CrashGenerator.MIN_CRASH) {
            currentMultiplier = CrashGenerator.MIN_CRASH;
        }

        // Расчет выигрыша с учетом активированного бустера
        long winAmount = Math.round(activeRound.betAmount() * currentMultiplier);

        // Расчет заработанных игровых очков
        int passedLevels = GameLevelConfig.calculatePassedLevels(activeRound.theme(), baseMultiplier);
        int pointsEarned = GameLevelConfig.calculatePoints(
                passedLevels, true, boosterActivated,
                activeRound.pointsPerLine(), activeRound.pointsCashoutBonus(), activeRound.pointsBoosterBonus()
        );

        // Начисление выигрыша и очков на баланс
        user.setBonusBalance(user.getBonusBalance() + winAmount);
        user.setPoints((user.getPoints() != null ? user.getPoints() : 0L) + pointsEarned);

        // Обновление персонального House Edge игрока (выигрыш)
        RoundOutcome winOutcome = RoundOutcome.win(
                activeRound.betAmount(),
                toDoubleOrNull(activeRound.previousBetAmount()),
                currentMultiplier
        );
        double nextHe = houseEdgeCalculator.calculateNextHouseEdge(activeRound.houseEdge(), winOutcome);
        user.setCurrentHouseEdge(nextHe);
        user.setLastBetAmount(activeRound.betAmount());

        // Обновляем запись раунда в БД
        GameRound round = gameRoundRepository.findById(activeRound.roundId());
        if (round != null) {
            round.setStatus(GameRound.STATUS_FINISHED);
            round.setIsWin(true);
            round.setCashoutMultiplier(currentMultiplier);
            round.setWinAmount(winAmount);
            round.setPointsEarned(pointsEarned);
            round.setEndTime(now);
        }

        // Удаляем из in-memory кэша
        activeRounds.remove(userId);

        LOG.infof("Cashout success: roundId=%s, userId=%d, mult=%.2fx, win=%d, points=%d, newBalance=%d",
                activeRound.roundId(), userId, currentMultiplier, winAmount, pointsEarned, user.getBonusBalance());

        return new GameRoundCashoutResult(
                activeRound.roundId(),
                GameRound.STATUS_FINISHED,
                true,
                currentMultiplier,
                activeRound.crashMultiplier(),
                winAmount,
                user.getBonusBalance(),
                pointsEarned,
                passedLevels,
                boosterActivated,
                activeRound.boosterMultiplier(),
                nextHe,
                activeRound.serverSeed(),
                activeRound.clientSeed(),
                activeRound.nonce()
        );
    }

    /**
     * Получить текущее состояние раунда игрока (с авто-проверкой краша).
     */
    @Transactional
    public GameRoundStateResult checkRoundState(Long userId, UUID roundId) {
        Objects.requireNonNull(userId, "userId must not be null");
        Objects.requireNonNull(roundId, "roundId must not be null");

        Instant now = Instant.now();
        ActiveGameRound activeRound = activeRounds.get(userId);

        if (activeRound != null && activeRound.roundId().equals(roundId)) {
            if (activeRound.isExpiredAt(now)) {
                // Автоматически завершаем крашем
                GameRoundCashoutResult cr = resolveCrash(activeRound, now);
                return new GameRoundStateResult(
                        roundId,
                        GameRound.STATUS_CRASHED,
                        true,
                        cr.crashMultiplier(),
                        cr.crashMultiplier(),
                        Duration.between(activeRound.startTime(), activeRound.crashTime()).toMillis(),
                        0L,
                        activeRound.startTime(),
                        cr.levelsPassed(),
                        cr.pointsEarned(),
                        cr.boosterActivated()
                );
            }

            double currentMultiplier = CrashGenerator.floorTo2Decimals(
                    calculateMultiplierAt(activeRound.startTime(), now, activeRound.growthRate())
            );
            long elapsedMs = Math.max(0, Duration.between(activeRound.startTime(), now).toMillis());
            long potentialWin = Math.round(activeRound.betAmount() * currentMultiplier);
            int passedLevels = GameLevelConfig.calculatePassedLevels(activeRound.theme(), currentMultiplier);
            int currentPoints = GameLevelConfig.calculatePoints(
                    passedLevels, false, activeRound.isBoosterActivated(),
                    activeRound.pointsPerLine(), activeRound.pointsCashoutBonus(), activeRound.pointsBoosterBonus()
            );

            return new GameRoundStateResult(
                    roundId,
                    GameRound.STATUS_IN_PROGRESS,
                    false,
                    currentMultiplier,
                    null, // Скрываем множитель краха до окончания раунда
                    elapsedMs,
                    potentialWin,
                    activeRound.startTime(),
                    passedLevels,
                    currentPoints,
                    activeRound.isBoosterActivated()
            );
        }

        // Если нет в памяти, читаем из базы данных
        GameRound dbRound = gameRoundRepository.findByIdOptional(roundId)
                .orElseThrow(() -> new NotFoundException("Game round not found: " + roundId));

        boolean isCrashed = GameRound.STATUS_CRASHED.equals(dbRound.getStatus());
        double mult = dbRound.getCashoutMultiplier() != null
                ? dbRound.getCashoutMultiplier()
                : dbRound.getCrashMultiplier();

        long elapsedMs = dbRound.getEndTime() != null && dbRound.getStartTime() != null
                ? Duration.between(dbRound.getStartTime(), dbRound.getEndTime()).toMillis()
                : 0L;
        int passedLevels = GameLevelConfig.calculatePassedLevels(dbRound.getTheme(), mult);
        boolean boosterAct = dbRound.getBoosterMultiplier() != null && dbRound.getBoosterMultiplier() > 1;

        return new GameRoundStateResult(
                roundId,
                dbRound.getStatus(),
                isCrashed,
                mult,
                dbRound.getCrashMultiplier(),
                elapsedMs,
                dbRound.getWinAmount(),
                dbRound.getStartTime(),
                passedLevels,
                dbRound.getPointsEarned(),
                boosterAct
        );
    }

    /**
     * Разрешение краха для активного in-memory раунда.
     */
    @Transactional
    public GameRoundCashoutResult resolveCrash(ActiveGameRound activeRound, Instant now) {
        User user = userRepository.findById(activeRound.userId());

        // Проверяем, активировался ли бустер до момента краха
        boolean boosterActivated = activeRound.isBoosterActivated();
        if (!boosterActivated && activeRound.hasBooster() && activeRound.crashMultiplier() >= activeRound.boosterThreshold()) {
            boosterActivated = true;
            activeRound.markBoosterActivated();
        }

        double finalCrashMultiplier = boosterActivated
                ? CrashGenerator.floorTo2Decimals(activeRound.crashMultiplier() * activeRound.boosterMultiplier())
                : activeRound.crashMultiplier();

        int passedLevels = GameLevelConfig.calculatePassedLevels(activeRound.theme(), activeRound.crashMultiplier());
        int pointsEarned = GameLevelConfig.calculatePoints(
                passedLevels, false, boosterActivated,
                activeRound.pointsPerLine(), activeRound.pointsCashoutBonus(), activeRound.pointsBoosterBonus()
        );

        // Обновление персонального House Edge игрока (проигрыш)
        RoundOutcome lossOutcome = RoundOutcome.loss(
                activeRound.betAmount(),
                toDoubleOrNull(activeRound.previousBetAmount())
        );
        double nextHe = houseEdgeCalculator.calculateNextHouseEdge(activeRound.houseEdge(), lossOutcome);

        if (user != null) {
            user.setCurrentHouseEdge(nextHe);
            user.setLastBetAmount(activeRound.betAmount());
            user.setPoints((user.getPoints() != null ? user.getPoints() : 0L) + pointsEarned);
        }

        // Обновляем запись в БД
        GameRound round = gameRoundRepository.findById(activeRound.roundId());
        if (round != null) {
            round.setStatus(GameRound.STATUS_CRASHED);
            round.setIsWin(false);
            round.setWinAmount(0L);
            round.setPointsEarned(pointsEarned);
            round.setEndTime(activeRound.crashTime().isBefore(now) ? activeRound.crashTime() : now);
        }

        // Удаляем из памяти
        activeRounds.remove(activeRound.userId());

        LOG.infof("Round crashed: roundId=%s, userId=%d, crashMult=%.2fx, points=%d",
                activeRound.roundId(), activeRound.userId(), finalCrashMultiplier, pointsEarned);

        long balance = user != null ? user.getBonusBalance() : 0L;

        return new GameRoundCashoutResult(
                activeRound.roundId(),
                GameRound.STATUS_CRASHED,
                false,
                0.0,
                finalCrashMultiplier,
                0L,
                balance,
                pointsEarned,
                passedLevels,
                boosterActivated,
                activeRound.boosterMultiplier(),
                nextHe,
                activeRound.serverSeed(),
                activeRound.clientSeed(),
                activeRound.nonce()
        );
    }

    private void resolveDbCrash(GameRound round, User user, Instant crashTime) {
        RoundOutcome lossOutcome = RoundOutcome.loss(
                round.getBetAmount(),
                toDoubleOrNull(user.getLastBetAmount())
        );
        double nextHe = houseEdgeCalculator.calculateNextHouseEdge(round.getHouseEdge(), lossOutcome);
        user.setCurrentHouseEdge(nextHe);
        user.setLastBetAmount(round.getBetAmount());

        GameConfigDto cfg = getCurrentConfigOrDefault();
        int passedLevels = GameLevelConfig.calculatePassedLevels(round.getTheme(), round.getCrashMultiplier());
        boolean wasBooster = round.getBoosterMultiplier() != null && round.getBoosterMultiplier() > 1;
        int pointsEarned = GameLevelConfig.calculatePoints(
                passedLevels, false, wasBooster,
                cfg.pointsPerLine(), cfg.pointsCashoutBonus(), cfg.pointsBoosterBonus()
        );
        user.setPoints((user.getPoints() != null ? user.getPoints() : 0L) + pointsEarned);
        round.setPointsEarned(pointsEarned);

        round.setStatus(GameRound.STATUS_CRASHED);
        round.setIsWin(false);
        round.setWinAmount(0L);
        round.setEndTime(crashTime);
        activeRounds.remove(user.getId());
    }

    private static Double toDoubleOrNull(Long value) {
        return value != null ? value.doubleValue() : null;
    }

    /**
     * Расчет текущего множителя по экспоненциальной формуле:
     * M(t) = 1.00 * e^(growthRate * t_sec).
     */
    public static double calculateMultiplierAt(Instant startTime, Instant now, double growthRate) {
        if (now.isBefore(startTime)) {
            return CrashGenerator.MIN_CRASH;
        }
        double elapsedSeconds = Duration.between(startTime, now).toNanos() / 1_000_000_000.0;
        double multiplier = Math.exp(growthRate * elapsedSeconds);
        return Math.max(CrashGenerator.MIN_CRASH, multiplier);
    }

    /**
     * Расчет времени краха от момента старта:
     * t_sec = ln(crashMultiplier) / growthRate.
     */
    public static Instant calculateCrashTime(Instant startTime, double crashMultiplier, double growthRate) {
        if (crashMultiplier <= CrashGenerator.MIN_CRASH) {
            return startTime;
        }
        double secondsToCrash = Math.log(crashMultiplier) / growthRate;
        long nanosToCrash = (long) (secondsToCrash * 1_000_000_000.0);
        return startTime.plusNanos(nanosToCrash);
    }

    /**
     * Получить текущий персональный House Edge игрока.
     */
    public double getPlayerHouseEdge(Long userId) {
        return userRepository.findByIdOptional(userId)
                .map(User::getCurrentHouseEdge)
                .orElse(0.04);
    }

    /**
     * Сброс персонального House Edge игрока к базовому значению HE_base (0.04).
     */
    @Transactional
    public double resetPlayerHouseEdge(Long userId) {
        User user = userRepository.findByIdOptional(userId)
                .orElseThrow(() -> new NotFoundException("User not found with id: " + userId));
        user.setCurrentHouseEdge(houseEdgeCalculator.getConfig().baseHe());
        user.setLastBetAmount(null);
        return user.getCurrentHouseEdge();
    }

    public HouseEdgeCalculator getHouseEdgeCalculator() {
        return houseEdgeCalculator;
    }

    public CrashGenerator getCrashGenerator() {
        return crashGenerator;
    }

    public Map<Long, ActiveGameRound> getActiveRounds() {
        return activeRounds;
    }

    public ActiveGameRound getActiveRound(Long userId) {
        return activeRounds.get(userId);
    }
}
