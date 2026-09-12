package com.hack2026.mog.dto.meta;

/**
 * DTO полигона характеристик игрока (шестиугольник в стиле Dota 2).
 * Показатели от 0.0 до 10.0, рассчитываются по скользящему окну последних 30 игр с пересчетом каждые 10 игр.
 */
public record StatRadarDto(
        double patience,
        double boosters,
        double collector,
        double generosity,
        double winRate,
        double risk,
        int gamesAnalyzed,
        long totalGames,
        int nextRecalcIn
) {
    public static StatRadarDto empty(long totalGames, int nextRecalcIn) {
        return new StatRadarDto(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0, totalGames, nextRecalcIn);
    }
}
