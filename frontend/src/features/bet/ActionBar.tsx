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
    <div className="mt-10 grid shrink-0 gap-5">
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="glass"
          disabled={flying || !hasLastBet}
          onClick={onRepeat}
          className="whitespace-nowrap rounded-full border border-glass-line/50 bg-sky-deep/[0.65] px-3 py-5 text-lg font-semibold text-on-glass backdrop-blur-md hover:bg-sky-deep"
        >
          Повторить ставку
        </Button>
        <Button
          variant="glass"
          disabled={flying}
          onClick={onExpress}
          className="whitespace-nowrap rounded-full border border-glass-line/50 bg-sky-deep/[0.65] px-3 py-5 text-lg font-semibold text-on-glass backdrop-blur-md hover:bg-sky-deep"
        >
          Экспресс-ставка
        </Button>
      </div>

      {flying ? (
        <Button
          variant="gold"
          disabled={!canCashout || cashedOut}
          onClick={onCashout}
          className="rounded-full bg-linear-to-b from-accent to-accent-dark py-6 text-3xl font-extrabold text-sky-deep hover:brightness-110 active:translate-y-0.5"
        >
          {cashedOut ? 'Выигрыш зафиксирован' : 'Забрать'}
        </Button>
      ) : (
        <Button
          variant="gold"
          disabled={!canStart || starting}
          onClick={onStart}
          className="rounded-full bg-linear-to-b from-accent to-accent-dark py-6 text-3xl font-extrabold text-sky-deep hover:brightness-110 active:translate-y-0.5"
        >
          {starting ? 'Запуск…' : 'Начать'}
        </Button>
      )}
    </div>
  );
}
