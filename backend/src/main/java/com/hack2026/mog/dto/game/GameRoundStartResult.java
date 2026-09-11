package com.hack2026.mog.dto.game;

import java.time.Instant;
import java.util.UUID;

/**
 * Результат запуска игрового раунда.
 * Содержит Provably Fair хэш (combined_hash), время старта и скорость роста для отрисовки кривой клиентом.
 * Значение crashMultiplier клиенту до завершения раунда НЕ передается.
 */
public record GameRoundStartResult(
        UUID roundId,
        Instant startTime,
        double initialMultiplier,
        double growthRate,
        String provablyFairHash,
        Long betAmount,
        Integer boosterMultiplier,
        Long remainingBalance
) {}
