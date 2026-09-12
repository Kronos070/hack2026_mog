// Лента последних крашей: коэффициенты завершённых раундов в одну строку

import type { HistoryEntry } from '@/shared/api/contract';
import { cn } from '@/shared/lib/cn';

interface CrashHistoryProps {
  entries: HistoryEntry[];
  limit?: number;
}

const HIGH_MULTIPLIER = 2;

export function CrashHistory({ entries, limit = 6 }: CrashHistoryProps) {
  // Показывает коэффициенты краха, подсвечивая высокие множители
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2.5">
      {entries.slice(0, limit).map((entry) => (
        <span
          key={entry.roundId}
          title={`${entry.playerName} · ставка ${entry.betCost}`}
          className={cn(
            'shrink-0 rounded-full px-4 py-1.5 text-base font-bold tabular-nums shadow-[0_2px_8px_rgb(5_25_50/0.4)]',
            entry.crashMultiplier >= HIGH_MULTIPLIER
              ? 'bg-linear-to-b from-pick to-pick-dark text-on-glass'
              : 'bg-linear-to-b from-accent to-accent-dark text-sky-deep',
          )}
        >
          x{entry.crashMultiplier.toFixed(2)}
        </span>
      ))}
    </div>
  );
}
