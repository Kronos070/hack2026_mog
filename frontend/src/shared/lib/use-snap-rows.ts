// Подгоняет высоту прокручиваемого списка под целое число строк

import { useEffect, useRef } from 'react';

export function useSnapRows<T extends HTMLElement>() {
  // Обрезает высоту контейнера по шагу строки, чтобы не было полувидимой записи
  const ref = useRef<T>(null);

  useEffect(() => {
    const box = ref.current;
    if (!box) return undefined;

    const fit = (): void => {
      // на узких экранах список растёт по контенту, подрезать нечего
      if (window.innerWidth < 1024) {
        box.style.maxHeight = '';
        return;
      }

      const items = box.querySelectorAll<HTMLElement>(':scope > * > *');
      const first = items[0];
      if (!first) return;

      const item = first.getBoundingClientRect().height;
      const step = items[1]
        ? items[1].getBoundingClientRect().top - first.getBoundingClientRect().top
        : item;
      const gap = step - item;
      if (item <= 0) return;

      box.style.maxHeight = '';
      const available = box.getBoundingClientRect().height;
      // N строк занимают N высот записи плюс N-1 промежутков между ними
      const rows = Math.max(Math.floor((available + gap) / step), 1);
      box.style.maxHeight = `${Math.round(rows * item + (rows - 1) * gap)}px`;
    };

    fit();

    const observer = new ResizeObserver(fit);
    observer.observe(box);
    window.addEventListener('resize', fit);
    const list = box.firstElementChild;
    if (list) observer.observe(list);

    return () => {
      window.removeEventListener('resize', fit);
      observer.disconnect();
    };
  }, []);

  return ref;
}
