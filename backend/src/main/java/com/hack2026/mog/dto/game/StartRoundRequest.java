package com.hack2026.mog.dto.game;

import jakarta.validation.constraints.Min;

/**
 * Запрос на запуск нового раунда.
 * Поддерживает как канонические поля (betAmount, boosterMultiplier),
 * так и форматы фронтенда (cost, boosterTier).
 * Тема нормализуется в "green" (по умолчанию, 9 уровней) или "red" (12 уровней).
 */
public record StartRoundRequest(
        Long betAmount,

        Long cost,

        String theme,

        @Min(value = 1, message = "Booster multiplier must be at least 1")
        Integer boosterMultiplier,

        @Min(value = 1, message = "Booster tier must be at least 1")
        Integer boosterTier
) {
    public StartRoundRequest {
        if (betAmount == null && cost != null && cost >= 1) {
            betAmount = cost;
        }
        if (betAmount == null || betAmount < 1) {
            betAmount = 100L;
        }
        if (theme == null || theme.isBlank()) {
            theme = "green";
        } else {
            theme = theme.trim().toLowerCase();
            if (!theme.equals("green") && !theme.equals("red")) {
                theme = "green";
            }
        }
        if (boosterMultiplier == null || boosterMultiplier < 1) {
            if (boosterTier != null && boosterTier >= 1) {
                boosterMultiplier = boosterTier;
            } else {
                boosterMultiplier = 1;
            }
        }
        if (boosterTier == null) {
            boosterTier = boosterMultiplier;
        }
    }
}
