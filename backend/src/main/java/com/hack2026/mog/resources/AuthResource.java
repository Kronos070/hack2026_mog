package com.hack2026.mog.resources;

import com.hack2026.mog.dto.AuthResponse;
import com.hack2026.mog.dto.LoginRequest;
import com.hack2026.mog.dto.RegisterRequest;
import com.hack2026.mog.dto.UserProfileResponse;
import com.hack2026.mog.services.AuthService;
import com.hack2026.mog.services.SecurityService;
import io.quarkus.security.Authenticated;
import io.smallrye.common.annotation.RunOnVirtualThread;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

@Path("/api/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Authentication", description = "Авторизация и регистрация пользователей через JWT Bearer токен")
public class AuthResource {

    @Inject
    AuthService authService;

    @Inject
    SecurityService securityService;

    @POST
    @Path("/register")
    @RunOnVirtualThread
    @Operation(summary = "Регистрация нового пользователя", description = "Создает нового пользователя, возвращает профиль и JWT Bearer токен")
    public Response register(@Valid @NotNull RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return Response.status(Response.Status.CREATED).entity(response).build();
    }

    @POST
    @Path("/login")
    @RunOnVirtualThread
    @Operation(summary = "Вход в систему", description = "Аутентифицирует пользователя по логину (username или email) и паролю, возвращает JWT Bearer токен")
    public Response login(@Valid @NotNull LoginRequest request) {
        AuthResponse response = authService.login(request);
        return Response.ok(response).build();
    }

    @GET
    @Path("/me")
    @Authenticated
    @RunOnVirtualThread
    @SecurityRequirement(name = "jwtAuth")
    @Operation(summary = "Получение текущего пользователя", description = "Возвращает профиль аутентифицированного пользователя по переданному Bearer токену")
    public UserProfileResponse me() {
        Long currentUserId = securityService.getCurrentUserId();
        return authService.getCurrentUser(currentUserId);
    }
}
