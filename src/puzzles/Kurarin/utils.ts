import type { KurarinClue, KurarinClueColor, KurarinPuzzleData, YajilinSolutionEdge } from '../types';

export type KurarinCellState = 0 | 1 | 2;

export interface KurarinValidationResult {
  valid: boolean;
  message?: string;
  badCells: { r: number; c: number }[];
  badClueIndices: number[];
}

export type KurarinHitTarget =
  | { kind: 'cell'; row: number; col: number }
  | { kind: 'edge'; key: string; cells: [{ row: number; col: number }, { row: number; col: number }] }
  | null;

function mapColorToken(token: number): KurarinClueColor | null {
  if (token === 1) return 'black';
  if (token === 2) return 'gray';
  if (token === 3) return 'white';
  return null;
}

function readNumber16(source: string, index: number): [number, number] {
  if (index >= source.length) return [-1, 0];
  const ch = source[index];
  if (/[0-9a-f]/.test(ch)) return [parseInt(ch, 16), 1];
  if (ch === '-') return index + 3 <= source.length ? [parseInt(source.slice(index + 1, index + 3), 16), 3] : [-1, 0];
  if (ch === '+') return index + 4 <= source.length ? [parseInt(source.slice(index + 1, index + 4), 16), 4] : [-1, 0];
  if (ch === '=') return index + 4 <= source.length ? [parseInt(source.slice(index + 1, index + 4), 16) + 4096, 4] : [-1, 0];
  if (ch === '%') return index + 4 <= source.length ? [parseInt(source.slice(index + 1, index + 4), 16) + 8192, 4] : [-1, 0];
  return [-1, 0];
}

function decodeKurarinDots(dataStr: string, width: number, height: number): KurarinClue[] {
  const dotWidth = width * 2 - 1;
  const dotHeight = height * 2 - 1;
  const dotCount = dotWidth * dotHeight;
  const pairCount = Math.floor((dotCount + 1) / 2);
  const dotValues = Array(dotCount).fill(0);

  let pairIndex = 0;
  let strIndex = 0;
  while (strIndex < dataStr.length && pairIndex < pairCount) {
    const token = dataStr[strIndex];
    if (token >= 'g' && token <= 'z') {
      pairIndex += parseInt(token, 36) - 15;
      strIndex += 1;
      continue;
    }

    const [value, consumed] = readNumber16(dataStr, strIndex);
    if (consumed <= 0 || value < 0) {
      strIndex += 1;
      continue;
    }

    const firstDot = pairIndex * 2;
    const secondDot = firstDot + 1;
    dotValues[firstDot] = (value >> 2) & 3;
    if (secondDot < dotCount) {
      dotValues[secondDot] = value & 3;
    }

    pairIndex += 1;
    strIndex += consumed;
  }

  const clues: KurarinClue[] = [];
  for (let index = 0; index < dotCount; index += 1) {
    const color = mapColorToken(dotValues[index]);
    if (!color) continue;
    clues.push({
      row: Math.floor(index / dotWidth),
      col: index % dotWidth,
      color,
    });
  }
  return clues;
}

export function parseKurarinLink(link: string): KurarinPuzzleData | null {
  try {
    let dataPart = link.includes('?') ? link.split('?')[1] : link;
    if (dataPart.startsWith('p?')) dataPart = dataPart.slice(2);

    const parts = dataPart.split('/');
    if (parts[0] !== 'kurarin' || parts.length < 4) return null;

    const width = Number(parts[1]);
    const height = Number(parts[2]);
    const dataStr = parts.slice(3).join('/');
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0 || !dataStr) {
      return null;
    }

    return {
      type: 'kurarin',
      width,
      height,
      clues: decodeKurarinDots(dataStr, width, height),
    };
  } catch {
    return null;
  }
}

export function getKurarinEdgeKey(r1: number, c1: number, r2: number, c2: number): string | null {
  if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) return null;
  if (r1 < r2 || (r1 === r2 && c1 < c2)) {
    return `${r1},${c1}-${r2},${c2}`;
  }
  return `${r2},${c2}-${r1},${c1}`;
}

export function parseKurarinEdgeKey(key: string) {
  const match = key.match(/^(\d+),(\d+)-(\d+),(\d+)$/);
  if (!match) return null;
  return {
    r1: Number(match[1]),
    c1: Number(match[2]),
    r2: Number(match[3]),
    c2: Number(match[4]),
  };
}

export function createKurarinEdgeSet(edges: YajilinSolutionEdge[]) {
  return new Set(
    edges
      .map((edge) => getKurarinEdgeKey(edge.r1, edge.c1, edge.r2, edge.c2))
      .filter((key): key is string => key !== null)
  );
}

export function createEmptyKurarinGrid(width: number, height: number): KurarinCellState[][] {
  return Array.from({ length: height }, () => Array(width).fill(0) as KurarinCellState[]);
}

export function getIncidentKurarinEdgeKeys(
  row: number,
  col: number,
  width: number,
  height: number
) {
  return [
    getKurarinEdgeKey(row, col, row - 1, col),
    getKurarinEdgeKey(row, col, row + 1, col),
    getKurarinEdgeKey(row, col, row, col - 1),
    getKurarinEdgeKey(row, col, row, col + 1),
  ].filter((key): key is string => {
    if (!key) return false;
    const parsed = parseKurarinEdgeKey(key);
    if (!parsed) return false;
    return (
      parsed.r1 >= 0 &&
      parsed.r1 < height &&
      parsed.c1 >= 0 &&
      parsed.c1 < width &&
      parsed.r2 >= 0 &&
      parsed.r2 < height &&
      parsed.c2 >= 0 &&
      parsed.c2 < width
    );
  });
}

function getOverlappedCells(dotRow: number, dotCol: number, width: number, height: number) {
  const rows = dotRow % 2 === 0 ? [dotRow / 2] : [(dotRow - 1) / 2, (dotRow + 1) / 2];
  const cols = dotCol % 2 === 0 ? [dotCol / 2] : [(dotCol - 1) / 2, (dotCol + 1) / 2];
  const cells: Array<{ row: number; col: number }> = [];

  rows.forEach((row) => {
    cols.forEach((col) => {
      if (row < 0 || row >= height || col < 0 || col >= width) return;
      cells.push({ row, col });
    });
  });

  return cells;
}

function clueKey(row: number, col: number) {
  return `${row},${col}`;
}

export function validateKurarin(
  grid: KurarinCellState[][],
  loopEdges: Set<string>,
  clues: KurarinClue[],
  width: number,
  height: number
): KurarinValidationResult {
  const badCells = new Set<string>();
  const badClues = new Set<number>();
  const degree = Array.from({ length: height }, () => Array(width).fill(0));
  const adjacency = new Map<string, Set<string>>();
  const addBadCell = (row: number, col: number) => badCells.add(clueKey(row, col));

  for (const key of loopEdges) {
    const edge = parseKurarinEdgeKey(key);
    if (!edge) continue;

    degree[edge.r1][edge.c1] += 1;
    degree[edge.r2][edge.c2] += 1;

    const k1 = clueKey(edge.r1, edge.c1);
    const k2 = clueKey(edge.r2, edge.c2);
    if (!adjacency.has(k1)) adjacency.set(k1, new Set());
    if (!adjacency.has(k2)) adjacency.set(k2, new Set());
    adjacency.get(k1)!.add(k2);
    adjacency.get(k2)!.add(k1);

    if (grid[edge.r1][edge.c1] === 1) addBadCell(edge.r1, edge.c1);
    if (grid[edge.r2][edge.c2] === 1) addBadCell(edge.r2, edge.c2);
  }

  const loopCells: string[] = [];
  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width; col += 1) {
      const isShaded = grid[row][col] === 1;
      if (isShaded) {
        if (degree[row][col] !== 0) addBadCell(row, col);
        continue;
      }

      loopCells.push(clueKey(row, col));
      if (degree[row][col] !== 2) addBadCell(row, col);
    }
  }

  if (loopCells.length > 0) {
    const visited = new Set<string>();
    const stack = [loopCells[0]];
    visited.add(loopCells[0]);

    while (stack.length > 0) {
      const current = stack.pop()!;
      for (const next of adjacency.get(current) ?? []) {
        if (visited.has(next)) continue;
        visited.add(next);
        stack.push(next);
      }
    }

    for (const cell of loopCells) {
      if (visited.has(cell)) continue;
      const [row, col] = cell.split(',').map(Number);
      addBadCell(row, col);
    }
  }

  clues.forEach((clue, index) => {
    const overlapped = getOverlappedCells(clue.row, clue.col, width, height);
    let shaded = 0;
    let unshaded = 0;
    overlapped.forEach((cell) => {
      if (grid[cell.row][cell.col] === 1) shaded += 1;
      else unshaded += 1;
    });

    if (clue.color === 'black' && !(shaded > unshaded)) badClues.add(index);
    if (clue.color === 'white' && !(unshaded > shaded)) badClues.add(index);
    if (clue.color === 'gray' && shaded !== unshaded) badClues.add(index);
  });

  const valid = badCells.size === 0 && badClues.size === 0;
  return {
    valid,
    message: valid ? undefined : 'Loop, shading, or circle constraints are not satisfied yet.',
    badCells: [...badCells].map((key) => {
      const [r, c] = key.split(',').map(Number);
      return { r, c };
    }),
    badClueIndices: [...badClues].sort((a, b) => a - b),
  };
}

export function detectKurarinHitTarget(
  x: number,
  y: number,
  width: number,
  height: number,
  cellSize: number,
  gap: number
): KurarinHitTarget {
  const step = cellSize + gap;
  const col = Math.floor(x / step);
  const row = Math.floor(y / step);

  if (row < 0 || row >= height || col < 0 || col >= width) return null;

  const localX = x - col * step;
  const localY = y - row * step;

  if (localX < 0 || localX > cellSize || localY < 0 || localY > cellSize) return null;

  const centerHalf = cellSize * 0.24;
  const centerX = cellSize / 2;
  const centerY = cellSize / 2;

  if (Math.abs(localX - centerX) <= centerHalf && Math.abs(localY - centerY) <= centerHalf) {
    return { kind: 'cell', row, col };
  }

  const threshold = Math.max(8, cellSize * 0.18);
  const candidates: Array<{
    distance: number;
    edgeKey: string | null;
    cells: [{ row: number; col: number }, { row: number; col: number }];
  }> = [
    {
      distance: Math.hypot(localX - centerX, localY),
      edgeKey: row > 0 ? getKurarinEdgeKey(row - 1, col, row, col) : null,
      cells: [{ row: row - 1, col }, { row, col }],
    },
    {
      distance: Math.hypot(localX - centerX, localY - cellSize),
      edgeKey: row + 1 < height ? getKurarinEdgeKey(row, col, row + 1, col) : null,
      cells: [{ row, col }, { row: row + 1, col }],
    },
    {
      distance: Math.hypot(localX, localY - centerY),
      edgeKey: col > 0 ? getKurarinEdgeKey(row, col - 1, row, col) : null,
      cells: [{ row, col: col - 1 }, { row, col }],
    },
    {
      distance: Math.hypot(localX - cellSize, localY - centerY),
      edgeKey: col + 1 < width ? getKurarinEdgeKey(row, col, row, col + 1) : null,
      cells: [{ row, col }, { row, col: col + 1 }],
    },
  ]
    .filter((item) => item.edgeKey !== null)
    .sort((a, b) => a.distance - b.distance);

  const best = candidates[0];
  if (best && best.distance <= threshold && best.edgeKey) {
    return { kind: 'edge', key: best.edgeKey, cells: best.cells };
  }

  return { kind: 'cell', row, col };
}
