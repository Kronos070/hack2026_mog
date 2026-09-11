// Мок-логика раунда: старт, фиксация выигрыша и подведение итогов

import type {
  Achievement,
  BetRequest,
  CashoutResult,
  RoundResult,
  RoundStart,
  Reward,
} from '@/shared/api/contract';
import { LEVELS_BY_THEME } from '@/shared/api/contract';
import { readState, updateState } from '@/shared/api/mock-store';
import { buildAchievements, evaluateAchievements } from '@/shared/api/mock-achievements';
import { PUZZLE_PIECES, PUZZLE_TOTAL } from '@/shared/config/default-config';
import {
  buildLevelMultipliers,
  generateCrashMultiplier,
  levelsPassedAt,
  pickBoosterLevel,
} from '@/shared/lib/crash-math';

interface ActiveRound extends RoundStart {
  cashoutMultiplier: number | null;
  pointsEarned: number;
  boosterActivated: boolean;
}

let activeRound: ActiveRound | null = null;

export function mockStartRound(request: BetRequest): RoundStart {
  const state = readState();
  const user = state.currentUserId ? state.users[state.currentUserId] : null;
  if (!user) throw new Error('Требуется вход');

  const { theme, cost, boosterTier } = request;
  if (!Number.isInteger(cost) || cost <= 0) throw new Error('Некорректная ставка');
  if (user.balance < cost) throw new Error('Не хватает бонусов');

  const { config } = state;
  const boosterMultiplier = config.boosterTierValues[boosterTier - 1] ?? 1;
  const levelMultipliers = buildLevelMultipliers(theme, config);
  const boosterLevel =
    boosterMultiplier > 1 ? pickBoosterLevel(theme, config, Math.random()) : null;

  const round: ActiveRound = {
    roundId: `round-${Date.now()}`,
    theme,
    betCost: cost,
    boosterMultiplier,
    boosterLevel,
    levelCount: LEVELS_BY_THEME[theme],
    levelMultipliers,
    crashMultiplier: generateCrashMultiplier(config, Math.random()),
    growthRate: config.multiplierGrowthRate,
    startedAt: Date.now(),
    balanceAfterBet: user.balance - cost,
    cashoutMultiplier: null,
    pointsEarned: 0,
    boosterActivated: false,
  };

  updateState((draft) => {
    const target = draft.users[user.id];
    if (target) target.balance -= cost;
  });

  activeRound = round;
  return stripInternals(round);
}

export function mockCashout(multiplier: number, boosterActivated: boolean): CashoutResult {
  const round = activeRound;
  if (!round) throw new Error('Нет активного раунда');
  if (round.cashoutMultiplier !== null) throw new Error('Выигрыш уже зафиксирован');

  const effective = Math.min(multiplier, round.crashMultiplier);
  const payout = Math.round(round.betCost * effective);
  round.cashoutMultiplier = effective;
  round.boosterActivated = boosterActivated;

  const state = updateState((draft) => {
    if (!draft.currentUserId) return;
    const target = draft.users[draft.currentUserId];
    if (target) target.balance += payout;
  });

  const user = state.currentUserId ? state.users[state.currentUserId] : null;
  return {
    roundId: round.roundId,
    multiplier: effective,
    payout,
    balance: user?.balance ?? 0,
  };
}

export function mockFinishRound(boosterActivated: boolean): RoundResult {
  const round = activeRound;
  if (!round) throw new Error('Нет активного раунда');

  const config = readState().config;
  const levelsPassed = levelsPassedAt(round.crashMultiplier, round.levelMultipliers);
  const activated = boosterActivated || round.boosterActivated;

  let points = levelsPassed * config.pointsPerLine;
  if (round.cashoutMultiplier !== null) points += config.pointsCashoutBonus;
  if (activated) points += config.pointsBoosterBonus;

  const payout =
    round.cashoutMultiplier === null ? 0 : Math.round(round.betCost * round.cashoutMultiplier);

  const unlockedNow: Achievement[] = [];

  const state = updateState((draft) => {
    if (!draft.currentUserId) return;
    const target = draft.users[draft.currentUserId];
    if (target) target.points += points;

    draft.stats.roundsPlayed += 1;
    draft.stats.totalWagered += round.betCost;
    draft.stats.maxBet = Math.max(draft.stats.maxBet, round.betCost);
    if (activated) draft.stats.boostersActivated += 1;
    if (round.cashoutMultiplier !== null) {
      draft.stats.roundsWon += 1;
      draft.stats.totalPayout += payout;
      draft.stats.bestMultiplier = Math.max(
        draft.stats.bestMultiplier,
        round.cashoutMultiplier,
      );
    }

    if (draft.puzzle.length < PUZZLE_TOTAL) {
      const next = PUZZLE_PIECES[draft.puzzle.length];
      if (next) draft.puzzle.push(next);
    }

    draft.history.unshift({
      roundId: round.roundId,
      playerName: target?.name ?? 'Игрок',
      theme: round.theme,
      betCost: round.betCost,
      crashMultiplier: round.crashMultiplier,
      cashoutMultiplier: round.cashoutMultiplier,
      payout,
      finishedAt: Date.now(),
    });
    draft.history = draft.history.slice(0, 50);

    const puzzleSize = draft.puzzle.length;
    for (const id of evaluateAchievements(draft.stats, puzzleSize)) {
      if (draft.unlocked[id]) continue;
      draft.unlocked[id] = Date.now();
      const full = buildAchievements(draft.unlocked).find((item) => item.id === id);
      if (full) unlockedNow.push(full);
    }
  });

  const user = state.currentUserId ? state.users[state.currentUserId] : null;
  const reward: Reward = {
    kind: 'puzzle-piece',
    pieceId: `piece-${state.puzzle.length}`,
    label: state.puzzle.at(-1) ?? 'Фрагмент',
    collected: state.puzzle.length,
    total: PUZZLE_TOTAL,
  };

  activeRound = null;

  return {
    roundId: round.roundId,
    theme: round.theme,
    betCost: round.betCost,
    crashMultiplier: round.crashMultiplier,
    cashoutMultiplier: round.cashoutMultiplier,
    payout,
    pointsEarned: points,
    levelsPassed,
    boosterActivated: activated,
    reward,
    balance: user?.balance ?? 0,
    finishedAt: Date.now(),
    unlockedAchievements: unlockedNow,
  };
}

function stripInternals(round: ActiveRound): RoundStart {
  const { cashoutMultiplier, pointsEarned, boosterActivated, ...rest } = round;
  void cashoutMultiplier;
  void pointsEarned;
  void boosterActivated;
  return rest;
}
