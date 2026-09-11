// Лента последних крашей: коэффициенты завершённых раундов в одну строку

import type { HistoryEntry } from '@/shared/api/contract';
import { cn } from '@/shared/lib/cn';
import { multiplierChipClass } from '@/shared/lib/multiplier-color';

interface CrashHistoryProps {
  entries: HistoryEntry[];
  limit?: number;
}

export function CrashHistory({ entries, limit = 16 }: CrashHistoryProps) {
  // Показывает коэффициенты краха, подсвечивая высокие множители
  if (entries.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-line px-3 py-2 text-xs text-muted">
        Истории крашей пока нет
      </p>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {entries.slice(0, limit).map((entry) => (
        <span
          key={entry.roundId}
          title={`${entry.playerName} · ставка ${entry.betCost}`}
          className={cn(
            'shrink-0 rounded-md border px-2.5 py-1 text-sm font-semibold tabular-nums',
            multiplierChipClass(entry.crashMultiplier),
          )}
        >
          x{entry.crashMultiplier.toFixed(2)}
        </span>
      ))}
    </div>
  );
}
