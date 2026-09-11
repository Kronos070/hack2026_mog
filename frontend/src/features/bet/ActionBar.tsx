// Панель действий: повтор ставки, главная кнопка раунда и экспресс-ставка

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
  // Держит главную кнопку по центру, подменяя «Начать» на «Забрать» в полёте
  return (
    <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
      <div className="flex sm:justify-end">
        <Button
          variant="outline"
          disabled={flying || !hasLastBet}
          onClick={onRepeat}
          className="w-full sm:w-auto"
        >
          Повторить ставку
        </Button>
      </div>

      {flying ? (
        <Button
          variant="success"
          disabled={!canCashout || cashedOut}
          onClick={onCashout}
          className="w-full px-10 py-3.5 text-lg sm:w-auto sm:min-w-56"
        >
          {cashedOut ? 'Выигрыш зафиксирован' : 'Забрать'}
        </Button>
      ) : (
        <Button
          variant="success"
          disabled={!canStart || starting}
          onClick={onStart}
          className="w-full px-10 py-3.5 text-lg sm:w-auto sm:min-w-56"
        >
          {starting ? 'Запуск…' : 'Начать'}
        </Button>
      )}

      <div className="flex sm:justify-start">
        <Button
          variant="outline"
          disabled={flying}
          onClick={onExpress}
          className="w-full sm:w-auto"
        >
          Экспресс-ставка
        </Button>
      </div>
    </div>
  );
}
