// Слой поверх сцены: множитель и кнопка «Забрать», не влияющие на поток страницы

import { useEffect, useRef, useState } from 'react';
import type { RoundStart } from '@/shared/api/contract';
import type { FlightSnapshot } from '@/features/flight/use-flight-engine';
import { MultiplierDisplay } from '@/features/flight/MultiplierDisplay';
import { useSessionStore } from '@/entities/game/session-store';
import { ONBOARDING_DURATION_MS } from '@/shared/config/default-config';

interface FlightOverlayProps {
  round: RoundStart;
  getSnapshot: () => FlightSnapshot;
  boosterHit: boolean;
}

export function FlightOverlay({
  round,
  getSnapshot,
  boosterHit,
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

      <div className="flex justify-center">
        {showOnboarding && (
          <div className="relative rounded-md bg-ink px-3 py-2 text-xs text-paper">
            Нажми «Забрать» до того, как шар лопнет
            <span className="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rotate-45 bg-ink" />
          </div>
        )}
      </div>
    </div>
  );
}
