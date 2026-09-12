// Панель ставки: тема, сумма и бустер в одной горизонтали

import { LEVELS_BY_THEME, type BoosterTier, type Theme } from '@/shared/api/contract';
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
  onThemeChange: (theme: Theme) => void;
  onBetChange: (cost: number, tier: BoosterTier) => void;
}

export function BetPanel({
  theme,
  betCost,
  boosterTier,
  balance,
  multipliers,
  locked,
  onThemeChange,
  onBetChange,
}: BetPanelProps) {
  // Собирает параметры ставки для предстоящего раунда
  return (
    <div
      className={cn(
        'grid gap-5 transition-opacity lg:grid-cols-3',
        locked && 'pointer-events-none opacity-50',
      )}
    >
      <section>
        <h2 className="text-sm font-semibold text-muted">Тема</h2>
        <div className="mt-2 grid gap-2">
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

      <section>
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

      <section>
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
    </div>
  );
}
