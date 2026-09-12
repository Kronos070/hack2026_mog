package com.hack2026.mog.repositories;

import com.hack2026.mog.entities.GameRound;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class GameRoundRepository implements PanacheRepositoryBase<GameRound, UUID> {

    public Optional<GameRound> findActiveByUserId(Long userId) {
        return find("user.id = ?1 and status = ?2", userId, GameRound.STATUS_IN_PROGRESS).firstResultOptional();
    }

    public List<GameRound> findHistoryByUserId(Long userId, int limit) {
        return find("user.id = ?1 and status != ?2", Sort.descending("createdAt"), userId, GameRound.STATUS_IN_PROGRESS)
                .page(0, limit)
                .list();
    }

    public List<GameRound> findGlobalHistory(int limit) {
        return find("status != ?1", Sort.descending("createdAt"), GameRound.STATUS_IN_PROGRESS)
                .page(0, limit)
                .list();
    }

    public long countRoundsByUserId(Long userId) {
        return count("user.id = ?1", userId);
    }

    public record UserGameStats(
            long roundsPlayed,
            long roundsWon,
            double bestMultiplier,
            long totalWagered,
            long totalPayout,
            long maxBet
    ) {}

    public UserGameStats getUserStats(Long userId) {
        Object[] row = (Object[]) getEntityManager().createQuery(
                "SELECT " +
                "COUNT(r), " +
                "COALESCE(SUM(CASE WHEN r.isWin = true THEN 1L ELSE 0L END), 0L), " +
                "COALESCE(MAX(r.cashoutMultiplier), 0.0), " +
                "COALESCE(SUM(r.betAmount), 0L), " +
                "COALESCE(SUM(r.winAmount), 0L), " +
                "COALESCE(MAX(r.betAmount), 0L) " +
                "FROM GameRound r " +
                "WHERE r.user.id = :userId AND r.status != :inProgress"
        )
        .setParameter("userId", userId)
        .setParameter("inProgress", GameRound.STATUS_IN_PROGRESS)
        .getSingleResult();

        long roundsPlayed = ((Number) row[0]).longValue();
        long roundsWon = ((Number) row[1]).longValue();
        double bestMultiplier = ((Number) row[2]).doubleValue();
        long totalWagered = ((Number) row[3]).longValue();
        long totalPayout = ((Number) row[4]).longValue();
        long maxBet = ((Number) row[5]).longValue();

        return new UserGameStats(roundsPlayed, roundsWon, bestMultiplier, totalWagered, totalPayout, maxBet);
    }

    public boolean hasWinStreak(Long userId, int streak) {
        List<Boolean> lastWins = getEntityManager().createQuery(
                "SELECT r.isWin FROM GameRound r " +
                "WHERE r.user.id = :userId AND r.status != :inProgress " +
                "ORDER BY r.createdAt DESC", Boolean.class)
                .setParameter("userId", userId)
                .setParameter("inProgress", GameRound.STATUS_IN_PROGRESS)
                .setMaxResults(streak)
                .getResultList();

        if (lastWins.size() < streak) {
            return false;
        }
        for (Boolean won : lastWins) {
            if (won == null || !won) {
                return false;
            }
        }
        return true;
    }
}
