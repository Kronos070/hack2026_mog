package com.hack2026.mog.services;

import com.hack2026.mog.dto.meta.AchievementDto;
import com.hack2026.mog.dto.meta.ProfileDto;
import com.hack2026.mog.dto.meta.ProfileUserDto;
import com.hack2026.mog.dto.meta.RankDto;
import com.hack2026.mog.dto.meta.RewardDto;
import com.hack2026.mog.entities.GameRound;
import com.hack2026.mog.entities.User;
import com.hack2026.mog.entities.UserAchievement;
import com.hack2026.mog.entities.UserPuzzlePiece;
import com.hack2026.mog.repositories.GameRoundRepository;
import com.hack2026.mog.repositories.UserAchievementRepository;
import com.hack2026.mog.repositories.UserPuzzlePieceRepository;
import com.hack2026.mog.repositories.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@ApplicationScoped
public class MetaGameService {

    private static final Logger LOG = Logger.getLogger(MetaGameService.class);
    public static final int TOTAL_PUZZLE_PIECES = 9;

    public record AchievementDef(String id, String title, String description, String letter) {}

    public static final List<String> PUZZLE_PIECE_IDS = List.of(
            "piece_1", "piece_2", "piece_3",
            "piece_4", "piece_5", "piece_6",
            "piece_7", "piece_8", "piece_9"
    );

    public static final List<AchievementDef> ACHIEVEMENTS = List.of(
            new AchievementDef("first_flight", "Первый полет", "Сыграть первый раунд в игре", "П"),
            new AchievementDef("lucky_start", "Удачный старт", "Выиграть свой первый раунд", "У"),
            new AchievementDef("high_flight_5x", "Высокий полет (x5+)", "Забрать выигрыш на множителе x5 или выше", "В"),
            new AchievementDef("stratosphere_10x", "Стратосфера (x10+)", "Забрать выигрыш на множителе x10 или выше", "С"),
            new AchievementDef("risky_captain", "Рисковый капитан", "Забрать выигрыш на множителе x20 или выше", "Р"),
            new AchievementDef("win_streak_3", "Серия побед", "Одержать победу в 3 раундах подряд", "П"),
            new AchievementDef("booster_master", "Мастер бустеров", "Активировать бустер во время полета", "М"),
            new AchievementDef("puzzle_collector", "Коллекционер пазлов", "Собрать все 9 фрагментов пазла", "К"),
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

        return new RoundMetaResult(reward, unlocked);
    }

    private RewardDto evaluatePuzzleDrop(User user) {
        Long userId = user.getId();
        List<String> collectedPieceIds = userPuzzlePieceRepository.findPieceIdsByUserId(userId);
        int collectedCount = collectedPieceIds.size();

        if (collectedCount >= TOTAL_PUZZLE_PIECES) {
            return RewardDto.puzzlePiece("completed", "Коллекция собрана", TOTAL_PUZZLE_PIECES, TOTAL_PUZZLE_PIECES);
        }

        int pity = user.getPuzzlePity() != null ? user.getPuzzlePity() : 0;
        // Базовый шанс 30% + 20% за каждый пустой раунд
        double dropChance = Math.min(1.0, 0.30 + pity * 0.20);
        boolean dropped = ThreadLocalRandom.current().nextDouble() < dropChance;

        if (dropped) {
            List<String> missingPieces = PUZZLE_PIECE_IDS.stream()
                    .filter(id -> !collectedPieceIds.contains(id))
                    .toList();

            if (!missingPieces.isEmpty()) {
                String pickedPieceId = missingPieces.get(ThreadLocalRandom.current().nextInt(missingPieces.size()));
                UserPuzzlePiece piece = new UserPuzzlePiece(user, pickedPieceId);
                userPuzzlePieceRepository.persist(piece);

                user.setPuzzlePity(0);
                int newCount = collectedCount + 1;
                String label = getPuzzleLabel(pickedPieceId);

                LOG.infof("Puzzle piece dropped: userId=%d, pieceId=%s, collected=%d/%d, pityReset=0",
                        userId, pickedPieceId, newCount, TOTAL_PUZZLE_PIECES);

                return RewardDto.puzzlePiece(pickedPieceId, label, newCount, TOTAL_PUZZLE_PIECES);
            }
        }

        // Без выпадения: увеличиваем pity-счетчик
        user.setPuzzlePity(pity + 1);
        LOG.debug("Puzzle piece not dropped: userId=" + userId + ", pity=" + (pity + 1) + ", dropChance=" + dropChance);

        return RewardDto.puzzlePiece("none", "Без фрагмента", collectedCount, TOTAL_PUZZLE_PIECES);
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
                case "puzzle_collector" -> conditionMet = reward != null && reward.collected() >= TOTAL_PUZZLE_PIECES;
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
        List<String> puzzle = userPuzzlePieceRepository.findPieceIdsByUserId(userId);

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
            default -> "Фрагмент";
        };
    }
}
