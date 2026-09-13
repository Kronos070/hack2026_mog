// Коллекция фрагментов пазла: открытые фрагменты подсвечены, несобранные показаны иконками-силуэтами
import { useMemo } from 'react';
import { cn } from '@/shared/lib/cn';
import {
  getPuzzlePieceLabel,
  getPuzzlePieceSrc,
  isPieceCollected,
  PUZZLE_TOTAL_DEFAULT,
} from '@/shared/config/puzzles';

interface PuzzleCollectionProps {
  puzzle: string[];
  total: number;
}

export function PuzzleCollection({ puzzle, total }: PuzzleCollectionProps) {
  // Количество элементов в коллекции (по умолчанию 9 из контракта бэкенда)
  const totalCount = total > 0 ? total : PUZZLE_TOTAL_DEFAULT;

  // Формируем список всех фрагментов коллекции
  const pieces = useMemo(() => {
    return Array.from({ length: totalCount }, (_, i) => {
      const num = i + 1;
      const id = `piece_${num}`;
      const collected = isPieceCollected(puzzle, id);
      const src = getPuzzlePieceSrc(num);
      const label = getPuzzlePieceLabel(num);
      return { id, num, collected, src, label };
    });
  }, [puzzle, totalCount]);

  const collectedCount = pieces.filter((p) => p.collected).length;
  const isComplete = collectedCount >= totalCount && totalCount > 0;
  const progressPercent = Math.min(100, Math.round((collectedCount / totalCount) * 100));

  // Подбираем сетку в зависимости от количества кусочков
  const gridClass =
    totalCount === 9
      ? 'grid-cols-3'
      : totalCount === 25
        ? 'grid-cols-5'
        : totalCount <= 4
          ? 'grid-cols-2 sm:grid-cols-4'
          : totalCount <= 6
            ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
            : 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-5';

  return (
    <section className="glass-tile rounded-2xl p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-glass-line/30 pb-3">
        <div>
          <h2 className="text-base font-bold text-on-glass">
            Коллекция пазлов
          </h2>
          <p className="text-xs text-on-glass-dim">
            Собрано {collectedCount} из {totalCount} ({progressPercent}%)
          </p>
        </div>
        {isComplete && (
          <span className="rounded-full bg-pick/20 px-3 py-1 text-xs font-bold text-pick border border-pick/40 shadow-sm animate-pulse">
            ★ Вся коллекция собрана!
          </span>
        )}
      </div>

      {/* Прогресс-бар */}
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-sky-deep/50 border border-glass-line/20">
        <div
          className="h-full bg-linear-to-r from-accent to-pick transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Сетка элементов коллекции */}
      <div className={cn('mt-4 grid gap-2.5 sm:gap-3.5', gridClass)}>
        {pieces.map((piece) => (
          <div
            key={piece.id}
            title={piece.collected ? `${piece.label} (собран)` : `${piece.label} (ещё не найден)`}
            className={cn(
              'group relative flex flex-col items-center justify-between rounded-xl border-2 p-2.5 sm:p-3 transition-all duration-200',
              piece.collected
                ? 'border-accent/70 bg-glass-strong/60 shadow-[0_4px_16px_rgba(245,179,36,0.18)] hover:scale-[1.03] hover:border-accent hover:shadow-[0_6px_22px_rgba(245,179,36,0.28)]'
                : 'border-dashed border-glass-line/35 bg-sky-deep/20 hover:border-glass-line/50',
            )}
          >
            {/* Контейнер иконки */}
            <div className="relative aspect-square w-full max-w-[110px] flex items-center justify-center p-1">
              <img
                src={piece.src}
                alt={piece.label}
                draggable={false}
                className={cn(
                  'h-full w-full object-contain select-none transition-transform duration-200',
                  piece.collected
                    ? 'drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] group-hover:scale-105'
                    : 'grayscale opacity-30 brightness-75 contrast-125',
                )}
              />

              {/* Бейдж замка для несобранных фрагментов */}
              {!piece.collected && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="rounded-full bg-sky-deep/85 p-1.5 backdrop-blur-xs border border-glass-line/30 shadow-md">
                    <svg
                      className="h-3.5 w-3.5 text-on-glass-dim/80"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                </div>
              )}
            </div>

            {/* Подпись фрагмента */}
            <div className="mt-1.5 flex items-center gap-1 text-center">
              <span
                className={cn(
                  'text-xs font-semibold tracking-wide truncate',
                  piece.collected
                    ? 'text-on-glass font-bold drop-shadow-xs'
                    : 'text-on-glass-dim/50',
                )}
              >
                {piece.label}
              </span>
              {piece.collected && (
                <span className="text-[10px] text-pick font-bold" aria-hidden="true">
                  ✓
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
