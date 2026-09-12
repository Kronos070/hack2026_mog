// Загрузка иконок бустеров для отрисовки маркера на сцене

const cache = new Map<number, HTMLImageElement>();

export function getBoosterSprite(tier: number): HTMLImageElement | null {
  // Возвращает готовую иконку либо null, пока картинка не загрузилась
  const safe = Math.min(Math.max(Math.round(tier), 1), 4);
  const cached = cache.get(safe);
  if (cached) return cached.complete && cached.naturalWidth > 0 ? cached : null;

  const image = new Image();
  image.src = `/images/boosters/tier-${safe}.png`;
  cache.set(safe, image);
  return null;
}
