// Список завершённых раундов (глобальная или персональная история)

import type { HistoryEntry } from '@/shared/api/contract';
import { cn } from '@/shared/lib/cn';

interface HistoryListProps {
  entries: HistoryEntry[];
  limit?: number;
  scope?: 'all' | 'my';
  onScopeChange?: (scope: 'all' | 'my') => void;
}

export function HistoryList({ entries, limit = 12, scope, onScopeChange }: HistoryListProps) {
  return (
    <div>
      {onScopeChange && scope && (
        <div className="mb-3 flex rounded-lg border border-line bg-sky-deep/40 p-1 text-xs">
          <button
            onClick={() => onScopeChange('all')}
            className={cn(
              'flex-1 rounded py-1 font-semibold transition-colors',
              scope === 'all'
                ? 'bg-accent/25 text-accent font-bold shadow-xs'
                : 'text-on-glass-dim hover:text-on-glass',
            )}
          >
            Все раунды
          </button>
          <button
            onClick={() => onScopeChange('my')}
            className={cn(
              'flex-1 rounded py-1 font-semibold transition-colors',
              scope === 'my'
                ? 'bg-accent/25 text-accent font-bold shadow-xs'
                : 'text-on-glass-dim hover:text-on-glass',
            )}
          >
            Мои ставки
          </button>
        </div>
      )}

      {entries.length === 0 ? (
        <p className="py-3 text-center text-sm text-on-glass-dim">
          {scope === 'my' ? 'У вас пока нет сыгранных раундов' : 'Пока нет завершённых игр'}
        </p>
      ) : (
        <ul className="grid gap-2.5">
          {entries.slice(0, limit).map((entry) => (
            <li
              key={entry.roundId}
              className="glass-tile flex items-center gap-3 rounded-sm px-3.5 py-3 text-base"
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
      )}
    </div>
  );
}
