// Экран выбора шара: сравнение тем перед запуском раунда

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { Theme } from '@/shared/api/contract';
import { useSessionStore } from '@/entities/game/session-store';
import { AppHeader } from '@/shared/ui/AppHeader';
import { SkyDecor } from '@/features/home/SkyDecor';
import { BonusBadge } from '@/features/choose/BonusBadge';
import { BALLOON_OPTIONS } from '@/features/choose/balloon-options';
import { soundManager } from '@/shared/lib/sound-manager';
import { cn } from '@/shared/lib/cn';

export function ChooseBalloonPage() {
  // Даёт выбрать шар и уводит в игру с выбранной темой
  const navigate = useNavigate();
  const user = useSessionStore((state) => state.user);
  const storedTheme = useSessionStore((state) => state.theme);
  const setTheme = useSessionStore((state) => state.setTheme);
  const [active, setActive] = useState<Theme>(storedTheme === 'red' ? 'red' : 'green');

  const option = BALLOON_OPTIONS.find((item) => item.theme === active) ?? BALLOON_OPTIONS[0]!;

  const confirm = (): void => {
    setTheme(active);
    soundManager.play('select', 0.5);
    navigate('/game');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-sky-deep bg-[url('/images/home/sky.webp')] bg-cover bg-center">
      <SkyDecor withBirds={false} />

      <div className="relative z-10 flex min-h-screen flex-col">
        <AppHeader />

        <main className="anim-page mx-auto grid w-[94%] max-w-[1700px] flex-1 items-start gap-[clamp(1rem,3vw,2rem)] pb-[5vh] pt-[clamp(0.75rem,2vw,1.5rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,34rem)]">
          <section className="flex min-w-0 flex-col gap-[clamp(0.75rem,2vw,1.5rem)]">
            <h1 className="glass-panel w-fit max-w-full rounded-full px-[clamp(1rem,4vw,3rem)] py-[clamp(0.5rem,1.5vw,1rem)] text-[clamp(1.125rem,3vw,2.25rem)] font-extrabold uppercase tracking-wide text-on-glass">
              Выберите шар
            </h1>

            <div className="grid min-w-0 grid-cols-2 items-end gap-[clamp(0.5rem,2vw,2rem)]">
              {BALLOON_OPTIONS.map((item) => (
                <button
                  key={item.theme}
                  onClick={() => setActive(item.theme)}
                  aria-pressed={item.theme === active}
                  className={cn(
                    'min-w-0 origin-bottom transition-all duration-300',
                    item.theme === active
                      ? 'scale-100 drop-shadow-[0_18px_40px_rgb(10_40_80/0.45)]'
                      : 'scale-[0.78] opacity-70 hover:opacity-100',
                  )}
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className={cn(
                      'w-full',
                      item.theme === 'green' ? 'anim-balloon-sway' : 'anim-balloon-sway-alt',
                    )}
                  />
                </button>
              ))}
            </div>
          </section>

          <aside className="flex min-w-0 flex-col gap-[clamp(0.75rem,2vw,1.25rem)]">
            <div className="flex justify-end">
              <BonusBadge balance={user?.balance ?? 0} />
            </div>

            <div className="glass-panel flex flex-col gap-7 rounded-3xl p-10">
              <h2 className="text-[clamp(1.75rem,5vw,3rem)] font-extrabold uppercase leading-tight text-on-glass">
                {option.title}
              </h2>

              <div className="glass-tile flex w-fit max-w-full items-center gap-[clamp(0.5rem,1.5vw,0.875rem)] rounded-full px-[clamp(0.875rem,3vw,1.75rem)] py-[clamp(0.5rem,1.5vw,0.75rem)]">
                <span className={cn('size-7 shrink-0 rounded-full', option.dotClass)} />
                <span className="truncate text-[clamp(0.8rem,1.6vw,1.25rem)] font-semibold text-on-glass">
                  {option.colorName} · {option.levels} уровней
                </span>
              </div>

              <div className="flex flex-col gap-4 text-xl leading-relaxed text-on-glass">
                {option.lines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>

              <button
                onClick={confirm}
                className="btn-gold mt-3 flex items-center justify-center gap-3 py-[clamp(0.75rem,2vw,1.5rem)] text-[clamp(1.125rem,2.2vw,1.875rem)] font-extrabold text-sky-deep"
              >
                Выбрать
                <ArrowRight size={32} strokeWidth={3} />
              </button>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
