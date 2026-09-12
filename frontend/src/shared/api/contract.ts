// Контракт API: zod-схемы и типы, общие для мока и реального бэкенда

import { z } from 'zod';

export const themeSchema = z.enum(['green', 'red']);
export const roleSchema = z.enum(['user', 'admin']);

export const LEVELS_BY_THEME: Readonly<Record<Theme, number>> = {
  green: 9,
  red: 12,
};

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: roleSchema,
  balance: z.number().nonnegative(),
  points: z.number().nonnegative(),
});

export const boosterTierSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);

export const betRequestSchema = z.object({
  theme: themeSchema,
  cost: z.number().int().positive(),
  boosterTier: boosterTierSchema,
});

export const betOptionSchema = z.object({
  id: z.string(),
  cost: z.number().positive(),
  boosterTier: boosterTierSchema,
  boosterMultiplier: z.number().positive(),
});

export const roundStartSchema = z.object({
  roundId: z.string(),
  theme: themeSchema,
  betCost: z.number().positive(),
  boosterMultiplier: z.number().positive(),
  boosterLevel: z.number().int().nullable(),
  levelCount: z.number().int().positive(),
  levelMultipliers: z.array(z.number().positive()),
  crashMultiplier: z.number().positive(),
  growthRate: z.number().positive(),
  startedAt: z.number().int(),
  balanceAfterBet: z.number().nonnegative(),
});

export const cashoutResultSchema = z.object({
  roundId: z.string(),
  multiplier: z.number().positive(),
  payout: z.number().nonnegative(),
  balance: z.number().nonnegative(),
});

export const rewardSchema = z.object({
  kind: z.literal('puzzle-piece'),
  pieceId: z.string(),
  label: z.string(),
  collected: z.number().int().nonnegative(),
  total: z.number().int().positive(),
});

export const achievementSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  letter: z.string(),
  unlockedAt: z.number().int().nullable(),
});

export const roundResultSchema = z.object({
  roundId: z.string(),
  theme: themeSchema,
  betCost: z.number().positive(),
  crashMultiplier: z.number().positive(),
  cashoutMultiplier: z.number().positive().nullable(),
  payout: z.number().nonnegative(),
  pointsEarned: z.number().nonnegative(),
  levelsPassed: z.number().int().nonnegative(),
  boosterActivated: z.boolean(),
  reward: rewardSchema,
  balance: z.number().nonnegative(),
  finishedAt: z.number().int(),
  unlockedAchievements: z.array(achievementSchema).default([]),
});

export const historyEntrySchema = z.object({
  roundId: z.string(),
  playerName: z.string(),
  theme: themeSchema,
  betCost: z.number().positive(),
  crashMultiplier: z.number().positive(),
  cashoutMultiplier: z.number().positive().nullable(),
  payout: z.number().nonnegative(),
  finishedAt: z.number().int(),
});

export const leaderboardEntrySchema = z.object({
  playerId: z.string(),
  playerName: z.string(),
  points: z.number().nonnegative(),
});

export const rankSchema = z.object({
  id: z.string(),
  title: z.string(),
  minProfit: z.number(),
  nextTitle: z.string().nullable(),
  nextAt: z.number().nullable(),
  profit: z.number(),
});

export const profileSchema = z.object({
  user: userSchema,
  puzzle: z.array(z.string()),
  puzzleTotal: z.number().int().positive(),
  roundsPlayed: z.number().int().nonnegative(),
  roundsWon: z.number().int().nonnegative(),
  bestMultiplier: z.number().nonnegative(),
  totalWagered: z.number().nonnegative(),
  totalPayout: z.number().nonnegative(),
  rank: rankSchema,
  achievements: z.array(achievementSchema),
});

export const tournamentEntrySchema = z.object({
  place: z.number().int().positive(),
  playerId: z.string(),
  playerName: z.string(),
  points: z.number().nonnegative(),
  prize: z.number().nonnegative(),
});

export const tournamentSchema = z.object({
  title: z.string(),
  endsAt: z.number().int(),
  entries: z.array(tournamentEntrySchema),
  currentPlayerId: z.string().nullable(),
});

export const gameConfigSchema = z.object({
  gameId: z.string(),
  gameName: z.string(),
  isActive: z.boolean(),
  alpha: z.number().positive(),
  maxMultiplier: z.number().positive(),
  minCrashMultiplier: z.number().min(1),
  multiplierGrowthRate: z.number().positive(),
  growthAcceleration: z.number().min(1).max(3),
  pointsPerLine: z.number().nonnegative(),
  pointsCashoutBonus: z.number().nonnegative(),
  pointsBoosterBonus: z.number().nonnegative(),
  boosterTierValues: z.array(z.number().positive()).length(4),
  lootProbabilities: z.object({
    green: z.array(z.number().min(0).max(1)),
    red: z.array(z.number().min(0).max(1)),
  }),
  minWinAmount: z.number().nonnegative(),
  popupTimeout: z.number().positive(),
});

export type Theme = z.infer<typeof themeSchema>;
export type Role = z.infer<typeof roleSchema>;
export type User = z.infer<typeof userSchema>;
export type BetOption = z.infer<typeof betOptionSchema>;
export type BetRequest = z.infer<typeof betRequestSchema>;
export type BoosterTier = z.infer<typeof boosterTierSchema>;
export type RoundStart = z.infer<typeof roundStartSchema>;
export type CashoutResult = z.infer<typeof cashoutResultSchema>;
export type Reward = z.infer<typeof rewardSchema>;
export type RoundResult = z.infer<typeof roundResultSchema>;
export type HistoryEntry = z.infer<typeof historyEntrySchema>;
export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;
export type GameConfig = z.infer<typeof gameConfigSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type Achievement = z.infer<typeof achievementSchema>;
export type Rank = z.infer<typeof rankSchema>;
export type TournamentEntry = z.infer<typeof tournamentEntrySchema>;
export type Tournament = z.infer<typeof tournamentSchema>;
