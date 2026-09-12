package com.hack2026.mog.repositories;

import com.hack2026.mog.entities.UserStatRadar;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.Optional;

@ApplicationScoped
public class UserStatRadarRepository implements PanacheRepository<UserStatRadar> {

    public Optional<UserStatRadar> findByUserId(Long userId) {
        return find("user.id = ?1", userId).firstResultOptional();
    }
}
