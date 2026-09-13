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
      <AppHeader />

      <main className="mx-auto flex w-[94%] max-w-[1700px] flex-col gap-[clamp(0.5rem,1.5vw,0.75rem)] pt-[clamp(0.75rem,2vw,1.75rem)] pb-[5vh] game-main">
        <div className="grid flex-1 grid-cols-[minmax(0,1fr)] items-stretch gap-[clamp(0.75rem,2vw,1.25rem)] lg:min-h-0 lg:grid-cols-[0.85fr_1.4583fr_1.4917fr]">
          <div className="order-2 lg:hidden">{stickyBelow}</div>

          <aside className="no-scrollbar order-4 flex min-w-0 flex-col gap-[clamp(0.75rem,2vw,2.25rem)] lg:order-1 lg:max-h-[calc(100vh-var(--header-h)-6rem)] lg:min-h-0 lg:overflow-y-auto">
            {asideLeft}
          </aside>

          <section className="order-1 h-[clamp(14rem,42vh,70vh)] min-h-0 min-w-0 lg:order-2 lg:h-auto">
            <div className="glass-edge relative h-full overflow-hidden rounded-3xl">
              <div
                aria-hidden
                className="absolute inset-0 bg-[url('/images/game-background.webp')] bg-cover bg-[66%_bottom] brightness-[1.45] saturate-[0.8]"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-linear-to-b from-[rgb(128_157_191/0.5)] via-[rgb(102_136_174/0.2)] to-transparent"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-glass bg-[radial-gradient(ellipse_75%_75%_at_50%_50%,rgb(40_62_90/0.55)_0%,rgb(48_72_103/0.4)_55%,rgb(72_104_142/0.12)_100%)]"
              />

              <FlightCanvas round={round} levels={levels} theme={theme} getSnapshot={getSnapshot} />

              <LevelLadder levels={levels} getSnapshot={getSnapshot} />

              {sceneOverlay}
            </div>
          </section>

          <aside className="no-scrollbar order-3 grid min-w-0 content-start gap-[clamp(0.5rem,1.4vw,1.25rem)] lg:grid-rows-[minmax(min-content,1fr)_auto] lg:content-stretch">
            {asideRight}
          </aside>
        </div>

        <div className="hidden lg:grid lg:grid-cols-[0.85fr_1.4583fr_1.4917fr] lg:gap-5">
          <div />
          {stickyBelow}
        </div>
      </main>

      {children}
    </div>
  );
}
