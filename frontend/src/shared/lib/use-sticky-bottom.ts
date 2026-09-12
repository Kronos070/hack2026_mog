// Отслеживает нижнюю кромку липкого блока в координатах окна

import { useEffect, useState, type RefObject } from 'react';

export function useStickyBottom(ref: RefObject<HTMLElement | null>): number {
  // Возвращает позицию нижней границы блока, чтобы поставить под ней слой затухания
  const [bottom, setBottom] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    let scheduled = false;
    const measure = (): void => {
      scheduled = false;
      setBottom(node.getBoundingClientRect().bottom);
    };
    const schedule = (): void => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);

    const observer = new ResizeObserver(schedule);
    observer.observe(node);

    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      observer.disconnect();
    };
  }, [ref]);

  return bottom;
}
