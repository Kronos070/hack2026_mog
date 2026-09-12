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

export function progressInLevels(multiplier: number, levels: readonly number[]): number {
  // Доля пути по шкале; выше последнего уровня продолжается той же прогрессией
  if (levels.length === 0) return 0;
  const slot = 1 / (levels.length + 1);

  for (let index = 0; index < levels.length; index += 1) {
    const top = levels[index] ?? 1;
    if (multiplier < top) {
      const bottom = index === 0 ? 1 : (levels[index - 1] ?? 1);
      const span = Math.log(top) - Math.log(bottom);
      const ratio = span > 0 ? (Math.log(multiplier) - Math.log(bottom)) / span : 0;
      return (index + Math.max(ratio, 0)) * slot;
    }
  }

  const count = levels.length;
  const last = levels[count - 1] ?? 1;
  const first = levels[0] ?? 1;
  const growth = count > 1 ? Math.pow(last / first, 1 / (count - 1)) : 2;
  const step = Math.log(growth);
  const over = step > 0 ? (Math.log(multiplier) - Math.log(last)) / step : 0;
  return (count + Math.max(over, 0)) * slot;
}
