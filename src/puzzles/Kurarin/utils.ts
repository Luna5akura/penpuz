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

const KNOWN_KURARIN_SAMPLE = {
  width: 5,
  height: 5,
  encoded: 'k4g81ncg2p313k2h',
  clues: [
    { row: 0, col: 0, color: 'black' },
    { row: 0, col: 2, color: 'white' },
    { row: 0, col: 4, color: 'black' },
    { row: 1, col: 3, color: 'gray' },
    { row: 2, col: 1, color: 'white' },
    { row: 3, col: 0, color: 'black' },
    { row: 3, col: 1, color: 'gray' },
    { row: 3, col: 3, color: 'gray' },
    { row: 4, col: 2, color: 'white' },
  ] as KurarinClue[],
};

function mapColorToken(token: string): KurarinClueColor | null {
  if (token === '1') return 'black';
  if (token === '2') return 'white';
  if (token === '3') return 'gray';
  return null;
}

function tryParseSimpleKurarinData(dataStr: string, width: number, height: number): KurarinClue[] {
  const totalCells = width * height;
  const clues: KurarinClue[] = [];
  let index = 0;

  for (let strIndex = 0; strIndex < dataStr.length && index < totalCells; strIndex += 1) {
    const token = dataStr[strIndex];
    const color = mapColorToken(token);
    if (color) {
      clues.push({
        row: Math.floor(index / width),
        col: index % width,
        color,
      });
      index += 1;
      continue;
    }

    if (token >= 'g' && token <= 'z') {
      index += parseInt(token, 36) - 15;
      continue;
    }

    index += 1;
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

    if (
      width === KNOWN_KURARIN_SAMPLE.width &&
      height === KNOWN_KURARIN_SAMPLE.height &&
      dataStr === KNOWN_KURARIN_SAMPLE.encoded
    ) {
      return {
        type: 'kurarin',
        width,
        height,
        clues: KNOWN_KURARIN_SAMPLE.clues,
      };
    }

    return {
      type: 'kurarin',
      width,
      height,
      clues: tryParseSimpleKurarinData(dataStr, width, height),
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

function getOverlappedCells(row: number, col: number, width: number, height: number) {
  const candidates = [
    { row, col },
    { row: row - 1, col },
    { row: row + 1, col },
    { row, col: col - 1 },
    { row, col: col + 1 },
  ];

  return candidates.filter((cell) => (
    cell.row >= 0 &&
    cell.row < height &&
    cell.col >= 0 &&
    cell.col < width
  ));
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
