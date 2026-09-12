package com.hack2026.mog.services;

import com.hack2026.mog.dto.tournament.LeaderboardEntryDto;
import com.hack2026.mog.dto.tournament.TournamentHistoryItemDto;
import com.hack2026.mog.dto.tournament.TournamentResponseDto;
import com.hack2026.mog.dto.tournament.TournamentSettlementResultDto;
import com.hack2026.mog.dto.tournament.TournamentTableEntryDto;
import com.hack2026.mog.entities.TournamentEntry;
import com.hack2026.mog.entities.TournamentHistory;
import com.hack2026.mog.entities.User;
import com.hack2026.mog.repositories.TournamentEntryRepository;
import com.hack2026.mog.repositories.TournamentHistoryRepository;
import com.hack2026.mog.repositories.UserRepository;
import io.quarkus.scheduler.Scheduled;
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
 * Сервис управления турнирной таблицей, лидербордом и автоначислением наград.
 * Обеспечивает атомарный учет очков, расчет призов, SSE-стриминг и периодическую финализацию.
 */
@ApplicationScoped
public class TournamentService {

    private static final Logger LOG = Logger.getLogger(TournamentService.class);
    private static final String TOURNAMENT_TITLE = "Гран-при Воздухоплавателей Столото";
    private static final ZoneId MSK_ZONE = ZoneId.of("Europe/Moscow");
    private static final int DEFAULT_LIMIT = 50;

    @Inject
    TournamentEntryRepository tournamentEntryRepository;

    @Inject
    TournamentHistoryRepository tournamentHistoryRepository;

    @Inject
    UserRepository userRepository;

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
        long endsAt = getDailyTournamentEndsAt().toEpochMilli();
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

    /**
     * Финализация текущего турнира: выплата наград топ-3 призерам, архивация в историю и сброс очков.
     *
     * @param force если true, финализация выполняется немедленно без проверки истечения времени периода.
     */
    @Transactional
    public TournamentSettlementResultDto settleCurrentTournament(boolean force) {
        Instant now = Instant.now();
        Instant periodEnd = getDailyTournamentEndsAt();
        Instant periodStart = getDailyTournamentStartsAt();

        if (!force && now.isBefore(periodEnd)) {
            return new TournamentSettlementResultDto(
                    "SKIPPED",
                    TOURNAMENT_TITLE,
                    now.toEpochMilli(),
                    0,
                    0L,
                    Collections.emptyList(),
                    "Текущий суточный турнир еще активен (endsAt=" + periodEnd + "). Для принудительного расчета используйте force=true."
            );
        }

        if (!force && tournamentHistoryRepository.isPeriodSettled(periodEnd)) {
            return new TournamentSettlementResultDto(
                    "ALREADY_SETTLED",
                    TOURNAMENT_TITLE,
                    now.toEpochMilli(),
                    0,
                    0L,
                    Collections.emptyList(),
                    "Турнир за текущий период уже был рассчитан ранее."
            );
        }

        // Выбираем топ-3 лидеров для начисления призов
        List<TournamentEntry> topEntries = tournamentEntryRepository.findTopEntries(3);
        List<TournamentHistoryItemDto> winners = new ArrayList<>();
        long totalPrizes = 0L;
        int rewardedCount = 0;

        for (int i = 0; i < topEntries.size(); i++) {
            TournamentEntry entry = topEntries.get(i);
            int place = i + 1;
            long score = entry.getScore() != null ? entry.getScore() : 0L;

            long prize = 0L;
            if (place == 1) {
                prize = score;
            } else if (place == 2) {
                prize = Math.round(score * 0.6);
            } else if (place == 3) {
                prize = Math.round(score * 0.3);
            }

            if (prize > 0) {
                User user = null;
                if (entry.getUser() != null) {
                    user = userRepository.findById(entry.getUser().getId());
                }

                if (user != null) {
                    user.setBonusBalance(user.getBonusBalance() + prize);
                    rewardedCount++;
                    totalPrizes += prize;

                    TournamentHistory history = new TournamentHistory(
                            TOURNAMENT_TITLE,
                            periodStart,
                            periodEnd,
                            user,
                            entry.getUsername(),
                            place,
                            score,
                            prize
                    );
                    tournamentHistoryRepository.persist(history);

                    winners.add(new TournamentHistoryItemDto(
                            place,
                            String.valueOf(user.getId()),
                            entry.getUsername(),
                            score,
                            prize,
                            history.getAwardedAt().toString()
                    ));

                    LOG.infof("Tournament prize awarded: place=%d, userId=%d, username=%s, score=%d, prize=+%d, newBalance=%d",
                            place, user.getId(), entry.getUsername(), score, prize, user.getBonusBalance());
                }
            }
        }

        // Сбрасываем очки для нового периода турнира
        int resetCount = tournamentEntryRepository.resetAllScores();

        LOG.infof("Tournament settlement completed: title=%s, rewarded=%d, totalPrizes=%d, entriesReset=%d",
                TOURNAMENT_TITLE, rewardedCount, totalPrizes, resetCount);

        return new TournamentSettlementResultDto(
                "SUCCESS",
                TOURNAMENT_TITLE,
                now.toEpochMilli(),
                rewardedCount,
                totalPrizes,
                winners,
                "Турнир успешно финализирован! Призы зачислены на баланс победителей."
        );
    }

    /**
     * Плановый запуск финализации турнира ровно в 00:00:00 ежедневно.
     */
    @Scheduled(cron = "0 0 0 * * ?")
    public void scheduledMidnightSettlement() {
        LOG.info("Scheduled midnight tournament settlement triggered");
        try {
            settleCurrentTournament(false);
        } catch (Exception e) {
            LOG.error("Failed to execute scheduled tournament settlement", e);
        }
    }

    /**
     * Фоновая периодическая проверка на случай перезапуска сервера в момент наступления полуночи.
     */
    @Scheduled(every = "1m", delayed = "15s")
    public void checkPendingSettlement() {
        Instant now = Instant.now();
        Instant periodEnd = getDailyTournamentEndsAt();
        // Если период завершился, а наград за него еще не было — финализируем
        if (now.isAfter(periodEnd) && !tournamentHistoryRepository.isPeriodSettled(periodEnd)) {
            LOG.warnf("Detected unhandled tournament expiration for endsAt=%s, running recovery settlement", periodEnd);
            try {
                settleCurrentTournament(false);
            } catch (Exception e) {
                LOG.error("Failed to run recovery settlement", e);
            }
        }
    }

    /**
     * Получение истории завершенных турниров и полученных призов.
     */
    public List<TournamentHistoryItemDto> getTournamentHistory(Long userId, int limit) {
        int max = limit > 0 ? limit : 20;
        List<TournamentHistory> list = (userId != null)
                ? tournamentHistoryRepository.findByUserId(userId, max)
                : tournamentHistoryRepository.findRecent(max);

        if (list == null || list.isEmpty()) {
            return Collections.emptyList();
        }

        List<TournamentHistoryItemDto> dtos = new ArrayList<>(list.size());
        for (TournamentHistory th : list) {
            String playerId = th.getUser() != null ? String.valueOf(th.getUser().getId()) : "";
            dtos.add(new TournamentHistoryItemDto(
                    th.getPlace(),
                    playerId,
                    th.getUsername(),
                    th.getScore(),
                    th.getPrizeAwarded(),
                    th.getAwardedAt() != null ? th.getAwardedAt().toString() : null
            ));
        }
        return dtos;
    }

    public Instant getDailyTournamentStartsAt() {
        LocalDate today = LocalDate.now(MSK_ZONE);
        return today.atStartOfDay(MSK_ZONE).toInstant();
    }

    public Instant getDailyTournamentEndsAt() {
        LocalDate today = LocalDate.now(MSK_ZONE);
        return today.atTime(LocalTime.of(23, 59, 59)).atZone(MSK_ZONE).toInstant();
    }
}
