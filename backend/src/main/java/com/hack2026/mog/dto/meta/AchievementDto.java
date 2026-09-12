package com.hack2026.mog.dto.meta;

/**
 * DTO достижения игрока, в точности соответствует achievementSchema фронтенда.
 */
public record AchievementDto(
        String id,
        String title,
        String description,
        String letter,
        Long unlockedAt
) {}
