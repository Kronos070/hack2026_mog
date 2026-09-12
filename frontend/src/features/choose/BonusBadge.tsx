// Плашка бонусов в стиле макета: монета, сумма и кнопка пополнения

import { Plus } from 'lucide-react';

interface BonusBadgeProps {
  balance: number;
}

export function BonusBadge({ balance }: BonusBadgeProps) {
  // Показывает доступные бонусы поверх неба
  return (
    <div className="glass-panel flex items-center gap-4 rounded-full py-2.5 pl-4 pr-2.5">
      <img src="/images/choose/coin.webp" alt="" className="h-10 w-auto" />
      <span className="whitespace-nowrap text-xl font-bold text-on-glass">
        Бонусы {balance.toLocaleString('ru-RU')}
      </span>
      <button
        type="button"
        aria-label="Пополнить бонусы"
        className="grid size-11 shrink-0 place-items-center rounded-full bg-linear-to-b from-accent to-accent-dark text-sky-deep transition-transform hover:brightness-110 active:translate-y-0.5"
      >
        <Plus size={24} strokeWidth={3} />
      </button>
    </div>
  );
}
