package com.hack2026.mog.services;

import com.hack2026.mog.dto.meta.AchievementDto;
import com.hack2026.mog.dto.meta.ProfileDto;
import com.hack2026.mog.dto.meta.ProfileUserDto;
import com.hack2026.mog.dto.meta.RankDto;
import com.hack2026.mog.dto.meta.RewardDto;
import com.hack2026.mog.dto.meta.StatRadarDto;
import com.hack2026.mog.entities.GameRound;
import com.hack2026.mog.entities.User;
import com.hack2026.mog.entities.UserAchievement;
import com.hack2026.mog.entities.UserPuzzlePiece;
import com.hack2026.mog.entities.UserStatRadar;
import com.hack2026.mog.repositories.GameRoundRepository;
import com.hack2026.mog.repositories.UserAchievementRepository;
import com.hack2026.mog.repositories.UserPuzzlePieceRepository;
import com.hack2026.mog.repositories.UserRepository;
import com.hack2026.mog.repositories.UserStatRadarRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@ApplicationScoped
public class MetaGameService {

    private static final Logger LOG = Logger.getLogger(MetaGameService.class);
    public static final int TOTAL_PUZZLE_PIECES = 10;

    public record AchievementDef(String id, String title, String description, String letter) {}

    public static final List<String> PUZZLE_PIECE_IDS = List.of(
            "piece_1", "piece_2", "piece_3",
            "piece_4", "piece_5", "piece_6",
            "piece_7", "piece_8", "piece_9", "piece_10"
    );

    public static final List<AchievementDef> ACHIEVEMENTS = List.of(
            new AchievementDef("first_flight", "Первый полет", "Сыграть первый раунд в игре", "П"),
            new AchievementDef("lucky_start", "Удачный старт", "Выиграть свой первый раунд", "У"),
            new AchievementDef("high_flight_5x", "Высокий полет (x5+)", "Забрать выигрыш на множителе x5 или выше", "В"),
            new AchievementDef("stratosphere_10x", "Стратосфера (x10+)", "Забрать выигрыш на множителе x10 или выше", "С"),
            new AchievementDef("risky_captain", "Рисковый капитан", "Забрать выигрыш на множителе x20 или выше", "Р"),
            new AchievementDef("win_streak_3", "Серия побед", "Одержать победу в 3 раундах подряд", "П"),
            new AchievementDef("booster_master", "Мастер бустеров", "Активировать бустер во время полета", "М"),
            new AchievementDef("puzzle_collector", "Коллекционер пазлов", "Собрать все 10 фрагментов пазла", "К"),
            new AchievementDef("high_roller", "Щедрый игрок", "Сделать ставку от 250 бонусов за раунд", "Щ"),
            new AchievementDef("sky_legend", "Легенда небес", "Достичь наивысшего ранга «Легенда небес»", "Л")
    );

    @Inject
    UserPuzzlePieceRepository userPuzzlePieceRepository;

    @Inject
    UserAchievementRepository userAchievementRepository;

    @Inject
    UserRepository userRepository;

    @Inject
    GameRoundRepository gameRoundRepository;

    @Inject
    UserStatRadarRepository userStatRadarRepository;

    public record RoundMetaResult(
            RewardDto reward,
            List<AchievementDto> unlockedAchievements
    ) {}

    @Transactional
    public RoundMetaResult processRoundCompletion(User user, GameRound round, boolean isWin, double roundMultiplier, boolean boosterActivated) {
        if (user == null) {
            return new RoundMetaResult(
                    RewardDto.puzzlePiece("none", "Без фрагмента", 0, TOTAL_PUZZLE_PIECES),
                    List.of()
            );
        }

        Long userId = user.getId();

        // 1. Обработка выпадения фрагмента пазла (Bad Luck Protection + Pity Timer)
        RewardDto reward = evaluatePuzzleDrop(user);

        // 2. Обработка разблокировки достижений
        List<AchievementDto> unlocked = evaluateAchievements(user, round, isWin, roundMultiplier, boosterActivated, reward);

        // 3. Обновление полигона характеристик игрока (RADAR-1)
        maybeUpdateStatRadar(user);

        return new RoundMetaResult(reward, unlocked);
    }

    private RewardDto evaluatePuzzleDrop(User user) {
        Long userId = user.getId();
        int currentFragments = user.getFragmentBalance() != null ? user.getFragmentBalance() : 0;

        if (currentFragments >= TOTAL_PUZZLE_PIECES) {
            return RewardDto.puzzlePiece("completed", "Коллекция собрана", TOTAL_PUZZLE_PIECES, TOTAL_PUZZLE_PIECES);
        }

        int pity = user.getPuzzlePity() != null ? user.getPuzzlePity() : 0;
        // Базовый шанс 30% + 20% за каждый пустой раунд
        double dropChance = Math.min(1.0, 0.30 + pity * 0.20);
        boolean dropped = ThreadLocalRandom.current().nextDouble() < dropChance;

        if (dropped) {
            int newBalance = Math.min(TOTAL_PUZZLE_PIECES, currentFragments + 1);
            user.setFragmentBalance(newBalance);
            user.setPuzzlePity(0);

            String pickedPieceId = "piece_" + newBalance;
            List<String> collectedPieceIds = userPuzzlePieceRepository.findPieceIdsByUserId(userId);
            if (!collectedPieceIds.contains(pickedPieceId)) {
                UserPuzzlePiece piece = new UserPuzzlePiece(user, pickedPieceId);
                userPuzzlePieceRepository.persist(piece);
            }

            String label = getPuzzleLabel(pickedPieceId);
            LOG.infof("Puzzle piece dropped: userId=%d, pieceId=%s, collected=%d/%d, pityReset=0",
                    userId, pickedPieceId, newBalance, TOTAL_PUZZLE_PIECES);

            return RewardDto.puzzlePiece(pickedPieceId, label, newBalance, TOTAL_PUZZLE_PIECES);
        }

        // Без выпадения: увеличиваем pity-счетчик
        user.setPuzzlePity(pity + 1);
        LOG.debug("Puzzle piece not dropped: userId=" + userId + ", pity=" + (pity + 1) + ", dropChance=" + dropChance);

        return RewardDto.puzzlePiece("none", "Без фрагмента", currentFragments, TOTAL_PUZZLE_PIECES);
    }

    private List<AchievementDto> evaluateAchievements(User user, GameRound round, boolean isWin,
                                                      double roundMultiplier, boolean boosterActivated,
                                                      RewardDto reward) {
        Long userId = user.getId();
        List<UserAchievement> existing = userAchievementRepository.findByUserId(userId);
        Set<String> unlockedIds = existing.stream()
                .map(UserAchievement::getAchievementId)
                .collect(Collectors.toSet());

        GameRoundRepository.UserGameStats stats = gameRoundRepository.getUserStats(userId);
        long currentBet = round != null && round.getBetAmount() != null ? round.getBetAmount() : 0L;
        double profit = stats.totalPayout() - stats.totalWagered();

        List<AchievementDto> newlyUnlocked = new ArrayList<>();

        for (AchievementDef def : ACHIEVEMENTS) {
            if (unlockedIds.contains(def.id())) {
                continue;
            }

            boolean conditionMet = false;
            switch (def.id()) {
                case "first_flight" -> conditionMet = stats.roundsPlayed() >= 1;
                case "lucky_start" -> conditionMet = stats.roundsWon() >= 1 || isWin;
                case "high_flight_5x" -> conditionMet = stats.bestMultiplier() >= 5.0 || (isWin && roundMultiplier >= 5.0);
                case "stratosphere_10x" -> conditionMet = stats.bestMultiplier() >= 10.0 || (isWin && roundMultiplier >= 10.0);
                case "risky_captain" -> conditionMet = stats.bestMultiplier() >= 20.0 || (isWin && roundMultiplier >= 20.0);
                case "win_streak_3" -> conditionMet = isWin && gameRoundRepository.hasWinStreak(userId, 3);
                case "booster_master" -> conditionMet = boosterActivated;
                case "puzzle_collector" -> conditionMet = (user.getFragmentBalance() != null && user.getFragmentBalance() >= TOTAL_PUZZLE_PIECES)
                        || (reward != null && reward.collected() >= TOTAL_PUZZLE_PIECES);
                case "high_roller" -> conditionMet = stats.maxBet() >= 250 || currentBet >= 250;
                case "sky_legend" -> conditionMet = profit >= 50000.0;
            }

            if (conditionMet) {
                UserAchievement ua = new UserAchievement(user, def.id());
                userAchievementRepository.persist(ua);
                newlyUnlocked.add(new AchievementDto(
                        def.id(),
                        def.title(),
                        def.description(),
                        def.letter(),
                        ua.getUnlockedAt().toEpochMilli()
                ));
                LOG.infof("Achievement unlocked: userId=%d, achievement=%s (%s)", userId, def.id(), def.title());
            }
        }

        return newlyUnlocked;
    }

    public ProfileDto getProfile(Long userId) {
        User user = userRepository.findById(userId);
        if (user == null) {
            return null;
        }

        GameRoundRepository.UserGameStats stats = gameRoundRepository.getUserStats(userId);
        int fragmentCount = user.getFragmentBalance() != null ? user.getFragmentBalance() : 0;
        List<String> puzzle = java.util.stream.IntStream.rangeClosed(1, fragmentCount)
                .mapToObj(i -> "piece_" + i)
                .toList();

        double profit = stats.totalPayout() - stats.totalWagered();
        RankDto rank = computeRank(profit);

        Map<String, Long> unlockedMap = userAchievementRepository.findByUserId(userId).stream()
                .collect(Collectors.toMap(
                        UserAchievement::getAchievementId,
                        ua -> ua.getUnlockedAt() != null ? ua.getUnlockedAt().toEpochMilli() : System.currentTimeMillis(),
                        (existing, replacement) -> existing
                ));

        List<AchievementDto> achievements = ACHIEVEMENTS.stream()
                .map(def -> new AchievementDto(
                        def.id(),
                        def.title(),
                        def.description(),
                        def.letter(),
                        unlockedMap.get(def.id())
                ))
                .toList();

        ProfileUserDto userSummary = new ProfileUserDto(
                String.valueOf(user.getId()),
                user.getUsername(),
                "ADMIN".equalsIgnoreCase(user.getRole()) ? "admin" : "user",
                user.getBonusBalance() != null ? user.getBonusBalance() : 0L,
                user.getPoints() != null ? user.getPoints() : 0L
        );

        return new ProfileDto(
                userSummary,
                puzzle,
                TOTAL_PUZZLE_PIECES,
                (int) stats.roundsPlayed(),
                (int) stats.roundsWon(),
                stats.bestMultiplier(),
                stats.totalWagered(),
                stats.totalPayout(),
                rank,
                achievements
        );
    }

    public static RankDto computeRank(double profit) {
        if (profit >= 50000.0) {
            return new RankDto("sky_legend", "Легенда небес", 50000.0, null, null, profit);
        }
        if (profit >= 15000.0) {
            return new RankDto("wind_master", "Мастер ветра", 15000.0, "Легенда небес", 50000.0, profit);
        }
        if (profit >= 5000.0) {
            return new RankDto("captain", "Капитан", 5000.0, "Мастер ветра", 15000.0, profit);
        }
        if (profit >= 2000.0) {
            return new RankDto("aeronaut", "Воздухоплаватель", 2000.0, "Капитан", 5000.0, profit);
        }
        if (profit >= 500.0) {
            return new RankDto("amateur", "Любитель", 500.0, "Воздухоплаватель", 2000.0, profit);
        }
        return new RankDto("novice", "Новичок", 0.0, "Любитель", 500.0, profit);
    }

    public static String getPuzzleLabel(String pieceId) {
        if (pieceId == null) return "Фрагмент";
        return switch (pieceId) {
            case "piece_1" -> "Фрагмент 1";
            case "piece_2" -> "Фрагмент 2";
            case "piece_3" -> "Фрагмент 3";
            case "piece_4" -> "Фрагмент 4";
            case "piece_5" -> "Фрагмент 5";
            case "piece_6" -> "Фрагмент 6";
            case "piece_7" -> "Фрагмент 7";
            case "piece_8" -> "Фрагмент 8";
            case "piece_9" -> "Фрагмент 9";
            case "piece_10" -> "Фрагмент 10";
            default -> "Фрагмент";
        };
    }

    @Transactional
    public void maybeUpdateStatRadar(User user) {
        if (user == null || user.getId() == null) return;
        long totalCompleted = gameRoundRepository.countCompletedRoundsByUserId(user.getId());
        if (totalCompleted <= 0) return;

        if (totalCompleted <= 9 || totalCompleted % 10 == 0) {
            recalculateStatRadar(user, totalCompleted);
        } else {
            userStatRadarRepository.findByUserId(user.getId()).ifPresent(radar -> {
                int nextIn = (int) (10 - (totalCompleted % 10));
                radar.setTotalGames(totalCompleted);
                radar.setNextRecalcIn(nextIn);
            });
        }
    }

    @Transactional
    public UserStatRadar recalculateStatRadar(User user, long totalCompleted) {
        Long userId = user.getId();
        List<GameRound> rounds = gameRoundRepository.findHistoryByUserId(userId, 30);
        int n = rounds.size();

        int nextIn;
        if (totalCompleted < 10) {
            nextIn = 10 - (int) totalCompleted;
        } else {
            long rem = totalCompleted % 10;
            nextIn = rem == 0 ? 10 : (int) (10 - rem);
        }

        if (n == 0) {
            UserStatRadar emptyRadar = userStatRadarRepository.findByUserId(userId)
                    .orElseGet(() -> new UserStatRadar(user, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0, totalCompleted, nextIn));
            emptyRadar.setTotalGames(totalCompleted);
            emptyRadar.setNextRecalcIn(nextIn);
            userStatRadarRepository.persist(emptyRadar);
            return emptyRadar;
        }

        // 1. Выдержка (Patience): средний кэф забора в победных раундах
        List<GameRound> winningRounds = rounds.stream()
                .filter(r -> Boolean.TRUE.equals(r.getIsWin()) && r.getCashoutMultiplier() != null)
                .toList();
        double patience = 0.0;
        if (!winningRounds.isEmpty()) {
            double avgCashout = winningRounds.stream()
                    .mapToDouble(GameRound::getCashoutMultiplier)
                    .average()
                    .orElse(1.0);
            if (avgCashout > 1.0) {
                patience = Math.min(10.0, ((avgCashout - 1.0) / 4.0) * 10.0);
            }
        }

        // 2. Бустеры (Boosters): выбор бустера (до 5.0) + его реальная активация (до 5.0)
        long boosterChosenCount = rounds.stream()
                .filter(r -> r.getBoosterMultiplier() != null && r.getBoosterMultiplier() > 1)
                .count();
        long boosterActivatedCount = rounds.stream()
                .filter(r -> Boolean.TRUE.equals(r.getBoosterActivated()))
                .count();
        double chosenScore = ((double) boosterChosenCount / n) * 5.0;
        double activatedScore = boosterChosenCount > 0 ? (((double) boosterActivatedCount / boosterChosenCount) * 5.0) : 0.0;
        double boosters = Math.min(10.0, chosenScore + activatedScore);

        // 3. Коллекционер (Collector): прогресс коллекции по текущему балансу фрагментов (до 7.0) + дропы за окно (до 3.0)
        int currentFragments = user.getFragmentBalance() != null ? user.getFragmentBalance() : 0;
        double collectionScore = (Math.min(10.0, (double) currentFragments) / 10.0) * 7.0;
        Instant oldestRoundTime = rounds.get(rounds.size() - 1).getCreatedAt();
        long recentDrops = oldestRoundTime != null
                ? userPuzzlePieceRepository.countCollectedAfter(userId, oldestRoundTime)
                : 0L;
        double dropScore = Math.min(3.0, (double) recentDrops);
        double collector = Math.min(10.0, collectionScore + dropScore);

        // 4. Размах / Щедрость (Generosity): средний размер ставки по шкале пресетов
        double avgBet = rounds.stream()
                .mapToDouble(GameRound::getBetAmount)
                .average()
                .orElse(10.0);
        double generosity = computeGenerosityScore(avgBet);

        // 5. Винрейт (Win Rate): доля побед за окно
        long winsCount = rounds.stream()
                .filter(r -> Boolean.TRUE.equals(r.getIsWin()))
                .count();
        double winRate = ((double) winsCount / n) * 10.0;

        // 6. Азарт / Риск (Risk): красная тема (до 5.0) + дерзость близости к краху (до 5.0)
        long redThemeCount = rounds.stream()
                .filter(r -> "red".equalsIgnoreCase(r.getTheme()))
                .count();
        double redScore = ((double) redThemeCount / n) * 5.0;
        double avgDaring = rounds.stream().mapToDouble(r -> {
            if (Boolean.TRUE.equals(r.getIsWin()) && r.getCashoutMultiplier() != null && r.getCrashMultiplier() != null && r.getCrashMultiplier() > 0) {
                return Math.min(1.0, r.getCashoutMultiplier() / r.getCrashMultiplier());
            }
            return 1.0; // краш до вывода = максимальный риск
        }).average().orElse(0.5);
        double daringScore = avgDaring * 5.0;
        double risk = Math.min(10.0, redScore + daringScore);

        // Округляем до 1 знака после запятой
        double roundedPatience = roundOneDecimal(patience);
        double roundedBoosters = roundOneDecimal(boosters);
        double roundedCollector = roundOneDecimal(collector);
        double roundedGenerosity = roundOneDecimal(generosity);
        double roundedWinRate = roundOneDecimal(winRate);
        double roundedRisk = roundOneDecimal(risk);

        Optional<UserStatRadar> existingOpt = userStatRadarRepository.findByUserId(userId);
        UserStatRadar radar;
        if (existingOpt.isPresent()) {
            radar = existingOpt.get();
            radar.setPatience(roundedPatience);
            radar.setBoosters(roundedBoosters);
            radar.setCollector(roundedCollector);
            radar.setGenerosity(roundedGenerosity);
            radar.setWinRate(roundedWinRate);
            radar.setRisk(roundedRisk);
            radar.setGamesAnalyzed(n);
            radar.setTotalGames(totalCompleted);
            radar.setNextRecalcIn(nextIn);
        } else {
            radar = new UserStatRadar(user, roundedPatience, roundedBoosters, roundedCollector,
                    roundedGenerosity, roundedWinRate, roundedRisk, n, totalCompleted, nextIn);
            userStatRadarRepository.persist(radar);
        }

        LOG.infof("Stat radar recalculated for userId=%d: games=%d, patience=%.1f, boosters=%.1f, collector=%.1f, generosity=%.1f, winRate=%.1f, risk=%.1f, nextIn=%d",
                userId, n, roundedPatience, roundedBoosters, roundedCollector, roundedGenerosity, roundedWinRate, roundedRisk, nextIn);

        return radar;
    }

    private double computeGenerosityScore(double avgBet) {
        if (avgBet <= 10.0) {
            return Math.max(0.0, (avgBet / 10.0) * 1.0);
        } else if (avgBet <= 25.0) {
            return 1.0 + ((avgBet - 10.0) / 15.0) * 1.5;
        } else if (avgBet <= 50.0) {
            return 2.5 + ((avgBet - 25.0) / 25.0) * 2.5;
        } else if (avgBet <= 100.0) {
            return 5.0 + ((avgBet - 50.0) / 50.0) * 2.5;
        } else if (avgBet <= 250.0) {
            return 7.5 + ((avgBet - 100.0) / 150.0) * 2.5;
        }
        return 10.0;
    }

    private static double roundOneDecimal(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    @Transactional
    public StatRadarDto getStatRadar(Long userId) {
        if (userId == null) return null;
        User user = userRepository.findById(userId);
        if (user == null) return null;

        Optional<UserStatRadar> radarOpt = userStatRadarRepository.findByUserId(userId);
        if (radarOpt.isPresent()) {
            UserStatRadar r = radarOpt.get();
            return new StatRadarDto(
                    r.getPatience(),
                    r.getBoosters(),
                    r.getCollector(),
                    r.getGenerosity(),
                    r.getWinRate(),
                    r.getRisk(),
                    r.getGamesAnalyzed(),
                    r.getTotalGames(),
                    r.getNextRecalcIn()
            );
        }

        long totalCompleted = gameRoundRepository.countCompletedRoundsByUserId(userId);
        if (totalCompleted > 0) {
            UserStatRadar created = recalculateStatRadar(user, totalCompleted);
            return new StatRadarDto(
                    created.getPatience(),
                    created.getBoosters(),
                    created.getCollector(),
                    created.getGenerosity(),
                    created.getWinRate(),
                    created.getRisk(),
                    created.getGamesAnalyzed(),
                    created.getTotalGames(),
                    created.getNextRecalcIn()
            );
        }

        return StatRadarDto.empty(0L, 10);
    }
}
