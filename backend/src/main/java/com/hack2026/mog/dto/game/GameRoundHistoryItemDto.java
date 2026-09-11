package com.hack2026.mog.dto.game;

import java.time.Instant;
import java.util.UUID;

public record GameRoundHistoryItemDto(
        UUID roundId,
        Long userId,
        String username,
        String theme,
        Long betAmount,
        Double crashMultiplier,
        Double cashoutMultiplier,
        Long winAmount,
        Boolean isWin,
        String status,
        Instant createdAt
) {}
