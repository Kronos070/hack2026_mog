package com.hack2026.mog.dto.config;

import jakarta.validation.constraints.NotNull;
import java.util.List;

/**
 * Вероятности выпадения лута (фрагментов пазлов) по темам.
 */
public record LootProbabilitiesDto(
    @NotNull List<Double> green,
    @NotNull List<Double> red
) {}
