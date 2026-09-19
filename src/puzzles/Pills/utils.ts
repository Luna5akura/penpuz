import type { PillsPuzzleData } from '../types';
import type { ShadingCellState, ShadingValidationResult } from '../shared/ShadingBoard';
import { getCellKey, isPositiveGridSize, parsePuzzLinkParts } from '../gridUtils';

/** Dice-pip style dot positions for a cell, slightly slanted. */
export function getPillsPipsLayout(count: number, cellSize: number) {
  const radius = Math.max(2, Math.min(cellSize * 0.09, cellSize * 0.16));
  const positions: Array<{ x: number; y: number }> = [];
  if (count === 1) {
    positions.push({ x: 0.5, y: 0.5 });
  } else if (count === 2) {
    positions.push({ x: 0.34, y: 0.34 }, { x: 0.66, y: 0.66 });
  } else if (count === 3) {
    positions.push({ x: 0.5, y: 0.26 }, { x: 0.26, y: 0.7 }, { x: 0.74, y: 0.7 });
  } else if (count === 4) {
    positions.push({ x: 0.32, y: 0.32 }, { x: 0.68, y: 0.32 }, { x: 0.32, y: 0.68 }, { x: 0.68, y: 0.68 });
  } else {
    for (let index = 0; index < count; index++) {
      const col = index % 3;
      const row = Math.floor(index / 3);
      positions.push({ x: 0.25 + col * 0.25, y: 0.25 + row * 0.25 });
    }
  }
  return { radius, positions };
}

export interface PillsComponent {
  cells: Array<{ row: number; col: number }>;
  orientation: 'h' | 'v' | 'mixed';
}

/**
 * Marked cells connect orthogonally in any direction; a manual separator
 * line drawn between two cells breaks the connection.  Each resulting
 * component is one pill candidate (1×3 or 3×1 straight bar).
 */
export function getPillComponents(
  grid: ShadingCellState[][],
  lineEdges: readonly string[],
  width: number,
  height: number
): PillsComponent[] {
  const separatorSet = new Set(lineEdges);
  const visited = Array.from({ length: height }, () => Array(width).fill(false));
  const components: PillsComponent[] = [];

  const isSeparated = (r1: number, c1: number, r2: number, c2: number) => {
    if (r1 === r2) return separatorSet.has(`v-${r1}-${Math.max(c1, c2)}`);
    return separatorSet.has(`h-${Math.max(r1, r2)}-${c1}`);
  };

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      if (grid[row]?.[col] !== 1 || visited[row][col]) continue;
      const cells: Array<{ row: number; col: number }> = [];
      const stack = [{ row, col }];
      visited[row][col] = true;
      while (stack.length > 0) {
        const current = stack.pop()!;
        cells.push(current);
        for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]] as const) {
          const nr = current.row + dr;
          const nc = current.col + dc;
          if (nr < 0 || nc < 0 || nr >= height || nc >= width || visited[nr][nc]) continue;
          if (grid[nr]?.[nc] !== 1) continue;
          if (isSeparated(current.row, current.col, nr, nc)) continue;
          visited[nr][nc] = true;
          stack.push({ row: nr, col: nc });
        }
      }
      const orientation = cells.every((cell) => cell.row === cells[0].row)
        ? 'h'
        : cells.every((cell) => cell.col === cells[0].col)
          ? 'v'
          : 'mixed';
      components.push({ cells, orientation });
    }
  }
  return components;
}

/**
 * Parse a Pills link:
 * `pills/W/H/[cell dots number16][top clues][left clues]`.
 *
 * The cell grid stores the given dot count of every cell (0 = no dots;
 * dots outside pills are decorative).  The clue sections use the pzpr
 * number16ExCell encoding.  Every pill is a horizontal 1×3 bar, and the
 * pill values shown to the right are the distinct values 1..K, derived
 * from the total number of dots inside pills.
 */
export function parsePillsLink(link: string): PillsPuzzleData | null {
  try {
    const parts = parsePuzzLinkParts(link);
    if (parts[0]?.toLowerCase() !== 'pills') return null;
    const width = Number(parts[1]);
    const height = Number(parts[2]);
    if (!isPositiveGridSize(width, height)) return null;
    const payload = parts[3] ?? '';
    if (!payload) return null;

    let index = 0;

    // --- cell dots (number16 over width*height cells) ---
    const dots = Array.from({ length: height }, () => Array<number>(width).fill(0));
    const cellCount = width * height;
    let cell = 0;
    while (cell < cellCount && index < payload.length) {
      const char = payload[index];
      if (char >= 'g' && char <= 'z') {
        cell = Math.min(cellCount, cell + parseInt(char, 36) - 15);
        index += 1;
        continue;
      }
      if (/^[0-9a-f]$/.test(char)) {
        dots[Math.floor(cell / width)][cell % width] = parseInt(char, 16);
        cell += 1;
        index += 1;
        continue;
      }
      if (char === '-' && /^[0-9a-f]{2}$/.test(payload.slice(index + 1, index + 3))) {
        dots[Math.floor(cell / width)][cell % width] = parseInt(payload.slice(index + 1, index + 3), 16);
        cell += 1;
        index += 3;
        continue;
      }
      return null;
    }
    if (cell !== cellCount) return null;

    // --- top clues, then left clues (number16ExCell) ---
    const topClues = readClueSection(payload, index, width);
    if (!topClues) return null;
    index = topClues.nextIndex;
    const leftClues = readClueSection(payload, index, height);
    if (!leftClues) return null;

    // --- derive the pill values from the total dots inside pills ---
    let topSum = 0;
    for (const value of topClues.values) topSum += value ?? 0;
    let leftSum = 0;
    for (const value of leftClues.values) leftSum += value ?? 0;
    if (topSum !== leftSum) return null;
    const pillValues = pillValuesFromTotal(topSum);
    if (!pillValues) return null;

    return { type: 'pills', width, height, dots, topClues: topClues.values, leftClues: leftClues.values, pillValues };
  } catch {
    return null;
  }
}

function readClueSection(payload: string, start: number, count: number): { values: (number | null)[]; nextIndex: number } | null {
  const values: (number | null)[] = [];
  let index = start;
  let cell = 0;
  while (cell < count && index < payload.length) {
    const char = payload[index];
    if (char >= 'g' && char <= 'z') {
      cell = Math.min(count, cell + parseInt(char, 36) - 15);
      index += 1;
      continue;
    }
    if (/^[0-9a-f]$/.test(char)) {
      values[cell] = parseInt(char, 16);
      cell += 1;
      index += 1;
      continue;
    }
    if (char === '-') {
      if (!/^[0-9a-f]{2}$/.test(payload.slice(index + 1, index + 3))) return null;
      values[cell] = parseInt(payload.slice(index + 1, index + 3), 16);
      cell += 1;
      index += 3;
      continue;
    }
    if (char === '.') {
      values[cell] = null;
      cell += 1;
      index += 1;
      continue;
    }
    return null;
  }
  if (cell !== count) return null;
  return { values, nextIndex: index };
}

function pillValuesFromTotal(total: number): number[] | null {
  if (!Number.isInteger(total) || total < 1) return null;
  const count = Math.floor((Math.sqrt(1 + 8 * total) - 1) / 2);
  if (count < 1 || count * (count + 1) / 2 !== total) return null;
  return Array.from({ length: count }, (_, index) => index + 1);
}

/**
 * Validate the placed pills.  Pills are horizontal 1×3 blocks of marked
 * cells; every maximal run of marked cells must have a length divisible by
 * three.  The manual separator lines are purely a visual aid and take no
 * part in the validation.
 */
export function validatePills(
  grid: ShadingCellState[][],
  lineEdges: readonly string[],
  puzzle: PillsPuzzleData
): ShadingValidationResult {
  const { width, height, dots, topClues, leftClues, pillValues } = puzzle;
  const badCells = new Set<string>();
  let message: string | undefined;
  const setMessage = (next: string) => { if (!message) message = next; };
  const addLine = (cells: Array<{ row: number; col: number }>) => {
    cells.forEach(({ row, col }) => badCells.add(getCellKey(row, col)));
  };
  const cellDots = (row: number, col: number) => dots[row]?.[col] ?? 0;

  // 1. Every connected component must be a straight 1×3 / 3×1 pill.
  const occupiedCells = new Set<string>();
  const pillSums: number[] = [];
  for (const component of getPillComponents(grid, lineEdges, width, height)) {
    const cells = component.cells;
    if (cells.length !== 3 || component.orientation === 'mixed') {
      addLine(cells);
      setMessage('药丸必须是 1×3 或 3×1 的连续三格');
      continue;
    }
    cells.forEach((cell) => occupiedCells.add(getCellKey(cell.row, cell.col)));
    pillSums.push(cells.reduce((sum, cell) => sum + cellDots(cell.row, cell.col), 0));
  }

  // 2. The pill values must match the indicated set exactly.
  const remainingValues = [...pillValues];
  for (const sum of pillSums) {
    const valueIndex = remainingValues.indexOf(sum);
    if (valueIndex >= 0) remainingValues.splice(valueIndex, 1);
  }
  if (remainingValues.length > 0) {
    setMessage('药丸的值（内部点数）与右侧给出的数值不符');
  }

  // 3. Row and column dot sums must match the clues.
  for (let row = 0; row < height; row++) {
    const clue = leftClues[row];
    if (clue === null) continue;
    let sum = 0;
    const cells: Array<{ row: number; col: number }> = [];
    for (let col = 0; col < width; col++) {
      if (occupiedCells.has(getCellKey(row, col))) sum += cellDots(row, col);
      cells.push({ row, col });
    }
    if (sum !== clue) {
      addLine(cells);
      setMessage('每行药丸内部的点数与左侧数字不符');
    }
  }
  for (let col = 0; col < width; col++) {
    const clue = topClues[col];
    if (clue === null) continue;
    let sum = 0;
    const cells: Array<{ row: number; col: number }> = [];
    for (let row = 0; row < height; row++) {
      if (occupiedCells.has(getCellKey(row, col))) sum += cellDots(row, col);
      cells.push({ row, col });
    }
    if (sum !== clue) {
      addLine(cells);
      setMessage('每列药丸内部的点数与上方数字不符');
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
