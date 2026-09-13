package com.hack2026.mog.services;

import com.hack2026.mog.dto.meta.StatRadarDto;
import com.hack2026.mog.entities.GameRound;
import com.hack2026.mog.entities.User;
import com.hack2026.mog.entities.UserStatRadar;
import com.hack2026.mog.repositories.GameRoundRepository;
import com.hack2026.mog.repositories.UserAchievementRepository;
import com.hack2026.mog.repositories.UserPuzzlePieceRepository;
import com.hack2026.mog.repositories.UserRepository;
import com.hack2026.mog.repositories.UserStatRadarRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MetaGameServiceTest {

    private MetaGameService metaGameService;
    private StubGameRoundRepository stubGameRoundRepository;
    private StubUserStatRadarRepository stubUserStatRadarRepository;
    private StubUserPuzzlePieceRepository stubUserPuzzlePieceRepository;
    private StubUserRepository stubUserRepository;

    static class StubGameRoundRepository extends GameRoundRepository {
        List<GameRound> history = new ArrayList<>();
        long completedCount = 0;

        @Override
        public List<GameRound> findHistoryByUserId(Long userId, int limit) {
            return history;
        }

        @Override
        public long countCompletedRoundsByUserId(Long userId) {
            return completedCount;
        }

        @Override
        public UserGameStats getUserStats(Long userId) {
            return new UserGameStats(0, 0, 1.0, 0L, 0L, 0L);
        }
    }

    static class StubUserAchievementRepository extends UserAchievementRepository {
        @Override
        public List<com.hack2026.mog.entities.UserAchievement> findByUserId(Long userId) {
            return List.of();
        }
    }

    static class StubUserStatRadarRepository extends UserStatRadarRepository {
        UserStatRadar saved;

        @Override
        public Optional<UserStatRadar> findByUserId(Long userId) {
            return Optional.ofNullable(saved);
        }

        @Override
        public void persist(UserStatRadar entity) {
            this.saved = entity;
        }
    }

    static class StubUserPuzzlePieceRepository extends UserPuzzlePieceRepository {
        long pieceCount = 0;
        long recentCount = 0;

        @Override
        public long countByUserId(Long userId) {
            return pieceCount;
        }

        @Override
        public long countCollectedAfter(Long userId, Instant after) {
            return recentCount;
        }
    }

    static class StubUserRepository extends UserRepository {
        User user;

        @Override
        public User findById(Long id) {
            return user;
        }
    }

    @BeforeEach
    void setUp() {
        metaGameService = new MetaGameService();
        stubGameRoundRepository = new StubGameRoundRepository();
        stubUserStatRadarRepository = new StubUserStatRadarRepository();
        stubUserPuzzlePieceRepository = new StubUserPuzzlePieceRepository();
        stubUserRepository = new StubUserRepository();

        metaGameService.gameRoundRepository = stubGameRoundRepository;
        metaGameService.userStatRadarRepository = stubUserStatRadarRepository;
        metaGameService.userPuzzlePieceRepository = stubUserPuzzlePieceRepository;
        metaGameService.userRepository = stubUserRepository;
        metaGameService.userAchievementRepository = new StubUserAchievementRepository();
    }

    @Test
    void testRecalculateStatRadarWith30Rounds() {
        User user = new User("pilot", "pilot@example.com", "hash");
        user.setId(42L);

        List<GameRound> rounds = new ArrayList<>();
        Instant now = Instant.now();
        for (int i = 0; i < 30; i++) {
            GameRound round = new GameRound(UUID.randomUUID(), user, i % 2 == 0 ? "red" : "classic", 50L, 2, 3.5, 0.04, "s", "c", "h", 1L, now.minusSeconds(i * 60));
            round.setCreatedAt(now.minusSeconds(i * 60));
            round.setIsWin(i % 3 != 0); // 20 wins out of 30
            round.setCashoutMultiplier(3.0);
            round.setBoosterMultiplier(2);
            round.setBoosterActivated(true);
            rounds.add(round);
        }

        user.setFragmentBalance(6);
        stubGameRoundRepository.history = rounds;
        stubUserPuzzlePieceRepository.pieceCount = 6L;
        stubUserPuzzlePieceRepository.recentCount = 2L;

        UserStatRadar result = metaGameService.recalculateStatRadar(user, 30L);

        assertNotNull(result);
        assertEquals(30, result.getGamesAnalyzed());
        assertEquals(30L, result.getTotalGames());
        assertEquals(10, result.getNextRecalcIn());

        // Patience: avg cashout 3.0x -> ((3.0 - 1.0) / 4.0) * 10 = 5.0
        assertEquals(5.0, result.getPatience());

        // Boosters: all 30 rounds chosen (5.0) + all activated (5.0) = 10.0
        assertEquals(10.0, result.getBoosters());

        // Collector: 6/10 * 7.0 (4.2) + 2.0 recent = 6.2
        assertEquals(6.2, result.getCollector());

        // Generosity: bet 50 -> 5.0
        assertEquals(5.0, result.getGenerosity());

        // WinRate: 20/30 * 10 = 6.7
        assertEquals(6.7, result.getWinRate());

        // Risk: 15/30 red = 2.5, daring close to 3.0/3.5 = 0.857 * 5.0 = 4.3 -> total ~6.8
        assertTrue(result.getRisk() >= 5.0 && result.getRisk() <= 10.0);
    }

    @Test
    void testGetStatRadarForNewUserWithZeroGames() {
        User user = new User("newbie", "newbie@example.com", "hash");
        user.setId(101L);
        user.setFragmentBalance(0);

        stubUserRepository.user = user;
        stubGameRoundRepository.completedCount = 0L;

        StatRadarDto dto = metaGameService.getStatRadar(101L);

        assertNotNull(dto);
        assertEquals(0.0, dto.patience());
        assertEquals(0.0, dto.boosters());
        assertEquals(0.0, dto.collector());
        assertEquals(0.0, dto.generosity());
        assertEquals(0.0, dto.winRate());
        assertEquals(0.0, dto.risk());
        assertEquals(0, dto.gamesAnalyzed());
        assertEquals(0L, dto.totalGames());
        assertEquals(10, dto.nextRecalcIn());
    }

    @Test
    void testGetProfileReturnsPuzzleListMatchingFragmentBalance() {
        User user = new User("player", "player@example.com", "hash");
        user.setId(200L);
        user.setFragmentBalance(6);
        stubUserRepository.user = user;

        var profile = metaGameService.getProfile(200L);
        assertNotNull(profile);
        assertEquals(10, profile.puzzleTotal());
        assertEquals(6, profile.puzzle().size());
        assertEquals(List.of("piece_1", "piece_2", "piece_3", "piece_4", "piece_5", "piece_6"), profile.puzzle());
    }
}
