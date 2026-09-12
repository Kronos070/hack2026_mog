package com.hack2026.mog.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hack2026.mog.dto.game.ActiveGameRound;
import com.hack2026.mog.dto.game.GameRoundCashoutResult;
import com.hack2026.mog.dto.game.WsGameMessage;
import com.hack2026.mog.math.CrashGenerator;
import com.hack2026.mog.services.GameLevelConfig;
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

            ActiveGameRound activeRound = gameService.getActiveRounds().get(userId);
            if (activeRound != null && !activeRound.isExpiredAt(Instant.now())) {
                startFlightStream(userId, activeRound);
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
            sendJson(connection, WsGameMessage.pong());
        }
    }

    /**
     * Запуск push-стриминга тиков полета шара на виртуальном потоке (60 FPS).
     * Отслеживает достижение уровня бустера и отправляет событие BOOSTER_ACTIVATED.
     * Шар летит до точки crashTime даже после cashout, как того требует CASE.md.
     */
    public void startFlightStream(Long userId, ActiveGameRound activeRound) {
        if (activeRound == null) {
            return;
        }

        Thread.ofVirtual().name("ws-flight-" + userId).start(() -> {
            WebSocketConnection conn = userConnections.get(userId);
            if (conn == null || conn.isClosed()) {
                return;
            }

            UUID roundId = activeRound.roundId();
            Instant startTime = activeRound.startTime();
            Instant crashTime = activeRound.crashTime();
            double baseCrashMultiplier = activeRound.crashMultiplier();

            boolean hasBooster = activeRound.hasBooster();
            int boosterMultiplier = activeRound.boosterMultiplier();
            int boosterLevel = activeRound.boosterLevel() != null ? activeRound.boosterLevel() : 1;
            double boosterThreshold = activeRound.boosterThreshold() != null ? activeRound.boosterThreshold() : Double.MAX_VALUE;

            boolean boosterActivated = activeRound.isBoosterActivated();

            while (conn.isOpen()) {
                Instant now = Instant.now();

                if (now.isAfter(crashTime) || now.equals(crashTime)) {
                    // Точка краха достигнута
                    long totalElapsed = Math.max(0, Duration.between(startTime, crashTime).toMillis());
                    double finalCrashMultiplier = (boosterActivated || activeRound.isBoosterActivated())
                            ? CrashGenerator.floorTo2Decimals(baseCrashMultiplier * boosterMultiplier)
                            : baseCrashMultiplier;

                    GameRoundCashoutResult crashResolution = null;
                    if (!activeRound.isCashedOut()) {
                        crashResolution = gameService.resolveCrash(activeRound, crashTime);
                    }

                    int pointsEarned = crashResolution != null && crashResolution.pointsEarned() != null
                            ? crashResolution.pointsEarned()
                            : 0;
                    int passedLevels = crashResolution != null && crashResolution.levelsPassed() != null
                            ? crashResolution.levelsPassed()
                            : GameLevelConfig.calculatePassedLevels(activeRound.theme(), baseCrashMultiplier);
                    boolean wasBooster = boosterActivated || activeRound.isBoosterActivated();
                    Long newBalance = crashResolution != null ? crashResolution.newBalance() : null;
                    sendJson(conn, WsGameMessage.crashed(roundId, finalCrashMultiplier, totalElapsed, pointsEarned, passedLevels, wasBooster, newBalance));
                    break;
                }

                // Текущий базовый множитель по экспоненциальной формуле с динамическим growthRate
                double rawBaseMultiplier = GameService.calculateMultiplierAt(startTime, now, activeRound.growthRate());
                double baseMultiplier = CrashGenerator.floorTo2Decimals(rawBaseMultiplier);

                // Проверка достижения уровня бустера
                if (!boosterActivated && hasBooster && baseMultiplier >= boosterThreshold) {
                    // По CASE.md бустер не активируется, если шар долетел до него уже после нажатия «Забрать»
                    if (!activeRound.isCashedOut()) {
                        if (activeRound.markBoosterActivated()) {
                            boosterActivated = true;
                            double previousMultiplier = baseMultiplier;
                            double currentMultiplier = CrashGenerator.floorTo2Decimals(previousMultiplier * boosterMultiplier);
                            int bonusPoints = activeRound.pointsBoosterBonus();

                            LOG.infof("Booster activated for user %d: level=%d, mult=x%d, prev=%.2f, curr=%.2f, points=%d",
                                    userId, boosterLevel, boosterMultiplier, previousMultiplier, currentMultiplier, bonusPoints);

                            // Рассылка события BOOSTER_ACTIVATED в WebSocket
                            sendJson(conn, WsGameMessage.boosterActivated(
                                    boosterLevel,
                                    boosterMultiplier,
                                    previousMultiplier,
                                    currentMultiplier,
                                    bonusPoints
                            ));
                        }
                    }
                }

                // Если бустер активен — отображаем увеличенный множитель
                double displayMultiplier = (boosterActivated || activeRound.isBoosterActivated())
                        ? CrashGenerator.floorTo2Decimals(baseMultiplier * boosterMultiplier)
                        : baseMultiplier;

                long elapsedMs = Math.max(0, Duration.between(startTime, now).toMillis());
                sendJson(conn, WsGameMessage.tick(roundId, displayMultiplier, elapsedMs));

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
                    result.newBalance(),
                    result.pointsEarned(),
                    result.levelsPassed(),
                    result.boosterActivated()
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
