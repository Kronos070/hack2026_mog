package com.hack2026.mog.services;

import com.hack2026.mog.dto.tournament.LeaderboardEntryDto;
import com.hack2026.mog.dto.tournament.TournamentResponseDto;
import com.hack2026.mog.dto.tournament.TournamentTableEntryDto;
import com.hack2026.mog.entities.TournamentEntry;
import com.hack2026.mog.repositories.TournamentEntryRepository;
import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.infrastructure.Infrastructure;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Сервис управления турнирной таблицей и лидербордом.
 * Обеспечивает атомарный учет очков, расчет призов и SSE-стриминг.
 */
@ApplicationScoped
public class TournamentService {

    private static final Logger LOG = Logger.getLogger(TournamentService.class);
    private static final String TOURNAMENT_TITLE = "Гран-при Воздухоплавателей Столото";
    private static final ZoneId MSK_ZONE = ZoneId.of("Europe/Moscow");
    private static final int DEFAULT_LIMIT = 50;

    @Inject
    TournamentEntryRepository tournamentEntryRepository;

    /**
     * Атомарное начисление турнирных очков игроку после завершения раунда / кэшаута.
     */
    @Transactional
    public void recordRoundPoints(Long userId, String username, int pointsEarned) {
        if (userId == null || pointsEarned <= 0) {
            return;
        }

        String safeUsername = (username != null && !username.isBlank()) ? username.trim() : "Игрок #" + userId;
        try {
            tournamentEntryRepository.upsertPoints(userId, safeUsername, pointsEarned);
            LOG.debugv("Recorded tournament points: userId={0}, username={1}, points=+{2}", userId, safeUsername, pointsEarned);
        } catch (Exception e) {
            LOG.errorf(e, "Failed to record tournament points for userId=%d, points=%d", userId, pointsEarned);
        }
    }

    /**
     * Получение компактного списка лидеров по очкам (Leaderboard).
     */
    public List<LeaderboardEntryDto> getLeaderboard(int limit) {
        int max = limit > 0 ? limit : DEFAULT_LIMIT;
        List<TournamentEntry> entries = tournamentEntryRepository.findTopEntries(max);
        if (entries == null || entries.isEmpty()) {
            return Collections.emptyList();
        }

        List<LeaderboardEntryDto> dtos = new ArrayList<>(entries.size());
        for (TournamentEntry entry : entries) {
            String playerId = entry.getUser() != null
                    ? String.valueOf(entry.getUser().getId())
                    : String.valueOf(entry.getId());
            dtos.add(new LeaderboardEntryDto(playerId, entry.getUsername(), entry.getScore()));
        }
        return dtos;
    }

    /**
     * Получение полной турнирной таблицы с расчетом динамических призов для топ-3.
     */
    public TournamentResponseDto getCurrentTournament(Long currentUserId) {
        List<TournamentEntry> rawEntries = tournamentEntryRepository.findTopEntries(DEFAULT_LIMIT);
        List<TournamentTableEntryDto> tableEntries = new ArrayList<>();

        if (rawEntries != null) {
            for (int i = 0; i < rawEntries.size(); i++) {
                TournamentEntry entry = rawEntries.get(i);
                int place = i + 1;
                long score = entry.getScore() != null ? entry.getScore() : 0L;

                // Динамический расчет призов только для топ-3:
                // 1 место: 100% от очков
                // 2 место: 60% от очков
                // 3 место: 30% от очков
                // 4+ места: 0
                long prize = 0L;
                if (place == 1) {
                    prize = score;
                } else if (place == 2) {
                    prize = Math.round(score * 0.6);
                } else if (place == 3) {
                    prize = Math.round(score * 0.3);
                }

                String playerId = entry.getUser() != null
                        ? String.valueOf(entry.getUser().getId())
                        : String.valueOf(entry.getId());

                tableEntries.add(new TournamentTableEntryDto(place, playerId, entry.getUsername(), score, prize));
            }
        }

        // Суточный турнир — конец текущих суток 23:59:59 MSK
        LocalDate today = LocalDate.now(MSK_ZONE);
        Instant endsInstant = today.atTime(LocalTime.of(23, 59, 59)).atZone(MSK_ZONE).toInstant();
        long endsAt = endsInstant.toEpochMilli();

        String currentPlayerIdStr = currentUserId != null ? String.valueOf(currentUserId) : null;

        return new TournamentResponseDto(TOURNAMENT_TITLE, endsAt, tableEntries, currentPlayerIdStr);
    }

    /**
     * SSE-стрим лидерборда: каждую секунду отправляет актуальный снимок рейтинга.
     */
    public Multi<List<LeaderboardEntryDto>> streamLeaderboard() {
        return Multi.createFrom().ticks().startingAfter(Duration.ofMillis(1)).every(Duration.ofSeconds(1))
                .emitOn(Infrastructure.getDefaultWorkerPool())
                .onItem().transform(tick -> getLeaderboard(DEFAULT_LIMIT));
    }

    /**
     * SSE-стрим полной турнирной таблицы: каждую секунду отправляет актуальный снимок турнира.
     */
    public Multi<TournamentResponseDto> streamTournament() {
        return Multi.createFrom().ticks().startingAfter(Duration.ofMillis(1)).every(Duration.ofSeconds(1))
                .emitOn(Infrastructure.getDefaultWorkerPool())
                .onItem().transform(tick -> getCurrentTournament(null));
    }
}
