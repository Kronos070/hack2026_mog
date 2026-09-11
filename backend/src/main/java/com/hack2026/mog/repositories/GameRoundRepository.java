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
}
