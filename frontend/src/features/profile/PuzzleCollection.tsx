// Коллекция фрагментов: собранные открыты, остальные скрыты
import { PUZZLE_PIECES } from '@/shared/config/default-config';
import { cn } from '@/shared/lib/cn';

interface PuzzleCollectionProps {
  puzzle: string[];
  total: number;
}

export function PuzzleCollection({ puzzle, total }: PuzzleCollectionProps) {
  // Показывает прогресс сбора коллекции
  return (
    <section>
      <h2 className="text-sm font-semibold text-on-glass-dim">
        Коллекция · {puzzle.length} из {total}
      </h2>
      <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {PUZZLE_PIECES.map((piece) => {
          const collected = puzzle.includes(piece);
          return (
            <div
              key={piece}
              className={cn(
                'rounded-lg border-2 p-4 text-center text-base',
                collected ? 'border-glass-line font-medium' : 'border-dashed border-glass-line/40 text-on-glass-dim/60',
              )}
            >
              {collected ? piece : '?'}
            </div>
          );
        })}
      </div>
      {puzzle.length === total && (
        <p className="mt-3 text-sm font-medium text-green-theme">Коллекция собрана полностью!</p>
      )}
    </section>
  );
}
