package com.hack2026.mog.math;

/**
 * Конфигурация параметров House Edge для математической модели crash-игры.
 *
 * @param baseHe Базовый House Edge (по умолчанию 0.04 = 4%)
 * @param minHe  Минимальный порог House Edge (по умолчанию 0.005 = 0.5%)
 * @param maxHe  Максимальный порог House Edge (по умолчанию 0.33 = 33%)
 */
public record HouseEdgeConfig(
        double baseHe,
        double minHe,
        double maxHe
) {
    public static final double DEFAULT_BASE_HE = 0.04;
    public static final double DEFAULT_MIN_HE = 0.005;
    public static final double DEFAULT_MAX_HE = 0.33;

    public static final HouseEdgeConfig DEFAULT = new HouseEdgeConfig(
            DEFAULT_BASE_HE,
            DEFAULT_MIN_HE,
            DEFAULT_MAX_HE
    );

    public HouseEdgeConfig {
        if (minHe < 0.0 || minHe > 1.0) {
            throw new IllegalArgumentException("minHe must be between 0.0 and 1.0: " + minHe);
        }
        if (maxHe < minHe || maxHe > 1.0) {
            throw new IllegalArgumentException("maxHe must be between minHe (" + minHe + ") and 1.0: " + maxHe);
        }
        if (baseHe < minHe || baseHe > maxHe) {
            throw new IllegalArgumentException("baseHe (" + baseHe + ") must be within [" + minHe + ", " + maxHe + "]");
        }
    }

    public HouseEdgeConfig() {
        this(DEFAULT_BASE_HE, DEFAULT_MIN_HE, DEFAULT_MAX_HE);
    }
}
