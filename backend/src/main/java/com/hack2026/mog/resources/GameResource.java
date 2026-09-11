package com.hack2026.mog.resources;

import com.hack2026.mog.dto.game.ActiveGameRound;
import com.hack2026.mog.dto.game.CashoutRequest;
import com.hack2026.mog.dto.game.GameRoundCashoutResult;
import com.hack2026.mog.dto.game.GameRoundHistoryItemDto;
import com.hack2026.mog.dto.game.GameRoundStartResult;
import com.hack2026.mog.dto.game.GameRoundStateResult;
import com.hack2026.mog.dto.game.PlayerHouseEdgeResponse;
import com.hack2026.mog.dto.game.StartRoundRequest;
import com.hack2026.mog.entities.GameRound;
import com.hack2026.mog.entities.User;
import com.hack2026.mog.exceptions.BadRequestException;
import com.hack2026.mog.exceptions.NotFoundException;
import com.hack2026.mog.repositories.GameRoundRepository;
import com.hack2026.mog.repositories.UserRepository;
import com.hack2026.mog.services.GameService;
import com.hack2026.mog.services.SecurityService;
import com.hack2026.mog.websocket.GameWebSocket;
import io.quarkus.security.Authenticated;
import io.smallrye.common.annotation.RunOnVirtualThread;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.util.List;
import java.util.UUID;

@Path("/api/game")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Game", description = "Управление игровым циклом crash-игры «Воздушный Шар»")
public class GameResource {

    @Inject
    GameService gameService;

    @Inject
    SecurityService securityService;

    @Inject
    GameWebSocket gameWebSocket;

    @Inject
    GameRoundRepository gameRoundRepository;

    @Inject
    UserRepository userRepository;

    @Inject
    com.hack2026.mog.services.UserService userService;

    @POST
    @Path("/start")
    @Authenticated
    @RunOnVirtualThread
    @SecurityRequirement(name = "jwtAuth")
    @Operation(summary = "Начать новый раунд игры", description = "Списывает ставку с баланса игрока, генерирует Provably Fair крах и запускает полет")
    public Response startRound(@Valid @NotNull StartRoundRequest request) {
        Long userId = securityService.getCurrentUserId();
        GameRoundStartResult result = gameService.startRound(userId, request);

        // Запуск WebSocket 60 FPS стрима для подключенного клиента
        ActiveGameRound activeRound = gameService.getActiveRounds().get(userId);
        if (activeRound != null) {
            gameWebSocket.startFlightStream(userId, activeRound);
        }

        return Response.status(Response.Status.CREATED).entity(result).build();
    }

    @POST
    @Path("/cashout")
    @Authenticated
    @RunOnVirtualThread
    @SecurityRequirement(name = "jwtAuth")
    @Operation(summary = "Забрать выигрыш (Cashout)", description = "Фиксирует текущий множитель и начисляет выигрыш на баланс пользователя")
    public Response cashout(@Valid @NotNull CashoutRequest request) {
        Long userId = securityService.getCurrentUserId();
        GameRoundCashoutResult result = gameService.cashout(userId, request.roundId());

        // Уведомление через WebSocket
        if (result.isWin()) {
            gameWebSocket.notifyCashout(userId, result);
        }

        return Response.ok(result).build();
    }

    @GET
    @Path("/state")
    @Authenticated
    @RunOnVirtualThread
    @SecurityRequirement(name = "jwtAuth")
    @Operation(summary = "Получить состояние раунда", description = "Возвращает текущее состояние активного раунда пользователя")
    public Response getRoundState(@QueryParam("roundId") UUID roundId) {
        Long userId = securityService.getCurrentUserId();

        UUID targetRoundId = roundId;
        if (targetRoundId == null) {
            ActiveGameRound activeRound = gameService.getActiveRounds().get(userId);
            if (activeRound != null) {
                targetRoundId = activeRound.roundId();
            } else {
                return Response.ok(new GameRoundStateResult(
                        null,
                        "NO_ACTIVE_ROUND",
                        false,
                        1.00,
                        null,
                        0L,
                        0L,
                        null,
                        0,
                        0,
                        false
                )).build();
            }
        }

        GameRoundStateResult state = gameService.checkRoundState(userId, targetRoundId);
        return Response.ok(state).build();
    }

    @GET
    @Path("/history")
    @RunOnVirtualThread
    @Operation(summary = "История завершенных игр", description = "Возвращает историю раундов (глобальную или персональную с флагом my=true)")
    public Response getHistory(
            @QueryParam("my") @DefaultValue("false") boolean my,
            @QueryParam("limit") @DefaultValue("20") int limit
    ) {
        int safeLimit = Math.clamp(limit, 1, 100);
        List<GameRound> rounds;

        if (my) {
            Long currentUserId = securityService.getCurrentUserId();
            rounds = gameRoundRepository.findHistoryByUserId(currentUserId, safeLimit);
        } else {
            rounds = gameRoundRepository.findGlobalHistory(safeLimit);
        }

        List<GameRoundHistoryItemDto> historyItems = rounds.stream()
                .map(this::mapToHistoryDto)
                .toList();

        return Response.ok(historyItems).build();
    }

    @GET
    @Path("/house-edge")
    @Authenticated
    @RunOnVirtualThread
    @SecurityRequirement(name = "jwtAuth")
    @Operation(summary = "Получить персональный House Edge игрока", description = "Возвращает текущий HE, RTP и EV авторизованного пользователя")
    public Response getHouseEdge() {
        Long userId = securityService.getCurrentUserId();
        User user = userRepository.findByIdOptional(userId)
                .orElseThrow(() -> new NotFoundException("Пользователь не найден"));

        double he = user.getCurrentHouseEdge();
        double rtp = gameService.getHouseEdgeCalculator().returnToPlayer(he);
        double ev = gameService.getHouseEdgeCalculator().expectedValue(he);

        return Response.ok(new PlayerHouseEdgeResponse(
                userId,
                he,
                rtp,
                ev,
                user.getLastBetAmount()
        )).build();
    }

    @POST
    @Path("/house-edge/reset")
    @Authenticated
    @RunOnVirtualThread
    @SecurityRequirement(name = "jwtAuth")
    @Operation(summary = "Сбросить персональный House Edge", description = "Сбрасывает House Edge игрока к базовому значению 0.04 (для тестирования/демо)")
    public Response resetHouseEdge() {
        Long userId = securityService.getCurrentUserId();
        double baseHe = gameService.resetPlayerHouseEdge(userId);
        double rtp = gameService.getHouseEdgeCalculator().returnToPlayer(baseHe);
        double ev = gameService.getHouseEdgeCalculator().expectedValue(baseHe);

        return Response.ok(new PlayerHouseEdgeResponse(
                userId,
                baseHe,
                rtp,
                ev,
                null
        )).build();
    }

    private GameRoundHistoryItemDto mapToHistoryDto(GameRound round) {
        User u = round.getUser();
        String username = u != null ? u.getUsername() : "Игрок";
        Long userId = u != null ? u.getId() : null;

        return new GameRoundHistoryItemDto(
                round.getId(),
                userId,
                username,
                round.getTheme(),
                round.getBetAmount(),
                round.getCrashMultiplier(),
                round.getCashoutMultiplier(),
                round.getWinAmount(),
                round.getIsWin(),
                round.getStatus(),
                round.getCreatedAt()
        );
    }

    @POST
    @Path("/top-up")
    @Authenticated
    @RunOnVirtualThread
    @SecurityRequirement(name = "jwtAuth")
    @Operation(summary = "Пополнить баланс бонусов игрока", description = "Пополняет баланс бонусов текущего игрока без ограничений (для тестирования)")
    public Response topUpGameBalance(com.hack2026.mog.dto.TopUpBalanceRequest request) {
        Long userId = securityService.getCurrentUserId();
        com.hack2026.mog.dto.TopUpBalanceResponse response = userService.topUpBalance(userId, request != null ? request.amount() : null);
        return Response.ok(response).build();
    }
}
