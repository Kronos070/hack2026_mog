package com.hack2026.mog.dto.tournament;

import org.eclipse.microprofile.openapi.annotations.media.Schema;
import java.util.List;

@Schema(description = "Полная информация о текущем турнире и участниках")
public record TournamentResponseDto(
        @Schema(description = "Название турнира", example = "Гран-при Воздухоплавателей Столото")
        String title,

        @Schema(description = "Время окончания турнира в миллисекундах (epoch ms)", example = "1726185599000")
        Long endsAt,

        @Schema(description = "Список участников турнира")
        List<TournamentTableEntryDto> entries,

        @Schema(description = "ID текущего авторизованного пользователя (или null в публичном стриме)", example = "1")
        String currentPlayerId
) {}
