// Выбор тира бустера: множитель применяется при достижении его уровня
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
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {TIERS.map((tier) => {
        const multiplier = multipliers[tier - 1] ?? 1;
        return (
          <button
            key={tier}
            disabled={disabled}
            onClick={() => onChange(tier)}
            className={cn(
              'rounded-lg border p-3 text-left transition-all disabled:cursor-not-allowed',
              value === tier ? 'border-ink shadow-sm' : 'border-line hover:border-muted',
            )}
          >
            <p className="text-base font-bold">x{multiplier}</p>
            <p className="mt-0.5 text-xs text-muted">
              {multiplier === 1 ? 'Без усиления' : `Тир ${tier}`}
            </p>
          </button>
        );
      })}
    </div>
  );
}
