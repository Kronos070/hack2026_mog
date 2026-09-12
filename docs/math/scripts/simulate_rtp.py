#!/usr/bin/env python3
"""
MOG (Make Ochko Great) — Monte Carlo RTP & House Edge Simulator
================================================================
Этот скрипт проводит эмпирическую верификацию математической модели:
1. Закон распределения краша: P(crash >= k) = (1 - HE) / k
2. Теоретический возврат игроку (RTP): RTP = 1 - HE (по умолчанию 96.00%)
3. Математическое ожидание раунда: EV = -HE (по умолчанию -4.00%)
4. Динамическая адаптация House Edge при выигрышах и смене ставок.

Запуск:
    python3 simulate_rtp.py [количество_раундов]
Пример:
    python3 simulate_rtp.py 1000000
"""

import hmac
import hashlib
import os
import sys
import math
import random
from typing import Tuple

E_52_BITS = 1 << 52
E_DOUBLE = float(E_52_BITS)
MIN_CRASH = 1.00

DEFAULT_BASE_HE = 0.04
DEFAULT_MIN_HE = 0.005
DEFAULT_MAX_HE = 0.33


def generate_crash(server_seed: bytes, client_seed: str, nonce: int, house_edge: float) -> float:
    """Генерация множителя краша строго по алгоритму com.hack2026.mog.math.CrashGenerator."""
    combined_seed = f"{client_seed}:{nonce}".encode("utf-8")
    h_bytes = hmac.new(server_seed, combined_seed, hashlib.sha256).digest()

    # Извлечение первых 52 бит: первые 6 байт (48 бит) + 4 старших бита 7-го байта
    h = 0
    for i in range(6):
        h = (h << 8) | h_bytes[i]
    h = (h << 4) | (h_bytes[6] >> 4)

    h_float = float(h)
    numerator = 100.0 * E_DOUBLE - h_float
    denominator = E_DOUBLE - h_float

    raw = (numerator / denominator) * (1.0 - house_edge) / 100.0
    floored = math.floor(raw * 100.0) / 100.0
    return max(MIN_CRASH, floored)


def update_house_edge(current_he: float, won: bool, bet: float, prev_bet: float, cashout_mult: float) -> float:
    """Расчет динамического House Edge строго по com.hack2026.mog.math.HouseEdgeCalculator."""
    delta = 0.0
    if won:
        w = max(1.0, cashout_mult - 1.0)
        delta += (math.pow(1.01, w) - 1.0)
    else:
        delta -= 0.01

    if prev_bet is not None and abs(bet - prev_bet) > 1e-6:
        delta += (DEFAULT_BASE_HE - current_he)

    next_he = current_he + delta
    return max(DEFAULT_MIN_HE, min(DEFAULT_MAX_HE, next_he))


def run_static_rtp_simulation(total_rounds: int, target_cashouts: list[float], house_edge: float = DEFAULT_BASE_HE):
    """Тестирование RTP и EV на фиксированном House Edge при разных стратегиях кэшаута."""
    print("=" * 70)
    print(f"1. СТАТИЧЕСКИЙ ТЕСТ RTP: {total_rounds:,} раундов (HE = {house_edge*100:.2f}%, Теория RTP = {(1-house_edge)*100:.2f}%)")
    print("=" * 70)

    server_seed = os.urandom(32)
    client_seed = "sim_client_seed"

    results = {k: {"bets": 0.0, "wins": 0.0, "hits": 0} for k in target_cashouts}
    crashes = []

    for nonce in range(1, total_rounds + 1):
        crash = generate_crash(server_seed, client_seed, nonce, house_edge)
        if len(crashes) < 100000:
            crashes.append(crash)

        bet = 100.0
        for k in target_cashouts:
            results[k]["bets"] += bet
            if crash >= k:
                results[k]["wins"] += bet * k
                results[k]["hits"] += 1

    print(f"{'Target (k)':>10} | {'Теория P(>=k)':>14} | {'Факт P(>=k)':>12} | {'Эмпирический RTP':>18} | {'EV на ставку 100':>16}")
    print("-" * 78)

    for k in target_cashouts:
        theory_p = (1.0 - house_edge) / k
        fact_p = results[k]["hits"] / total_rounds
        rtp = (results[k]["wins"] / results[k]["bets"]) * 100.0
        ev = (results[k]["wins"] - results[k]["bets"]) / total_rounds
        print(f"{k:>9.2f}x | {theory_p*100:>13.2f}% | {fact_p*100:>11.2f}% | {rtp:>17.2f}% | {ev:>16.2f}")

    crashes.sort()
    n = len(crashes)
    print("\nКвантили распределения точки краха:")
    print(f"  Медиана (p50): {crashes[int(n * 0.50)]:.2f}x")
    print(f"  p75:           {crashes[int(n * 0.75)]:.2f}x")
    print(f"  p90:           {crashes[int(n * 0.90)]:.2f}x")
    print(f"  p99:           {crashes[int(n * 0.99)]:.2f}x")
    print(f"  Максимум:      {crashes[-1]:.2f}x")


def run_dynamic_house_edge_simulation(rounds: int = 20000):
    """Демонстрация работы адаптивного House Edge и саморегуляции казино."""
    print("\n" + "=" * 70)
    print(f"2. ДИНАМИЧЕСКИЙ ТЕСТ АДАПТАЦИИ HOUSE EDGE ({rounds:,} раундов)")
    print("=" * 70)

    server_seed = os.urandom(32)
    client_seed = "dynamic_sim"
    current_he = DEFAULT_BASE_HE
    prev_bet = None

    history_he = []
    total_wagered = 0.0
    total_returned = 0.0

    # Моделируем игрока с переменным стилем игры (кэшаут 2x, иногда меняет ставку)
    for nonce in range(1, rounds + 1):
        # Случайная смена ставки раз в 50 раундов
        bet = 250.0 if (nonce % 50 == 0) else 100.0
        crash = generate_crash(server_seed, client_seed, nonce, current_he)

        target_k = 2.00
        won = crash >= target_k
        cashout_mult = target_k if won else 0.0

        total_wagered += bet
        if won:
            total_returned += bet * cashout_mult

        current_he = update_house_edge(current_he, won, bet, prev_bet, cashout_mult)
        prev_bet = bet
        history_he.append(current_he)

    avg_he = sum(history_he) / len(history_he)
    min_observed = min(history_he)
    max_observed = max(history_he)
    effective_rtp = (total_returned / total_wagered) * 100.0

    print(f"Базовый House Edge:    {DEFAULT_BASE_HE*100:.2f}%")
    print(f"Средний House Edge:    {avg_he*100:.2f}% (диапазон: [{min_observed*100:.2f}%, {max_observed*100:.2f}%])")
    print(f"Итоговый оборот:       {total_wagered:,.0f} бонусов")
    print(f"Итоговый возврат:      {total_returned:,.0f} бонусов")
    print(f"Фактический RTP:       {effective_rtp:.2f}%")
    print("=" * 70)


if __name__ == "__main__":
    n_rounds = int(sys.argv[1]) if len(sys.argv) > 1 else 1_000_000
    target_multipliers = [1.20, 1.50, 2.00, 3.00, 5.00, 10.00]
    run_static_rtp_simulation(n_rounds, target_multipliers)
    run_dynamic_house_edge_simulation(20_000)
