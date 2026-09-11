// Выдача достижений и расчёт ранга по накопительной статистике игрока

import type { Achievement, Rank } from '@/shared/api/contract';
import type { PlayerStats } from '@/shared/api/mock-store';
import { ACHIEVEMENTS, RANKS } from '@/shared/config/achievements';
import { PUZZLE_TOTAL } from '@/shared/config/default-config';

const HIGH_ROLLER_BET = 250;
const FIRST_RANK_FLOOR = -500;

export function evaluateAchievements(stats: PlayerStats, puzzleSize: number): string[] {
  // Возвращает идентификаторы достижений, условия которых выполнены
  const unlocked: string[] = [];
  const add = (id: string, condition: boolean): void => {
    if (condition) unlocked.push(id);
  };

  add('first-flight', stats.roundsPlayed >= 1);
  add('first-win', stats.roundsWon >= 1);
  add('high-five', stats.bestMultiplier >= 5);
  add('sky-ten', stats.bestMultiplier >= 10);
  add('booster-hit', stats.boostersActivated >= 1);
  add('veteran-10', stats.roundsPlayed >= 10);
  add('veteran-50', stats.roundsPlayed >= 50);
  add('collector', puzzleSize >= PUZZLE_TOTAL);
  add('high-roller', stats.maxBet >= HIGH_ROLLER_BET);
  add('in-profit', stats.totalPayout > stats.totalWagered);

  return unlocked;
}

export function buildAchievements(unlockedMap: Record<string, number>): Achievement[] {
  // Собирает полный список достижений с отметкой о получении
  return ACHIEVEMENTS.map((def) => ({
    id: def.id,
    title: def.title,
    description: def.description,
    letter: def.letter,
    unlockedAt: unlockedMap[def.id] ?? null,
  }));
}

export function computeRank(profit: number): Rank {
  // Определяет ранг по чистой прибыли и порог следующего уровня
  let index = 0;
  for (let i = 0; i < RANKS.length; i += 1) {
    if (profit >= (RANKS[i]?.minProfit ?? 0)) index = i;
  }

  const current = RANKS[index];
  const next = RANKS[index + 1];

  return {
    id: current?.id ?? 'recruit',
    title: current?.title ?? 'Новобранец',
    minProfit: Number.isFinite(current?.minProfit)
      ? (current?.minProfit ?? 0)
      : FIRST_RANK_FLOOR,
    nextTitle: next?.title ?? null,
    nextAt: next?.minProfit ?? null,
    profit,
  };
}
