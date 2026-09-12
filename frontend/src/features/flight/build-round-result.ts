// Сборка итогов раунда из серверного сообщения о крахе
import type { RoundResult, RoundStart } from '@/shared/api/contract';
import type { SocketMessage } from '@/features/flight/game-socket';
import { PUZZLE_PIECES, PUZZLE_TOTAL } from '@/shared/config/default-config';

export function buildRoundResult(
  round: RoundStart,
  message: SocketMessage,
  cashoutMultiplier: number | null,
): RoundResult {
  // Переводит событие CRASHED в модель результата раунда
  const payout =
    message.winAmount !== undefined && message.winAmount !== null
      ? message.winAmount
      : cashoutMultiplier !== null
        ? Math.round(round.betCost * cashoutMultiplier)
        : 0;

  const collectedFallback = Math.min((message.levelsPassed ?? 0) % PUZZLE_TOTAL, PUZZLE_TOTAL - 1);

  const reward = message.reward ?? {
    kind: 'puzzle-piece' as const,
    pieceId: `piece-${collectedFallback}`,
    label: PUZZLE_PIECES[collectedFallback] ?? 'Фрагмент',
    collected: collectedFallback + 1,
    total: PUZZLE_TOTAL,
  };

  return {
    roundId: round.roundId,
    theme: round.theme,
    betCost: round.betCost,
    crashMultiplier: message.crashMultiplier ?? 1,
    cashoutMultiplier,
    payout,
    pointsEarned: message.pointsEarned ?? 0,
    levelsPassed: message.levelsPassed ?? 0,
    boosterActivated: message.boosterActivated ?? false,
    reward,
    balance: message.newBalance ?? 0,
    finishedAt: Date.now(),
    unlockedAchievements: message.unlockedAchievements ?? [],
  };
}
