package com.hack2026.mog.resources;

import com.hack2026.mog.dto.config.GameConfigDto;
import com.hack2026.mog.services.GameConfigService;
import io.quarkus.security.Authenticated;
import io.smallrye.common.annotation.RunOnVirtualThread;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

/**
 * REST API управления параметрами игры (ТЗ §1.9).
 * <p>
 * Эндпоинты:
 * <ul>
 *   <li>GET /api/admin/config — чтение конфига (для AdminPage.tsx и игрового клиента)</li>
 *   <li>PUT /api/admin/config — горячее сохранение конфига (роль ADMIN)</li>
 *   <li>POST /api/admin/config/reset — сброс к заводским дефолтам (роль ADMIN)</li>
 * </ul>
 */
@Path("/api/admin/config")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Admin Config", description = "Управление конфигурацией игры и hot-reload параметров")
public class AdminConfigResource {

    @Inject
    GameConfigService gameConfigService;

    @GET
    @Authenticated
    @RunOnVirtualThread
    @SecurityRequirement(name = "jwtAuth")
    @Operation(
        summary = "Получить текущую конфигурацию игры",
        description = "Возвращает актуальные параметры игры из in-memory кэша без задержек обращения к БД"
    )
    public GameConfigDto getConfig() {
        return gameConfigService.getCurrentConfig();
    }

    @PUT
    @RolesAllowed("ADMIN")
    @RunOnVirtualThread
    @SecurityRequirement(name = "jwtAuth")
    @Operation(
        summary = "Обновить конфигурацию игры (Hot-Reload)",
        description = "Сохраняет параметры в БД и обновляет in-memory ссылку. Доступно только пользователям с ролью ADMIN"
    )
    public GameConfigDto updateConfig(@Valid @NotNull GameConfigDto request) {
        return gameConfigService.saveConfig(request);
    }

    @POST
    @Path("/reset")
    @Consumes(MediaType.WILDCARD)
    @RolesAllowed("ADMIN")
    @RunOnVirtualThread
    @SecurityRequirement(name = "jwtAuth")
    @Operation(
        summary = "Сбросить конфигурацию к дефолтной",
        description = "Сбрасывает конфигурацию игры к эталонным настройкам по умолчанию. Доступно только пользователям с ролью ADMIN"
    )
    public GameConfigDto resetConfig() {
        return gameConfigService.resetConfig();
    }
}
