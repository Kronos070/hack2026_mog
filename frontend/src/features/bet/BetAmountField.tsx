// Поле произвольной ставки с быстрыми пресетами и проверкой баланса

import { BET_PRESETS } from '@/shared/config/default-config';
import { Button } from '@/shared/ui/Button';
import { cn } from '@/shared/lib/cn';

interface BetAmountFieldProps {
  value: number;
  balance: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}

export function BetAmountField({
  value,
  balance,
  disabled = false,
  onChange,
}: BetAmountFieldProps) {
  // Позволяет ввести свою сумму ставки или выбрать пресет
  const tooHigh = value > balance;

  return (
    <div>
      <label className="block">
        <span className="block text-xs text-muted">Сумма ставки, бонусов</span>
        <input
          type="number"
          disabled={disabled}
          min={1}
          max={balance}
          step={1}
          value={value === 0 ? '' : value}
          placeholder="Введите сумму"
          onChange={(event) => onChange(Math.floor(Number(event.target.value)) || 0)}
          className={cn(
            'mt-1 w-full rounded-md border px-3 py-2 text-lg font-semibold tabular-nums',
            'focus:outline-none',
            tooHigh ? 'border-red-theme text-red-theme' : 'border-line focus:border-ink',
          )}
        />
      </label>

      <div className="mt-2 flex flex-wrap gap-2">
        {BET_PRESETS.map((preset) => (
          <Button
            key={preset}
            variant="outline"
            disabled={disabled || preset > balance}
            onClick={() => onChange(preset)}
            className="px-3 py-1 text-xs"
          >
            {preset}
          </Button>
        ))}
        <Button
          variant="outline"
          disabled={disabled || balance < 1}
          onClick={() => onChange(balance)}
          className="px-3 py-1 text-xs"
        >
          Весь баланс
        </Button>
      </div>

      {tooHigh && <p className="mt-2 text-xs text-red-theme">Не хватает бонусов</p>}
    </div>
  );
}
