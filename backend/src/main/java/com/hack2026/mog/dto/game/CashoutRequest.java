package com.hack2026.mog.dto.game;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record CashoutRequest(
        @NotNull(message = "Параметр roundId обязателен")
        UUID roundId
) {}
