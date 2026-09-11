package com.hack2026.mog.math;

/**
 * Входные данные раунда n для перерасчета динамического House Edge.
 *
 * @param bet               Размер ставки в текущем раунде (bet(n))
 * @param previousBet       Размер ставки в предыдущем раунде (bet(n-1)), null если это первый раунд
 * @param won               Флаг выигрыша (true: игрок забрал выигрыш до краха [WIN], false: крах до забора [LOSS])
 * @param cashoutMultiplier Коэффициент, на котором был совершен cashout k(n) (при выигрыше)
 */
public record RoundOutcome(
        double bet,
        Double previousBet,
        boolean won,
        double cashoutMultiplier
) {
    public RoundOutcome {
        if (bet <= 0.0) {
            throw new IllegalArgumentException("bet must be positive: " + bet);
        }
        if (won && cashoutMultiplier < 1.0) {
            throw new IllegalArgumentException("cashoutMultiplier on win must be >= 1.0: " + cashoutMultiplier);
        }
    }

    /**
     * Создает исход раунда с выигрышем.
     */
    public static RoundOutcome win(double bet, Double previousBet, double cashoutMultiplier) {
        return new RoundOutcome(bet, previousBet, true, cashoutMultiplier);
    }

    /**
     * Создает исход раунда с проигрышем.
     */
    public static RoundOutcome loss(double bet, Double previousBet) {
        return new RoundOutcome(bet, previousBet, false, 0.0);
    }

    /**
     * Проверяет, изменился ли размер ставки по сравнению с предыдущим раундом: [bet(n) != bet(n-1)].
     * Если предыдущая ставка не задана (первый раунд), изменение считается отсутствующим (false).
     */
    public boolean hasBetChanged() {
        if (previousBet == null) {
            return false;
        }
        return Math.abs(bet - previousBet) > 1e-9;
    }
}
