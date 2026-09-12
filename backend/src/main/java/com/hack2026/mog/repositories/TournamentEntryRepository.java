package com.hack2026.mog.repositories;

import com.hack2026.mog.entities.TournamentEntry;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class TournamentEntryRepository implements PanacheRepository<TournamentEntry> {

    public List<TournamentEntry> findTopEntries(int limit) {
        getEntityManager().clear();
        return find("from TournamentEntry te left join fetch te.user order by te.score desc, te.id asc")
                .page(0, limit)
                .list();
    }

    public Optional<TournamentEntry> findByUserId(Long userId) {
        return find("user.id = ?1", userId).firstResultOptional();
    }

    @Transactional
    public void upsertPoints(Long userId, String username, int pointsEarned) {
        getEntityManager().createNativeQuery(
                "INSERT INTO tournament_entries (user_id, username, score, updated_at) " +
                "VALUES (:userId, :username, :points, CURRENT_TIMESTAMP) " +
                "ON CONFLICT (user_id) DO UPDATE " +
                "SET score = tournament_entries.score + EXCLUDED.score, " +
                "    username = EXCLUDED.username, " +
                "    updated_at = CURRENT_TIMESTAMP"
        )
        .setParameter("userId", userId)
        .setParameter("username", username)
        .setParameter("points", (long) pointsEarned)
        .executeUpdate();
    }

    @Transactional
    public int resetAllScores() {
        int updated = getEntityManager().createNativeQuery(
                "UPDATE tournament_entries SET score = 0, updated_at = CURRENT_TIMESTAMP"
        ).executeUpdate();
        getEntityManager().clear();
        return updated;
    }
}
