import { useEffect } from 'react';
import { Lock } from 'lucide-react';
import type { BoosterTier } from '@/shared/api/contract';
import { cn } from '@/shared/lib/cn';
import { soundManager } from '@/shared/lib/sound-manager';

interface BoosterPickerProps {
  value: BoosterTier;
  multipliers: readonly number[];
  costs?: readonly number[];
  fragmentBalance?: number;
  disabled?: boolean;
  onChange: (tier: BoosterTier) => void;
}

const TIERS: readonly BoosterTier[] = [1, 2, 3, 4];

export function BoosterPicker({
  value,
  multipliers,
  costs = [0, 2, 4, 6],
  fragmentBalance = 6,
  disabled = false,
  onChange,
}: BoosterPickerProps) {
  // Сбрасываем выбранный бустер на бесплатный, если пазлов перестало хватать
  useEffect(() => {
    const selectedCost = costs[value - 1] ?? 0;
    if (selectedCost > fragmentBalance && value !== 1) {
      onChange(1);
    }
  }, [value, costs, fragmentBalance, onChange]);

  return (
    <div className="grid grid-cols-2 gap-[clamp(0.375rem,1.2vw,0.875rem)] lg:grid-cols-4">
      {TIERS.map((tier) => {
        const multiplier = multipliers[tier - 1] ?? 1;
        const cost = costs[tier - 1] ?? 0;
        const notEnough = cost > fragmentBalance;
        const isDisabled = disabled || notEnough;
        const active = value === tier;

        return (
          <button
            key={tier}
            disabled={isDisabled}
            onClick={() => {
              soundManager.play('select', 0.5);
              onChange(tier);
            }}
            aria-pressed={active}
            title={
              notEnough
                ? `Недостаточно пазлов (нужно ${cost} 🧩, у вас ${fragmentBalance} 🧩)`
                : cost > 0
                  ? `Стоимость активации: ${cost} 🧩`
                  : 'Бесплатный полет'
            }
            className={cn(
              'relative flex min-w-0 flex-col items-center gap-[clamp(0.2rem,0.6vw,0.375rem)] rounded-xl px-[clamp(0.25rem,1vw,0.5rem)] py-[clamp(0.3rem,0.9vw,0.625rem)] transition-all',
              isDisabled
                ? 'cursor-not-allowed opacity-50 grayscale'
                : 'hover:brightness-125',
              active
                ? 'bg-linear-to-b from-pick to-pick-dark shadow-[0_4px_16px_rgb(60_130_10/0.5)]'
                : 'glass-tile',
            )}
          >
            {notEnough && (
              <div
                className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-black/60 text-white shadow-xs"
                title={`Не хватает ${cost - fragmentBalance} 🧩`}
              >
                <Lock className="size-2.5" />
              </div>
            )}
            <img
              src={`/images/boosters/tier-${tier}.png`}
              alt=""
              className="h-[clamp(1.75rem,4.5vw,3rem)] w-auto drop-shadow-[0_2px_4px_rgb(4_20_40/0.5)]"
            />
            <span className="text-center text-[clamp(0.65rem,1.15vw,0.875rem)] font-semibold leading-tight text-on-glass">
              x{multiplier}
              <span className="block font-semibold text-on-glass-dim text-[clamp(0.6rem,1vw,0.75rem)]">
                {cost === 0 ? '0 🧩' : `${cost} 🧩`}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
