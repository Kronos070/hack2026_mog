// Панель действий: повтор и экспресс-ставка над главной кнопкой раунда

import { Button } from '@/shared/ui/Button';

interface ActionBarProps {
  flying: boolean;
  starting: boolean;
  canStart: boolean;
  canCashout: boolean;
  cashedOut: boolean;
  hasLastBet: boolean;
  onStart: () => void;
  onCashout: () => void;
  onRepeat: () => void;
  onExpress: () => void;
}

export function ActionBar({
  flying,
  starting,
  canStart,
  canCashout,
  cashedOut,
  hasLastBet,
  onStart,
  onCashout,
  onRepeat,
  onExpress,
}: ActionBarProps) {
  // Подменяет «Начать» на «Забрать» во время полёта
  return (
    <div className="mt-[clamp(0.5rem,1.5vw,1.5rem)] grid shrink-0 gap-[clamp(0.5rem,1.2vw,1.25rem)]">
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="glass"
          disabled={flying || !hasLastBet}
          onClick={onRepeat}
          className="whitespace-nowrap rounded-full border border-glass-line/50 bg-sky-deep/[0.65] px-3 py-[clamp(0.625rem,1.6vw,1.25rem)] text-[clamp(0.8rem,1.15vw,1.125rem)] font-semibold text-on-glass backdrop-blur-md hover:bg-sky-deep"
        >
          Повторить ставку
        </Button>
        <Button
          variant="glass"
          disabled={flying}
          onClick={onExpress}
          className="whitespace-nowrap rounded-full border border-glass-line/50 bg-sky-deep/[0.65] px-3 py-[clamp(0.625rem,1.6vw,1.25rem)] text-[clamp(0.8rem,1.15vw,1.125rem)] font-semibold text-on-glass backdrop-blur-md hover:bg-sky-deep"
        >
          Экспресс-ставка
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
