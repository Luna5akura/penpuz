import type { ShapeMinesweeperPuzzleData, ShapeMinesweeperShape } from '../types';
import type { ShadingCellState, ShadingValidationResult } from '../shared/ShadingBoard';
import {
  collectBooleanComponents,
  decodeCustomPayload,
  getCellKey,
  isPositiveGridSize,
  parsePuzzLinkParts,
} from '../gridUtils';

interface ShapePayload {
  clues?: unknown;
  shapes?: unknown;
}

function normalizeShapeCells(cells: boolean[][]): boolean[][] {
  const occupied = cells.flatMap((row, rowIndex) => row.flatMap((cell, colIndex) => cell ? [{ row: rowIndex, col: colIndex }] : []));
  if (occupied.length === 0) return [];
  const minRow = Math.min(...occupied.map((cell) => cell.row));
  const minCol = Math.min(...occupied.map((cell) => cell.col));
  const maxRow = Math.max(...occupied.map((cell) => cell.row));
  const maxCol = Math.max(...occupied.map((cell) => cell.col));
  return Array.from({ length: maxRow - minRow + 1 }, (_, row) =>
    Array.from({ length: maxCol - minCol + 1 }, (_, col) => cells[minRow + row]?.[minCol + col] === true)
  );
}

function rotate(cells: boolean[][]): boolean[][] {
  const height = cells.length;
  const width = cells[0]?.length ?? 0;
  return Array.from({ length: width }, (_, row) =>
    Array.from({ length: height }, (_, col) => cells[height - 1 - col]?.[row] === true)
  );
}

function mirror(cells: boolean[][]): boolean[][] {
  return cells.map((row) => [...row].reverse());
}

function shapeKey(cells: boolean[][]) {
  return normalizeShapeCells(cells).map((row) => row.map((cell) => cell ? '1' : '0').join('')).join('/');
}

/** Canonical key under all rotations and reflections. */
export function getShapeCanonicalKey(cells: boolean[][]) {
  let current = normalizeShapeCells(cells);
  const keys: string[] = [];
  for (let reflection = 0; reflection < 2; reflection++) {
    let rotated = reflection === 0 ? current : mirror(current);
    for (let turn = 0; turn < 4; turn++) {
      keys.push(shapeKey(rotated));
      rotated = rotate(rotated);
    }
    current = rotate(current);
  }
  return [...new Set(keys)].sort()[0] ?? '';
}

function parseShapeMask(text: string): boolean[][] | null {
  const rows = text.split(/[;,]/u).map((row) => row.trim()).filter(Boolean);
  if (rows.length === 0) return null;
  const width = rows[0].length;
  if (width === 0 || rows.some((row) => row.length !== width || !/^[01]+$/u.test(row))) return null;
  const cells = rows.map((row) => [...row].map((cell) => cell === '1'));
  return cells.some((row) => row.some(Boolean)) ? normalizeShapeCells(cells) : null;
}

function parseCompactShapes(encoded: string): ShapeMinesweeperShape[] | null {
  const shapes: ShapeMinesweeperShape[] = [];
  for (const token of encoded.split('|').map((part) => part.trim()).filter(Boolean)) {
    const separator = token.indexOf(':');
    if (separator <= 0) return null;
    const label = token.slice(0, separator).trim();
    const cells = parseShapeMask(token.slice(separator + 1));
    if (!label || !cells) return null;
    shapes.push({ label, cells });
  }
  return shapes.length > 0 ? shapes : null;
}

function parseClueRows(encoded: string, width: number, height: number) {
  const rows = encoded.split(/[;/]/u);
  if (rows.length !== height) return null;
  const clues = rows.map((row) => {
    if (row.length !== width) return null;
    return [...row].map((char) => char === '.' ? null : /^[0-8]$/u.test(char) ? Number(char) : Number.NaN);
  });
  if (clues.some((row) => !row || row.some((value) => Number.isNaN(value)))) return null;
  return clues as (number | null)[][];
}

function parseCluesPayload(value: unknown, width: number, height: number) {
  if (typeof value === 'string') return parseClueRows(value, width, height);
  if (!Array.isArray(value) || value.length !== height) return null;
  if (!value.every((row) => Array.isArray(row) && row.length === width)) return null;
  const clues = value.map((row) => (row as unknown[]).map((cell) =>
    cell === null || cell === '.' ? null : typeof cell === 'number' && Number.isInteger(cell) && cell >= 0 && cell <= 8 ? cell : Number.NaN
  ));
  return clues.some((row) => row.some((value) => Number.isNaN(value))) ? null : clues;
}

function parseShapesPayload(value: unknown): ShapeMinesweeperShape[] | null {
  if (typeof value === 'string') return parseCompactShapes(value);
  if (!Array.isArray(value)) return null;
  const shapes: ShapeMinesweeperShape[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') return null;
    const record = item as { label?: unknown; cells?: unknown };
    if (typeof record.label !== 'string' || !Array.isArray(record.cells)) return null;
    const rows = record.cells;
    if (rows.length === 0 || !rows.every((row) => Array.isArray(row))) return null;
    const width = (rows[0] as unknown[]).length;
    if (width === 0 || !rows.every((row) => (row as unknown[]).length === width && (row as unknown[]).every((cell) => typeof cell === 'boolean'))) return null;
    const cells = normalizeShapeCells(rows as boolean[][]);
    if (cells.length === 0) return null;
    shapes.push({ label: record.label, cells });
  }
  return shapes.length > 0 ? shapes : null;
}

export function parseShapeMinesweeperLink(link: string): ShapeMinesweeperPuzzleData | null {
  try {
    const parts = parsePuzzLinkParts(link);
    const id = parts[0]?.toLowerCase();
    if (id !== 'shape-minesweeper' && id !== 'shapeminesweeper' && id !== 'shape-minesweep') return null;
    const width = Number(parts[1]);
    const height = Number(parts[2]);
    if (!isPositiveGridSize(width, height)) return null;
    const encoded = parts.slice(3).join('/');
    if (!encoded) return null;

    const payload = decodeCustomPayload<ShapePayload>(encoded);
    if (payload) {
      const clues = parseCluesPayload(payload.clues, width, height);
      const shapes = parseShapesPayload(payload.shapes);
      if (clues && shapes) return { type: 'shape-minesweeper', width, height, clues, shapes };
    }

    const clueRows = parts[3] ?? '';
    const shapeBank = parts.slice(4).join('/');
    if (!clueRows || !shapeBank) return null;
    const clues = parseClueRows(clueRows, width, height);
    const shapes = parseCompactShapes(shapeBank);
    return clues && shapes ? { type: 'shape-minesweeper', width, height, clues, shapes } : null;
  } catch {
    return null;
  }
}

function getShapeMultiset(shapes: ShapeMinesweeperShape[]) {
  const counts = new Map<string, number>();
  shapes.forEach((shape) => {
    const key = getShapeCanonicalKey(shape.cells);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return counts;
}

export function validateShapeMinesweeper(
  grid: ShadingCellState[][],
  puzzle: ShapeMinesweeperPuzzleData
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
      if (clue !== null && shaded[row][col]) {
        badCells.add(getCellKey(row, col));
        setMessage('数字格不能放置形状');
      }
      if (clue !== null) {
        let count = 0;
        for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
          for (let colOffset = -1; colOffset <= 1; colOffset++) {
            if (rowOffset === 0 && colOffset === 0) continue;
            const nextRow = row + rowOffset;
            const nextCol = col + colOffset;
            if (nextRow >= 0 && nextRow < puzzle.height && nextCol >= 0 && nextCol < puzzle.width && shaded[nextRow][nextCol]) count++;
          }
        }
        if (count !== clue) {
          badCells.add(getCellKey(row, col));
          setMessage('数字周围的形状格数量不正确');
        }
      }
    }
  }

  const components = collectBooleanComponents(shaded, true);
  const componentIds = Array.from({ length: puzzle.height }, () => Array(puzzle.width).fill(-1));
  components.forEach((component, componentIndex) => {
    component.forEach(({ row, col }) => {
      componentIds[row][col] = componentIndex;
    });
  });
  const expected = getShapeMultiset(puzzle.shapes);
  const actual = new Map<string, number>();
  components.forEach((component) => {
    const minRow = Math.min(...component.map((cell) => cell.row));
    const minCol = Math.min(...component.map((cell) => cell.col));
    const maxRow = Math.max(...component.map((cell) => cell.row));
    const maxCol = Math.max(...component.map((cell) => cell.col));
    const mask = Array.from({ length: maxRow - minRow + 1 }, (_, row) =>
      Array.from({ length: maxCol - minCol + 1 }, (_, col) => shaded[minRow + row][minCol + col])
    );
    const key = getShapeCanonicalKey(mask);
    actual.set(key, (actual.get(key) ?? 0) + 1);
    component.forEach((cell) => badCells.add(getCellKey(cell.row, cell.col)));
  });

  const allKeys = new Set([...expected.keys(), ...actual.keys()]);
  if ([...allKeys].some((key) => (expected.get(key) ?? 0) !== (actual.get(key) ?? 0))) {
    setMessage('盘面中的形状与形状库不一致');
  } else {
    components.forEach((component) => component.forEach((cell) => badCells.delete(getCellKey(cell.row, cell.col))));
  }

  let hasDiagonalContact = false;
  for (let row = 0; row < puzzle.height; row++) {
    for (let col = 0; col < puzzle.width; col++) {
      if (!shaded[row][col]) continue;
      for (const [rowOffset, colOffset] of [[-1, -1], [-1, 1], [1, -1], [1, 1]] as const) {
        const nextRow = row + rowOffset;
        const nextCol = col + colOffset;
        if (
          nextRow < 0 || nextRow >= puzzle.height || nextCol < 0 || nextCol >= puzzle.width ||
          !shaded[nextRow][nextCol] || componentIds[row][col] === componentIds[nextRow][nextCol]
        ) continue;
        hasDiagonalContact = true;
        badCells.add(getCellKey(row, col));
        badCells.add(getCellKey(nextRow, nextCol));
      }
    }
  }
  if (hasDiagonalContact) {
    setMessage('不同形状不能正交或斜向接触');
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
