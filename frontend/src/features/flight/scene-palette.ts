// Чтение цветов сцены из CSS-переменных текущей темы
export interface ScenePalette {
  sky: string;
  line: string;
  linePassed: string;
  label: string;
  cloud: string;
  bird: string;
  ground: string;
  treePine: string;
  treeRound: string;
  trunk: string;
}

export function readScenePalette(): ScenePalette {
  // Возвращает актуальные цвета сцены для текущей темы
  const styles = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string): string =>
    styles.getPropertyValue(name).trim() || fallback;

  return {
    sky: read('--c-scene-sky', '#fafafa'),
    line: read('--c-scene-line', '#e5e7eb'),
    linePassed: read('--c-scene-line-passed', '#0a0a0a'),
    label: read('--c-scene-label', '#9ca3af'),
    cloud: read('--c-scene-cloud', '#e5e7eb'),
    bird: read('--c-scene-bird', '#6b7280'),
    ground: read('--c-scene-ground', '#eef2ee'),
    treePine: read('--c-scene-tree-pine', '#9cb89c'),
    treeRound: read('--c-scene-tree-round', '#aac4a6'),
    trunk: read('--c-scene-trunk', '#8d6e4a'),
  };
}
