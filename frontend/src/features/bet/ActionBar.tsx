// Панель действий: повтор и экспресс-ставка над главной кнопкой раунда

import { Button } from '@/shared/ui/Button';
import { soundManager } from '@/shared/lib/sound-manager';
import { cn } from '@/shared/lib/cn';

interface ActionBarProps {
  flying: boolean;
  starting: boolean;
  canStart: boolean;
  canCashout: boolean;
  cashedOut: boolean;
  hasLastBet: boolean;
  autoCashout2x: boolean;
  onStart: () => void;
  onCashout: () => void;
  onRepeat: () => void;
  onToggleAutoCashout: () => void;
}

export function ActionBar({
  flying,
  starting,
  canStart,
  canCashout,
  cashedOut,
  hasLastBet,
  autoCashout2x,
  onStart,
  onCashout,
  onRepeat,
  onToggleAutoCashout,
}: ActionBarProps) {
  // Подменяет «Начать» на «Забрать» во время полёта
  return (
    <div className="mt-[clamp(0.5rem,1.5vw,1.5rem)] grid shrink-0 gap-[clamp(0.5rem,1.2vw,1.25rem)]">
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="glass"
          disabled={flying || !hasLastBet}
          onClick={() => {
            soundManager.play('select', 0.5);
            onRepeat();
          }}
          className="whitespace-nowrap rounded-full border border-glass-line/50 bg-sky-deep/[0.65] px-3 py-[clamp(0.625rem,1.6vw,1.25rem)] text-[clamp(0.8rem,1.15vw,1.125rem)] font-semibold text-on-glass backdrop-blur-md hover:bg-sky-deep"
        >
          Повторить ставку
        </Button>
        <Button
          variant="glass"
          onClick={() => {
            soundManager.play('select', 0.5);
            onToggleAutoCashout();
          }}
          className={cn(
            'whitespace-nowrap rounded-full border px-3 py-[clamp(0.625rem,1.6vw,1.25rem)] text-[clamp(0.8rem,1.15vw,1.125rem)] font-semibold backdrop-blur-md transition-all',
            autoCashout2x
              ? 'border-amber-300 bg-amber-400/30 text-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.35)]'
              : 'border-glass-line/50 bg-sky-deep/[0.65] text-on-glass hover:bg-sky-deep',
          )}
        >
          {autoCashout2x ? 'Автовывод x2 ✓' : 'Автовывод x2'}
        </Button>
      </div>

      {flying ? (
        <Button
          variant="bare"
          disabled={!canCashout || cashedOut}
          onClick={onCashout}
          className="btn-gold py-[clamp(0.75rem,2vw,1.5rem)] text-[clamp(1.125rem,2.2vw,1.875rem)] font-extrabold text-sky-deep"
        >
          {cashedOut ? 'Выигрыш зафиксирован' : 'Забрать'}
        </Button>
      ) : (
        <Button
          variant="bare"
          disabled={!canStart || starting}
          onClick={onStart}
          className="btn-gold py-[clamp(0.75rem,2vw,1.5rem)] text-[clamp(1.125rem,2.2vw,1.875rem)] font-extrabold text-sky-deep"
        >
          {starting ? 'Запуск…' : 'Начать'}
        </Button>
      )}
    </div>
  );
}
