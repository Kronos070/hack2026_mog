// Описания шаров для экрана выбора

import { LEVELS_BY_THEME, type Theme } from '@/shared/api/contract';

export interface BalloonOption {
  theme: Theme;
  title: string;
  colorName: string;
  dotClass: string;
  levels: number;
  image: string;
  lines: readonly string[];
}

export const BALLOON_OPTIONS: readonly BalloonOption[] = [
  {
    theme: 'green',
    title: 'Зелёный шар',
    colorName: 'Зелёный',
    dotClass: 'bg-linear-to-b from-[#7ddc3a] to-[#3f9e12]',
    levels: LEVELS_BY_THEME.green,
    image: '/images/choose/balloon-green.webp',
    lines: [
      'Поднимайся по уровням и забирай бонусы.',
      'Меньше уровней — выше шанс дойти до конца и забрать выигрыш.',
    ],
  },
  {
    theme: 'red',
    title: 'Красный шар',
    colorName: 'Красный',
    dotClass: 'bg-linear-to-b from-[#ff6b6b] to-[#c81e1e]',
    levels: LEVELS_BY_THEME.red,
    image: '/images/choose/balloon-red.webp',
    lines: [
      'Поднимайся по уровням и забирай бонусы.',
      'Больше уровней — выше максимальный множитель и крупнее выигрыш.',
    ],
  },
];
