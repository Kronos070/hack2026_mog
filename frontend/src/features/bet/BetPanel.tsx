// Правая колонка: выбор бустера и сумма ставки в стеклянных панелях

import type { BoosterTier } from '@/shared/api/contract';
import { BetAmountField } from '@/features/bet/BetAmountField';
import { BoosterPicker } from '@/features/bet/BoosterPicker';
import { GlassPanel } from '@/shared/ui/GlassPanel';
import { cn } from '@/shared/lib/cn';

interface BetPanelProps {
  betCost: number;
  boosterTier: BoosterTier;
  balance: number;
  multipliers: readonly number[];
  locked: boolean;
  onBetChange: (cost: number, tier: BoosterTier) => void;
}

export function BetPanel({
  betCost,
  boosterTier,
  balance,
  multipliers,
  locked,
  onBetChange,
}: BetPanelProps) {
  // Собирает параметры ставки для предстоящего раунда
  return (
    <div
      className={cn(
        'flex flex-col gap-4 transition-opacity',
        locked && 'pointer-events-none opacity-60',
      )}
    >
      <GlassPanel title="Бустер" subtitle="Выберите фрагмент пазла">
        <BoosterPicker
          value={boosterTier}
          multipliers={multipliers}
          disabled={locked}
          onChange={(tier) => onBetChange(betCost, tier)}
        />
      </GlassPanel>

      <GlassPanel title="Ставка" subtitle="Сумма ставок, бонусов">
        <BetAmountField
          value={betCost}
          balance={balance}
          disabled={locked}
          onChange={(value) => onBetChange(value, boosterTier)}
        />
      </GlassPanel>
    </div>
  );
}
