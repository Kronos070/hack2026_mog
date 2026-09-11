// Список завершённых раундов всех игроков прототипа
import type { HistoryEntry } from '@/shared/api/contract';
import { multiplierTextClass } from '@/shared/lib/multiplier-color';

interface HistoryListProps {
  entries: HistoryEntry[];
}

export function HistoryList({ entries }: HistoryListProps) {
  // Отображает историю раундов с коэффициентами и выигрышем
  if (entries.length === 0) {
    return (
      <p className="mt-2 rounded-lg border-2 border-dashed border-line p-5 text-base text-muted">
        Пока нет завершённых игр
      </p>
    );
  }

  return (
    <ul className="mt-2 divide-y divide-line overflow-hidden rounded-lg border-2 border-line">
      {entries.map((entry) => (
        <li key={entry.roundId} className="flex items-center justify-between px-4 py-3 text-base">
          <span className="truncate">{entry.playerName}</span>
          <span className="flex items-center gap-3">
            <span className={`font-semibold tabular-nums ${multiplierTextClass(entry.crashMultiplier)}`}>
              x{entry.crashMultiplier.toFixed(2)}
            </span>
            <span className={entry.payout > 0 ? 'font-medium text-green-theme' : 'text-muted'}>
              {entry.payout > 0 ? `+${entry.payout}` : `−${entry.betCost}`}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
