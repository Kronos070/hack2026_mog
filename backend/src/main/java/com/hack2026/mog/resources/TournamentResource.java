package com.hack2026.mog.resources;

import com.hack2026.mog.dto.tournament.LeaderboardEntryDto;
import com.hack2026.mog.dto.tournament.TournamentHistoryItemDto;
import com.hack2026.mog.dto.tournament.TournamentResponseDto;
import com.hack2026.mog.dto.tournament.TournamentSettlementResultDto;
import com.hack2026.mog.services.SecurityService;
import com.hack2026.mog.services.TournamentService;
import io.smallrye.mutiny.Multi;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import org.jboss.resteasy.reactive.RestStreamElementType;

import java.util.List;

/**
 * REST и SSE эндпоинты для турнирной таблицы, живого рейтинга и финализации наград.
 */
@Path("/api/tournament")
@Tag(name = "Tournament", description = "Управление турнирной таблицей, лидербордом, автоначислением наград и SSE-стриминг")
public class TournamentResource {

    @Inject
    TournamentService tournamentService;

    @Inject
    SecurityService securityService;

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Получение полной информации о турнире и участниках",
            description = "Возвращает текущий турнир, таймер endsAt, призовые места и подсветку текущего игрока при наличии JWT")
    public TournamentResponseDto getTournament() {
        Long currentUserId = null;
        try {
            currentUserId = securityService.getCurrentUserId();
        } catch (Exception ignored) {
            // Эндпоинт публичный, токен опционален
        }
        return tournamentService.getCurrentTournament(currentUserId);
    }

    @GET
    @Path("/leaderboard")
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Получение компактного рейтинга участников (топ по очкам)",
            description = "Возвращает список лидеров для быстрого виджета или страницы рейтинга")
    public List<LeaderboardEntryDto> getLeaderboard(@QueryParam("limit") @DefaultValue("50") int limit) {
        return tournamentService.getLeaderboard(limit);
    }

    @GET
    @Path("/stream")
    @Produces(MediaType.SERVER_SENT_EVENTS)
    @RestStreamElementType(MediaType.APPLICATION_JSON)
    @Operation(summary = "SSE-стрим турнирной таблицы в реальном времени",
            description = "Стримит актуальный снимок турнирной таблицы каждую секунду")
    public Multi<TournamentResponseDto> streamTournament() {
        return tournamentService.streamTournament();
    }

    @GET
    @Path("/leaderboard/stream")
    @Produces(MediaType.SERVER_SENT_EVENTS)
    @RestStreamElementType(MediaType.APPLICATION_JSON)
    @Operation(summary = "SSE-стрим рейтинга лидеров в реальном времени",
            description = "Стримит актуальный компактный рейтинг каждую секунду")
    public Multi<List<LeaderboardEntryDto>> streamLeaderboard() {
        return tournamentService.streamLeaderboard();
    }

    @POST
    @Path("/settle")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Operation(summary = "Финализация турнира и начисление наград",
            description = "Подводит итоги турнира, начисляет призы топ-3 участникам на бонусный баланс, архивирует результаты и сбрасывает очки. Параметр force=true форсирует расчет до наступления endsAt (для тестирования).")
    public TournamentSettlementResultDto settleTournament(@QueryParam("force") @DefaultValue("false") boolean force) {
        return tournamentService.settleCurrentTournament(force);
    }

    @GET
    @Path("/history")
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "История завершенных турниров и начисленных призов",
            description = "Возвращает архив призеров прошедших турниров. При ?my=true возвращает только призы текущего пользователя.")
    public List<TournamentHistoryItemDto> getTournamentHistory(
            @QueryParam("my") @DefaultValue("false") boolean my,
            @QueryParam("limit") @DefaultValue("20") int limit) {
        Long userId = null;
        if (my) {
            try {
                userId = securityService.getCurrentUserId();
            } catch (Exception ignored) {
                // без токена возвращаем пустой список для my=true
                return List.of();
            }
        }
        return tournamentService.getTournamentHistory(userId, limit);
    }
}
