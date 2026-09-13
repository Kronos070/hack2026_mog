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
  boosterCosts?: readonly number[];
  fragmentBalance?: number;
  locked: boolean;
  onBetChange: (cost: number, tier: BoosterTier) => void;
}

export function BetPanel({
  betCost,
  boosterTier,
  balance,
  multipliers,
  boosterCosts = [0, 2, 4, 6],
  fragmentBalance = 6,
  locked,
  onBetChange,
}: BetPanelProps) {
  // Собирает параметры ставки для предстоящего раунда
  return (
    <div className="grid gap-[clamp(0.5rem,1.4vw,1.25rem)] min-[380px]:grid-cols-2 lg:grid-cols-1 lg:grid-rows-[minmax(min-content,1fr)_minmax(min-content,1fr)]">
      <GlassPanel
        title={`Бустер · ${fragmentBalance} 🧩`}
        className={cn(
          'flex flex-col justify-center transition-opacity',
          locked && 'pointer-events-none opacity-60',
        )}
      >
        <BoosterPicker
          value={boosterTier}
          multipliers={multipliers}
          costs={boosterCosts}
          fragmentBalance={fragmentBalance}
          disabled={locked}
          onChange={(tier) => onBetChange(betCost, tier)}
        />
      </GlassPanel>

      <GlassPanel
        title="Ставка"
        className={cn(
          'flex flex-col justify-center transition-opacity',
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
    </div>
  );
}
