// Плашка бонусов в стиле макета: монета, сумма и кнопка пополнения

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/shared/api/client';
import { useSessionStore } from '@/entities/game/session-store';
import { soundManager } from '@/shared/lib/sound-manager';

interface BonusBadgeProps {
  balance: number;
}

export function BonusBadge({ balance }: BonusBadgeProps) {
  // Показывает доступные бонусы поверх неба и кнопку пополнения
  const [loading, setLoading] = useState(false);
  const updateBalance = useSessionStore((state) => state.updateBalance);

  const handleTopUp = async () => {
    if (loading) return;
    setLoading(true);
    soundManager.play('cashout', 0.6);
    try {
      const res = await api.topUpBalance(1000);
      updateBalance(res.newBalance);
      toast.success('+1 000 бонусов добавлено на баланс!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не удалось пополнить баланс');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel flex items-center gap-3 rounded-full py-2 pl-4 pr-2 sm:gap-4 sm:py-2.5 sm:pr-2.5">
      <img src="/images/choose/coin.webp" alt="" className="h-8 w-auto sm:h-10" />
      <span className="truncate text-[clamp(0.8rem,1.6vw,1.25rem)] font-bold text-on-glass">
        Бонусы {balance.toLocaleString('ru-RU')}
      </span>
      <button
        type="button"
        onClick={() => void handleTopUp()}
        disabled={loading}
        aria-label="Добавить 1000"
        title="Добавить 1000 бонусов"
        className="btn-gold flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-extrabold text-sky-deep transition-transform hover:brightness-110 active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:py-2 sm:text-sm"
      >
        <Plus size={18} strokeWidth={3} />
        <span>{loading ? '…' : 'Добавить 1000'}</span>
      </button>
    </div>
  );
}
