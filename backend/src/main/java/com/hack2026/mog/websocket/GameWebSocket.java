package com.hack2026.mog.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hack2026.mog.dto.game.ActiveGameRound;
import com.hack2026.mog.dto.game.GameRoundCashoutResult;
import com.hack2026.mog.dto.game.WsGameMessage;
import com.hack2026.mog.math.CrashGenerator;
import com.hack2026.mog.services.GameService;
import com.hack2026.mog.services.SecurityService;
import io.quarkus.websockets.next.OnClose;
import io.quarkus.websockets.next.OnError;
import io.quarkus.websockets.next.OnOpen;
import io.quarkus.websockets.next.OnTextMessage;
import io.quarkus.websockets.next.WebSocket;
import io.quarkus.websockets.next.WebSocketConnection;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.jboss.logging.Logger;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * WebSocket эндпоинт (/ws/game) для push-стриминга тиков полета шара в реальном времени (60 FPS).
 */
@ApplicationScoped
@WebSocket(path = "/ws/game")
public class GameWebSocket {

    private static final Logger LOG = Logger.getLogger(GameWebSocket.class);
    private static final long TICK_INTERVAL_MS = 16L; // ~60 кадров в секунду
    private static final io.quarkus.websockets.next.UserData.TypedKey<Long> USER_ID_KEY = io.quarkus.websockets.next.UserData.TypedKey.forLong("userId");

    @Inject
    SecurityService securityService;

    @Inject
    GameService gameService;

    @Inject
    ObjectMapper objectMapper;

    /**
     * Активные подключения игроков: userId -> WebSocketConnection
     */
    private final Map<Long, WebSocketConnection> userConnections = new ConcurrentHashMap<>();

    @OnOpen
    public void onOpen(WebSocketConnection connection) {
        String query = connection.handshakeRequest().query();
        String token = extractToken(query);

        if (token == null || token.isBlank()) {
            LOG.warn("WebSocket connection rejected: token parameter is missing");
            sendJson(connection, WsGameMessage.error("Token required: /ws/game?token=<jwt>"));
            connection.closeAndAwait();
            return;
        }

        try {
            JsonWebToken jwt = securityService.parseToken(token);
            Long userId = Long.parseLong(jwt.getSubject());
            String username = jwt.getName() != null ? jwt.getName() : "player_" + userId;

            connection.userData().put(USER_ID_KEY, userId);
            userConnections.put(userId, connection);

            LOG.infof("User connected to WebSocket game stream: id=%d, username=%s", userId, username);
            sendJson(connection, WsGameMessage.connected(userId, username));

            // Если у пользователя уже идет активный раунд (например, при реконнекте) — запускаем стрим тиков
            ActiveGameRound activeRound = gameService.getActiveRounds().get(userId);
            if (activeRound != null && !activeRound.isExpiredAt(Instant.now())) {
                startFlightStream(
                        userId,
                        activeRound.roundId(),
                        activeRound.startTime(),
                        activeRound.crashTime(),
                        activeRound.crashMultiplier()
                );
            }
        } catch (Exception e) {
            LOG.warnf("WebSocket connection authentication failed: %s", e.getMessage());
            sendJson(connection, WsGameMessage.error("Authentication failed: " + e.getMessage()));
            connection.closeAndAwait();
        }
    }

    @OnClose
    public void onClose(WebSocketConnection connection) {
        Long userId = connection.userData().get(USER_ID_KEY);
        if (userId != null) {
            userConnections.remove(userId);
            LOG.infof("User disconnected from WebSocket: id=%d", userId);
        }
    }

    @OnError
    public void onError(WebSocketConnection connection, Throwable throwable) {
        LOG.errorf(throwable, "WebSocket error on connection: %s", connection.id());
    }

    @OnTextMessage
    public void onMessage(WebSocketConnection connection, String text) {
        if ("PING".equalsIgnoreCase(text.trim())) {
            sendJson(connection, new WsGameMessage("PONG", null, null, null, null, null, null, "PONG"));
        }
    }

    /**
     * Запуск push-стриминга тиков полета шара на виртуальном потоке (60 FPS).
     * Шар летит до точки crashTime даже после cashout, как того требует CASE.md.
     */
    public void startFlightStream(Long userId, UUID roundId, Instant startTime, Instant crashTime, double crashMultiplier) {
        Thread.ofVirtual().name("ws-flight-" + userId).start(() -> {
            WebSocketConnection conn = userConnections.get(userId);
            if (conn == null || conn.isClosed()) {
                return;
            }

            while (conn.isOpen()) {
                Instant now = Instant.now();

                if (now.isAfter(crashTime) || now.equals(crashTime)) {
                    // Точка краха достигнута
                    long totalElapsed = Math.max(0, Duration.between(startTime, crashTime).toMillis());
                    sendJson(conn, WsGameMessage.crashed(roundId, crashMultiplier, totalElapsed));
                    break;
                }

                // Текущий множитель по экспоненциальной формуле
                double currentMultiplier = CrashGenerator.floorTo2Decimals(
                        GameService.calculateMultiplierAt(startTime, now, GameService.DEFAULT_GROWTH_RATE)
                );
                long elapsed = Math.max(0, Duration.between(startTime, now).toMillis());

                sendJson(conn, WsGameMessage.tick(roundId, currentMultiplier, elapsed));

                try {
                    Thread.sleep(TICK_INTERVAL_MS);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        });
    }

    /**
     * Уведомление подключенного клиента об успешном Cashout.
     */
    public void notifyCashout(Long userId, GameRoundCashoutResult result) {
        WebSocketConnection conn = userConnections.get(userId);
        if (conn != null && conn.isOpen()) {
            sendJson(conn, WsGameMessage.cashout(
                    result.roundId(),
                    result.multiplier(),
                    result.winAmount(),
                    result.newBalance()
            ));
        }
    }

    private void sendJson(WebSocketConnection connection, WsGameMessage message) {
        if (connection == null || connection.isClosed()) {
            return;
        }
        try {
            String json = objectMapper.writeValueAsString(message);
            connection.sendTextAndAwait(json);
        } catch (Exception e) {
            LOG.warnf("Failed to send WebSocket message: %s", e.getMessage());
        }
    }

    private String extractToken(String query) {
        if (query == null || query.isBlank()) {
            return null;
        }
        for (String param : query.split("&")) {
            String[] pair = param.split("=", 2);
            if (pair.length == 2 && "token".equalsIgnoreCase(pair[0].trim())) {
                return pair[1].trim();
            }
        }
        return null;
    }

    public Map<Long, WebSocketConnection> getUserConnections() {
        return userConnections;
    }
}
