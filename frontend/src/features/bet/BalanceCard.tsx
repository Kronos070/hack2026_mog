// Плашка баланса игрока над блоком ставки

import { GlassPanel } from '@/shared/ui/GlassPanel';

interface BalanceCardProps {
  balance: number;
  fragments?: number;
  totalFragments?: number;
}

export function BalanceCard({ balance, fragments = 0, totalFragments = 10 }: BalanceCardProps) {
  // Показывает текущий баланс бонусов и пазлов в одну строку
  return (
    <GlassPanel title="Баланс" className="flex flex-col justify-center">
      <div className="grid grid-cols-2 gap-[clamp(0.375rem,0.8vw,0.625rem)]">
        <div className="glass-tile flex min-w-0 items-center gap-[clamp(0.375rem,0.8vw,0.625rem)] rounded-xl px-[clamp(0.5rem,1.2vw,0.875rem)] py-[clamp(0.375rem,1vw,0.625rem)]">
          <img src="/images/choose/coin.webp" alt="" className="h-[clamp(1.2rem,2vw,1.45rem)] w-auto shrink-0" />
          <span className="min-w-0 flex-1 truncate text-[clamp(1rem,1.5vw,1.25rem)] font-extrabold tabular-nums text-on-glass">
            {balance.toLocaleString('ru-RU')}
          </span>
          <span className="shrink-0 text-[clamp(0.75rem,1.1vw,0.875rem)] font-semibold text-on-glass-dim">
            бонусов
          </span>
        </div>

        <div className="glass-tile flex min-w-0 items-center gap-[clamp(0.375rem,0.8vw,0.625rem)] rounded-xl px-[clamp(0.5rem,1.2vw,0.875rem)] py-[clamp(0.375rem,1vw,0.625rem)]">
          <span className="text-[clamp(1.1rem,1.9vw,1.35rem)] shrink-0 select-none leading-none" role="img" aria-label="Пазл">
            🧩
          </span>
          <span className="min-w-0 flex-1 truncate text-[clamp(1rem,1.5vw,1.25rem)] font-extrabold tabular-nums text-on-glass">
            {fragments}{' '}
            <span className="font-semibold text-on-glass-dim text-[clamp(0.75rem,1.1vw,0.875rem)]">
              / {totalFragments}
            </span>
          </span>
          <span className="shrink-0 text-[clamp(0.75rem,1.1vw,0.875rem)] font-semibold text-on-glass-dim">
            пазлов
          </span>
        </div>
      </div>
    </GlassPanel>
  );
}
