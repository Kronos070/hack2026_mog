package com.hack2026.mog.dto.game;

import com.hack2026.mog.dto.meta.AchievementDto;
import com.hack2026.mog.dto.meta.RewardDto;
import java.util.List;
import java.util.UUID;

/**
 * Результат запроса на cashout игроком и финализации раунда.
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
        long nonce,
        RewardDto reward,
        List<AchievementDto> unlockedAchievements
) {
    public GameRoundCashoutResult(
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
    ) {
        this(roundId, status, isWin, multiplier, crashMultiplier, winAmount, newBalance,
                pointsEarned, levelsPassed, boosterActivated, boosterMultiplier, nextHouseEdge,
                serverSeed, clientSeed, nonce, null, List.of());
    }
}
