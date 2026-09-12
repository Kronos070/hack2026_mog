package com.hack2026.mog.dto.tournament;

import org.eclipse.microprofile.openapi.annotations.media.Schema;

@Schema(description = "Строка турнирной таблицы с местом и призом")
public record TournamentTableEntryDto(
        @Schema(description = "Занятое место в турнире", example = "1")
        Integer place,

        @Schema(description = "Идентификатор игрока", example = "1")
        String playerId,

        @Schema(description = "Имя пользователя / логин", example = "alex_pilot")
        String playerName,

        @Schema(description = "Набранные турнирные очки", example = "3450")
        Long points,

        @Schema(description = "Призовой фонд (бонусы)", example = "3450")
        Long prize
) {}
