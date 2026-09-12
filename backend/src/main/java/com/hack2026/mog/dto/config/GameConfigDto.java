package com.hack2026.mog.dto.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * DTO конфигурации параметров crash-игры «Воздушный Шар».
 * Полностью соответствует frontend контракту gameConfigSchema.
 */
public record GameConfigDto(
    @NotBlank String gameId,
    @NotBlank String gameName,
    @NotNull Boolean isActive,
    @NotNull @Positive Double alpha,
    @NotNull @Positive Double maxMultiplier,
    @NotNull @DecimalMin("1.0") Double minCrashMultiplier,
    @NotNull @Positive Double multiplierGrowthRate,
    @NotNull @DecimalMin("1.0") @DecimalMax("3.0") Double growthAcceleration,
    @NotNull @Min(0) Integer pointsPerLine,
    @NotNull @Min(0) Integer pointsCashoutBonus,
    @NotNull @Min(0) Integer pointsBoosterBonus,
    @NotNull @Size(min = 4, max = 4) List<Double> boosterTierValues,
    @NotNull @Valid LootProbabilitiesDto lootProbabilities,
    @NotNull @Min(0) Integer minWinAmount,
    @NotNull @Positive Integer popupTimeout
) {

    /**
     * Эталонная конфигурация по умолчанию (ТЗ §1.9).
     */
    public static GameConfigDto defaultConfig() {
        return new GameConfigDto(
            "air-balloon",
            "Воздушный Шар",
            true,
            1.30,
            100.0,
            1.01,
            0.22,
            1.5,
            10,
            25,
            50,
            List.of(1.0, 2.0, 3.0, 4.0),
            new LootProbabilitiesDto(
                List.of(0.0, 0.25, 0.20, 0.18, 0.15, 0.10, 0.07, 0.04, 0.01),
                List.of(0.0, 0.20, 0.18, 0.15, 0.13, 0.10, 0.08, 0.06, 0.04, 0.03, 0.02, 0.01)
            ),
            50,
            10
        );
    }
}
