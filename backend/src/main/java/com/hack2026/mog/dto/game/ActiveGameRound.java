package com.hack2026.mog.dto.game;

import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Внутреннее in-memory представление активного раунда игрока.
 */
public record ActiveGameRound(
        UUID roundId,
        Long userId,
        Long betAmount,
        Integer boosterMultiplier,
        Integer boosterLevel,
        Double boosterThreshold,
        String theme,
        double crashMultiplier,
        double houseEdge,
        Long previousBetAmount,
        Instant startTime,
        Instant crashTime,
        String serverSeed,
        String clientSeed,
        String hashHex,
        long nonce,
        int totalLevels,
        double unlockMultiplier,
        AtomicBoolean boosterActivated,
        AtomicBoolean cashedOut
) {
    public ActiveGameRound(
            UUID roundId,
            Long userId,
            Long betAmount,
            Integer boosterMultiplier,
            Integer boosterLevel,
            Double boosterThreshold,
            String theme,
            double crashMultiplier,
            double houseEdge,
            Long previousBetAmount,
            Instant startTime,
            Instant crashTime,
            String serverSeed,
            String clientSeed,
            String hashHex,
            long nonce,
            int totalLevels,
            double unlockMultiplier
    ) {
        this(
                roundId,
                userId,
                betAmount,
                boosterMultiplier != null ? boosterMultiplier : 1,
                boosterLevel,
                boosterThreshold,
                theme,
                crashMultiplier,
                houseEdge,
                previousBetAmount,
                startTime,
                crashTime,
                serverSeed,
                clientSeed,
                hashHex,
                nonce,
                totalLevels,
                unlockMultiplier,
                new AtomicBoolean(false),
                new AtomicBoolean(false)
        );
    }

    public boolean isExpiredAt(Instant now) {
        return now.isAfter(crashTime) || now.equals(crashTime);
    }

    public boolean hasBooster() {
        return boosterMultiplier != null && boosterMultiplier > 1 && boosterLevel != null;
    }

    public boolean isBoosterActivated() {
        return boosterActivated.get();
    }

    public boolean markBoosterActivated() {
        return boosterActivated.compareAndSet(false, true);
    }

    public boolean isCashedOut() {
        return cashedOut.get();
    }

    public void markCashedOut() {
        cashedOut.set(true);
    }
}
