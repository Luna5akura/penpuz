import type {
  YajilinClue,
  YajilinPuzzleData,
  YajilinDirection,
  YajilinSolutionEdge,
} from '../types';

export type YajilinCellState = 0 | 1 | 2;

export interface YajilinValidationResult {
  valid: boolean;
  message?: string;
  badCells: { r: number; c: number }[];
  badClueIndices: number[];
}

export type YajilinHitTarget =
  | { kind: 'cell'; row: number; col: number }
  | { kind: 'edge'; key: string; cells: [{ row: number; col: number }, { row: number; col: number }] }
  | null;

export const YAJILIN_ARROWS: Record<YajilinDirection, string> = {
  up: '↑',
  right: '→',
  down: '↓',
  left: '←',
};

function readNumber16(bstr: string, i: number): [number, number] {
  if (i >= bstr.length) return [-1, 0];
  const ch = bstr[i];
  if (/[0-9a-f]/.test(ch)) return [parseInt(ch, 16), 1];
  if (ch === '-') return i + 3 <= bstr.length ? [parseInt(bstr.slice(i + 1, i + 3), 16), 3] : [-1, 0];
  if (ch === '+') return i + 4 <= bstr.length ? [parseInt(bstr.slice(i + 1, i + 4), 16), 4] : [-1, 0];
  if (ch === '=') return i + 4 <= bstr.length ? [parseInt(bstr.slice(i + 1, i + 4), 16) + 4096, 4] : [-1, 0];
  if (ch === '%') return i + 4 <= bstr.length ? [parseInt(bstr.slice(i + 1, i + 4), 16) + 8192, 4] : [-1, 0];
  if (ch === '.') return [-2, 1];
  return [-1, 0];
}

function mapYajilinDirection(code: string): YajilinDirection | null {
  if (code === '1') return 'up';
  if (code === '2') return 'down';
  if (code === '3') return 'left';
  if (code === '4') return 'right';
  return null;
}

export function parseYajilinLink(link: string): YajilinPuzzleData | null {
  try {
    let dataPart = link.includes('?') ? link.split('?')[1] : link;
    if (dataPart.startsWith('p?')) dataPart = dataPart.slice(2);

    const parts = dataPart.split('/');
    if (parts[0] !== 'yajilin' || parts.length < 4) return null;

    const width = Number(parts[1]);
    const height = Number(parts[2]);
    const dataStr = parts.slice(3).join('/');
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0 || !dataStr) {
      return null;
    }

    const clues: YajilinClue[] = [];
    const totalCells = width * height;
    let cellIndex = 0;
    let strIndex = 0;

    while (strIndex < dataStr.length && cellIndex < totalCells) {
      const ch = dataStr[strIndex];

      if (/[a-z]/.test(ch)) {
        cellIndex += parseInt(ch, 36) - 9;
        strIndex++;
        continue;
      }

      const direction = mapYajilinDirection(ch);
      if (!direction) return null;

      const [value, consumed] = readNumber16(dataStr, strIndex + 1);
      if (consumed <= 0) return null;

      const row = Math.floor(cellIndex / width);
      const col = cellIndex % width;
      clues.push({
        row,
        col,
        direction,
        value: value === -2 ? '?' : value,
      });

      cellIndex++;
      strIndex += consumed + 1;
    }

    return {
      type: 'yajilin',
      width,
      height,
      clues,
    };
  } catch {
    return null;
  }
}

export function getYajilinEdgeKey(
  r1: number,
  c1: number,
  r2: number,
  c2: number
): string | null {
  if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) return null;
  if (r1 < r2 || (r1 === r2 && c1 < c2)) {
    return `${r1},${c1}-${r2},${c2}`;
  }
  return `${r2},${c2}-${r1},${c1}`;
}

export function parseYajilinEdgeKey(key: string) {
  const match = key.match(/^(\d+),(\d+)-(\d+),(\d+)$/);
  if (!match) return null;
  return {
    r1: Number(match[1]),
    c1: Number(match[2]),
    r2: Number(match[3]),
    c2: Number(match[4]),
  };
}

export function createYajilinEdgeSet(edges: YajilinSolutionEdge[]) {
  return new Set(
    edges
      .map((edge) => getYajilinEdgeKey(edge.r1, edge.c1, edge.r2, edge.c2))
      .filter((key): key is string => key !== null)
  );
}

export function createEmptyYajilinGrid(width: number, height: number): YajilinCellState[][] {
  return Array.from({ length: height }, () => Array(width).fill(0) as YajilinCellState[]);
}

export function getIncidentYajilinEdgeKeys(
  row: number,
  col: number,
  width: number,
  height: number
) {
  return [
    getYajilinEdgeKey(row, col, row - 1, col),
    getYajilinEdgeKey(row, col, row + 1, col),
    getYajilinEdgeKey(row, col, row, col - 1),
    getYajilinEdgeKey(row, col, row, col + 1),
  ].filter((key): key is string => {
    if (!key) return false;
    const parsed = parseYajilinEdgeKey(key);
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

function clueKey(row: number, col: number) {
  return `${row},${col}`;
}

function directionDelta(direction: YajilinDirection) {
  if (direction === 'up') return { dr: -1, dc: 0 };
  if (direction === 'right') return { dr: 0, dc: 1 };
  if (direction === 'down') return { dr: 1, dc: 0 };
  return { dr: 0, dc: -1 };
}

function countShadedCellsInDirection(
  grid: YajilinCellState[][],
  clue: YajilinClue,
  width: number,
  height: number
) {
  const { dr, dc } = directionDelta(clue.direction);
  let row = clue.row + dr;
  let col = clue.col + dc;
  let count = 0;

  while (row >= 0 && row < height && col >= 0 && col < width) {
    if (grid[row][col] === 1) count++;
    row += dr;
    col += dc;
  }

  return count;
}

export function validateYajilin(
  grid: YajilinCellState[][],
  loopEdges: Set<string>,
  clues: YajilinClue[],
  width: number,
  height: number
): YajilinValidationResult {
  const badCells = new Set<string>();
  const badClues = new Set<number>();
  const clueCells = new Set(clues.map((clue) => clueKey(clue.row, clue.col)));
  const degree = Array.from({ length: height }, () => Array(width).fill(0));
  const adjacency = new Map<string, Set<string>>();
  const addBadCell = (row: number, col: number) => badCells.add(clueKey(row, col));

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (grid[r][c] !== 1) continue;

      if (clueCells.has(clueKey(r, c))) addBadCell(r, c);

      if (r + 1 < height && grid[r + 1][c] === 1) {
        addBadCell(r, c);
        addBadCell(r + 1, c);
      }
      if (c + 1 < width && grid[r][c + 1] === 1) {
        addBadCell(r, c);
        addBadCell(r, c + 1);
      }
    }
  }

  clues.forEach((clue, index) => {
    if (grid[clue.row][clue.col] === 1) badClues.add(index);
    if (clue.value === '?') return;
    if (countShadedCellsInDirection(grid, clue, width, height) !== clue.value) {
      badClues.add(index);
    }
  });

  for (const key of loopEdges) {
    const edge = parseYajilinEdgeKey(key);
    if (!edge) continue;

    const endpoints = [
      { row: edge.r1, col: edge.c1 },
      { row: edge.r2, col: edge.c2 },
    ];

    for (const endpoint of endpoints) {
      degree[endpoint.row][endpoint.col]++;
      const pointKey = clueKey(endpoint.row, endpoint.col);
      if (!adjacency.has(pointKey)) adjacency.set(pointKey, new Set());
    }

    const key1 = clueKey(edge.r1, edge.c1);
    const key2 = clueKey(edge.r2, edge.c2);
    adjacency.get(key1)!.add(key2);
    adjacency.get(key2)!.add(key1);

    for (const endpoint of endpoints) {
      if (clueCells.has(clueKey(endpoint.row, endpoint.col)) || grid[endpoint.row][endpoint.col] === 1) {
        addBadCell(endpoint.row, endpoint.col);
      }
    }
  }

  const loopCells: string[] = [];

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      const currentKey = clueKey(r, c);
      const isClueCell = clueCells.has(currentKey);
      const isShaded = grid[r][c] === 1;
      const expectedLoopCell = !isClueCell && !isShaded;

      if (expectedLoopCell) {
        loopCells.push(currentKey);
        if (degree[r][c] !== 2) addBadCell(r, c);
      } else if (degree[r][c] !== 0) {
        addBadCell(r, c);
      }
    }
  }

  if (loopCells.length > 0) {
    const visited = new Set<string>();
    const stack = [loopCells[0]];
    visited.add(loopCells[0]);

    while (stack.length > 0) {
      const current = stack.pop()!;
      for (const next of adjacency.get(current) ?? []) {
        if (!visited.has(next)) {
          visited.add(next);
          stack.push(next);
        }
      }
    }

    for (const cell of loopCells) {
      if (!visited.has(cell)) {
        const [row, col] = cell.split(',').map(Number);
        addBadCell(row, col);
      }
    }
  }

  const hasAnyBadCell = badCells.size > 0;
  const hasAnyBadClue = badClues.size > 0;
  const valid = !hasAnyBadCell && !hasAnyBadClue;

  let message: string | undefined;
  if (badClues.size > 0) {
    message = '箭头数字与涂黑格数量不匹配，或线索格被错误使用。';
  } else if (badCells.size > 0) {
    message = '回路、黑格或经过的格子不满足 Yajilin 规则。';
  }

  return {
    valid,
    message,
    badCells: [...badCells].map((key) => {
      const [r, c] = key.split(',').map(Number);
      return { r, c };
    }),
    badClueIndices: [...badClues].sort((a, b) => a - b),
  };
}

export function detectYajilinHitTarget(
  x: number,
  y: number,
  width: number,
  height: number,
  cellSize: number,
  gap: number
): YajilinHitTarget {
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
      edgeKey: row > 0 ? getYajilinEdgeKey(row - 1, col, row, col) : null,
      cells: [{ row: row - 1, col }, { row, col }],
    },
    {
      distance: Math.hypot(localX - centerX, localY - cellSize),
      edgeKey: row + 1 < height ? getYajilinEdgeKey(row, col, row + 1, col) : null,
      cells: [{ row, col }, { row: row + 1, col }],
    },
    {
      distance: Math.hypot(localX, localY - centerY),
      edgeKey: col > 0 ? getYajilinEdgeKey(row, col - 1, row, col) : null,
      cells: [{ row, col: col - 1 }, { row, col }],
    },
    {
      distance: Math.hypot(localX - cellSize, localY - centerY),
      edgeKey: col + 1 < width ? getYajilinEdgeKey(row, col, row, col + 1) : null,
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
