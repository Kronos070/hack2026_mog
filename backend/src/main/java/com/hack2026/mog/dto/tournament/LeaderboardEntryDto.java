package com.hack2026.mog.dto.tournament;

import org.eclipse.microprofile.openapi.annotations.media.Schema;

@Schema(description = "Запись в таблице живого рейтинга (лидерборд)")
public record LeaderboardEntryDto(
        @Schema(description = "Идентификатор игрока", example = "1")
        String playerId,

        @Schema(description = "Имя пользователя / логин", example = "alex_pilot")
        String playerName,

        @Schema(description = "Набранные очки", example = "3450")
        Long points
) {}
