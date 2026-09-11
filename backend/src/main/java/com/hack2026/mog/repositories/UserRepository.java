package com.hack2026.mog.repositories;

import com.hack2026.mog.entities.User;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.Optional;

@ApplicationScoped
public class UserRepository implements PanacheRepository<User> {

    public Optional<User> findByUsername(String username) {
        return find("LOWER(username) = LOWER(?1)", username.trim()).firstResultOptional();
    }

    public Optional<User> findByEmail(String email) {
        return find("LOWER(email) = LOWER(?1)", email.trim()).firstResultOptional();
    }

    public Optional<User> findByUsernameOrEmail(String login) {
        String normalized = login.trim().toLowerCase();
        return find("LOWER(username) = ?1 OR LOWER(email) = ?1", normalized).firstResultOptional();
    }

    public boolean existsByUsername(String username) {
        return count("LOWER(username) = LOWER(?1)", username.trim()) > 0;
    }

    public boolean existsByEmail(String email) {
        return count("LOWER(email) = LOWER(?1)", email.trim()) > 0;
    }
}
