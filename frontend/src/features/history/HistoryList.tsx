// Список завершённых раундов всех игроков прототипа

import { useLayoutEffect, useRef } from 'react';
import type { HistoryEntry } from '@/shared/api/contract';

interface HistoryListProps {
  entries: HistoryEntry[];
  limit?: number;
}

export function HistoryList({ entries, limit = 12 }: HistoryListProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const prevFirstIdRef = useRef<string | null>(null);
  const isInitialMount = useRef(true);
  const rafIdRef = useRef<number | null>(null);
  const rafId2Ref = useRef<number | null>(null);

  useLayoutEffect(() => {
    const container = listRef.current?.parentElement;
    if (!container || entries.length === 0) return;

    const currentFirstId = entries[0]?.roundId;
    if (!currentFirstId) return;

    // При первой отрисовке просто фиксируем верхний раунд без прокрутки
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevFirstIdRef.current = currentFirstId;
      return;
    }

    // Если пришла новая игра в начало списка
    if (prevFirstIdRef.current && currentFirstId !== prevFirstIdRef.current) {
      const prevIndex = entries.findIndex((entry) => entry.roundId === prevFirstIdRef.current);
      const newItemsCount = prevIndex > 0 ? prevIndex : 1;
      prevFirstIdRef.current = currentFirstId;

      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (prefersReducedMotion) {
        container.scrollTo({ top: 0, behavior: 'auto' });
        return;
      }

      const currentScroll = container.scrollTop;

      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
      if (rafId2Ref.current !== null) cancelAnimationFrame(rafId2Ref.current);

      if (currentScroll > 4) {
        // Пользователь был прокручен ниже: плавно прокручиваем вверх к новым играм
        rafIdRef.current = requestAnimationFrame(() => {
          container.scrollTo({ top: 0, behavior: 'smooth' });
        });
      } else {
        // Пользователь был в самом верху (scrollTop ≈ 0):
        // Смещаем scrollTop на высоту новых элементов до перерисовки браузера,
        // а затем плавно прокручиваем вверх к 0, чтобы новая строка плавно въехала сверху
        const items = listRef.current?.children;
        const first = items?.[0] as HTMLElement | undefined;
        const second = items?.[1] as HTMLElement | undefined;

        if (first && second) {
          const step = second.getBoundingClientRect().top - first.getBoundingClientRect().top;
          const offset = Math.round(newItemsCount * step);
          const maxScroll = container.scrollHeight - container.clientHeight;
          const initialScroll = Math.min(offset, maxScroll);

          if (initialScroll > 0) {
            container.scrollTop = initialScroll;
          }
        }

        rafIdRef.current = requestAnimationFrame(() => {
          rafId2Ref.current = requestAnimationFrame(() => {
            container.scrollTo({ top: 0, behavior: 'smooth' });
          });
        });
      }
    } else if (!prevFirstIdRef.current) {
      prevFirstIdRef.current = currentFirstId;
    }

    return () => {
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
      if (rafId2Ref.current !== null) cancelAnimationFrame(rafId2Ref.current);
    };
  }, [entries]);

  // Отображает историю раундов с коэффициентами и выигрышем
  if (entries.length === 0) {
    return <p className="py-3 text-center text-sm text-on-glass-dim">Пока нет завершённых игр</p>;
  }

  return (
    <ul ref={listRef} className="grid gap-2.5">
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

