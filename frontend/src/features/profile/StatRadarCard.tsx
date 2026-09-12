// Полигон характеристик игрока (RADAR-1 / Stats Polygon в стиле Dota 2)
// 6 осей характеристик на шкале 0.0–10.0 по скользящему окну последних 30 игр

import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { StatRadar } from '@/shared/api/contract';

interface StatRadarCardProps {
  playerId?: string | undefined;
}

const AXES: { key: keyof Pick<StatRadar, 'patience' | 'boosters' | 'collector' | 'generosity' | 'winRate' | 'risk'>; label: string; description: string }[] = [
  { key: 'patience', label: 'Выдержка', description: 'Средний множитель забора в победных раундах' },
  { key: 'boosters', label: 'Бустеры', description: 'Выбор и активация бустеров x2–x4' },
  { key: 'collector', label: 'Коллекционер', description: 'Сбор фрагментов пазла и недавний дроп' },
  { key: 'generosity', label: 'Щедрость', description: 'Средний размер ставок игрока' },
  { key: 'winRate', label: 'Винрейт', description: 'Доля раундов без краха' },
  { key: 'risk', label: 'Азарт / Риск', description: 'Красная тема и забор вблизи краха' },
];

export function StatRadarCard({ playerId }: StatRadarCardProps) {
  const { data: radar, isLoading } = useQuery({
    queryKey: ['radar-stats', playerId ?? 'me'],
    queryFn: () => api.getRadarStats(playerId),
  });

  if (isLoading || !radar) {
    return (
      <div className="rounded-xl border border-line bg-card/60 p-5 backdrop-blur-sm">
        <h3 className="text-base font-semibold">Полигон характеристик</h3>
        <p className="mt-2 text-sm text-muted">Загрузка полигона игрока…</p>
      </div>
    );
  }

  const cx = 175;
  const cy = 150;
  const maxRadius = 100;
  const levels = [0.25, 0.5, 0.75, 1.0];

  // Вычисление координат регулярного шестиугольника для уровней сетки
  const getPolygonPoints = (scale: number) => {
    return AXES.map((_, i) => {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 6;
      const x = cx + Math.cos(angle) * maxRadius * scale;
      const y = cy + Math.sin(angle) * maxRadius * scale;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  };

  // Координаты фактических показателей игрока
  const playerPoints = AXES.map((axis, i) => {
    const rawValue = radar[axis.key] ?? 0;
    const clamped = Math.max(0, Math.min(10, rawValue));
    const scale = clamped / 10;
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 6;
    const x = cx + Math.cos(angle) * maxRadius * scale;
    const y = cy + Math.sin(angle) * maxRadius * scale;
    return { x, y, value: rawValue, label: axis.label };
  });

  const playerPointsString = playerPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <section className="rounded-xl border border-line bg-card/60 p-5 backdrop-blur-sm shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
        <div>
          <h2 className="text-base font-bold text-ink">Полигон характеристик</h2>
          <p className="text-xs text-muted">Шестиугольник характеристик по последним 30 играм (0.0–10.0)</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted">
          <span>Анализ: <b className="text-ink">{radar.gamesAnalyzed}</b> из 30</span>
          <span>Пересчёт через: <b className="text-ink">{radar.nextRecalcIn}</b> игр</span>
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center justify-center lg:flex-row lg:gap-8">
        {/* SVG Полигон */}
        <div className="relative flex justify-center">
          <svg viewBox="0 0 350 300" className="h-64 w-72 sm:h-72 sm:w-80">
            <defs>
              <linearGradient id="radarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.25" />
              </linearGradient>
              <radialGradient id="dotGrad">
                <stop offset="0%" stopColor="#fde047" />
                <stop offset="100%" stopColor="#d97706" />
              </radialGradient>
            </defs>

            {/* Концентрические шестиугольники сетки */}
            {levels.map((lvl) => (
              <polygon
                key={lvl}
                points={getPolygonPoints(lvl)}
                fill="none"
                stroke="currentColor"
                strokeOpacity={lvl === 1.0 ? 0.25 : 0.12}
                strokeWidth={lvl === 1.0 ? 1.5 : 1}
                className="text-line"
              />
            ))}

            {/* Осевые лучи */}
            {AXES.map((_, i) => {
              const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 6;
              const x2 = cx + Math.cos(angle) * maxRadius;
              const y2 = cy + Math.sin(angle) * maxRadius;
              return (
                <line
                  key={i}
                  x1={cx}
                  y1={cy}
                  x2={x2}
                  y2={y2}
                  stroke="currentColor"
                  strokeOpacity={0.15}
                  strokeWidth={1}
                  className="text-line"
                />
              );
            })}

            {/* Заполненный полигон игрока */}
            <polygon
              points={playerPointsString}
              fill="url(#radarGrad)"
              stroke="#f59e0b"
              strokeWidth={2.5}
              strokeLinejoin="round"
            />

            {/* Вершины и метки */}
            {playerPoints.map((pt, i) => {
              const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 6;
              const labelRadius = maxRadius + 24;
              const lx = cx + Math.cos(angle) * labelRadius;
              const ly = cy + Math.sin(angle) * labelRadius;

              return (
                <g key={i}>
                  {/* Точка на полигоне */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={4}
                    fill="url(#dotGrad)"
                    stroke="#ffffff"
                    strokeWidth={1.5}
                  />

                  {/* Текстовая подпись оси */}
                  <text
                    x={lx}
                    y={ly}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="fill-ink text-[11px] font-semibold"
                  >
                    {pt.label}
                  </text>
                  <text
                    x={lx}
                    y={ly + 12}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="fill-amber-500 font-bold text-[10px]"
                  >
                    {pt.value.toFixed(1)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Сетка показателей с пояснениями */}
        <div className="mt-4 grid w-full max-w-sm grid-cols-2 gap-2 text-xs sm:grid-cols-3 lg:mt-0">
          {AXES.map((axis) => {
            const val = radar[axis.key] ?? 0;
            return (
              <div key={axis.key} className="rounded-lg border border-line bg-muted/5 p-2.5">
                <div className="flex items-center justify-between font-medium text-ink">
                  <span>{axis.label}</span>
                  <span className="font-bold text-amber-500">{val.toFixed(1)}</span>
                </div>
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-sky-500"
                    style={{ width: `${Math.min(100, (val / 10) * 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-[10px] text-muted line-clamp-1" title={axis.description}>
                  {axis.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
