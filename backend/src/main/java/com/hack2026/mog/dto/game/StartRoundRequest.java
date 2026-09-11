package com.hack2026.mog.dto.game;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record StartRoundRequest(
        @NotNull(message = "Bet amount is required")
        @Min(value = 1, message = "Bet amount must be at least 1")
        Long betAmount,

        String theme,

        @Min(value = 1, message = "Booster multiplier must be at least 1")
        Integer boosterMultiplier
) {
    public StartRoundRequest {
        if (theme == null || theme.isBlank()) {
            theme = "classic";
        }
        if (boosterMultiplier == null || boosterMultiplier < 1) {
            boosterMultiplier = 1;
        }
    }
}
