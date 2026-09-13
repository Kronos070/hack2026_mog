// Поле произвольной ставки с быстрыми пресетами и проверкой баланса

import { Plus } from 'lucide-react';
import { BET_PRESETS } from '@/shared/config/default-config';
import { cn } from '@/shared/lib/cn';
import { soundManager } from '@/shared/lib/sound-manager';

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
    <div className="min-h-0">
      <div
        className={cn(
          'flex min-w-0 items-center gap-[clamp(0.375rem,1.2vw,0.75rem)] rounded-xl px-[clamp(0.625rem,1.6vw,1rem)] py-[clamp(0.3rem,1vw,0.5rem)] transition-colors',
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
            'no-spinner min-w-0 flex-1 bg-transparent text-[clamp(0.9rem,1.6vw,1.25rem)] font-semibold tabular-nums outline-none',
            'placeholder:font-semibold placeholder:text-on-glass-dim',
            tooHigh ? 'text-red-theme' : 'text-on-glass',
          )}
        />
        <button
          type="button"
          disabled={disabled || value + STEP > balance}
          onClick={() => {
            soundManager.play('select', 0.4);
            onChange(Math.min(value + STEP, balance));
          }}
          aria-label="Увеличить ставку"
          className="glass-tile shrink-0 rounded-lg p-[clamp(0.3rem,1vw,0.5rem)] text-on-glass transition-opacity hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="size-[clamp(1rem,2.2vw,1.375rem)]" />
        </button>
      </div>

      <div className="mt-[clamp(0.375rem,1vw,0.625rem)] grid grid-cols-2 gap-[clamp(0.2rem,0.6vw,0.5rem)] min-[380px]:grid-cols-3 lg:flex">
        {BET_PRESETS.map((preset) => (
          <button
            key={preset}
            disabled={disabled || preset > balance}
            onClick={() => {
              soundManager.play('select', 0.4);
              onChange(preset);
            }}
            className="glass-tile min-w-0 flex-1 rounded-lg px-1 min-h-[2.25rem] py-[clamp(0.3rem,1vw,0.5rem)] text-[clamp(0.75rem,1.1vw,0.875rem)] font-semibold text-on-glass transition-all hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {preset}
          </button>
        ))}
        <button
          disabled={disabled || balance < 1}
          onClick={() => {
            soundManager.play('select', 0.4);
            onChange(balance);
          }}
          className="glass-tile min-h-[2.25rem] min-w-0 truncate rounded-lg px-[clamp(0.375rem,1.5vw,0.75rem)] py-[clamp(0.3rem,1vw,0.5rem)] text-[clamp(0.7rem,1.1vw,0.875rem)] font-semibold text-on-glass transition-all hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-40 lg:shrink-0 lg:whitespace-nowrap"
        >
          <span className="lg:hidden">Всё</span>
          <span className="hidden lg:inline">Весь баланс</span>
        </button>
      </div>

      {tooHigh && <p className="mt-2 text-xs font-semibold text-red-theme">Не хватает бонусов</p>}
    </div>
  );
}
