// Список завершённых раундов всех игроков прототипа

import type { HistoryEntry } from '@/shared/api/contract';

interface HistoryListProps {
  entries: HistoryEntry[];
  limit?: number;
}

export function HistoryList({ entries, limit = 12 }: HistoryListProps) {
  // Отображает историю раундов с коэффициентами и выигрышем
  if (entries.length === 0) {
    return <p className="py-3 text-center text-sm text-on-glass-dim">Пока нет завершённых игр</p>;
  }

  return (
    <ul className="grid gap-2.5">
      {entries.slice(0, limit).map((entry) => (
        <li
          key={entry.roundId}
          className="glass-tile flex snap-start items-center gap-3 rounded-xl px-3.5 py-3 text-base"
        >
          <span className="min-w-0 flex-1 truncate text-on-glass">{entry.playerName}</span>
          <span className="shrink-0 font-bold tabular-nums text-accent">
            x{entry.crashMultiplier.toFixed(2)}
          </span>
          <span
            className={
              entry.payout > 0
                ? 'shrink-0 text-right font-semibold tabular-nums text-pick'
                : 'shrink-0 text-right tabular-nums text-on-glass-dim'
            }
          >
            {entry.payout > 0 ? `+${entry.payout}` : `−${entry.betCost}`}
          </span>
        </li>
      ))}
    </ul>
  );
}
