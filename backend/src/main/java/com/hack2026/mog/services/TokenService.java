package com.hack2026.mog.services;

import com.hack2026.mog.entities.User;
import io.smallrye.jwt.build.Jwt;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.time.Duration;
import java.util.Set;

@ApplicationScoped
public class TokenService {

    public static final long TOKEN_EXPIRES_IN_SECONDS = 86400L; // 24 hours

    @ConfigProperty(name = "mp.jwt.verify.issuer", defaultValue = "https://mog.stoloto.ru/issuer")
    String issuer;

    public String generateToken(User user) {
        return Jwt.issuer(issuer)
            .subject(String.valueOf(user.getId()))
            .upn(user.getUsername())
            .preferredUserName(user.getUsername())
            .claim("email", user.getEmail())
            .claim("role", user.getRole())
            .groups(Set.of(user.getRole()))
            .expiresIn(Duration.ofSeconds(TOKEN_EXPIRES_IN_SECONDS))
            .sign();
    }

    public long getExpiresInSeconds() {
        return TOKEN_EXPIRES_IN_SECONDS;
    }
}
