// Плашка баланса игрока над блоком ставки

import { GlassPanel } from '@/shared/ui/GlassPanel';

interface BalanceCardProps {
  balance: number;
  fragments?: number;
  totalFragments?: number;
}

export function BalanceCard({ balance, fragments = 6, totalFragments = 10 }: BalanceCardProps) {
  // Показывает текущий баланс бонусов и пазлов в стиле остальных панелей
  return (
    <GlassPanel title="Баланс" className="flex flex-col justify-center">
      <div className="flex flex-col gap-[clamp(0.375rem,0.8vw,0.625rem)]">
        <div className="glass-tile flex min-w-0 items-center gap-[clamp(0.375rem,1.2vw,0.75rem)] rounded-xl px-[clamp(0.625rem,1.8vw,1rem)] py-[clamp(0.375rem,1.2vw,0.625rem)]">
          <img src="/images/choose/coin.webp" alt="" className="h-[clamp(1.25rem,2.6vw,1.75rem)] w-auto shrink-0" />
          <span className="min-w-0 flex-1 truncate text-[clamp(1.125rem,1.9vw,1.5rem)] font-extrabold tabular-nums text-on-glass">
            {balance.toLocaleString('ru-RU')}
          </span>
          <span className="shrink-0 text-[clamp(0.7rem,1.2vw,1rem)] font-semibold text-on-glass-dim">бонусов</span>
        </div>

        <div className="glass-tile flex min-w-0 items-center gap-[clamp(0.375rem,1.2vw,0.75rem)] rounded-xl px-[clamp(0.625rem,1.8vw,1rem)] py-[clamp(0.3rem,1vw,0.5rem)]">
          <span className="text-[clamp(1rem,2vw,1.35rem)] shrink-0 select-none" role="img" aria-label="Пазл">🧩</span>
          <span className="min-w-0 flex-1 truncate text-[clamp(0.95rem,1.6vw,1.25rem)] font-bold tabular-nums text-on-glass">
            {fragments} <span className="font-semibold text-on-glass-dim text-[clamp(0.75rem,1.2vw,0.875rem)]">/ {totalFragments}</span>
          </span>
          <span className="shrink-0 text-[clamp(0.7rem,1.2vw,0.875rem)] font-semibold text-on-glass-dim">пазлов</span>
        </div>
      </div>
    </GlassPanel>
  );
}
