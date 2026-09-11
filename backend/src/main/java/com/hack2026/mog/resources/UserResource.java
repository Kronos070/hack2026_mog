package com.hack2026.mog.resources;

import com.hack2026.mog.dto.ChangePasswordRequest;
import com.hack2026.mog.dto.PageResponse;
import com.hack2026.mog.dto.UpdateProfileRequest;
import com.hack2026.mog.dto.UserProfileResponse;
import com.hack2026.mog.services.SecurityService;
import com.hack2026.mog.services.UserService;
import io.quarkus.security.Authenticated;
import io.smallrye.common.annotation.RunOnVirtualThread;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import java.util.Map;

@Path("/api/users")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Users", description = "Управление профилями пользователей (CRUD)")
public class UserResource {

    @Inject
    UserService userService;

    @Inject
    SecurityService securityService;

    @GET
    @Path("/me")
    @Authenticated
    @RunOnVirtualThread
    @SecurityRequirement(name = "jwtAuth")
    @Operation(summary = "Получить собственный профиль", description = "Возвращает данные профиля авторизованного пользователя")
    public UserProfileResponse getMyProfile() {
        Long currentUserId = securityService.getCurrentUserId();
        return userService.getProfile(currentUserId);
    }

    @PUT
    @Path("/me")
    @Authenticated
    @RunOnVirtualThread
    @SecurityRequirement(name = "jwtAuth")
    @Operation(summary = "Обновить собственный профиль", description = "Обновляет имя пользователя, email, имя, фамилию или аватар")
    public UserProfileResponse updateMyProfile(@Valid @NotNull UpdateProfileRequest request) {
        Long currentUserId = securityService.getCurrentUserId();
        return userService.updateProfile(currentUserId, request);
    }

    @PUT
    @Path("/me/password")
    @Authenticated
    @RunOnVirtualThread
    @SecurityRequirement(name = "jwtAuth")
    @Operation(summary = "Сменить пароль", description = "Изменяет пароль авторизованного пользователя с проверкой текущего пароля")
    public Response changePassword(@Valid @NotNull ChangePasswordRequest request) {
        Long currentUserId = securityService.getCurrentUserId();
        userService.changePassword(currentUserId, request);
        return Response.ok(Map.of("message", "Пароль успешно изменен")).build();
    }

    @DELETE
    @Path("/me")
    @Authenticated
    @RunOnVirtualThread
    @SecurityRequirement(name = "jwtAuth")
    @Operation(summary = "Удалить собственный аккаунт", description = "Удаляет профиль авторизованного пользователя")
    public Response deleteMyAccount() {
        Long currentUserId = securityService.getCurrentUserId();
        userService.deleteUser(currentUserId);
        return Response.noContent().build();
    }

    @GET
    @Path("/{id}")
    @RunOnVirtualThread
    @Operation(summary = "Получить профиль пользователя по ID", description = "Возвращает публичный профиль пользователя по его идентификатору")
    public UserProfileResponse getUserById(@PathParam("id") Long id) {
        return userService.getProfile(id);
    }

    @GET
    @RunOnVirtualThread
    @Operation(summary = "Список пользователей", description = "Возвращает пагинированный список пользователей")
    public PageResponse<UserProfileResponse> listUsers(
        @QueryParam("page") @DefaultValue("0") int page,
        @QueryParam("size") @DefaultValue("20") int size
    ) {
        return userService.listUsers(page, size);
    }

    @POST
    @Path("/me/top-up")
    @Authenticated
    @RunOnVirtualThread
    @SecurityRequirement(name = "jwtAuth")
    @Operation(summary = "Пополнить баланс бонусов текущего пользователя", description = "Добавляет бонусные баллы на баланс авторизованного пользователя без проверок (для тестирования)")
    public com.hack2026.mog.dto.TopUpBalanceResponse topUpMyBalance(com.hack2026.mog.dto.TopUpBalanceRequest request) {
        Long currentUserId = securityService.getCurrentUserId();
        return userService.topUpBalance(currentUserId, request != null ? request.amount() : null);
    }

    @POST
    @Path("/{id}/top-up")
    @RunOnVirtualThread
    @Operation(summary = "Пополнить баланс бонусов пользователя по ID", description = "Добавляет бонусные баллы на баланс пользователя по ID без проверок (для тестирования)")
    public com.hack2026.mog.dto.TopUpBalanceResponse topUpBalanceById(@PathParam("id") Long id, com.hack2026.mog.dto.TopUpBalanceRequest request) {
        return userService.topUpBalance(id, request != null ? request.amount() : null);
    }
}
