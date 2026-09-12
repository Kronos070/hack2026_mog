package com.hack2026.mog.dto.tournament;

import org.eclipse.microprofile.openapi.annotations.media.Schema;
import java.util.List;

@Schema(description = "Результат завершения турнира и выплаты призов")
public record TournamentSettlementResultDto(
        @Schema(description = "Статус завершения", example = "SUCCESS")
        String status,

        @Schema(description = "Название турнира", example = "Гран-при Воздухоплавателей Столото")
        String tournamentTitle,

        @Schema(description = "Время завершения (epoch ms)", example = "1789246799000")
        Long settledAt,

        @Schema(description = "Количество награжденных игроков", example = "3")
        int rewardedPlayersCount,

        @Schema(description = "Общая сумма выплаченных призов в бонусах", example = "5907")
        Long totalPrizesAwarded,

        @Schema(description = "Список призеров турнира")
        List<TournamentHistoryItemDto> winners,

        @Schema(description = "Информационное сообщение", example = "Турнир успешно завершен, призы зачислены на баланс")
        String message
) {}
