// Математическая модель crash-игры: точка краха, рост коэффициента, уровни

import type { GameConfig, Theme } from '@/shared/api/contract';
import { LEVELS_BY_THEME } from '@/shared/api/contract';

export function generateCrashMultiplier(config: GameConfig, random: number): number {
  // Обратное преобразование Парето: P(crash > x) = (min/x)^alpha
  const safe = Math.min(Math.max(random, Number.EPSILON), 1 - Number.EPSILON);
  const raw = config.minCrashMultiplier / Math.pow(safe, 1 / config.alpha);
  return roundTo(Math.min(raw, config.maxMultiplier), 2);
}

export function multiplierAt(elapsedMs: number, config: GameConfig): number {
  // Разгон: показатель растёт как t^acceleration, поэтому старт пологий
  const seconds = Math.max(elapsedMs, 0) / 1000;
  const power = Math.pow(seconds, config.growthAcceleration);
  return roundTo(Math.exp(config.multiplierGrowthRate * power), 2);
}

export function timeToReach(multiplier: number, config: GameConfig): number {
  if (multiplier <= 1) return 0;
  const power = Math.log(multiplier) / config.multiplierGrowthRate;
  return Math.pow(power, 1 / config.growthAcceleration) * 1000;
}

export function buildLevelMultipliers(theme: Theme, config: GameConfig): number[] {
  const count = LEVELS_BY_THEME[theme];
  const top = Math.min(config.maxMultiplier, 10);
  const step = Math.pow(top, 1 / count);
  return Array.from({ length: count }, (_, index) => roundTo(Math.pow(step, index + 1), 2));
}

export function pickBoosterLevel(
  theme: Theme,
  config: GameConfig,
  random: number,
): number | null {
  const probabilities = config.lootProbabilities[theme];
  const total = probabilities.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return null;

  let cursor = random * total;
  for (let index = 0; index < probabilities.length; index += 1) {
    cursor -= probabilities[index] ?? 0;
    if (cursor <= 0) return index + 1;
  }
  return probabilities.length;
}

export function levelsPassedAt(multiplier: number, levelMultipliers: readonly number[]): number {
  let passed = 0;
  for (const level of levelMultipliers) {
    if (multiplier >= level) passed += 1;
    else break;
  }
  return passed;
}

function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
