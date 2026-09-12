// Выбор тира бустера: фрагмент пазла, множитель которого применяется на его уровне

import type { BoosterTier } from '@/shared/api/contract';
import { cn } from '@/shared/lib/cn';

interface BoosterPickerProps {
  value: BoosterTier;
  multipliers: readonly number[];
  disabled?: boolean;
  onChange: (tier: BoosterTier) => void;
}

const TIERS: readonly BoosterTier[] = [1, 2, 3, 4];

export function BoosterPicker({
  value,
  multipliers,
  disabled = false,
  onChange,
}: BoosterPickerProps) {
  // Переключает множитель бустера для следующего раунда
  return (
    <div className="grid grid-cols-4 gap-2.5">
      {TIERS.map((tier) => {
        const multiplier = multipliers[tier - 1] ?? 1;
        const active = value === tier;
        return (
          <button
            key={tier}
            disabled={disabled}
            onClick={() => onChange(tier)}
            aria-pressed={active}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-xl px-1 py-3 transition-all disabled:cursor-not-allowed',
              active
                ? 'bg-linear-to-b from-pick to-pick-dark shadow-[0_4px_16px_rgb(60_130_10/0.5)]'
                : 'glass-tile hover:brightness-125',
            )}
          >
            <img
              src={`/images/boosters/tier-${tier}.png`}
              alt=""
              className="h-10 w-auto drop-shadow-[0_2px_4px_rgb(4_20_40/0.5)]"
            />
            <span className="text-center text-[11px] font-semibold leading-tight text-on-glass">
              x{multiplier}
              <span className="block font-normal text-on-glass-dim">
                {multiplier === 1 ? '(без усил.)' : `(тир ${tier})`}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
