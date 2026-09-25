import type { PlaceByProductPieceShape, PlaceByProductPuzzleData } from '../types';
import type { ShadingCellState, ShadingValidationResult } from '../shared/ShadingBoard';
import { parsePuzzLinkParts } from '../gridUtils';

/**
 * Piece bank presets in the pzpr (statuepark) "Place by Product" link format.
 * Each preset maps a short key (the character after the `//` suffix) to the
 * exact set of piece shapes it represents.
 */
const PIECE_BANK_PRESETS: Record<string, Array<Array<[number, number]>>> = {
  // preset.pentominoes
  p: [
    [[0, 2], [1, 0], [1, 1], [1, 2], [2, 1]], // F
    [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]], // I
    [[0, 1], [1, 1], [2, 1], [3, 0], [3, 1]], // L
    [[0, 1], [1, 1], [2, 0], [2, 1], [3, 0]], // P
    [[0, 1], [1, 0], [1, 1], [2, 0], [2, 1]], // N
    [[0, 2], [1, 0], [1, 1], [1, 2], [2, 2]], // T
    [[0, 0], [0, 1], [1, 1], [2, 0], [2, 1]], // U
    [[0, 2], [1, 2], [2, 0], [2, 1], [2, 2]], // V
    [[0, 2], [1, 1], [1, 2], [2, 0], [2, 1]], // W
    [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1]], // X
    [[0, 1], [1, 1], [2, 0], [2, 1], [3, 1]], // Y
    [[0, 2], [1, 0], [1, 1], [1, 2], [2, 0]], // Z
  ],
  // preset.tetrominoes
  t: [
    [[0, 0], [1, 0], [2, 0], [3, 0]], // I
    [[0, 1], [1, 1], [2, 0], [2, 1]], // L
    [[0, 0], [0, 1], [1, 0], [1, 1]], // O
    [[0, 1], [1, 0], [1, 1], [2, 0]], // T
    [[0, 1], [1, 0], [1, 1], [2, 1]], // S/Z
  ],
  // preset.double_tetrominoes
  d: [
    [[0, 0], [1, 0], [2, 0], [3, 0]],
    [[0, 0], [1, 0], [2, 0], [3, 0]],
    [[0, 1], [1, 1], [2, 0], [2, 1]],
    [[0, 1], [1, 1], [2, 0], [2, 1]],
    [[0, 0], [0, 1], [1, 0], [1, 1]],
    [[0, 0], [0, 1], [1, 0], [1, 1]],
    [[0, 1], [1, 0], [1, 1], [2, 0]],
    [[0, 1], [1, 0], [1, 1], [2, 0]],
    [[0, 1], [1, 0], [1, 1], [2, 1]],
    [[0, 1], [1, 0], [1, 1], [2, 1]],
  ],
};

function resolvePieceBank(key: string | undefined): PlaceByProductPieceShape[] | null {
  if (!key) return null;
  const shapes = PIECE_BANK_PRESETS[key.toLowerCase()];
  if (!shapes) return null;
  return shapes.map((cells) => ({ cells }));
}

/**
 * Decode the pzpr number16 "excell" clue stream.  One character per outside
 * clue cell; 'g'-'z' skip empty cells (g = 1, …, z = 20), '-'/'+' prefix two
 * or three hex digits for larger values, '.' marks an empty clue cell.
 */
function decodeNumber16ExCell(encoded: string, cellCount: number): (number | null)[] | null {
  const values: (number | null)[] = new Array(cellCount).fill(null);
  let cell = 0;
  let index = 0;

  while (index < encoded.length) {
    const char = encoded[index];
    if (char >= '0' && char <= '9' || char >= 'a' && char <= 'f') {
      if (cell < cellCount) values[cell] = Number.parseInt(char, 16);
      cell += 1;
      index += 1;
    } else if (char === '-') {
      const digits = encoded.slice(index + 1, index + 3);
      if (!/^[0-9a-f]{2}$/u.test(digits)) return null;
      if (cell < cellCount) values[cell] = Number.parseInt(digits, 16);
      cell += 1;
      index += 3;
    } else if (char === '+') {
      const digits = encoded.slice(index + 1, index + 4);
      if (!/^[0-9a-f]{3}$/u.test(digits)) return null;
      if (cell < cellCount) values[cell] = Number.parseInt(digits, 16);
      cell += 1;
      index += 4;
    } else if (char === '.') {
      cell += 1;
      index += 1;
    } else if (char >= 'g' && char <= 'z') {
      cell += Number.parseInt(char, 36) - 15;
      index += 1;
    } else {
      return null;
    }
  }

  return values;
}

/**
 * Decode the base-27 circle stream: three cells per character with weights
 * 9/3/1.  Circle-marked cells are the pre-placed piece parts (givens).
 */
function decodeCircleGrid(encoded: string, width: number, height: number): boolean[][] | null {
  const givens = Array.from({ length: height }, () => Array<boolean>(width).fill(false));
  const cellCount = width * height;
  let cell = 0;
  for (const char of encoded) {
    let number = Number.parseInt(char, 27);
    if (Number.isNaN(number) || number < 0 || number >= 27) return null;
    for (const weight of [9, 3, 1]) {
      const value = Math.floor(number / weight);
      number %= weight;
      if (cell < cellCount) {
        if (value > 0) givens[Math.floor(cell / width)][cell % width] = true;
        cell += 1;
      }
    }
  }
  return givens;
}

/**
 * pzpr "Place by Product" (statuepark) link format:
 *   placebyproduct/<w>/<h>/<clues><circles>//<bankShortKey>
 * - clues: number16 stream over the w column clue cells then the h row clue
 *   cells (g-z skips, '-'/'+' prefixed values, '.' empty)
 * - circles: base-27 stream, ceil(w*h/3) characters, three cells each;
 *   marked cells are the given piece parts
 * - bankShortKey: 'p' pentominoes, 't' tetrominoes, 'd' double tetrominoes
 */
export function parsePlaceByProductLink(link: string): PlaceByProductPuzzleData | null {
  try {
    const parts = parsePuzzLinkParts(link);
    if (parts[0]?.toLowerCase() !== 'placebyproduct' || parts.length < 4) return null;
    const width = Number(parts[1]);
    const height = Number(parts[2]);
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || width > 30 || height < 1 || height > 30) return null;

    const question = parts[3] ?? '';
    const bankKey = (parts.length > 5 ? parts[5] : parts[4])?.toLowerCase();
    if (!question || !bankKey) return null;

    // The circle stream is always the trailing ceil(w*h/3) characters.
    const circleLength = Math.ceil((width * height) / 3);
    if (question.length < circleLength) return null;
    const excellPart = question.slice(0, question.length - circleLength);
    const circlePart = question.slice(question.length - circleLength);

    const excell = decodeNumber16ExCell(excellPart, width + height);
    if (!excell) return null;
    const colClues = excell.slice(0, width).map((value) => value === -2 ? null : value);
    const rowClues = excell.slice(width, width + height).map((value) => value === -2 ? null : value);

    const givens = decodeCircleGrid(circlePart, width, height);
    if (!givens) return null;

    const pieces = resolvePieceBank(bankKey);
    if (!pieces) return null;

    return { type: 'place-by-product', width, height, rowClues, colClues, pieces, givens };
  } catch {
    return null;
  }
}

function normalizeOffsets(cells: Array<[number, number]>): Array<[number, number]> {
  let minRow = Number.POSITIVE_INFINITY;
  let minCol = Number.POSITIVE_INFINITY;
  for (const [row, col] of cells) {
    minRow = Math.min(minRow, row);
    minCol = Math.min(minCol, col);
  }
  return cells
    .map(([row, col]) => [row - minRow, col - minCol] as [number, number])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}

/** All distinct orientations of a piece shape (rotations + reflection). */
export function getPieceOrientations(cells: Array<[number, number]>): Array<Array<[number, number]>> {
  const seen = new Set<string>();
  const orientations: Array<Array<[number, number]>> = [];
  let current = cells;
  for (let step = 0; step < 4; step++) {
    current = current.map(([row, col]) => [col, -row] as [number, number]);
    const normalized = normalizeOffsets(current);
    const key = JSON.stringify(normalized);
    if (!seen.has(key)) {
      seen.add(key);
      orientations.push(normalized);
    }
  }
  current = cells.map(([row, col]) => [-row, col] as [number, number]);
  for (let step = 0; step < 4; step++) {
    current = current.map(([row, col]) => [col, -row] as [number, number]);
    const normalized = normalizeOffsets(current);
    const key = JSON.stringify(normalized);
    if (!seen.has(key)) {
      seen.add(key);
      orientations.push(normalized);
    }
  }
  return orientations;
}

/**
 * Try to partition the filled cells into an exact copy of each given piece
 * (rotations/reflections allowed, every piece used exactly once).
 */
function matchPieces(
  filledCells: Array<[number, number]>,
  pieces: PlaceByProductPieceShape[],
  width: number,
  height: number
): Array<Array<[number, number]>> | null {
  const filledSet = new Set(filledCells.map(([row, col]) => `${row}-${col}`));
  if (filledSet.size !== filledCells.length) return null;
  const targetTotal = pieces.reduce((sum, piece) => sum + piece.cells.length, 0);
  if (filledCells.length !== targetTotal) return null;

  // Candidate placements per piece that lie entirely inside the filled set.
  const candidates: Array<Array<Array<[number, number]>>> = [];
  for (const piece of pieces) {
    const orientations = getPieceOrientations(piece.cells);
    const list: Array<Array<[number, number]>> = [];
    for (const orientation of orientations) {
      let maxRow = 0;
      let maxCol = 0;
      for (const [row, col] of orientation) {
        maxRow = Math.max(maxRow, row);
        maxCol = Math.max(maxCol, col);
      }
      for (let row = 0; row + maxRow < height; row++) {
        for (let col = 0; col + maxCol < width; col++) {
          const placement = orientation.map(([dr, dc]) => [row + dr, col + dc] as [number, number]);
          if (placement.every(([r, c]) => filledSet.has(`${r}-${c}`))) {
            list.push(placement);
          }
        }
      }
    }
    if (list.length === 0) return null;
    candidates.push(list);
  }

  const usedPieces = new Array(pieces.length).fill(false);
  const usedCells = new Set<string>();
  const result: Array<Array<[number, number]>> = [];

  const search = (depth: number): boolean => {
    if (depth === pieces.length) return usedCells.size === filledSet.size;
    for (let pieceIndex = 0; pieceIndex < pieces.length; pieceIndex++) {
      if (usedPieces[pieceIndex]) continue;
      for (const placement of candidates[pieceIndex]) {
        const keys = placement.map(([r, c]) => `${r}-${c}`);
        if (keys.some((key) => usedCells.has(key))) continue;
        usedPieces[pieceIndex] = true;
        keys.forEach((key) => usedCells.add(key));
        result.push(placement);
        if (search(depth + 1)) return true;
        result.pop();
        keys.forEach((key) => usedCells.delete(key));
        usedPieces[pieceIndex] = false;
      }
    }
    return false;
  };

  return search(0) ? result : null;
}

function getRowProduct(row: number, width: number, filled: Set<string>) {
  let product = 1;
  let col = 0;
  while (col < width) {
    if (filled.has(`${row}-${col}`)) {
      col += 1;
      continue;
    }
    let run = 0;
    while (col < width && !filled.has(`${row}-${col}`)) {
      run += 1;
      col += 1;
    }
    product *= run;
  }
  return product;
}

function getColProduct(col: number, height: number, filled: Set<string>) {
  let product = 1;
  let row = 0;
  while (row < height) {
    if (filled.has(`${row}-${col}`)) {
      row += 1;
      continue;
    }
    let run = 0;
    while (row < height && !filled.has(`${row}-${col}`)) {
      run += 1;
      row += 1;
    }
    product *= run;
  }
  return product;
}

export function validatePlaceByProduct(
  grid: ShadingCellState[][],
  puzzle: PlaceByProductPuzzleData
): ShadingValidationResult {
  const { width, height, rowClues, colClues, pieces, givens } = puzzle;
  const badCells = new Set<string>();
  let message: string | undefined;
  const setMessage = (nextMessage: string) => {
    message ??= nextMessage;
  };

  if (grid.length !== height || grid.some((row) => row.length !== width)) {
    return { valid: false, message: '盘面数据尺寸不正确', badCells: [] };
  }

  // 1. Givens must stay filled.
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      if (givens[row][col] && grid[row][col] !== 1) {
        badCells.add(`${row}-${col}`);
        setMessage('预置的拼块部分必须保留');
      }
    }
  }

  // 2. The exact number of piece cells must be filled.
  const totalPieceCells = pieces.reduce((sum, piece) => sum + piece.cells.length, 0);
  const filledCells: Array<[number, number]> = [];
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      if (grid[row][col] === 1) filledCells.push([row, col]);
    }
  }

  if (filledCells.length !== totalPieceCells) {
    setMessage(filledCells.length < totalPieceCells ? '还有拼块未放置' : '放置了多余的格子');
    return { valid: false, message, badCells: [] };
  }

  // 3. Partition the filled cells into the piece set.
  const assignment = matchPieces(filledCells, pieces, width, height);
  if (!assignment) {
    setMessage('已填充的格子无法拆成给定拼块');
    return { valid: false, message, badCells: [] };
  }

  // 4. Pieces may not touch, not even diagonally.
  for (let first = 0; first < assignment.length; first++) {
    for (let second = first + 1; second < assignment.length; second++) {
      for (const [r1, c1] of assignment[first]) {
        for (const [r2, c2] of assignment[second]) {
          if (Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1) {
            assignment[first].forEach(([r, c]) => badCells.add(`${r}-${c}`));
            assignment[second].forEach(([r, c]) => badCells.add(`${r}-${c}`));
            setMessage('拼块之间不能相邻（包括对角）');
            return { valid: false, message, badCells: Array.from(badCells).map((key) => {
              const [row, col] = key.split('-').map(Number);
              return { row, col };
            }) };
          }
        }
      }
    }
  }

  // 5. Row and column product clues.
  const filled = new Set(filledCells.map(([r, c]) => `${r}-${c}`));
  for (let row = 0; row < height; row++) {
    const clue = rowClues[row];
    if (clue === null) continue;
    const product = getRowProduct(row, width, filled);
    if (product !== clue) {
      for (let col = 0; col < width; col++) badCells.add(`${row}-${col}`);
      setMessage(clue === 0 ? '该行必须被拼块完全填满' : `第 ${row + 1} 行的白色分组乘积不等于 ${clue}`);
    }
  }
  for (let col = 0; col < width; col++) {
    const clue = colClues[col];
    if (clue === null) continue;
    const product = getColProduct(col, height, filled);
    if (product !== clue) {
      for (let row = 0; row < height; row++) badCells.add(`${row}-${col}`);
      setMessage(clue === 0 ? '该列必须被拼块完全填满' : `第 ${col + 1} 列的白色分组乘积不等于 ${clue}`);
    }
  }

  if (message) {
    return { valid: false, message, badCells: Array.from(badCells).map((key) => {
      const [row, col] = key.split('-').map(Number);
      return { row, col };
    }) };
  }
  return { valid: true, badCells: [] };
}
