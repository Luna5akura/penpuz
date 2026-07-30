import type { DominoSearchPuzzleData, YajilinSolutionEdge } from '../types';
import {
  areOrthogonallyAdjacent,
  decodeCustomPayload,
  getCellKey,
  getEdgeKey,
  isPositiveGridSize,
  parsePuzzLinkParts,
  parseSolutionEdgeKey,
} from '../gridUtils';

export interface DominoSearchValidationResult {
  valid: boolean;
  message?: string;
  badCells: Array<{ row: number; col: number }>;
}

export type DominoSearchBoundaryHitTarget = {
  key: string;
  cells: [{ row: number; col: number }, { row: number; col: number }];
} | null;

interface DominoSearchPayload {
  grid?: unknown;
  numbers?: unknown;
  pairs?: unknown;
  dominoes?: unknown;
}

function parseNumberMatrix(candidate: unknown, width: number, height: number): (number | null)[][] | null {
  if (!Array.isArray(candidate) || candidate.length !== height) return null;

  const rows: (number | null)[][] = [];
  for (const row of candidate) {
    if (!Array.isArray(row) || row.length !== width) return null;
    const numbers = row.map((cell) => {
      if (cell === null || cell === undefined || cell === 'block' || cell === 'x') return null;
      return Number.isInteger(cell) && cell >= 0 ? cell : undefined;
    });
    if (numbers.some((cell) => cell === undefined)) return null;
    rows.push(numbers as (number | null)[]);
  }

  return rows;
}

function parseDominoes(candidate: unknown): Array<[number, number]> | null {
  if (!Array.isArray(candidate)) return null;

  const dominoes: Array<[number, number]> = [];
  for (const item of candidate) {
    if (!Array.isArray(item) || item.length !== 2) return null;
    const [left, right] = item;
    if (!Number.isInteger(left) || !Number.isInteger(right) || left < 0 || right < 0) return null;
    dominoes.push([Math.min(left, right), Math.max(left, right)]);
  }

  return dominoes;
}

function readNumber16(encoded: string, index: number): [number | null, number] {
  const char = encoded[index];
  if (char === undefined) return [null, 0];
  if ((char >= '0' && char <= '9') || (char >= 'a' && char <= 'f')) {
    return [parseInt(char, 16), 1];
  }
  if (char === '-' && index + 3 <= encoded.length) {
    return [parseInt(encoded.slice(index + 1, index + 3), 16), 3];
  }
  if (char === '+' && index + 4 <= encoded.length) {
    return [parseInt(encoded.slice(index + 1, index + 4), 16), 4];
  }
  if (char === '.') {
    return [null, 1];
  }
  return [null, 0];
}

function parseCompactNumberGrid(encoded: string, width: number, height: number): (number | null)[][] | null {
  const cells = Array<number | null>(width * height).fill(null);
  let cellIndex = 0;
  let stringIndex = 0;

  while (stringIndex < encoded.length && cellIndex < cells.length) {
    const char = encoded[stringIndex];

    if (char >= 'g' && char <= 'z') {
      cellIndex += parseInt(char, 36) - 15;
      stringIndex++;
      continue;
    }

    const [value, consumed] = readNumber16(encoded, stringIndex);
    if (consumed === 0) return null;
    cells[cellIndex] = value;
    cellIndex++;
    stringIndex += consumed;
  }

  if (cellIndex !== cells.length || stringIndex !== encoded.length) return null;

  return Array.from({ length: height }, (_, row) => cells.slice(row * width, (row + 1) * width));
}

function generateCompleteDominoSet(maxNumber: number): Array<[number, number]> {
  const dominoes: Array<[number, number]> = [];
  for (let left = 0; left <= maxNumber; left++) {
    for (let right = left; right <= maxNumber; right++) {
      dominoes.push([left, right]);
    }
  }
  return dominoes;
}

function parseCompactDominoSearchData(encoded: string, width: number, height: number): DominoSearchPuzzleData | null {
  const numbers = parseCompactNumberGrid(encoded, width, height);
  if (!numbers) return null;

  const flatNumbers = numbers.flat().filter((value): value is number => value !== null);
  if (flatNumbers.length === 0 || flatNumbers.length % 2 !== 0) return null;

  const maxNumber = Math.max(...flatNumbers);
  const dominoes = generateCompleteDominoSet(maxNumber);
  if (dominoes.length * 2 !== flatNumbers.length) return null;

  return { type: 'domino-search', width, height, numbers, dominoes };
}

export function parseDominoSearchLink(link: string): DominoSearchPuzzleData | null {
  try {
    const parts = parsePuzzLinkParts(link);
    if (parts[0] !== 'domino-search' || parts.length < 4) return null;

    const width = Number(parts[1]);
    const height = Number(parts[2]);
    if (!isPositiveGridSize(width, height)) return null;

    const encodedData = parts.slice(3).join('/');
    const payload = decodeCustomPayload<DominoSearchPayload>(encodedData);
    if (!payload) {
      return parseCompactDominoSearchData(encodedData, width, height);
    }

    const numbers = parseNumberMatrix(payload.numbers ?? payload.grid, width, height);
    const dominoes = parseDominoes(payload.dominoes ?? payload.pairs);
    if (!numbers || !dominoes) return null;

    return { type: 'domino-search', width, height, numbers, dominoes };
  } catch {
    return null;
  }
}

export function getDominoPairKey(left: number, right: number) {
  return `${Math.min(left, right)}-${Math.max(left, right)}`;
}

function addCount(counts: Map<string, number>, key: string, amount: number) {
  counts.set(key, (counts.get(key) ?? 0) + amount);
}

function edgeCells(edgeKey: string): Array<{ row: number; col: number }> | null {
  const edge = parseSolutionEdgeKey(edgeKey);
  if (!edge) return null;
  return [
    { row: edge.r1, col: edge.c1 },
    { row: edge.r2, col: edge.c2 },
  ];
}

export function normalizeDominoEdge(a: { row: number; col: number }, b: { row: number; col: number }) {
  return getEdgeKey({ r1: a.row, c1: a.col, r2: b.row, c2: b.col });
}

export function detectDominoSearchBoundaryHitTarget(
  x: number,
  y: number,
  width: number,
  height: number,
  cellSize: number
): DominoSearchBoundaryHitTarget {
  if (x < 0 || y < 0 || x > width * cellSize || y > height * cellSize) return null;

  const row = Math.max(0, Math.min(height - 1, Math.floor(y / cellSize)));
  const col = Math.max(0, Math.min(width - 1, Math.floor(x / cellSize)));
  const localX = x - col * cellSize;
  const localY = y - row * cellSize;
  const threshold = Math.max(7, cellSize * 0.16);

  const candidates: Array<{
    distance: number;
    cells: [{ row: number; col: number }, { row: number; col: number }];
  }> = [
    {
      distance: Math.abs(localY),
      cells: [{ row: row - 1, col }, { row, col }],
    },
    {
      distance: Math.abs(localY - cellSize),
      cells: [{ row, col }, { row: row + 1, col }],
    },
    {
      distance: Math.abs(localX),
      cells: [{ row, col: col - 1 }, { row, col }],
    },
    {
      distance: Math.abs(localX - cellSize),
      cells: [{ row, col }, { row, col: col + 1 }],
    },
  ]
    .filter(({ cells }) =>
      cells.every((cell) => cell.row >= 0 && cell.row < height && cell.col >= 0 && cell.col < width)
    )
    .sort((left, right) => left.distance - right.distance);

  const best = candidates[0];
  if (!best || best.distance > threshold) return null;

  return {
    key: normalizeDominoEdge(best.cells[0], best.cells[1]),
    cells: best.cells,
  };
}

export function validateDominoSearch(
  edges: string[],
  puzzle: DominoSearchPuzzleData
): DominoSearchValidationResult {
  const { width, height, numbers, dominoes } = puzzle;
  const badCells = new Set<string>();
  let message: string | undefined;
  const setMessage = (nextMessage: string) => {
    if (!message) message = nextMessage;
  };
  const degree = Array.from({ length: height }, () => Array(width).fill(0));
  const expectedCounts = new Map<string, number>();
  const actualCounts = new Map<string, number>();

  dominoes.forEach(([left, right]) => addCount(expectedCounts, getDominoPairKey(left, right), 1));

  for (const edgeKey of edges) {
    const cells = edgeCells(edgeKey);
    if (!cells || !areOrthogonallyAdjacent(cells[0], cells[1])) {
      setMessage('骨牌只能覆盖两个正交相邻的格子');
      continue;
    }

    if (
      cells.some((cell) => cell.row < 0 || cell.row >= height || cell.col < 0 || cell.col >= width)
    ) {
      setMessage('骨牌超出了盘面范围');
      continue;
    }

    const [a, b] = cells;
    const leftValue = numbers[a.row][a.col];
    const rightValue = numbers[b.row][b.col];
    if (leftValue === null || rightValue === null) {
      if (leftValue === null) badCells.add(getCellKey(a.row, a.col));
      if (rightValue === null) badCells.add(getCellKey(b.row, b.col));
      setMessage('骨牌不能覆盖空洞格');
      continue;
    }

    degree[a.row][a.col]++;
    degree[b.row][b.col]++;
    const key = getDominoPairKey(leftValue, rightValue);
    addCount(actualCounts, key, 1);
    if (!expectedCounts.has(key) || (actualCounts.get(key) ?? 0) > (expectedCounts.get(key) ?? 0)) {
      badCells.add(getCellKey(a.row, a.col));
      badCells.add(getCellKey(b.row, b.col));
      setMessage('存在不在目标列表中或重复使用的骨牌组合');
    }
  }

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      if (numbers[row][col] === null) continue;
      if (degree[row][col] !== 1) {
        badCells.add(getCellKey(row, col));
        setMessage('每个格子必须恰好属于一张骨牌');
      }
    }
  }

  for (const [key, expectedCount] of expectedCounts.entries()) {
    if ((actualCounts.get(key) ?? 0) !== expectedCount) {
      setMessage('目标骨牌组合尚未全部使用');
    }
  }

  return {
    valid: !message && badCells.size === 0,
    message,
    badCells: Array.from(badCells).map((key) => {
      const [row, col] = key.split(',').map(Number);
      return { row, col };
    }),
  };
}

export function countPlacedDominoPairs(edges: string[], numbers: (number | null)[][]) {
  const counts = new Map<string, number>();

  for (const edgeKey of edges) {
    const cells = edgeCells(edgeKey);
    if (!cells) continue;

    const [a, b] = cells;
    const leftValue = numbers[a.row]?.[a.col];
    const rightValue = numbers[b.row]?.[b.col];
    if (typeof leftValue !== 'number' || typeof rightValue !== 'number') continue;

    addCount(counts, getDominoPairKey(leftValue, rightValue), 1);
  }

  return counts;
}

export function solutionEdgesToKeys(edges: YajilinSolutionEdge[]) {
  return edges.map((edge) => getEdgeKey(edge));
}
