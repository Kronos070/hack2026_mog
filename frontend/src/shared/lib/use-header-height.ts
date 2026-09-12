// Измеряет высоту закреплённого хедера для привязки липких блоков
import { useEffect, useState } from 'react';

const FALLBACK_HEIGHT = 69;

export function useHeaderHeight(): number {
  // Следит за высотой хедера, чтобы липкие блоки вставали вплотную под ним
  const [height, setHeight] = useState(FALLBACK_HEIGHT);

  useEffect(() => {
    const header = document.querySelector('header');
    if (!header) return undefined;

    const measure = (): void => setHeight(header.getBoundingClientRect().height);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  return height;
}
