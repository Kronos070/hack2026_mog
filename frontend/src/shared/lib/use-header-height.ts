// Измеряет высоту закреплённого хедера для привязки липких блоков
import { useLayoutEffect, useState } from 'react';

const FALLBACK_HEIGHT = 92;

export function useHeaderHeight(): number {
  // Следит за высотой хедера, чтобы липкие блоки вставали вплотную под ним
  const [height, setHeight] = useState(FALLBACK_HEIGHT);

  useLayoutEffect(() => {
    const header = document.querySelector('header');
    if (!header) return undefined;

    const measure = (): void => {
      const next = header.getBoundingClientRect().height;
      setHeight((current) => (Math.abs(current - next) > 0.5 ? next : current));
    };
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  return height;
}
