// Выбор тира бустера: фрагмент пазла, множитель которого применяется на его уровне

import type { BoosterTier } from '@/shared/api/contract';
import { cn } from '@/shared/lib/cn';
import { soundManager } from '@/shared/lib/sound-manager';

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
    <div className="grid grid-cols-2 gap-[clamp(0.375rem,1.2vw,0.875rem)] lg:grid-cols-4">
      {TIERS.map((tier) => {
        const multiplier = multipliers[tier - 1] ?? 1;
        const active = value === tier;
        return (
          <button
            key={tier}
            disabled={disabled}
            onClick={() => {
              soundManager.play('select', 0.5);
              onChange(tier);
            }}
            aria-pressed={active}
            className={cn(
              'flex min-w-0 flex-col items-center gap-[clamp(0.2rem,0.6vw,0.375rem)] rounded-xl px-[clamp(0.25rem,1vw,0.5rem)] py-[clamp(0.3rem,0.9vw,0.625rem)] transition-all disabled:cursor-not-allowed',
              active
                ? 'bg-linear-to-b from-pick to-pick-dark shadow-[0_4px_16px_rgb(60_130_10/0.5)]'
                : 'glass-tile hover:brightness-125',
            )}
          >
            <img
              src={`/images/boosters/tier-${tier}.png`}
              alt=""
              className="h-[clamp(1.75rem,4.5vw,3rem)] w-auto drop-shadow-[0_2px_4px_rgb(4_20_40/0.5)]"
            />
            <span className="text-center text-[clamp(0.65rem,1.15vw,0.875rem)] font-semibold leading-tight text-on-glass">
              x{multiplier}
              <span className="block font-semibold text-on-glass-dim">
                {multiplier === 1 ? '(без усил.)' : `(тир ${tier})`}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
