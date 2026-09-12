package com.hack2026.mog.dto.meta;

/**
 * Краткая модель пользователя внутри профиля, в точности соответствует userSchema фронтенда.
 */
public record ProfileUserDto(
        String id,
        String name,
        String role,
        long balance,
        long points
) {}
