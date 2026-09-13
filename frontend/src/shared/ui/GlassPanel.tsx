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
    <section className={cn('glass-panel rounded-3xl p-5', className)}>
      {title && (
        <header className={cn('mb-3', align === 'center' && 'text-center')}>
          <h2 className="panel-title text-balance text-3xl font-extrabold uppercase leading-tight tracking-wide">
            {title}
          </h2>
          {subtitle && <p className="mt-1 text-sm text-on-glass-dim">{subtitle}</p>}
        </header>
      )}
      <div ref={bodyRef} className={bodyClassName}>
        {children}
      </div>
    </section>
  );
}
