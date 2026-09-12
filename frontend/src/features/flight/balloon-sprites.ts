// Загрузка спрайтов шара: кадры полёта и взрыва для каждой темы

import type { Theme } from '@/shared/api/contract';

export type BalloonFrame = 'default' | 'mid' | 'boom';

const cache = new Map<string, HTMLImageElement>();

export function getBalloonSprite(theme: Theme, frame: BalloonFrame): HTMLImageElement | null {
  // Возвращает готовый спрайт либо null, пока картинка не загрузилась
  const key = `${theme}-${frame}`;
  const cached = cache.get(key);
  if (cached) return cached.complete && cached.naturalWidth > 0 ? cached : null;

  const image = new Image();
  image.src = `/images/balloons/${key}.webp`;
  cache.set(key, image);
  return null;
}
