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
    <>
      <GlassPanel
        title="Бустер"
        subtitle="Выберите фрагмент пазла"
        className={cn(
          'flex min-h-0 flex-1 basis-0 flex-col justify-center px-5 py-1 transition-opacity',
          locked && 'pointer-events-none opacity-60',
        )}
      >
        <BoosterPicker
          value={boosterTier}
          multipliers={multipliers}
          disabled={locked}
          onChange={(tier) => onBetChange(betCost, tier)}
        />
      </GlassPanel>

      <GlassPanel
        title="Ставка"
        subtitle="Сумма ставок, бонусов"
        className={cn(
          'flex min-h-0 flex-1 basis-0 flex-col justify-center px-5 py-1 transition-opacity',
          locked && 'pointer-events-none opacity-60',
        )}
      >
        <BetAmountField
          value={betCost}
          balance={balance}
          disabled={locked}
          onChange={(value) => onBetChange(value, boosterTier)}
        />
      </GlassPanel>
    </>
  );
}
