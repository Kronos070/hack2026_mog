// Карточка ранга: текущий уровень и прогресс до следующего
import type { Rank } from '@/shared/api/contract';
import { cn } from '@/shared/lib/cn';

export function RankCard({ rank }: { rank: Rank }) {
  // Показывает ранг игрока и сколько прибыли до повышения
  // У первого ранга нет нижней границы — отсчитываем прогресс от нуля
  const floor = Number.isFinite(rank.minProfit) ? rank.minProfit : 0;
  const span = rank.nextAt !== null ? rank.nextAt - floor : 0;
  const progress =
    span > 0 ? Math.min(Math.max((rank.profit - floor) / span, 0), 1) : 1;

  return (
    <div className="rounded-lg border-2 border-line p-4">
      <p className="text-xs text-muted">Ранг</p>
      <p className="mt-1 text-2xl font-bold">{rank.title}</p>

      <p className={cn('mt-1 text-sm tabular-nums', rank.profit >= 0 ? 'text-green-theme' : 'text-red-theme')}>
        {rank.profit >= 0 ? '+' : '−'}
        {Math.abs(rank.profit)} за всё время
      </p>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-green-theme transition-[width] duration-500"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>

      <p className="mt-2 text-xs text-muted">
        {rank.nextTitle
          ? `До ранга «${rank.nextTitle}»: ${Math.max((rank.nextAt ?? 0) - rank.profit, 0)}`
          : 'Максимальный ранг'}
      </p>
    </div>
  );
}
