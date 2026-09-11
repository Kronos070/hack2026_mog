// Общий макет игровых экранов: постоянная сцена слева и контент справа

import type { ReactNode } from 'react';
import type { RoundStart, Theme } from '@/shared/api/contract';
import type { FlightSnapshot } from '@/features/flight/use-flight-engine';
import { FlightCanvas } from '@/features/flight/FlightCanvas';

interface GameLayoutProps {
  round?: RoundStart | null | undefined;
  levels: readonly number[];
  theme: Theme;
  getSnapshot?: (() => FlightSnapshot) | undefined;
  sceneOverlay?: ReactNode;
  scenePanel?: ReactNode;
  children: ReactNode;
}

export function GameLayout({
  round,
  levels,
  theme,
  getSnapshot,
  sceneOverlay,
  scenePanel,
  children,
}: GameLayoutProps) {
  // Держит сцену видимой всегда, независимо от того, идёт раунд или нет
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-stretch lg:gap-6">
      <section className="flex min-h-96 shrink-0 flex-col overflow-hidden rounded-lg border border-line lg:h-[calc(100dvh-2rem)] lg:w-[22rem] lg:sticky lg:top-4">
        <div className="relative min-h-0 flex-1">
          <FlightCanvas round={round} levels={levels} theme={theme} getSnapshot={getSnapshot} />
          {sceneOverlay}
        </div>
        {scenePanel}
      </section>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
