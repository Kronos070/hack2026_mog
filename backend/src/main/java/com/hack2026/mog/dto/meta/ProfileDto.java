package com.hack2026.mog.dto.meta;

import java.util.List;

/**
 * Полный профиль игрока со всей мета-игрой, в точности соответствует profileSchema фронтенда.
 */
public record ProfileDto(
        ProfileUserDto user,
        List<String> puzzle,
        int puzzleTotal,
        int roundsPlayed,
        int roundsWon,
        double bestMultiplier,
        long totalWagered,
        long totalPayout,
        RankDto rank,
        List<AchievementDto> achievements
) {}
