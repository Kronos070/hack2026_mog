// Мок-бэкенд: авторитетная генерация раундов и расчёт выигрыша до появления Java-сервиса

import type {
  GameConfig,
  HistoryEntry,
  LeaderboardEntry,
  Profile,
  Tournament,
  TournamentEntry,
  User,
} from '@/shared/api/contract';
import { BOT_PROFILES, readState, updateState } from '@/shared/api/mock-store';
import { buildAchievements, computeRank } from '@/shared/api/mock-achievements';
import { PUZZLE_PIECES, PUZZLE_TOTAL } from '@/shared/config/default-config';

export { mockStartRound, mockCashout, mockFinishRound } from '@/shared/api/mock-rounds';

export function mockLogin(userId: string): User {
  const state = updateState((draft) => {
    draft.currentUserId = userId;
  });
  const user = state.users[userId];
  if (!user) throw new Error('Пользователь не найден');
  return user;
}

export function mockGetCurrentUser(): User | null {
  const state = readState();
  if (!state.currentUserId) return null;
  return state.users[state.currentUserId] ?? null;
}

export function mockLogout(): void {
  updateState((draft) => {
    draft.currentUserId = null;
    draft.upsellShown = false;
  });
}

export function mockGetProfile(playerId?: string): Profile {
  const state = readState();

  const bot = playerId ? BOT_PROFILES.find((item) => item.id === playerId) : undefined;
  if (bot) {
    const unlockedMap = Object.fromEntries(bot.achievements.map((id) => [id, 0]));
    return {
      user: { id: bot.id, name: bot.name, role: 'user', balance: 0, points: bot.points },
      puzzle: PUZZLE_PIECES.slice(0, bot.puzzleSize),
      puzzleTotal: PUZZLE_TOTAL,
      roundsPlayed: bot.stats.roundsPlayed,
      roundsWon: bot.stats.roundsWon,
      bestMultiplier: bot.stats.bestMultiplier,
      totalWagered: bot.stats.totalWagered,
      totalPayout: bot.stats.totalPayout,
      rank: computeRank(bot.stats.totalPayout - bot.stats.totalWagered),
      achievements: buildAchievements(unlockedMap),
    };
  }

  const user = state.currentUserId ? state.users[state.currentUserId] : null;
  if (!user) throw new Error('Требуется вход');

  const { stats } = state;
  return {
    user,
    puzzle: state.puzzle,
    puzzleTotal: PUZZLE_TOTAL,
    roundsPlayed: stats.roundsPlayed,
    roundsWon: stats.roundsWon,
    bestMultiplier: stats.bestMultiplier,
    totalWagered: stats.totalWagered,
    totalPayout: stats.totalPayout,
    rank: computeRank(stats.totalPayout - stats.totalWagered),
    achievements: buildAchievements(state.unlocked),
  };
}

const TOURNAMENT_PRIZES = [5000, 3000, 1500, 800, 500, 300, 200, 150, 100, 50];
const TOURNAMENT_DURATION_MS = 6 * 60 * 60 * 1000;

export function mockGetTournament(): Tournament {
  const state = readState();
  const current = state.currentUserId ? state.users[state.currentUserId] : null;

  const rows = [...state.leaderboard];
  if (current) {
    rows.push({ playerId: current.id, playerName: current.name, points: current.points });
  }

  const entries: TournamentEntry[] = rows
    .sort((left, right) => right.points - left.points)
    .map((row, index) => ({
      place: index + 1,
      playerId: row.playerId,
      playerName: row.playerName,
      points: row.points,
      prize: TOURNAMENT_PRIZES[index] ?? 0,
    }));

  return {
    title: 'Турнир выходного дня',
    endsAt: Math.floor(Date.now() / TOURNAMENT_DURATION_MS) * TOURNAMENT_DURATION_MS +
      TOURNAMENT_DURATION_MS,
    entries,
    currentPlayerId: current?.id ?? null,
  };
}

export function mockGetConfig(): GameConfig {
  return readState().config;
}

export function mockSaveConfig(config: GameConfig): GameConfig {
  updateState((draft) => {
    draft.config = config;
  });
  return config;
}

let botSimTimer: ReturnType<typeof setInterval> | null = null;

export function ensureBotHistorySimulation(): void {
  if (botSimTimer || typeof window === 'undefined') return;
  botSimTimer = setInterval(() => {
    try {
      const bots = BOT_PROFILES;
      const bot = bots[Math.floor(Math.random() * bots.length)];
      if (!bot) return;

      const multipliers = [1.22, 1.48, 1.95, 2.34, 3.12, 4.65, 1.08, 2.05, 5.8];
      const mult = multipliers[Math.floor(Math.random() * multipliers.length)] ?? 1.5;
      const cashedOut = Math.random() > 0.35;
      const betCost = [25, 50, 75, 100, 150, 200][Math.floor(Math.random() * 6)] ?? 50;
      const cashoutMult = cashedOut ? Math.round((1 + (mult - 1) * 0.8) * 100) / 100 : null;
      const payout = cashoutMult ? Math.round(betCost * cashoutMult) : 0;

      updateState((draft) => {
        draft.history.unshift({
          roundId: `bot-round-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          playerName: bot.name,
          theme: 'green',
          betCost,
          crashMultiplier: mult,
          cashoutMultiplier: cashoutMult,
          payout,
          finishedAt: Date.now(),
        });
        draft.history = draft.history.slice(0, 50);
      });
    } catch {
      // ignore
    }
  }, 10000);
}

export function mockGetHistory(): HistoryEntry[] {
  ensureBotHistorySimulation();
  return readState().history.slice(0, 20);
}

export function mockGetLeaderboard(): LeaderboardEntry[] {
  const state = readState();
  const current = state.currentUserId ? state.users[state.currentUserId] : null;
  const entries = [...state.leaderboard];
  if (current) {
    entries.push({ playerId: current.id, playerName: current.name, points: current.points });
  }
  return entries.sort((left, right) => right.points - left.points);
}


