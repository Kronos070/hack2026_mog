package com.hack2026.mog.services;

import com.hack2026.mog.exceptions.UnauthorizedException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.jwt.JsonWebToken;

@ApplicationScoped
public class SecurityService {

    @Inject
    JsonWebToken jwt;

    public Long getCurrentUserId() {
        if (jwt == null || jwt.getSubject() == null || jwt.getSubject().isBlank()) {
            throw new UnauthorizedException("Требуется авторизация: Bearer токен отсутствует или некорректен");
        }
        try {
            return Long.parseLong(jwt.getSubject());
        } catch (NumberFormatException e) {
            throw new UnauthorizedException("Некорректный идентификатор пользователя в токене");
        }
    }

    public String getCurrentUsername() {
        if (jwt == null || jwt.getName() == null) {
            throw new UnauthorizedException("Требуется авторизация");
        }
        return jwt.getName();
    }
}
