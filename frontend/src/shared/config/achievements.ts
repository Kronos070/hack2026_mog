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
  { id: 'first_flight', title: 'Первый полет', description: 'Сыграть первый раунд в игре', letter: 'П' },
  { id: 'lucky_start', title: 'Удачный старт', description: 'Выиграть свой первый раунд', letter: 'У' },
  { id: 'high_flight_5x', title: 'Высокий полет (x5+)', description: 'Забрать выигрыш на множителе x5 или выше', letter: 'В' },
  { id: 'stratosphere_10x', title: 'Стратосфера (x10+)', description: 'Забрать выигрыш на множителе x10 или выше', letter: 'С' },
  { id: 'risky_captain', title: 'Рисковый капитан', description: 'Забрать выигрыш на множителе x20 или выше', letter: 'Р' },
  { id: 'win_streak_3', title: 'Серия побед', description: 'Одержать победу в 3 раундах подряд', letter: 'П' },
  { id: 'booster_master', title: 'Мастер бустеров', description: 'Активировать бустер во время полета', letter: 'М' },
  { id: 'puzzle_collector', title: 'Коллекционер пазлов', description: 'Собрать все 9 фрагментов пазла', letter: 'К' },
  { id: 'high_roller', title: 'Щедрый игрок', description: 'Сделать ставку от 250 бонусов за раунд', letter: 'Щ' },
  { id: 'sky_legend', title: 'Легенда небес', description: 'Достичь наивысшего ранга «Легенда небес»', letter: 'Л' },
];

export const RANKS: readonly RankDef[] = [
  { id: 'recruit', title: 'Новобранец', minProfit: -Infinity },
  { id: 'pilot', title: 'Пилот', minProfit: 0 },
  { id: 'navigator', title: 'Штурман', minProfit: 250 },
  { id: 'captain', title: 'Капитан', minProfit: 750 },
  { id: 'ace', title: 'Ас', minProfit: 2000 },
  { id: 'legend', title: 'Легенда', minProfit: 5000 },
];

const ACHIEVEMENT_ICONS_MAP: Record<string, string> = {
  // Backend IDs (10 achievements)
  first_flight: '/images/achievements/first_flight.png',
  lucky_start: '/images/achievements/lucky_start.png',
  high_flight_5x: '/images/achievements/high_flight_5x.png',
  stratosphere_10x: '/images/achievements/stratosphere_10x.png',
  risky_captain: '/images/achievements/risky_captain.png',
  win_streak_3: '/images/achievements/win_streak_3.png',
  booster_master: '/images/achievements/booster_master.png',
  puzzle_collector: '/images/achievements/puzzle_collector.png',
  high_roller: '/images/achievements/high_roller.png',
  sky_legend: '/images/achievements/sky_legend.png',

  // Hyphen aliases & legacy mock aliases
  'first-flight': '/images/achievements/first_flight.png',
  'first-win': '/images/achievements/lucky_start.png',
  'lucky-start': '/images/achievements/lucky_start.png',
  'high-five': '/images/achievements/high_flight_5x.png',
  'high-flight-5x': '/images/achievements/high_flight_5x.png',
  'sky-ten': '/images/achievements/stratosphere_10x.png',
  'stratosphere-10x': '/images/achievements/stratosphere_10x.png',
  'risky-captain': '/images/achievements/risky_captain.png',
  'win-streak-3': '/images/achievements/win_streak_3.png',
  'booster-hit': '/images/achievements/booster_master.png',
  'booster-master': '/images/achievements/booster_master.png',
  collector: '/images/achievements/puzzle_collector.png',
  'puzzle-collector': '/images/achievements/puzzle_collector.png',
  'veteran-10': '/images/achievements/win_streak_3.png',
  'veteran-50': '/images/achievements/sky_legend.png',
  'in-profit': '/images/achievements/high_roller.png',
  'high-roller': '/images/achievements/high_roller.png',
  'sky-legend': '/images/achievements/sky_legend.png',
};

/**
 * Возвращает URL иконки достижения из набора achivements.svg
 */
export function getAchievementIcon(id: string | undefined | null): string {
  if (!id) return '/images/achievements/first_flight.png';
  const clean = id.trim();
  if (ACHIEVEMENT_ICONS_MAP[clean]) {
    return ACHIEVEMENT_ICONS_MAP[clean];
  }
  const normalized = clean.replace(/-/g, '_');
  if (ACHIEVEMENT_ICONS_MAP[normalized]) {
    return ACHIEVEMENT_ICONS_MAP[normalized];
  }
  return '/images/achievements/first_flight.png';
}
