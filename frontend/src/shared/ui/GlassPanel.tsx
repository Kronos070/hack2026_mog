// Стеклянная панель игрового интерфейса с заголовком и подписью

import type { ReactNode, Ref } from 'react';
import { cn } from '@/shared/lib/cn';

interface GlassPanelProps {
  title?: string;
  subtitle?: string;
  align?: 'left' | 'center';
  className?: string;
  bodyClassName?: string;
  bodyRef?: Ref<HTMLDivElement>;
  children: ReactNode;
}

export function GlassPanel({
  title,
  subtitle,
  align = 'left',
  className,
  bodyClassName,
  bodyRef,
  children,
}: GlassPanelProps) {
  // Оборачивает блок интерфейса в полупрозрачную карточку поверх неба
  return (
    <section className={cn('glass-panel rounded-[clamp(1rem,2.5vw,1.5rem)] p-[clamp(0.75rem,1.4vw,1.125rem)]', className)}>
      {title && (
        <header className={cn('mb-[clamp(0.25rem,0.8vw,0.625rem)]', align === 'center' && 'text-center')}>
          <h2 className="panel-title text-balance text-[clamp(1.125rem,2.2vw,1.875rem)] font-extrabold uppercase leading-tight tracking-wide">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-[clamp(0.7rem,1.1vw,0.875rem)] text-on-glass-dim">{subtitle}</p>
          )}
        </header>
      )}
      <div ref={bodyRef} className={bodyClassName}>
        {children}
      </div>
    </section>
  );
}
