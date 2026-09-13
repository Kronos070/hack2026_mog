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
  return (
    <div className="no-scrollbar flex h-[clamp(2rem,4vw,2.375rem)] w-full max-w-full gap-[clamp(0.375rem,1vw,0.625rem)] overflow-x-auto overflow-y-hidden">
      {entries.slice(0, limit).map((entry) => (
        <span
          key={entry.roundId}
          title={`${entry.playerName} · ставка ${entry.betCost}`}
          className={cn(
            'flex shrink-0 items-center rounded-full px-[clamp(0.625rem,1.5vw,1rem)] text-[clamp(0.75rem,1.3vw,1rem)] font-bold tabular-nums shadow-[0_2px_8px_rgb(5_25_50/0.4)]',
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
