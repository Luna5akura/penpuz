import type { CavePuzzleData } from '../types';
import type { ShadingCellState, ShadingValidationResult } from '../shared/ShadingBoard';
import {
  collectBooleanComponents,
  getCellKey,
  isPositiveGridSize,
  parsePuzzLinkParts,
} from '../gridUtils';

function readNumber16(encoded: string, index: number): { value: number | null; consumed: number } | null {
  const char = encoded[index];
  if (!char) return null;

  if (/^[0-9a-f]$/u.test(char)) {
    return { value: parseInt(char, 16), consumed: 1 };
  }

  const prefixedLengths: Record<string, number> = {
    '-': 2,
    '+': 3,
    '=': 3,
    '%': 3,
    '@': 3,
    '*': 4,
    '$': 5,
  };
  const digitCount = prefixedLengths[char];
  if (digitCount !== undefined) {
    const digits = encoded.slice(index + 1, index + 1 + digitCount);
    if (digits.length !== digitCount || !/^[0-9a-f]+$/u.test(digits)) return null;

    let value = parseInt(digits, 16);
    if (char === '=') value += 4096;
    else if (char === '%' || char === '@') value += 8192;
    else if (char === '*') value += 12240;
    else if (char === '$') value += 77776;
    return { value, consumed: digitCount + 1 };
  }

  return null;
}

function parseCaveClues(encoded: string, width: number, height: number) {
  const clues = Array.from({ length: height }, () => Array<number | null>(width).fill(null));
  const cellCount = width * height;
  let cellIndex = 0;
  let stringIndex = 0;

  while (stringIndex < encoded.length && cellIndex < cellCount) {
    const char = encoded[stringIndex];
    if (char >= 'g' && char <= 'z') {
      cellIndex += parseInt(char, 36) - 15;
      stringIndex++;
      continue;
    }

    const decoded = readNumber16(encoded, stringIndex);
    if (!decoded) return null;
    if (decoded.value !== null) {
      clues[Math.floor(cellIndex / width)][cellIndex % width] = decoded.value;
    }
    cellIndex++;
    stringIndex += decoded.consumed;
  }

  return cellIndex === cellCount && stringIndex === encoded.length ? clues : null;
}

/** Parse PuzzLink's native `cave/w/h/number16` representation. */
export function parseCaveLink(link: string): CavePuzzleData | null {
  try {
    const parts = parsePuzzLinkParts(link);
    if (parts[0]?.toLowerCase() !== 'cave' || parts.length < 4) return null;

    const width = Number(parts[1]);
    const height = Number(parts[2]);
    if (!isPositiveGridSize(width, height)) return null;

    const encoded = parts[3] ?? '';
    if (!encoded) return null;
    const clues = parseCaveClues(encoded, width, height);
    return clues ? { type: 'cave', width, height, clues } : null;
  } catch {
    return null;
  }
}

function addCells(badCells: Set<string>, cells: Array<{ row: number; col: number }>) {
  cells.forEach(({ row, col }) => badCells.add(getCellKey(row, col)));
}

function getVisibleCaveCount(shaded: boolean[][], row: number, col: number) {
  const height = shaded.length;
  const width = shaded[0]?.length ?? 0;
  let visible = 1;

  for (const [rowOffset, colOffset] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) {
    let nextRow = row + rowOffset;
    let nextCol = col + colOffset;
    while (
      nextRow >= 0 && nextRow < height &&
      nextCol >= 0 && nextCol < width &&
      !shaded[nextRow][nextCol]
    ) {
      visible++;
      nextRow += rowOffset;
      nextCol += colOffset;
    }
  }

  return visible;
}

export function validateCave(
  grid: ShadingCellState[][],
  puzzle: CavePuzzleData
): ShadingValidationResult {
  const shaded = grid.map((row) => row.map((cell) => cell === 1));
  const badCells = new Set<string>();
  let message: string | undefined;
  const setMessage = (nextMessage: string) => {
    if (!message) message = nextMessage;
  };

  for (let row = 0; row < puzzle.height; row++) {
    for (let col = 0; col < puzzle.width; col++) {
      const clue = puzzle.clues[row][col];
      if (clue === null) continue;

      if (shaded[row][col]) {
        badCells.add(getCellKey(row, col));
        setMessage('数字格必须属于洞穴');
        continue;
      }

      if (getVisibleCaveCount(shaded, row, col) !== clue) {
        badCells.add(getCellKey(row, col));
        setMessage('数字与可见洞穴格总数不符');
      }
    }
  }

  const whiteComponents = collectBooleanComponents(shaded, false);
  if (whiteComponents.length !== 1) {
    whiteComponents.forEach((component) => addCells(badCells, component));
    setMessage('所有洞穴格必须正交连通');
  }

  for (const component of collectBooleanComponents(shaded, true)) {
    const reachesEdge = component.some(({ row, col }) =>
      row === 0 || col === 0 || row === puzzle.height - 1 || col === puzzle.width - 1
    );
    if (!reachesEdge) {
      addCells(badCells, component);
      setMessage('洞穴外不能有被围住的涂黑区域');
    }
  }

  return {
    valid: !message && badCells.size === 0,
    message,
    badCells: Array.from(badCells, (key) => {
      const [row, col] = key.split(',').map(Number);
      return { row, col };
    }),
  };
}
