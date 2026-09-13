import type { NeighborDigit, NeighborPuzzleData } from '../types';
import {
  decodeCustomPayload,
  isPositiveGridSize,
  parsePuzzLinkParts,
} from '../gridUtils';

export type NeighborCellValue = NeighborDigit | null;

export interface NeighborValidationResult {
  valid: boolean;
  message?: string;
  badCells: { r: number; c: number }[];
}

type NeighborPayload = {
  givens?: unknown;
  grid?: unknown;
  numbers?: unknown;
  grayCells?: unknown;
  outlinedCells?: unknown;
  gray?: unknown;
  grayMask?: unknown;
  outlined?: unknown;
  mask?: unknown;
};

const NEIGHBOR_CELL_COUNT = 81;

function isNeighborDigit(value: unknown): value is NeighborDigit {
  return value === 1 || value === 2 || value === 3;
}

function makeEmptyNeighborGrid(width: number, height: number): (NeighborDigit | null)[][] {
  return Array.from({ length: height }, () => Array<NeighborDigit | null>(width).fill(null));
}

function createEmptyGrayGrid(width: number, height: number): boolean[][] {
  return Array.from({ length: height }, () => Array<boolean>(width).fill(false));
}

function decodePayloadString(encoded: string): unknown {
  const normalized = encoded.trim();
  if (!normalized) return null;

  // Accept a readable JSON payload as well as the URL-safe base64 payload
  // used by the other custom puzzle parsers.
  try {
    const decodedText = decodeURIComponent(normalized);
    if (decodedText.startsWith('{') || decodedText.startsWith('[')) {
      return JSON.parse(decodedText) as unknown;
    }
  } catch {
    // Fall through to the base64 decoder.
  }

  return decodeCustomPayload<unknown>(normalized);
}

function readGridRows(encoded: string, width: number, height: number) {
  let decoded = encoded.trim();
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    // Keep the original segment when it contains a malformed escape.
  }
  const normalized = decoded.replace(/\s+/gu, '');
  if (!normalized) return null;

  // Row separators are useful when copying a puzzle by hand. A compact
  // 81-character string remains the canonical URL representation.
  const separatedRows = normalized.split(/[;,|]/u).filter(Boolean);
  const rows = separatedRows.length === height
    ? separatedRows
    : normalized.length === width * height
      ? Array.from({ length: height }, (_, row) => normalized.slice(row * width, (row + 1) * width))
      : null;
  if (!rows || rows.some((row) => row.length !== width)) return null;
  return rows;
}

function parseGivens(value: unknown, width: number, height: number): (NeighborDigit | null)[][] | null {
  if (Array.isArray(value)) {
    if (value.length === height && value.every((row) => typeof row === 'string')) {
      const rows = readGridRows(value.join(';'), width, height);
      return rows ? parseGivens(rows.map((row) => Array.from(row)), width, height) : null;
    }

    if (value.length === height && value.every((row) => Array.isArray(row) && row.length === width)) {
      const matrix = makeEmptyNeighborGrid(width, height);
      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          const cell = value[row][col];
          if (
            cell === null || cell === undefined || cell === '' || cell === '.' ||
            cell === '-' || cell === '_' || cell === 0 || cell === '0'
          ) {
            matrix[row][col] = null;
          } else if (isNeighborDigit(cell)) {
            matrix[row][col] = cell;
          } else if (typeof cell === 'string' && /^[123]$/u.test(cell)) {
            matrix[row][col] = Number(cell) as NeighborDigit;
          } else {
            return null;
          }
        }
      }
      return matrix;
    }

    if (value.length === width * height) {
      return parseGivens(
        Array.from({ length: height }, (_, row) => value.slice(row * width, (row + 1) * width)),
        width,
        height
      );
    }
    return null;
  }

  if (typeof value !== 'string') return null;
  const rows = readGridRows(value, width, height);
  if (!rows) return null;

  const matrix = makeEmptyNeighborGrid(width, height);
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const cell = rows[row][col];
      if (cell === '.' || cell === '0' || cell === '-' || cell === '_') {
        matrix[row][col] = null;
      } else if (/^[123]$/u.test(cell)) {
        matrix[row][col] = Number(cell) as NeighborDigit;
      } else {
        return null;
      }
    }
  }
  return matrix;
}

function parseGrayCells(value: unknown, width: number, height: number): boolean[][] | null {
  if (Array.isArray(value)) {
    if (value.length === height && value.every((row) => typeof row === 'string')) {
      const rows = readGridRows(value.join(';'), width, height);
      return rows ? parseGrayCells(rows.map((row) => Array.from(row)), width, height) : null;
    }

    if (value.length === height && value.every((row) => Array.isArray(row) && row.length === width)) {
      const matrix = createEmptyGrayGrid(width, height);
      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          const cell = value[row][col];
          if (typeof cell === 'boolean') matrix[row][col] = cell;
          else if (cell === 1 || cell === '1' || cell === '#' || cell === 'g' || cell === 'x') matrix[row][col] = true;
          else if (cell === 0 || cell === '0' || cell === '.' || cell === '-' || cell === '_') matrix[row][col] = false;
          else return null;
        }
      }
      return matrix;
    }

    if (value.length === width * height) {
      return parseGrayCells(
        Array.from({ length: height }, (_, row) => value.slice(row * width, (row + 1) * width)),
        width,
        height
      );
    }
    return null;
  }

  if (typeof value !== 'string') return null;
  const rows = readGridRows(value, width, height);
  if (!rows) return null;

  const matrix = createEmptyGrayGrid(width, height);
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const cell = rows[row][col].toLowerCase();
      if (cell === '1' || cell === '#' || cell === 'g' || cell === 'x') matrix[row][col] = true;
      else if (cell === '0' || cell === '.' || cell === '-' || cell === '_') matrix[row][col] = false;
      else return null;
    }
  }
  return matrix;
}

function parsePayloadObject(
  payload: NeighborPayload,
  width: number,
  height: number
): NeighborPuzzleData | null {
  const givens = parseGivens(payload.givens ?? payload.grid ?? payload.numbers, width, height);
  const rawGray = payload.grayCells ?? payload.outlinedCells ?? payload.gray ?? payload.grayMask ?? payload.outlined ?? payload.mask;
  // pzpr treats an omitted gray layer as an all-white board.  Preserve that
  // behavior for imported links, while still rejecting an explicitly supplied
  // malformed layer.
  const grayCells = rawGray === undefined
    ? createEmptyGrayGrid(width, height)
    : parseGrayCells(rawGray, width, height);
  if (!givens || !grayCells) return null;
  return { type: 'neighbor', width, height, givens, grayCells };
}

/**
 * Parse the local Neighbor URL format:
 *
 *   neighbor/9/9/<81 givens>/<81 gray mask>
 *
 * A given string uses `1`–`3` and `.` for an empty cell. The gray mask uses
 * `1` (or `#`) for an outlined cell and `0` (or `.`) for a white cell. A
 * URL-safe base64/JSON payload with `givens` and `grayCells` is accepted too.
 * The aliases `neighbors`, `neighbour`, and `neighbours` are intentional;
 * unlike Koburin, this puzzle has no official PuzzLink encoder.
 */
export function parseNeighborLink(link: string): NeighborPuzzleData | null {
  try {
    const parts = parsePuzzLinkParts(link);
    const id = parts[0]?.trim().toLowerCase();
    if (!['neighbor', 'neighbors', 'neighbour', 'neighbours'].includes(id)) return null;

    const width = Number(parts[1]);
    const height = Number(parts[2]);
    if (!isPositiveGridSize(width, height) || width !== 9 || height !== 9) return null;

    const payloadParts = parts.slice(3).filter(Boolean);
    if (payloadParts.length === 0) return null;

    // First try a structured payload. This also permits links with a single
    // encoded segment, which is convenient for imported notes.
    const structured = parsePayloadObject(
      (decodePayloadString(payloadParts.join('')) ?? {}) as NeighborPayload,
      width,
      height
    );
    if (structured) return structured;

    let givensEncoded: string | undefined;
    let grayEncoded: string | undefined;
    if (payloadParts.length >= 2) {
      [givensEncoded, grayEncoded] = payloadParts;
    } else {
      const combined = payloadParts[0];
      const separator = ['~', '|', ':'].find((candidate) => combined.includes(candidate));
      if (separator) [givensEncoded, grayEncoded] = combined.split(separator, 2);
      else if (combined.length === NEIGHBOR_CELL_COUNT * 2) {
        givensEncoded = combined.slice(0, NEIGHBOR_CELL_COUNT);
        grayEncoded = combined.slice(NEIGHBOR_CELL_COUNT);
      } else {
        // A pzpr URL may omit the optional gray layer; omitted cells are
        // white, so an ordinary 81-character givens layer is sufficient.
        givensEncoded = combined;
      }
    }

    if (!givensEncoded) return null;
    const givens = parseGivens(givensEncoded, width, height);
    const grayCells = grayEncoded === undefined
      ? createEmptyGrayGrid(width, height)
      : parseGrayCells(grayEncoded, width, height);
    return givens && grayCells ? { type: 'neighbor', width, height, givens, grayCells } : null;
  } catch {
    return null;
  }
}

export const parseNeighborsLink = parseNeighborLink;
export const parseNeighbourLink = parseNeighborLink;
export const parseNeighboursLink = parseNeighborLink;
// Keep short aliases for callers that use the puzzle name rather than the
// URL-oriented `*Link` naming convention.  The link aliases above remain the
// documented form and all aliases intentionally share one implementation.
export const parseNeighbor = parseNeighborLink;
export const parseNeighbors = parseNeighborLink;
export const parseNeighbour = parseNeighborLink;
export const parseNeighbours = parseNeighborLink;

export function createEmptyNeighborGrid(width: number, height: number): (NeighborDigit | null)[][] {
  return makeEmptyNeighborGrid(width, height);
}

function cellKey(row: number, col: number) {
  return `${row},${col}`;
}

function orthogonalNeighbors(row: number, col: number, width: number, height: number) {
  return [
    row > 0 ? { row: row - 1, col } : null,
    row + 1 < height ? { row: row + 1, col } : null,
    col > 0 ? { row, col: col - 1 } : null,
    col + 1 < width ? { row, col: col + 1 } : null,
  ].filter((cell): cell is { row: number; col: number } => cell !== null);
}

function hasMatrixShape(value: unknown, width: number, height: number): value is unknown[][] {
  return Array.isArray(value) && value.length === height && value.every(
    (row) => Array.isArray(row) && row.length === width
  );
}

function hasNeighborPuzzleShape(
  value: unknown,
  width: number,
  height: number
): value is (NeighborDigit | null)[][] {
  return hasMatrixShape(value, width, height) && value.every((row) =>
    row.every((cell) => cell === null || isNeighborDigit(cell))
  );
}

function hasGrayPuzzleShape(value: unknown, width: number, height: number): value is boolean[][] {
  return hasMatrixShape(value, width, height) && value.every((row) =>
    row.every((cell) => typeof cell === 'boolean')
  );
}

/** Validate the row/column counts and the white/gray adjacency rules. */
export function validateNeighbor(
  grid: (number | null)[][],
  puzzle: NeighborPuzzleData
): NeighborValidationResult {
  // Puzzle objects can come from imported notes/localStorage and therefore
  // should be treated as untrusted at runtime despite the TypeScript type.
  // Validate the rectangular shape before reading nested fields so malformed
  // data returns a normal validation result instead of throwing.
  const candidate = puzzle as unknown as {
    width?: unknown;
    height?: unknown;
    givens?: unknown;
    grayCells?: unknown;
  } | null | undefined;
  const width = candidate?.width;
  const height = candidate?.height;
  const badCells = new Set<string>();
  let hasFixedError = false;
  let hasCountError = false;
  let hasAdjacencyError = false;
  const addBad = (row: number, col: number) => {
    if (typeof width === 'number' && typeof height === 'number' &&
      row >= 0 && row < height && col >= 0 && col < width) {
      badCells.add(cellKey(row, col));
    }
  };

  if (
    width !== 9 || height !== 9 ||
    !hasMatrixShape(grid, 9, 9) ||
    !hasNeighborPuzzleShape(candidate?.givens, 9, 9) ||
    !hasGrayPuzzleShape(candidate?.grayCells, 9, 9)
  ) {
    return {
      valid: false,
      message: '盘面数据尺寸不正确。',
      badCells: [],
    };
  }

  const givens = candidate.givens;
  const grayCells = candidate.grayCells;

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const value = grid[row][col];
      const given = givens[row][col];
      if (!isNeighborDigit(value)) {
        addBad(row, col);
      } else if (given !== null && value !== given) {
        hasFixedError = true;
        addBad(row, col);
      }
    }
  }

  for (let row = 0; row < height; row++) {
    const counts = [0, 0, 0, 0];
    for (const value of grid[row]) if (isNeighborDigit(value)) counts[value] += 1;
    if (counts[1] !== 3 || counts[2] !== 3 || counts[3] !== 3) {
      hasCountError = true;
      for (let col = 0; col < width; col++) addBad(row, col);
    }
  }

  for (let col = 0; col < width; col++) {
    const counts = [0, 0, 0, 0];
    for (let row = 0; row < height; row++) {
      const value = grid[row][col];
      if (isNeighborDigit(value)) counts[value] += 1;
    }
    if (counts[1] !== 3 || counts[2] !== 3 || counts[3] !== 3) {
      hasCountError = true;
      for (let row = 0; row < height; row++) addBad(row, col);
    }
  }

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const value = grid[row][col];
      if (!isNeighborDigit(value)) continue;
      const sameNeighbors = orthogonalNeighbors(row, col, width, height)
        .filter((cell) => grid[cell.row]?.[cell.col] === value).length;
      const isGray = grayCells[row][col] === true;
      if ((isGray && sameNeighbors > 0) || (!isGray && sameNeighbors === 0)) {
        hasAdjacencyError = true;
        addBad(row, col);
        for (const cell of orthogonalNeighbors(row, col, width, height)) {
          if (grid[cell.row]?.[cell.col] === value) addBad(cell.row, cell.col);
        }
      }
    }
  }

  let message: string | undefined;
  if (hasFixedError) message = '固定数字不能被修改。';
  else if (hasCountError) message = '每行每列中，数字 1、2、3 都必须恰好出现三次。';
  else if (hasAdjacencyError) message = '白格必须接触同号格，灰格不能接触同号格。';

  return {
    valid: !hasFixedError && !hasCountError && !hasAdjacencyError && badCells.size === 0,
    message,
    badCells: [...badCells].map((key) => {
      const [r, c] = key.split(',').map(Number);
      return { r, c };
    }),
  };
}

export const validateNeighbors = validateNeighbor;
export const validateNeighbour = validateNeighbor;

export function getNeighborCellKey(row: number, col: number) {
  return cellKey(row, col);
}
