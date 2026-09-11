// Общий макет: липкая сцена сверху, контент под ней растворяется при прокрутке

import { useRef, type ReactNode } from 'react';
import type { RoundStart, Theme } from '@/shared/api/contract';
import type { FlightSnapshot } from '@/features/flight/use-flight-engine';
import { FlightCanvas } from '@/features/flight/FlightCanvas';
import { AppHeader } from '@/shared/ui/AppHeader';
import { useHeaderHeight } from '@/shared/lib/use-header-height';
import { useStickyBottom } from '@/shared/lib/use-sticky-bottom';

const FADE_PX = 56;

interface GameLayoutProps {
  round?: RoundStart | null | undefined;
  levels: readonly number[];
  theme: Theme;
  getSnapshot?: (() => FlightSnapshot) | undefined;
  sceneOverlay?: ReactNode;
  onOpenRules?: (() => void) | undefined;
  scenePanel?: ReactNode;
  stickyBelow?: ReactNode;
  children: ReactNode;
}

export function GameLayout({
  round,
  levels,
  theme,
  getSnapshot,
  sceneOverlay,
  scenePanel,
  stickyBelow,
  onOpenRules,
  children,
}: GameLayoutProps) {
  // Держит сцену видимой всегда, независимо от того, идёт раунд или нет
  const headerHeight = useHeaderHeight();
  const stickyRef = useRef<HTMLDivElement>(null);
  const stickyBottom = useStickyBottom(stickyRef);

  return (
    <>
      <AppHeader onOpenRules={onOpenRules} />

      <div ref={stickyRef} className="sticky z-10 bg-paper" style={{ top: headerHeight }}>
        <div className="mx-auto w-[94%] max-w-[1600px] pt-4">
          <section className="flex h-[42vh] min-h-64 flex-col overflow-hidden rounded-lg border border-line sm:h-[44vh] sm:min-h-72 lg:h-[52vh] lg:min-h-80">
            <div className="relative min-h-0 flex-1">
              <FlightCanvas round={round} levels={levels} theme={theme} getSnapshot={getSnapshot} />
              {sceneOverlay}
            </div>
            {scenePanel}
          </section>

          {stickyBelow && <div className="pt-3">{stickyBelow}</div>}
        </div>

      </div>

      <main className="mx-auto w-[94%] max-w-[1600px] pt-4 pb-12">{children}</main>

      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 z-10"
        style={{
          top: stickyBottom,
          height: FADE_PX,
          background: 'linear-gradient(to bottom, var(--color-paper), transparent)',
        }}
      />
    </>
  );
}
