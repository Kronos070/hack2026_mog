// Поле произвольной ставки с быстрыми пресетами и проверкой баланса

import { Plus } from 'lucide-react';
import { BET_PRESETS } from '@/shared/config/default-config';
import { cn } from '@/shared/lib/cn';

interface BetAmountFieldProps {
  value: number;
  balance: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}

const STEP = 10;

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
      <div
        className={cn(
          'flex items-center gap-2 rounded-xl px-3 py-2 transition-colors',
          'glass-tile',
          tooHigh && 'border-red-theme',
        )}
      >
        <input
          type="number"
          disabled={disabled}
          min={1}
          max={balance}
          step={1}
          value={value === 0 ? '' : value}
          placeholder="Введите сумму"
          aria-label="Сумма ставки"
          onChange={(event) => onChange(Math.floor(Number(event.target.value)) || 0)}
          className={cn(
            'no-spinner min-w-0 flex-1 bg-transparent text-lg font-semibold tabular-nums outline-none',
            'placeholder:font-normal placeholder:text-on-glass-dim',
            tooHigh ? 'text-red-theme' : 'text-on-glass',
          )}
        />
        <button
          type="button"
          disabled={disabled || value + STEP > balance}
          onClick={() => onChange(Math.min(value + STEP, balance))}
          aria-label="Увеличить ставку"
          className="glass-tile shrink-0 rounded-md p-1 text-on-glass transition-opacity hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="mt-2.5 flex gap-1.5">
        {BET_PRESETS.map((preset) => (
          <button
            key={preset}
            disabled={disabled || preset > balance}
            onClick={() => onChange(preset)}
            className="glass-tile flex-1 rounded-lg px-1 py-1 text-xs font-semibold text-on-glass transition-all hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {preset}
          </button>
        ))}
        <button
          disabled={disabled || balance < 1}
          onClick={() => onChange(balance)}
          className="glass-tile shrink-0 whitespace-nowrap rounded-lg px-2 py-1 text-xs font-semibold text-on-glass transition-all hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Весь баланс
        </button>
      </div>

      {tooHigh && <p className="mt-2 text-xs font-semibold text-red-theme">Не хватает бонусов</p>}
    </div>
  );
}
