// Каталог достижений и шкала рангов по чистой прибыли

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  letter: string;
}

export interface RankDef {
  id: string;
  title: string;
  minProfit: number;
}

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  { id: 'first-flight', title: 'Первый полёт', description: 'Сыграть первый раунд', letter: 'П' },
  { id: 'first-win', title: 'Первая добыча', description: 'Впервые забрать выигрыш', letter: 'Д' },
  { id: 'high-five', title: 'Пятикратный', description: 'Забрать выигрыш на x5 и выше', letter: 'В' },
  { id: 'sky-ten', title: 'Небожитель', description: 'Забрать выигрыш на x10 и выше', letter: 'Н' },
  { id: 'booster-hit', title: 'Усиленный', description: 'Активировать бустер в полёте', letter: 'У' },
  { id: 'veteran-10', title: 'Ветеран', description: 'Сыграть 10 раундов', letter: 'Т' },
  { id: 'veteran-50', title: 'Старожил', description: 'Сыграть 50 раундов', letter: 'С' },
  { id: 'collector', title: 'Коллекционер', description: 'Собрать все фрагменты', letter: 'К' },
  { id: 'high-roller', title: 'Крупная ставка', description: 'Поставить 250 бонусов за раунд', letter: 'Р' },
  { id: 'in-profit', title: 'В плюсе', description: 'Выйти в плюс по итогам всех игр', letter: 'Э' },
];

export const RANKS: readonly RankDef[] = [
  { id: 'recruit', title: 'Новобранец', minProfit: -Infinity },
  { id: 'pilot', title: 'Пилот', minProfit: 0 },
  { id: 'navigator', title: 'Штурман', minProfit: 250 },
  { id: 'captain', title: 'Капитан', minProfit: 750 },
  { id: 'ace', title: 'Ас', minProfit: 2000 },
  { id: 'legend', title: 'Легенда', minProfit: 5000 },
];
