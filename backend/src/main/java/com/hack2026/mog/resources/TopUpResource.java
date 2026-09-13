package com.hack2026.mog.resources;

import com.hack2026.mog.dto.TopUpBalanceRequest;
import com.hack2026.mog.dto.TopUpBalanceResponse;
import com.hack2026.mog.services.SecurityService;
import com.hack2026.mog.services.UserService;
import io.quarkus.security.Authenticated;
import io.smallrye.common.annotation.RunOnVirtualThread;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

@Path("/api/top-up")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "TopUp", description = "Быстрое пополнение баланса бонусов игрока")
public class TopUpResource {

    @Inject
    SecurityService securityService;

    @Inject
    UserService userService;

    @POST
    @Authenticated
    @RunOnVirtualThread
    @SecurityRequirement(name = "jwtAuth")
    @Operation(summary = "Пополнить баланс бонусов игрока", description = "Пополняет баланс бонусов текущего игрока без ограничений (для тестирования)")
    public Response topUp(TopUpBalanceRequest request) {
        Long userId = securityService.getCurrentUserId();
        TopUpBalanceResponse response = userService.topUpBalance(userId, request != null ? request.amount() : null);
        return Response.ok(response).build();
    }
}
