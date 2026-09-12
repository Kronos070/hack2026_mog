// Игровой макет: три колонки поверх неба — история, поле полёта и ставка

import type { CSSProperties, ReactNode } from 'react';
import type { RoundStart, Theme } from '@/shared/api/contract';
import type { FlightSnapshot } from '@/features/flight/use-flight-engine';
import { FlightCanvas } from '@/features/flight/FlightCanvas';
import { LevelLadder } from '@/features/flight/LevelLadder';
import { AppHeader } from '@/shared/ui/AppHeader';
import { useHeaderHeight } from '@/shared/lib/use-header-height';

interface GameLayoutProps {
  round?: RoundStart | null | undefined;
  levels: readonly number[];
  theme: Theme;
  getSnapshot?: (() => FlightSnapshot) | undefined;
  sceneOverlay?: ReactNode;
  onOpenRules?: (() => void) | undefined;
  asideLeft?: ReactNode;
  asideRight?: ReactNode;
  stickyBelow?: ReactNode;
  children?: ReactNode;
}

export function GameLayout({
  round,
  levels,
  theme,
  getSnapshot,
  sceneOverlay,
  stickyBelow,
  onOpenRules,
  asideLeft,
  asideRight,
  children,
}: GameLayoutProps) {
  // Держит поле в центре, а панели управления — по краям экрана
  const headerHeight = useHeaderHeight();

  return (
    <div
      style={{ '--header-h': `${headerHeight}px` } as CSSProperties}
      className="relative min-h-screen bg-sky-deep bg-[url('/images/sky-background.webp')] bg-cover bg-center bg-fixed"
    >
      <AppHeader onOpenRules={onOpenRules} />

      <main className="mx-auto flex w-[94%] max-w-[1700px] flex-col gap-3 py-4 lg:h-[calc(100vh-var(--header-h))]">
        <div className="grid min-h-0 flex-1 items-stretch gap-5 lg:grid-cols-[0.85fr_1.4583fr_1.4917fr]">
          <aside className="no-scrollbar order-2 flex min-h-0 min-w-0 flex-col gap-9 overflow-y-auto lg:order-1">
            {asideLeft}
          </aside>

          <section className="order-1 h-[70vh] min-h-0 min-w-0 lg:order-2 lg:h-full">
            <div className="glass-edge h-full overflow-hidden rounded-3xl bg-[url('/images/game-background.webp')] bg-cover bg-[66%_bottom]">
              <div aria-hidden className="absolute inset-0 bg-glass" />

              <FlightCanvas round={round} levels={levels} theme={theme} getSnapshot={getSnapshot} />

              <LevelLadder levels={levels} getSnapshot={getSnapshot} />

              {sceneOverlay}
            </div>
          </section>

          <aside className="no-scrollbar order-3 flex min-h-0 min-w-0 flex-col gap-4 overflow-y-auto">
            {asideRight}
          </aside>
        </div>

        <div className="grid lg:grid-cols-[0.85fr_1.4583fr_1.4917fr] lg:gap-5">
          <div className="hidden lg:block" />
          {stickyBelow}
        </div>
      </main>

      {children}
    </div>
  );
}
