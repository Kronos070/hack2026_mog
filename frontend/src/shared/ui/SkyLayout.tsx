// Общий каркас внутренних страниц: небо не перемонтируется при переходах

import { Outlet } from 'react-router-dom';
import { AppHeader } from '@/shared/ui/AppHeader';
import { SkyDecor } from '@/features/home/SkyDecor';

export function SkyLayout() {
  // Держит небо и шапку смонтированными, меняя только содержимое страницы
  return (
    <div className="relative min-h-screen overflow-hidden bg-sky-deep bg-[url('/images/home/sky.webp')] bg-cover bg-center">
      <SkyDecor withBirds={false} />

      <div className="relative z-10 flex min-h-screen flex-col">
        <AppHeader />
        <main className="mx-auto w-[94%] max-w-[1600px] flex-1 py-6">
          <div className="glass-panel rounded-3xl p-6 text-on-glass">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
