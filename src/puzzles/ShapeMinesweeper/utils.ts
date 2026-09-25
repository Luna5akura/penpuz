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

/**
 * PuzzLink stores the shape bank using the common BankPiece serialization
 * used by the statue-park family.  The first two base-36 digits are the
 * width/height and the remaining base-32 digits contain five cells each.
 */
function decodeBankPiece(encoded: string): boolean[][] | null {
  if (encoded.length < 3) return null;

  const width = parseInt(encoded[0] ?? '', 36);
  const height = parseInt(encoded[1] ?? '', 36);
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) return null;

  const cellCount = width * height;
  let bits = '';
  for (const char of encoded.slice(2)) {
    const value = parseInt(char, 32);
    if (!Number.isInteger(value) || value < 0 || value >= 32) return null;
    bits += value.toString(2).padStart(5, '0');
  }
  // BankPiece serialization omits trailing zero bits, so a short final
  // base-32 chunk is expected and must be padded with empty cells. At least
  // one chunk is required; a width/height header by itself is malformed.
  if (bits.length === 0) return null;
  // The native decoder keeps only the first `width * height` bits.  The
  // final base-32 chunk may contain padding bits, so do not reject a valid
  // piece merely because those ignored bits are non-zero.
  bits = bits.padEnd(cellCount, '0');

  const cells = Array.from({ length: height }, (_, row) =>
    Array.from({ length: width }, (_, col) => bits[row * width + col] === '1')
  );
  return cells.some((row) => row.some(Boolean)) ? normalizeShapeCells(cells) : null;
}

/** The built-in Bank presets shipped by PuzzLink's Shape Minesweeper. */
const PUZZLINK_BANK_PRESETS: Record<string, string[]> = {
  t: ['14u', '23bg', '22u', '23f', '23eg'],
  p: ['337k', '15v', '24as', '24bo', '23fg', '337i', '23rg', '334u', '335s', '33bk', '24bk', '337o'],
  d: ['14u', '14u', '23bg', '23bg', '22u', '22u', '23f', '23f', '23eg', '23eg'],
};

/**
 * PuzzLink does not serialize the answer-entry letters printed beside the
 * competition shapes.  Standard tetrominoes have unambiguous names, so use
 * those names when possible and fall back to stable alphabetic labels for
 * custom banks.
 */
function getBankShapeLabel(cells: boolean[][], index: number) {
  const standardLabels: Array<[string, boolean[][]]> = [
    ['I', [[true], [true], [true], [true]] as boolean[][]],
    ['L', [[true, false], [true, false], [true, true]] as boolean[][]],
    ['O', [[true, true], [true, true]] as boolean[][]],
    ['S', [[false, true, true], [true, true, false]] as boolean[][]],
    ['T', [[false, true, false], [true, true, true]] as boolean[][]],
  ];
  const key = getShapeCanonicalKey(cells);
  const standard = standardLabels.find(([, shape]) => getShapeCanonicalKey(shape) === key);
  return standard?.[0] ?? String.fromCharCode('A'.charCodeAt(0) + (index % 26));
}

function parsePuzzLinkBank(parts: string[]): ShapeMinesweeperShape[] | null {
  // decodePieceBank consumes a leading slash. In split URL form, a preset
  // therefore appears as ["", "t"] for //t, while a custom bank appears as
  // ["", count, piece, ...].
  if (parts[0] === '') {
    const preset = parts[1]?.toLowerCase();
    if (preset && Object.prototype.hasOwnProperty.call(PUZZLINK_BANK_PRESETS, preset) && parts.length === 2) {
      const pieces = PUZZLINK_BANK_PRESETS[preset] ?? [];
      if (pieces.length === 0) return null;
      const shapes = pieces.map((encoded, index) => {
        const cells = decodeBankPiece(encoded);
        return cells ? { label: getBankShapeLabel(cells, index), cells } : null;
      }).filter((shape): shape is ShapeMinesweeperShape => shape !== null);
      return shapes.length === pieces.length ? shapes : null;
    }

    const count = Number(parts[1]);
    if (!Number.isInteger(count) || count <= 0 || parts.length !== count + 2) return null;
    const shapes: ShapeMinesweeperShape[] = [];
    for (let index = 0; index < count; index++) {
      const cells = decodeBankPiece(parts[index + 2] ?? '');
      if (!cells) return null;
      shapes.push({ label: getBankShapeLabel(cells, index), cells });
    }
    return shapes;
  }

  // Custom banks use a single separator slash (`/N/piece/...`).
  const count = Number(parts[0]);
  if (!Number.isInteger(count) || count <= 0 || parts.length !== count + 1) return null;
  const shapes: ShapeMinesweeperShape[] = [];
  for (let index = 0; index < count; index++) {
    const cells = decodeBankPiece(parts[index + 1] ?? '');
    if (!cells) return null;
    shapes.push({ label: getBankShapeLabel(cells, index), cells });
  }
  return shapes;
}

function readNumber16(encoded: string, index: number): { value: number | null; consumed: number } | null {
  const char = encoded[index];
  if (!char) return null;

  if (char === '.') return { value: null, consumed: 1 };

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
  if (digitCount === undefined) return null;
  const digits = encoded.slice(index + 1, index + 1 + digitCount);
  if (digits.length !== digitCount || !/^[0-9a-f]+$/u.test(digits)) return null;

  let value = parseInt(digits, 16);
  if (char === '=') value += 4096;
  else if (char === '%' || char === '@') value += 8192;
  else if (char === '*') value += 12240;
  else if (char === '$') value += 77776;
  return { value, consumed: digitCount + 1 };
}

/** Decode PuzzLink's number16 clue stream ('.' means an empty clue cell). */
function parseNumber16Clues(encoded: string, width: number, height: number) {
  const clues = Array.from({ length: height }, () => Array<number | null>(width).fill(null));
  const cellCount = width * height;
  // PuzzLink omits the number16 stream entirely for a newly created board
  // with no clues (for example `shapeminesweeper/4/4///t`).  In that form
  // the empty segment represents an all-empty clue matrix, not malformed
  // input.
  if (encoded.length === 0) return clues;
  let cellIndex = 0;
  let stringIndex = 0;

  while (stringIndex < encoded.length && cellIndex < cellCount) {
    const char = encoded[stringIndex];
    if (char >= 'g' && char <= 'z') {
      const run = parseInt(char, 36) - 15;
      if (cellIndex + run > cellCount) return null;
      cellIndex += run;
      stringIndex += 1;
      continue;
    }

    const decoded = readNumber16(encoded, stringIndex);
    if (!decoded || (decoded.value !== null && (decoded.value < 0 || decoded.value > 8))) return null;
    if (decoded.value !== null) {
      clues[Math.floor(cellIndex / width)][cellIndex % width] = decoded.value;
    }
    cellIndex += 1;
    stringIndex += decoded.consumed;
  }

  return cellIndex === cellCount && stringIndex === encoded.length ? clues : null;
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

    // Native PuzzLink representation: number16 clues followed by the bank
    // stream (`//t` for the standard tetromino bank, or `//N/piece/...`).
    const nativeClues = parseNumber16Clues(parts[3] ?? '', width, height);
    const nativeShapes = parsePuzzLinkBank(parts.slice(4));
    if (nativeClues && nativeShapes) {
      return { type: 'shape-minesweeper', width, height, clues: nativeClues, shapes: nativeShapes };
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

/**
 * Labels of the shapes the player has already drawn on the board.  A
 * shaded component counts as a drawn shape when its canonical key matches
 * one of the bank shapes; the shape inventory grays such shapes out.
 */
export function getPlacedShapeLabels(
  grid: ShadingCellState[][],
  puzzle: ShapeMinesweeperPuzzleData
): Set<string> {
  const shaded = grid.map((row) => row.map((cell) => cell === 1));
  const shapeLabels = new Map<string, string>();
  for (const shape of puzzle.shapes) {
    shapeLabels.set(getShapeCanonicalKey(shape.cells), shape.label);
  }
  const placed = new Set<string>();
  for (const component of collectBooleanComponents(shaded, true)) {
    const minRow = Math.min(...component.map((cell) => cell.row));
    const minCol = Math.min(...component.map((cell) => cell.col));
    const maxRow = Math.max(...component.map((cell) => cell.row));
    const maxCol = Math.max(...component.map((cell) => cell.col));
    const mask = Array.from({ length: maxRow - minRow + 1 }, (_, row) =>
      Array.from({ length: maxCol - minCol + 1 }, (_, col) => shaded[minRow + row][minCol + col])
    );
    const label = shapeLabels.get(getShapeCanonicalKey(mask));
    if (label !== undefined) placed.add(label);
  }
  return placed;
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
