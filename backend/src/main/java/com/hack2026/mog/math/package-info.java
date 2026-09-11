/**
 * Модуль математической модели для расчета динамического House Edge и Provably Fair коэффициента краха.
 * <p>
 * Основные компоненты:
 * <ul>
 *   <li>{@link com.hack2026.mog.math.HouseEdgeCalculator} — расчет динамического HE, дельты раунда, вероятностей и EV</li>
 *   <li>{@link com.hack2026.mog.math.CrashGenerator} — криптографическая генерация краха на базе HMAC-SHA256 и 52-битной энтропии</li>
 *   <li>{@link com.hack2026.mog.math.HouseEdgeConfig} — параметры модели (HE_base, HE_min, HE_max)</li>
 *   <li>{@link com.hack2026.mog.math.RoundOutcome} — модель входных данных завершенного раунда</li>
 *   <li>{@link com.hack2026.mog.math.CrashResult} — результат детерминированной генерации краха</li>
 * </ul>
 */
package com.hack2026.mog.math;
