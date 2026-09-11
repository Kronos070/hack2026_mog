package com.hack2026.mog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
    @NotBlank(message = "Текущий пароль обязателен")
    String oldPassword,

    @NotBlank(message = "Новый пароль обязателен")
    @Size(min = 6, max = 100, message = "Новый пароль должен содержать от 6 до 100 символов")
    String newPassword
) {}
