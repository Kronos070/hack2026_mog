package com.hack2026.mog.dto.game;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.UUID;

/**
 * Единый формат сообщений для WebSocket стрима /ws/game.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record WsGameMessage(
        String type, // "CONNECTED", "TICK", "BOOSTER_ACTIVATED", "CASHOUT", "CRASHED", "ERROR", "PONG"
        UUID roundId,
        Double multiplier,
        Double crashMultiplier,
        Long winAmount,
        Long newBalance,
        Long elapsedMs,
        String message,
        Integer level,
        Integer boosterMultiplier,
        Double previousMultiplier,
        Integer bonusPoints,
        Integer pointsEarned,
        Integer levelsPassed,
        Boolean boosterActivated
) {
    public static WsGameMessage connected(Long userId, String username) {
        return new WsGameMessage("CONNECTED", null, null, null, null, null, null, "Connected to game stream: " + username, null, null, null, null, null, null, null);
    }

    public static WsGameMessage tick(UUID roundId, double multiplier, long elapsedMs) {
        return new WsGameMessage("TICK", roundId, multiplier, null, null, null, elapsedMs, null, null, null, null, null, null, null, null);
    }

    public static WsGameMessage boosterActivated(int level, int boosterMultiplier, double previousMultiplier, double currentMultiplier, int bonusPoints) {
        return new WsGameMessage(
                "BOOSTER_ACTIVATED",
                null,
                currentMultiplier,
                null,
                null,
                null,
                null,
                null,
                level,
                boosterMultiplier,
                previousMultiplier,
                bonusPoints,
                null,
                null,
                true
        );
    }

    public static WsGameMessage cashout(UUID roundId, double multiplier, long winAmount, long newBalance, Integer pointsEarned, Integer levelsPassed, Boolean boosterActivated) {
        return new WsGameMessage("CASHOUT", roundId, multiplier, null, winAmount, newBalance, null, "Cashout successful", null, null, null, null, pointsEarned, levelsPassed, boosterActivated);
    }

    public static WsGameMessage cashout(UUID roundId, double multiplier, long winAmount, long newBalance) {
        return cashout(roundId, multiplier, winAmount, newBalance, null, null, null);
    }

    public static WsGameMessage crashed(UUID roundId, double crashMultiplier, long elapsedMs, Integer pointsEarned, Integer levelsPassed, Boolean boosterActivated, Long newBalance) {
        return new WsGameMessage("CRASHED", roundId, null, crashMultiplier, 0L, newBalance, elapsedMs, "Balloon crashed!", null, null, null, null, pointsEarned, levelsPassed, boosterActivated);
    }

    public static WsGameMessage crashed(UUID roundId, double crashMultiplier, long elapsedMs, Integer pointsEarned, Integer levelsPassed, Boolean boosterActivated) {
        return crashed(roundId, crashMultiplier, elapsedMs, pointsEarned, levelsPassed, boosterActivated, null);
    }

    public static WsGameMessage crashed(UUID roundId, double crashMultiplier, long elapsedMs) {
        return crashed(roundId, crashMultiplier, elapsedMs, 0, 0, false);
    }

    public static WsGameMessage error(String message) {
        return new WsGameMessage("ERROR", null, null, null, null, null, null, message, null, null, null, null, null, null, null);
    }

    public static WsGameMessage pong() {
        return new WsGameMessage("PONG", null, null, null, null, null, null, "PONG", null, null, null, null, null, null, null);
    }
}
