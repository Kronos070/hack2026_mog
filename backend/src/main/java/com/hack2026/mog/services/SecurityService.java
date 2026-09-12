package com.hack2026.mog.services;

import com.hack2026.mog.exceptions.UnauthorizedException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.jwt.JsonWebToken;

@ApplicationScoped
public class SecurityService {

    @Inject
    JsonWebToken jwt;

    @Inject
    io.smallrye.jwt.auth.principal.JWTParser jwtParser;

    public JsonWebToken parseToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new UnauthorizedException("Токен авторизации отсутствует");
        }
        try {
            return jwtParser.parse(rawToken.trim());
        } catch (Exception e) {
            throw new UnauthorizedException("Недействительный или просроченный токен авторизации");
        }
    }

    public Long parseUserId(String rawToken) {
        JsonWebToken parsed = parseToken(rawToken);
        try {
            return Long.parseLong(parsed.getSubject());
        } catch (NumberFormatException e) {
            throw new UnauthorizedException("Некорректный ID пользователя в токене");
        }
    }

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
