// Плашка баланса игрока над блоком ставки с кнопкой пополнения

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { GlassPanel } from '@/shared/ui/GlassPanel';
import { api } from '@/shared/api/client';
import { useSessionStore } from '@/entities/game/session-store';
import { soundManager } from '@/shared/lib/sound-manager';

interface BalanceCardProps {
  balance: number;
  fragments?: number;
  totalFragments?: number;
}

export function BalanceCard({ balance, fragments = 0, totalFragments = 10 }: BalanceCardProps) {
  // Показывает текущий баланс бонусов, пазлов и кнопку быстрого пополнения
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
    <GlassPanel title="Баланс" className="flex flex-col justify-center">
      <div className="grid grid-cols-1 gap-[clamp(0.375rem,0.8vw,0.625rem)] xl:grid-cols-[1.35fr_0.65fr]">
        <div className="glass-tile flex min-w-0 items-center justify-between gap-2 rounded-xl px-[clamp(0.5rem,1.2vw,0.875rem)] py-[clamp(0.375rem,1vw,0.625rem)]">
          <div className="flex min-w-0 items-center gap-[clamp(0.375rem,0.8vw,0.625rem)]">
            <img src="/images/choose/coin.webp" alt="" className="h-[clamp(1.2rem,2vw,1.45rem)] w-auto shrink-0" />
            <span className="min-w-0 truncate text-[clamp(1rem,1.5vw,1.25rem)] font-extrabold tabular-nums text-on-glass">
              {balance.toLocaleString('ru-RU')}
            </span>
            <span className="shrink-0 text-[clamp(0.75rem,1.1vw,0.875rem)] font-semibold text-on-glass-dim">
              бонусов
            </span>
          </div>

          <button
            type="button"
            onClick={() => void handleTopUp()}
            disabled={loading}
            aria-label="Добавить 1000"
            title="Добавить 1000 бонусов"
            className="btn-gold flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-extrabold text-sky-deep transition-transform hover:brightness-110 active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="size-3.5 stroke-[3]" />
            <span>{loading ? '…' : 'Добавить 1000'}</span>
          </button>
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
