package com.hack2026.mog.dto.game;

import java.util.UUID;

/**
 * Единый формат сообщений для WebSocket стрима /ws/game.
 */
public record WsGameMessage(
        String type, // "CONNECTED", "TICK", "CASHOUT", "CRASHED", "ERROR"
        UUID roundId,
        Double multiplier,
        Double crashMultiplier,
        Long winAmount,
        Long newBalance,
        Long elapsedMs,
        String message
) {
    public static WsGameMessage connected(Long userId, String username) {
        return new WsGameMessage("CONNECTED", null, null, null, null, null, null, "Connected to game stream: " + username);
    }

    public static WsGameMessage tick(UUID roundId, double multiplier, long elapsedMs) {
        return new WsGameMessage("TICK", roundId, multiplier, null, null, null, elapsedMs, null);
    }

    public static WsGameMessage cashout(UUID roundId, double multiplier, long winAmount, long newBalance) {
        return new WsGameMessage("CASHOUT", roundId, multiplier, null, winAmount, newBalance, null, "Cashout successful");
    }

    public static WsGameMessage crashed(UUID roundId, double crashMultiplier, long elapsedMs) {
        return new WsGameMessage("CRASHED", roundId, null, crashMultiplier, 0L, null, elapsedMs, "Balloon crashed!");
    }

    public static WsGameMessage error(String message) {
        return new WsGameMessage("ERROR", null, null, null, null, null, null, message);
    }
}
