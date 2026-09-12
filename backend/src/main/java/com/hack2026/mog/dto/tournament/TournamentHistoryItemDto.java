package com.hack2026.mog.dto.tournament;

import org.eclipse.microprofile.openapi.annotations.media.Schema;

@Schema(description = "Запись о победителе и начисленном призе в завершенном турнире")
public record TournamentHistoryItemDto(
        @Schema(description = "Занятое место", example = "1")
        Integer place,

        @Schema(description = "Идентификатор игрока", example = "42")
        String playerId,

        @Schema(description = "Имя пользователя", example = "alex_pilot")
        String playerName,

        @Schema(description = "Набранные турнирные очки", example = "3450")
        Long score,

        @Schema(description = "Начисленный приз в бонусах", example = "3450")
        Long prizeAwarded,

        @Schema(description = "Дата и время начисления", example = "2026-09-12T23:59:59Z")
        String awardedAt
) {}
