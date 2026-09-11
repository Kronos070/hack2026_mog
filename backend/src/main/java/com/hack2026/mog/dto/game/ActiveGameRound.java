package com.hack2026.mog.dto.game;

import java.time.Instant;
import java.util.UUID;

/**
 * Внутреннее in-memory представление активного раунда игрока.
 */
public record ActiveGameRound(
        UUID roundId,
        Long userId,
        Long betAmount,
        Integer boosterMultiplier,
        String theme,
        double crashMultiplier,
        double houseEdge,
        Long previousBetAmount,
        Instant startTime,
        Instant crashTime,
        String serverSeed,
        String clientSeed,
        String hashHex,
        long nonce
) {
    public boolean isExpiredAt(Instant now) {
        return now.isAfter(crashTime) || now.equals(crashTime);
    }
}
