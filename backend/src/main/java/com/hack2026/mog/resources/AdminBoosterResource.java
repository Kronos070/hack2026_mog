package com.hack2026.mog.resources;

import com.hack2026.mog.dto.config.BoosterTierPricingDto;
import com.hack2026.mog.services.GameConfigService;
import io.quarkus.security.Authenticated;
import io.smallrye.common.annotation.RunOnVirtualThread;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.util.List;

/**
 * REST API для администрирования стоимости бустеров во фрагментах.
 */
@Path("/api/admin/boosters/pricing")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Admin Boosters", description = "Управление стоимостью бустеров во фрагментах")
public class AdminBoosterResource {

    @Inject
    GameConfigService gameConfigService;

    @GET
    @Authenticated
    @RunOnVirtualThread
    @SecurityRequirement(name = "jwtAuth")
    @Operation(
        summary = "Получить текущую сетку цен бустеров",
        description = "Возвращает список тиров бустеров с множителями и стоимостью во фрагментах"
    )
    public List<BoosterTierPricingDto> getPricing() {
        return gameConfigService.getBoosterPricing();
    }

    @PUT
    @RolesAllowed("ADMIN")
    @RunOnVirtualThread
    @SecurityRequirement(name = "jwtAuth")
    @Operation(
        summary = "Обновить стоимость бустеров во фрагментах",
        description = "Принимает массив из 4 целых чисел со стоимостью во фрагментах для тиров 1..4 (например [0, 2, 4, 6])"
    )
    public List<BoosterTierPricingDto> updatePricing(@NotNull List<Integer> costs) {
        return gameConfigService.updateBoosterPricing(costs);
    }
}
