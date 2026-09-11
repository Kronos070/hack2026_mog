package com.hack2026.mog.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank(message = "Имя пользователя обязательно")
    @Size(min = 3, max = 64, message = "Имя пользователя должно содержать от 3 до 64 символов")
    String username,

    @NotBlank(message = "Email обязателен")
    @Email(message = "Некорректный формат email")
    @Size(max = 128, message = "Email не должен превышать 128 символов")
    String email,

    @NotBlank(message = "Пароль обязателен")
    @Size(min = 6, max = 100, message = "Пароль должен содержать от 6 до 100 символов")
    String password,

    @Size(max = 64, message = "Имя не должно превышать 64 символа")
    String firstName,

    @Size(max = 64, message = "Фамилия не должна превышать 64 символа")
    String lastName,

    @Size(max = 512, message = "URL аватара не должен превышать 512 символов")
    String avatarUrl
) {}
