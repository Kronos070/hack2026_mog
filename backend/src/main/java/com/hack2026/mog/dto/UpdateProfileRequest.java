package com.hack2026.mog.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
    @Size(min = 3, max = 64, message = "Имя пользователя должно содержать от 3 до 64 символов")
    String username,

    @Email(message = "Некорректный формат email")
    @Size(max = 128, message = "Email не должен превышать 128 символов")
    String email,

    @Size(max = 64, message = "Имя не должно превышать 64 символа")
    String firstName,

    @Size(max = 64, message = "Фамилия не должна превышать 64 символа")
    String lastName,

    @Size(max = 512, message = "URL аватара не должен превышать 512 символов")
    String avatarUrl
) {}
