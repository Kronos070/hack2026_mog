package com.hack2026.mog.dto.game;

import java.time.Instant;
import java.util.UUID;

/**
 * Текущее состояние раунда (для опроса или синхронизации).
 */
public record GameRoundStateResult(
        UUID roundId,
        String status,
        boolean isCrashed,
        double currentMultiplier,
        Double crashMultiplier,
        long elapsedMs,
        Long potentialWin,
        Instant startTime,
        Integer levelsPassed,
        Integer pointsEarned,
        Boolean boosterActivated
) {}
