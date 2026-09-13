// Значения игровых параметров по умолчанию (соответствуют группам настроек из ТЗ)

import type { BetOption, GameConfig } from '@/shared/api/contract';

export const DEFAULT_CONFIG: GameConfig = {
  gameId: 'air-balloon',
  gameName: 'Воздушный Шар',
  isActive: true,
  alpha: 1.3,
  maxMultiplier: 100,
  minCrashMultiplier: 1.3,
  multiplierGrowthRate: 0.1,
  growthAcceleration: 1.5,
  pointsPerLine: 10,
  pointsCashoutBonus: 25,
  pointsBoosterBonus: 50,
  boosterTierValues: [1, 2, 3, 4],
  lootProbabilities: {
    green: [0.2, 0.18, 0.15, 0.13, 0.11, 0.09, 0.07, 0.05, 0.02],
    red: [0.16, 0.15, 0.13, 0.11, 0.1, 0.08, 0.07, 0.06, 0.05, 0.04, 0.03, 0.02],
  },
  minWinAmount: 50,
  popupTimeout: 10,
};

export const BET_PRESETS: readonly number[] = [10, 25, 50, 100, 250];

export const BET_OPTIONS: readonly BetOption[] = [
  { id: 'tier-1', cost: 10, boosterTier: 1, boosterMultiplier: 1 },
  { id: 'tier-2', cost: 25, boosterTier: 2, boosterMultiplier: 2 },
  { id: 'tier-3', cost: 50, boosterTier: 3, boosterMultiplier: 3 },
  { id: 'tier-4', cost: 100, boosterTier: 4, boosterMultiplier: 4 },
];

export const PUZZLE_TOTAL = 6;

export const PUZZLE_PIECES: readonly string[] = [
  'Корзина',
  'Горелка',
  'Купол',
  'Балласт',
  'Канат',
  'Флаг',
];

export const ONBOARDING_DURATION_MS = 4000;
