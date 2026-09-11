// Панель ставки: тема, сумма и бустер; блокируется на время активного раунда

import { LEVELS_BY_THEME, type BoosterTier, type Theme } from '@/shared/api/contract';
import { Button } from '@/shared/ui/Button';
import { BetAmountField } from '@/features/bet/BetAmountField';
import { BoosterPicker } from '@/features/bet/BoosterPicker';
import { cn } from '@/shared/lib/cn';

interface BetPanelProps {
  theme: Theme;
  betCost: number;
  boosterTier: BoosterTier;
  balance: number;
  multipliers: readonly number[];
  locked: boolean;
  starting: boolean;
  onThemeChange: (theme: Theme) => void;
  onBetChange: (cost: number, tier: BoosterTier) => void;
  onStart: () => void;
}

export function BetPanel({
  theme,
  betCost,
  boosterTier,
  balance,
  multipliers,
  locked,
  starting,
  onThemeChange,
  onBetChange,
  onStart,
}: BetPanelProps) {
  // Собирает параметры ставки и запускает раунд
  const canStart = !locked && betCost >= 1 && betCost <= balance;

  return (
    <div className={cn('transition-opacity', locked && 'pointer-events-none opacity-50')}>
      <section>
        <h2 className="text-sm font-semibold text-muted">Тема</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {(['green', 'red'] as Theme[]).map((item) => (
            <button
              key={item}
              disabled={locked}
              onClick={() => onThemeChange(item)}
              className={cn(
                'rounded-md border px-4 py-2 text-sm transition-colors disabled:cursor-not-allowed',
                theme === item ? 'border-ink font-medium' : 'border-line text-muted',
              )}
            >
              {item === 'green' ? 'Зелёный шар' : 'Красный шар'} · {LEVELS_BY_THEME[item]} уровней
            </button>
          ))}
        </div>
      </section>

      <section className="mt-5">
        <h2 className="text-sm font-semibold text-muted">Ставка</h2>
        <div className="mt-2">
          <BetAmountField
            value={betCost}
            balance={balance}
            disabled={locked}
            onChange={(value) => onBetChange(value, boosterTier)}
          />
        </div>
      </section>

      <section className="mt-5">
        <h2 className="text-sm font-semibold text-muted">Бустер</h2>
        <div className="mt-2">
          <BoosterPicker
            value={boosterTier}
            multipliers={multipliers}
            disabled={locked}
            onChange={(tier) => onBetChange(betCost, tier)}
          />
        </div>
      </section>

      <div className="mt-5">
        <Button disabled={!canStart || starting} onClick={onStart}>
          {starting ? 'Запуск…' : 'Начать'}
        </Button>
      </div>
    </div>
  );
}
