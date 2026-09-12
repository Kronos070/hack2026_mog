// Плашка баланса игрока над блоком ставки

import { Wallet } from 'lucide-react';
import { GlassPanel } from '@/shared/ui/GlassPanel';

interface BalanceCardProps {
  balance: number;
}

export function BalanceCard({ balance }: BalanceCardProps) {
  // Показывает текущий баланс бонусов в стиле остальных панелей
  return (
    <GlassPanel title="Баланс" subtitle="Доступно бонусов" className="flex min-h-0 flex-1 basis-0 flex-col justify-center px-5 py-1">
      <div className="glass-tile flex items-center gap-3 rounded-xl px-4 py-2.5">
        <Wallet size={26} className="shrink-0 text-accent" />
        <span className="min-w-0 flex-1 truncate text-2xl font-extrabold tabular-nums text-on-glass">
          {balance.toLocaleString('ru-RU')}
        </span>
        <span className="shrink-0 text-base font-semibold text-on-glass-dim">бонусов</span>
      </div>
    </GlassPanel>
  );
}
