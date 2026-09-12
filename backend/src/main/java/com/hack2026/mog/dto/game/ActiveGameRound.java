package com.hack2026.mog.dto.game;

import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Внутреннее in-memory представление активного раунда игрока.
 * Хранит снапшот параметров игры (growthRate, points) на момент старта раунда.
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
        double growthRate,
        int pointsPerLine,
        int pointsCashoutBonus,
        int pointsBoosterBonus,
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
            double unlockMultiplier,
            double growthRate,
            int pointsPerLine,
            int pointsCashoutBonus,
            int pointsBoosterBonus
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
                growthRate > 0 ? growthRate : 0.22,
                pointsPerLine >= 0 ? pointsPerLine : 10,
                pointsCashoutBonus >= 0 ? pointsCashoutBonus : 25,
                pointsBoosterBonus >= 0 ? pointsBoosterBonus : 50,
                new AtomicBoolean(false),
                new AtomicBoolean(false)
        );
    }

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
                boosterMultiplier,
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
                0.22,
                10,
                25,
                50
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
