// Слой поверх сцены: множитель и кнопка «Забрать», не влияющие на поток страницы

import { useEffect, useRef, useState } from 'react';
import type { RoundStart } from '@/shared/api/contract';
import type { FlightSnapshot } from '@/features/flight/use-flight-engine';
import { MultiplierDisplay } from '@/features/flight/MultiplierDisplay';
import { Button } from '@/shared/ui/Button';
import { useSessionStore } from '@/entities/game/session-store';
import { ONBOARDING_DURATION_MS } from '@/shared/config/default-config';

interface FlightOverlayProps {
  round: RoundStart;
  getSnapshot: () => FlightSnapshot;
  canCashout: boolean;
  cashedOut: boolean;
  boosterHit: boolean;
  onCashout: () => void;
}

export function FlightOverlay({
  round,
  getSnapshot,
  canCashout,
  cashedOut,
  boosterHit,
  onCashout,
}: FlightOverlayProps) {
  // Показывает множитель и cashout прямо на сцене
  const { onboardingSeen, markOnboardingSeen } = useSessionStore();
  const [showOnboarding, setShowOnboarding] = useState(!onboardingSeen);
  const showOnboardingRef = useRef(!onboardingSeen);

  useEffect(() => {
    if (!showOnboardingRef.current) return undefined;
    const timer = setTimeout(() => {
      setShowOnboarding(false);
      markOnboardingSeen();
    }, ONBOARDING_DURATION_MS);
    return () => clearTimeout(timer);
  }, [markOnboardingSeen]);

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4">
      <div className="rounded-lg bg-paper/85 py-1 text-center backdrop-blur-sm">
        <MultiplierDisplay getSnapshot={getSnapshot} />
        {boosterHit && (
          <p className="mt-1 text-sm font-medium text-gold">Бустер x{round.boosterMultiplier}</p>
        )}
      </div>

      <div className="flex flex-col items-center gap-2">
        {showOnboarding && (
          <div className="relative rounded-md bg-ink px-3 py-2 text-xs text-paper">
            Нажми «Забрать» до того, как шар лопнет
            <span className="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rotate-45 bg-ink" />
          </div>
        )}

        <Button
          disabled={!canCashout || cashedOut}
          onClick={onCashout}
          className="pointer-events-auto w-full max-w-56 py-3 text-base shadow-lg disabled:opacity-60"
        >
          {cashedOut ? 'Выигрыш зафиксирован' : 'Забрать'}
        </Button>
      </div>
    </div>
  );
}
