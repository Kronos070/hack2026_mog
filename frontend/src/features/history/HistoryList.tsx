// Список завершённых раундов всех игроков прототипа
import type { HistoryEntry } from '@/shared/api/contract';

interface HistoryListProps {
  entries: HistoryEntry[];
}

export function HistoryList({ entries }: HistoryListProps) {
  // Отображает историю раундов с коэффициентами и выигрышем
  if (entries.length === 0) {
    return (
      <p className="mt-2 rounded-md border border-dashed border-line p-4 text-sm text-muted">
        Пока нет завершённых игр
      </p>
    );
  }

  return (
    <ul className="mt-2 divide-y divide-line rounded-md border border-line">
      {entries.map((entry) => (
        <li key={entry.roundId} className="flex items-center justify-between px-3 py-2 text-sm">
          <span className="truncate">{entry.playerName}</span>
          <span className="flex items-center gap-3">
            <span className="text-muted">x{entry.crashMultiplier.toFixed(2)}</span>
            <span className={entry.payout > 0 ? 'font-medium text-green-theme' : 'text-muted'}>
              {entry.payout > 0 ? `+${entry.payout}` : `−${entry.betCost}`}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
