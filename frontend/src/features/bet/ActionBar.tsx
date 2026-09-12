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
    <div className="grid shrink-0 gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="slate"
          disabled={flying || !hasLastBet}
          onClick={onRepeat}
          className="whitespace-nowrap rounded-full px-2 py-3 text-sm font-semibold"
        >
          Повторить ставку
        </Button>
        <Button
          variant="slate"
          disabled={flying}
          onClick={onExpress}
          className="whitespace-nowrap rounded-full px-2 py-3 text-sm font-semibold"
        >
          Экспресс-ставка
        </Button>
      </div>

      {flying ? (
        <Button
          variant="gold"
          disabled={!canCashout || cashedOut}
          onClick={onCashout}
          className="rounded-full py-4 text-2xl font-extrabold"
        >
          {cashedOut ? 'Выигрыш зафиксирован' : 'Забрать'}
        </Button>
      ) : (
        <Button
          variant="gold"
          disabled={!canStart || starting}
          onClick={onStart}
          className="rounded-full py-4 text-2xl font-extrabold"
        >
          {starting ? 'Запуск…' : 'Начать'}
        </Button>
      )}
    </div>
  );
}
