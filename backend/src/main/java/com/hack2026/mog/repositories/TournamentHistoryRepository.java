package com.hack2026.mog.repositories;

import com.hack2026.mog.entities.TournamentHistory;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.time.Instant;
import java.util.List;

@ApplicationScoped
public class TournamentHistoryRepository implements PanacheRepository<TournamentHistory> {

    public List<TournamentHistory> findRecent(int limit) {
        return find("ORDER BY awardedAt DESC, place ASC").page(0, limit).list();
    }

    public List<TournamentHistory> findByUserId(Long userId, int limit) {
        return find("user.id = ?1 ORDER BY awardedAt DESC, place ASC", userId).page(0, limit).list();
    }

    public boolean isPeriodSettled(Instant periodEnd) {
        return count("periodEnd = ?1", periodEnd) > 0;
    }
}
