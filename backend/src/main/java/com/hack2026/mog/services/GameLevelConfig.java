package com.hack2026.mog.services;

import java.util.List;

/**
 * Конфигурация уровней и тем для crash-игры «Воздушный Шар».
 * <ul>
 *   <li>Зеленая тема: 9 уровней</li>
 *   <li>Красная тема: 12 уровней</li>
 * </ul>
 */
public final class GameLevelConfig {

    private GameLevelConfig() {}

    public static final String THEME_GREEN = "green";
    public static final String THEME_RED = "red";
    public static final String THEME_CLASSIC = "classic";

    public static final int POINTS_PER_LEVEL = 10;
    public static final int POINTS_CASHOUT_BONUS = 50;

    /**
     * Пороги множителей для Зеленой темы (9 уровней).
     */
    public static final double[] GREEN_LEVEL_THRESHOLDS = {
            1.20, // Уровень 1 (разблокировка cashout)
            1.50, // Уровень 2
            2.00, // Уровень 3
            2.60, // Уровень 4
            3.50, // Уровень 5
            5.00, // Уровень 6
            7.50, // Уровень 7
            12.00, // Уровень 8
            20.00  // Уровень 9
    };

    /**
     * Пороги множителей для Красной темы (12 уровней).
     */
    public static final double[] RED_LEVEL_THRESHOLDS = {
            1.15, // Уровень 1 (разблокировка cashout)
            1.35, // Уровень 2
            1.65, // Уровень 3
            2.10, // Уровень 4
            2.80, // Уровень 5
            3.80, // Уровень 6
            5.20, // Уровень 7
            7.20, // Уровень 8
            10.50, // Уровень 9
            16.00, // Уровень 10
            25.00, // Уровень 11
            50.00  // Уровень 12
    };

    public static int getTotalLevels(String theme) {
        return isRedTheme(theme) ? RED_LEVEL_THRESHOLDS.length : GREEN_LEVEL_THRESHOLDS.length;
    }

    public static double[] getLevelThresholds(String theme) {
        return isRedTheme(theme) ? RED_LEVEL_THRESHOLDS : GREEN_LEVEL_THRESHOLDS;
    }

    public static double getUnlockMultiplier(String theme) {
        return getLevelThresholds(theme)[0];
    }

    public static double getThresholdForLevel(String theme, int level) {
        double[] thresholds = getLevelThresholds(theme);
        int index = Math.clamp(level - 1, 0, thresholds.length - 1);
        return thresholds[index];
    }

    /**
     * Определяет уровень, на котором появится бустер.
     * Размещается между 2-м уровнем и (totalLevels - 2).
     */
    public static int determineBoosterLevel(String theme, String seed) {
        int total = getTotalLevels(theme);
        int minLevel = 2;
        int maxLevel = Math.max(minLevel, total - 2);
        int range = maxLevel - minLevel + 1;

        int hash = seed != null ? Math.abs(seed.hashCode()) : (int) (System.currentTimeMillis() % 1000);
        return minLevel + (hash % range);
    }

    /**
     * Сколько уровней шар успешно преодолел на данном множителе.
     */
    public static int calculatePassedLevels(String theme, double multiplier) {
        double[] thresholds = getLevelThresholds(theme);
        int passed = 0;
        for (double threshold : thresholds) {
            if (multiplier >= threshold) {
                passed++;
            } else {
                break;
            }
        }
        return passed;
    }

    /**
     * Расчет очков за раунд по настраиваемым параметрам конфигурации.
     */
    public static int calculatePoints(int passedLevels, boolean isWin, boolean boosterActivated,
                                      int pointsPerLine, int pointsCashoutBonus, int pointsBoosterBonus) {
        int points = passedLevels * pointsPerLine;
        if (isWin) {
            points += pointsCashoutBonus;
        }
        if (boosterActivated) {
            points += pointsBoosterBonus;
        }
        return points;
    }

    /**
     * Расчет очков за раунд (legacy fallback).
     */
    public static int calculatePoints(int passedLevels, boolean isWin, boolean boosterActivated, int boosterMultiplier) {
        int points = passedLevels * POINTS_PER_LEVEL;
        if (boosterActivated && boosterMultiplier > 1) {
            points += boosterMultiplier * POINTS_PER_LEVEL;
        }
        if (isWin) {
            points += POINTS_CASHOUT_BONUS;
        }
        return points;
    }

    private static boolean isRedTheme(String theme) {
        return theme != null && (THEME_RED.equalsIgnoreCase(theme) || "red_balloon".equalsIgnoreCase(theme));
    }
}
