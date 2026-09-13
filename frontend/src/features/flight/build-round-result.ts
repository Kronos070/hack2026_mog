// Сборка итогов раунда из серверного сообщения о крахе
import type { Reward, RoundResult, RoundStart } from '@/shared/api/contract';
import type { SocketMessage } from '@/features/flight/game-socket';
import { getPuzzlePieceLabel } from '@/shared/config/puzzles';
import { PUZZLE_TOTAL } from '@/shared/config/default-config';

export function buildRoundResult(
  round: RoundStart,
  message: SocketMessage,
  cashoutMultiplier: number | null,
  cashoutReward?: Reward | null,
): RoundResult {
  // Переводит событие CRASHED в модель результата раунда
  const payout = cashoutMultiplier !== null ? Math.round(round.betCost * cashoutMultiplier) : 0;
  const rawReward = cashoutReward ?? message.reward;
  const pieceId = rawReward?.pieceId;
  const hasValidPiece = Boolean(pieceId) && pieceId !== 'none' && pieceId !== 'completed';

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
    reward: {
      kind: 'puzzle-piece',
      pieceId: hasValidPiece ? pieceId! : 'none',
      label: hasValidPiece
        ? (rawReward?.label ?? getPuzzlePieceLabel(pieceId))
        : 'Без фрагмента',
      collected: rawReward?.collected ?? 0,
      total: rawReward?.total ?? PUZZLE_TOTAL,
    },
    balance: message.newBalance ?? 0,
    finishedAt: Date.now(),
    unlockedAchievements: message.unlockedAchievements ?? [],
  };
}
