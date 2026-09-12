// Схемы реального бэкенда (Quarkus) и их приведение к внутренним типам фронта

import { z } from 'zod';
import type { HistoryEntry, RoundStart, Theme, User } from '@/shared/api/contract';
import { achievementSchema, rewardSchema } from '@/shared/api/contract';

export const backendUserSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().nullable().optional(),
  bonusBalance: z.number(),
  points: z.number().nullable().optional(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
});

export const authResponseSchema = z.object({
  token: z.string(),
  tokenType: z.string().optional(),
  expiresIn: z.number().optional(),
  user: backendUserSchema,
});

export const roundStartResponseSchema = z.object({
  roundId: z.string(),
  startTime: z.string(),
  initialMultiplier: z.number(),
  growthRate: z.number(),
  provablyFairHash: z.string().nullable().optional(),
  betAmount: z.number(),
  boosterMultiplier: z.number(),
  boosterLevel: z.number().nullable().optional(),
  totalLevels: z.number(),
  unlockCashoutMultiplier: z.number().nullable().optional(),
  remainingBalance: z.number(),
});

export const cashoutResponseSchema = z.object({
  roundId: z.string(),
  status: z.string().optional(),
  isWin: z.boolean().optional(),
  multiplier: z.number(),
  crashMultiplier: z.number().optional(),
  winAmount: z.number(),
  newBalance: z.number(),
  pointsEarned: z.number().nullable().optional(),
  levelsPassed: z.number().nullable().optional(),
  boosterActivated: z.boolean().nullable().optional(),
  boosterMultiplier: z.number().nullable().optional(),
  nextHouseEdge: z.number().nullable().optional(),
  serverSeed: z.string().nullable().optional(),
  clientSeed: z.string().nullable().optional(),
  nonce: z.number().nullable().optional(),
  reward: rewardSchema.nullable().optional(),
  unlockedAchievements: z.array(achievementSchema).optional(),
});

export const historyItemSchema = z.object({
  roundId: z.string(),
  userId: z.number().nullable().optional(),
  username: z.string().nullable().optional(),
  theme: z.string().nullable().optional(),
  betAmount: z.number(),
  crashMultiplier: z.number().nullable().optional(),
  cashoutMultiplier: z.number().nullable().optional(),
  winAmount: z.number().nullable().optional(),
  isWin: z.boolean().nullable().optional(),
  status: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
});

export type BackendUser = z.infer<typeof backendUserSchema>;
export type RoundStartResponse = z.infer<typeof roundStartResponseSchema>;
export type HistoryItem = z.infer<typeof historyItemSchema>;

export function toUser(raw: BackendUser): User {
  // Приводит профиль бэкенда к внутренней модели пользователя
  return {
    id: String(raw.id),
    name: raw.username,
    role: raw.role?.toUpperCase() === 'ADMIN' ? 'admin' : 'user',
    balance: raw.bonusBalance,
    points: raw.points ?? 0,
  };
}

export function toRoundStart(raw: RoundStartResponse, theme: Theme, levels: number[]): RoundStart {
  // Собирает описание раунда; точка краха остаётся на сервере
  return {
    roundId: raw.roundId,
    theme,
    betCost: raw.betAmount,
    boosterMultiplier: raw.boosterMultiplier,
    boosterLevel: raw.boosterLevel ?? null,
    levelCount: raw.totalLevels,
    levelMultipliers: levels,
    crashMultiplier: Number.POSITIVE_INFINITY,
    growthRate: raw.growthRate,
    startedAt: Date.parse(raw.startTime) || Date.now(),
    balanceAfterBet: raw.remainingBalance,
  };
}

export function toHistoryEntry(raw: HistoryItem): HistoryEntry {
  // Приводит запись истории бэкенда к внутренней модели
  return {
    roundId: raw.roundId,
    playerName: raw.username ?? 'Игрок',
    theme: raw.theme === 'red' ? 'red' : 'green',
    betCost: raw.betAmount,
    crashMultiplier: raw.crashMultiplier ?? 1,
    cashoutMultiplier: raw.cashoutMultiplier ?? null,
    payout: raw.winAmount ?? 0,
    finishedAt: raw.createdAt ? Date.parse(raw.createdAt) : Date.now(),
  };
}
