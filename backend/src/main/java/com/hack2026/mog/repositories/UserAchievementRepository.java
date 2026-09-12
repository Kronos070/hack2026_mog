package com.hack2026.mog.repositories;

import com.hack2026.mog.entities.UserAchievement;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class UserAchievementRepository implements PanacheRepository<UserAchievement> {

    public List<UserAchievement> findByUserId(Long userId) {
        return list("user.id = ?1 order by id asc", userId);
    }

    public Optional<UserAchievement> findByUserAndAchievementId(Long userId, String achievementId) {
        return find("user.id = ?1 and achievementId = ?2", userId, achievementId).firstResultOptional();
    }

    public boolean hasAchievement(Long userId, String achievementId) {
        return count("user.id = ?1 and achievementId = ?2", userId, achievementId) > 0;
    }
}
