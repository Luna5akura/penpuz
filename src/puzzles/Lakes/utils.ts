import type { LakesPuzzleData, NurikabeClue } from '../types';
import type { ShadingCellState, ShadingValidationResult } from '../shared/ShadingBoard';
import {
  collectBooleanComponents,
  decodeCustomPayload,
  getCellKey,
  isPositiveGridSize,
  parsePuzzLinkParts,
} from '../gridUtils';

interface LakesPayload {
  clues?: unknown;
}

function readNumber16(encoded: string, index: number): [number, number] {
  if (index >= encoded.length) return [-1, 0];

  const char = encoded[index];
  if ((char >= '0' && char <= '9') || (char >= 'a' && char <= 'f')) {
    return [parseInt(char, 16), 1];
  }
  if (char === '-') {
    return index + 3 <= encoded.length ? [parseInt(encoded.slice(index + 1, index + 3), 16), 3] : [-1, 0];
  }
  if (char === '+') {
    return index + 4 <= encoded.length ? [parseInt(encoded.slice(index + 1, index + 4), 16), 4] : [-1, 0];
  }
  if (char === '=') {
    return index + 4 <= encoded.length ? [parseInt(encoded.slice(index + 1, index + 4), 16) + 4096, 4] : [-1, 0];
  }
  if (char === '%' || char === '@') {
    return index + 4 <= encoded.length ? [parseInt(encoded.slice(index + 1, index + 4), 16) + 8192, 4] : [-1, 0];
  }
  if (char === '*') {
    return index + 5 <= encoded.length ? [parseInt(encoded.slice(index + 1, index + 5), 16) + 12240, 5] : [-1, 0];
  }
  if (char === '$') {
    return index + 6 <= encoded.length ? [parseInt(encoded.slice(index + 1, index + 6), 16) + 77776, 6] : [-1, 0];
  }
  if (char === '.') {
    return [-2, 1];
  }

  return [-1, 0];
}

function parseLakesClues(candidate: unknown): NurikabeClue[] | null {
  if (!Array.isArray(candidate)) return null;

  const clues: NurikabeClue[] = [];
  for (const item of candidate) {
    if (Array.isArray(item)) {
      const [row, col, value] = item;
      if (!Number.isInteger(row) || !Number.isInteger(col)) return null;
      if (value !== '?' && (!Number.isInteger(value) || value < 0)) return null;
      clues.push({ row, col, value });
      continue;
    }

    if (!item || typeof item !== 'object') return null;
    const clue = item as Partial<NurikabeClue>;
    if (!Number.isInteger(clue.row) || !Number.isInteger(clue.col)) return null;
    if (clue.value !== '?' && (!Number.isInteger(clue.value) || clue.value < 0)) return null;
    clues.push({ row: clue.row, col: clue.col, value: clue.value });
  }

  return clues;
}

function parseCompactLakesClues(encoded: string, width: number, height: number): NurikabeClue[] | null {
  const clues: NurikabeClue[] = [];
  const totalCells = width * height;
  let cellIndex = 0;
  let stringIndex = 0;

  while (stringIndex < encoded.length && cellIndex < totalCells) {
    const char = encoded[stringIndex];
    const [value, consumed] = readNumber16(encoded, stringIndex);

    if (value !== -1) {
      clues.push({
        row: Math.floor(cellIndex / width),
        col: cellIndex % width,
        value: value === -2 ? '?' : value,
      });
      cellIndex++;
      stringIndex += consumed;
      continue;
    }

    if (char >= 'g' && char <= 'z') {
      cellIndex += parseInt(char, 36) - 15;
      stringIndex++;
      continue;
    }

    return null;
  }

  return cellIndex === totalCells && stringIndex === encoded.length ? clues : null;
}

export function parseLakesLink(link: string): LakesPuzzleData | null {
  try {
    const parts = parsePuzzLinkParts(link);
    if (parts[0] !== 'lakes' || parts.length < 4) return null;

    const width = Number(parts[1]);
    const height = Number(parts[2]);
    if (!isPositiveGridSize(width, height)) return null;

    const encodedData = parts.slice(3).join('/');
    const payload = decodeCustomPayload<LakesPayload>(encodedData);
    if (!payload) {
      const clues = parseCompactLakesClues(encodedData, width, height);
      return clues ? { type: 'lakes', width, height, clues } : null;
    }

    const clues = parseLakesClues(payload.clues);
    if (!clues) return null;
    if (clues.some((clue) => clue.row < 0 || clue.row >= height || clue.col < 0 || clue.col >= width)) {
      return null;
    }

    return { type: 'lakes', width, height, clues };
  } catch {
    return null;
  }
}

function markCells(badCells: Set<string>, cells: Array<{ row: number; col: number }>) {
  cells.forEach((cell) => badCells.add(getCellKey(cell.row, cell.col)));
}

export function validateLakes(grid: ShadingCellState[][], puzzle: LakesPuzzleData): ShadingValidationResult {
  const { clues } = puzzle;
  const clueMap = new Map(clues.map((clue) => [getCellKey(clue.row, clue.col), clue]));
  const shaded = grid.map((row) => row.map((cell) => cell === 1));
  const badCells = new Set<string>();
  let message: string | undefined;
  const setMessage = (nextMessage: string) => {
    if (!message) message = nextMessage;
  };

  for (const clue of clues) {
    if (shaded[clue.row][clue.col]) {
      badCells.add(getCellKey(clue.row, clue.col));
      setMessage('线索格不能涂黑');
    }
  }

  const whiteComponents = collectBooleanComponents(shaded, false);
  for (const component of whiteComponents) {
    const componentClues = component
      .map((cell) => clueMap.get(getCellKey(cell.row, cell.col)))
      .filter((clue): clue is NurikabeClue => !!clue);

    if (componentClues.length !== 1) {
      markCells(badCells, component);
      setMessage('每个湖区必须恰好包含一个线索');
      continue;
    }

    const clue = componentClues[0];
    if (clue.value !== '?' && component.length !== clue.value) {
      markCells(badCells, component);
      setMessage('线索数字必须等于所在湖区的格数');
    }
  }

  return {
    valid: badCells.size === 0,
    message,
    badCells: Array.from(badCells).map((key) => {
      const [row, col] = key.split(',').map(Number);
      return { row, col };
    }),
  };
}
