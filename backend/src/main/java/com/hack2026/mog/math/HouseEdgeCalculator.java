package com.hack2026.mog.math;

import java.util.Objects;

/**
 * Калькулятор динамического House Edge (преимущества казино).
 * <p>
 * Реализует математическую модель удержания и балансировки:
 * <pre>
 * HE_base = 0.04
 * HE_min  = 0.005
 * HE_max  = 0.33
 *
 * W(n) = max( 1,  bet(n)·k(n)/bet(n) − 1 )
 *
 * ΔHE(n) = ( (1.01)^W(n) − 1 ) · [WIN]
 *        − 0.01              · [LOSS]
 *        + ( HE_base − HE(n) ) · [bet(n) ≠ bet(n−1)]
 *
 * HE(n+1) = clamp( HE(n) + ΔHE(n),  HE_min,  HE_max )
 *
 * P( crash ≥ k ) = (1 − HE(n)) / k
 * EV(n)          = −HE(n)
 * </pre>
 */
public class HouseEdgeCalculator {

    private final HouseEdgeConfig config;

    /**
     * Создает экземпляр с конфигурацией по умолчанию (HE_base=0.04, HE_min=0.005, HE_max=0.33).
     */
    public HouseEdgeCalculator() {
        this(HouseEdgeConfig.DEFAULT);
    }

    /**
     * Создает экземпляр с заданной конфигурацией.
     */
    public HouseEdgeCalculator(HouseEdgeConfig config) {
        this.config = Objects.requireNonNull(config, "config must not be null");
    }

    public HouseEdgeConfig getConfig() {
        return config;
    }

    /**
     * Расчет веса выигрыша: W(n) = max( 1, bet(n)·k(n)/bet(n) − 1 ).
     * При положительной ставке bet(n)·k(n)/bet(n) − 1 строго равно k(n) − 1.
     *
     * @param bet                Размер ставки bet(n)
     * @param cashoutMultiplier  Множитель вывода k(n)
     * @return W(n) >= 1.0
     */
    public double calculateW(double bet, double cashoutMultiplier) {
        if (bet <= 0.0) {
            return Math.max(1.0, cashoutMultiplier - 1.0);
        }
        double netProfitRatio = (bet * cashoutMultiplier) / bet - 1.0;
        return Math.max(1.0, netProfitRatio);
    }

    /**
     * Вычисляет приращение ΔHE(n) по итогам раунда n.
     *
     * @param currentHe Текущее значение HE(n)
     * @param outcome   Данные раунда (ставка, выигрыш/проигрыш, множитель, прошлая ставка)
     * @return Приращение ΔHE(n)
     */
    public double calculateDelta(double currentHe, RoundOutcome outcome) {
        Objects.requireNonNull(outcome, "outcome must not be null");

        double delta = 0.0;

        if (outcome.won()) {
            double w = calculateW(outcome.bet(), outcome.cashoutMultiplier());
            delta += (Math.pow(1.01, w) - 1.0);
        } else {
            delta -= 0.01;
        }

        // Если ставка изменилась [bet(n) != bet(n-1)], компенсируем отклонение к HE_base
        if (outcome.hasBetChanged()) {
            delta += (config.baseHe() - currentHe);
        }

        return delta;
    }

    /**
     * Вычисляет обновленный House Edge для следующего раунда n+1:
     * HE(n+1) = clamp( HE(n) + ΔHE(n), HE_min, HE_max ).
     *
     * @param currentHe Текущее значение HE(n)
     * @param outcome   Данные завершенного раунда n
     * @return Ограниченное значение HE(n+1) в диапазоне [HE_min, HE_max]
     */
    public double calculateNextHouseEdge(double currentHe, RoundOutcome outcome) {
        double delta = calculateDelta(currentHe, outcome);
        double rawNextHe = currentHe + delta;
        return clamp(rawNextHe);
    }

    /**
     * Удобная перегрузка для быстрого расчета без предварительного создания RoundOutcome.
     */
    public double calculateNextHouseEdge(double currentHe,
                                         boolean won,
                                         double bet,
                                         Double previousBet,
                                         double cashoutMultiplier) {
        RoundOutcome outcome = won
                ? RoundOutcome.win(bet, previousBet, cashoutMultiplier)
                : RoundOutcome.loss(bet, previousBet);
        return calculateNextHouseEdge(currentHe, outcome);
    }

    /**
     * Ограничивает значение House Edge пределами [HE_min, HE_max].
     */
    public double clamp(double value) {
        return Math.clamp(value, config.minHe(), config.maxHe());
    }

    /**
     * Расчет вероятности того, что крах произойдет на множителе не ниже k:
     * P( crash >= k ) = (1 - HE(n)) / k.
     *
     * @param k         Целевой множитель (k >= 1.0)
     * @param houseEdge Текущее значение HE(n)
     * @return Вероятность в диапазоне [0.0, 1.0]
     */
    public double probabilityOfCrashAtLeast(double k, double houseEdge) {
        if (k < 1.0) {
            throw new IllegalArgumentException("k must be >= 1.0: " + k);
        }
        double p = (1.0 - houseEdge) / k;
        return Math.clamp(p, 0.0, 1.0);
    }

    /**
     * Расчет математического ожидания раунда для игрока:
     * EV(n) = −HE(n).
     */
    public double expectedValue(double houseEdge) {
        return -houseEdge;
    }

    /**
     * Расчет теоретического возврата игроку (Return to Player):
     * RTP(n) = 1 − HE(n).
     */
    public double returnToPlayer(double houseEdge) {
        return 1.0 - houseEdge;
    }
}
