// Конфигурация и хелперы для элементов коллекции (пазлов)

export const PUZZLE_TOTAL_DEFAULT = 9;
export const PUZZLE_MAX_PIECES = 25;

export interface PuzzlePieceMeta {
  id: string;
  number: number;
  label: string;
  src: string;
}

/**
 * Извлекает порядковый номер фрагмента (1..25) из id, имени или индекса
 */
export function parsePieceNumber(pieceIdOrIndex: string | number | undefined | null): number {
  if (pieceIdOrIndex === undefined || pieceIdOrIndex === null) return 0;

  if (typeof pieceIdOrIndex === 'number') {
    if (pieceIdOrIndex >= 1 && pieceIdOrIndex <= PUZZLE_MAX_PIECES) return pieceIdOrIndex;
    if (pieceIdOrIndex >= 0 && pieceIdOrIndex < PUZZLE_MAX_PIECES) return pieceIdOrIndex + 1;
    return 0;
  }

  const str = String(pieceIdOrIndex).trim().toLowerCase();
  if (str === 'none' || str === 'completed' || str === '') return 0;

  // Регулярка для piece_3, piece-3, piece3, piece_03
  const match = str.match(/(?:piece[_-]?)(\d+)/i);
  if (match && match[1]) {
    const parsed = parseInt(match[1], 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= PUZZLE_MAX_PIECES) {
      return parsed;
    }
  }

  // Просто число в строке: "3"
  const directNum = parseInt(str, 10);
  if (!isNaN(directNum) && directNum >= 1 && directNum <= PUZZLE_MAX_PIECES) {
    return directNum;
  }

  return 0;
}

/**
 * Возвращает URL иконки фрагмента пазла
 */
export function getPuzzlePieceSrc(pieceIdOrIndex: string | number | undefined | null): string {
  const num = parsePieceNumber(pieceIdOrIndex);
  const safeNum = num >= 1 && num <= PUZZLE_MAX_PIECES ? num : 1;
  return `/images/puzzles/piece_${safeNum}.png`;
}

/**
 * Возвращает человекочитаемое название фрагмента
 */
export function getPuzzlePieceLabel(pieceIdOrIndex: string | number | undefined | null): string {
  const num = parsePieceNumber(pieceIdOrIndex);
  if (num <= 0) return 'Без фрагмента';
  return `Фрагмент ${num}`;
}

/**
 * Проверяет, собран ли данный фрагмент пользователем
 */
export function isPieceCollected(
  collectedList: readonly string[] | undefined | null,
  pieceIdOrIndex: string | number,
): boolean {
  if (!collectedList || collectedList.length === 0) return false;

  const num = parsePieceNumber(pieceIdOrIndex);
  if (num <= 0) return false;

  const targetId = `piece_${num}`;
  const hyphenId = `piece-${num}`;
  const numStr = String(num);

  return collectedList.some((item) => {
    if (!item) return false;
    const clean = String(item).trim().toLowerCase();
    if (clean === 'none' || clean === 'completed') return false;
    if (clean === targetId || clean === hyphenId || clean === numStr) return true;
    const parsed = parsePieceNumber(clean);
    return parsed === num;
  });
}
