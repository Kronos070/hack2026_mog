package com.hack2026.mog.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
    @NotBlank(message = "Логин (имя пользователя или email) обязателен")
    String login,

    @NotBlank(message = "Пароль обязателен")
    String password
) {}
