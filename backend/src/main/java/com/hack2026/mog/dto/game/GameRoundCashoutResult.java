package com.hack2026.mog.dto.game;

import java.util.UUID;

/**
 * Результат запроса на cashout игроком.
 */
public record GameRoundCashoutResult(
        UUID roundId,
        String status,
        boolean isWin,
        double multiplier,
        double crashMultiplier,
        Long winAmount,
        Long newBalance,
        Integer pointsEarned,
        Integer levelsPassed,
        Boolean boosterActivated,
        Integer boosterMultiplier,
        double nextHouseEdge,
        String serverSeed,
        String clientSeed,
        long nonce
) {}
