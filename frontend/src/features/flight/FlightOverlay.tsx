// Слой поверх сцены: множитель раунда, не влияющий на поток страницы

import type { RoundStart } from '@/shared/api/contract';
import type { FlightSnapshot } from '@/features/flight/use-flight-engine';
import { MultiplierDisplay } from '@/features/flight/MultiplierDisplay';

interface FlightOverlayProps {
  round: RoundStart;
  getSnapshot: () => FlightSnapshot;
  boosterHit: boolean;
}

export function FlightOverlay({ round, getSnapshot, boosterHit }: FlightOverlayProps) {
  // Показывает текущий множитель прямо на сцене
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4">
      <div className="glass-panel rounded-xl py-1.5 text-center">
        <MultiplierDisplay getSnapshot={getSnapshot} />
        {boosterHit && (
          <p className="mt-1 text-sm font-bold text-accent">Бустер x{round.boosterMultiplier}</p>
        )}
      </div>
    </div>
  );
}
