package com.hack2026.mog.dto.meta;

/**
 * DTO ранга игрока, в точности соответствует rankSchema фронтенда.
 */
public record RankDto(
        String id,
        String title,
        double minProfit,
        String nextTitle,
        Double nextAt,
        double profit
) {}
