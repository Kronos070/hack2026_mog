package com.hack2026.mog.dto.game;

public record PlayerHouseEdgeResponse(
        Long userId,
        double currentHouseEdge,
        double rtp,
        double expectedValue,
        Long lastBetAmount
) {}
