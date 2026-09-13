// Обёртка внутренних страниц: небо на фоне и шапка поверх него

import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { AppHeader } from '@/shared/ui/AppHeader';
import { SkyDecor } from '@/features/home/SkyDecor';

interface SkyLayoutProps {
  className?: string;
  children: ReactNode;
}

export function SkyLayout({ className, children }: SkyLayoutProps) {
  // Даёт странице тот же небесный фон, что и на главной
  return (
    <div className="relative min-h-screen overflow-hidden bg-sky-deep bg-[url('/images/home/sky.webp')] bg-cover bg-center">
      <SkyDecor withBirds={false} />

      <div className="relative z-10 flex min-h-screen flex-col">
        <AppHeader />
        <main className="mx-auto w-[94%] max-w-[1600px] flex-1 py-6">
          <div className={cn('glass-panel rounded-3xl p-6 text-on-glass', className)}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
