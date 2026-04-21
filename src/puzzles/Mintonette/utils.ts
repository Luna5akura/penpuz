import type {
  MintonetteClue,
  MintonettePuzzleData,
  MintonetteSolutionEdge,
} from '../types';

export interface MintonetteValidationResult {
  valid: boolean;
  message?: string;
  badCells: { r: number; c: number }[];
  badClues: number[];
}

export type MintonetteHitTarget =
  | { kind: 'cell'; row: number; col: number }
  | { kind: 'edge'; key: string; cells: [{ row: number; col: number }, { row: number; col: number }] }
  | null;

function readNumber16(source: string, index: number): [number | null, number] {
  if (index >= source.length) return [null, 0];
  const ch = source[index];
  if (/[0-9a-f]/.test(ch)) return [parseInt(ch, 16), 1];
  if (ch === '-') {
    return index + 3 <= source.length ? [parseInt(source.slice(index + 1, index + 3), 16), 3] : [null, 0];
  }
  return [null, 0];
}

export function parseMintonetteLink(link: string): MintonettePuzzleData | null {
  try {
    let dataPart = link.includes('?') ? link.split('?')[1] : link;
    if (dataPart.startsWith('p?')) dataPart = dataPart.slice(2);

    const parts = dataPart.split('/');
    if (parts[0] !== 'mintonette' || parts.length < 4) return null;

    const width = Number(parts[1]);
    const height = Number(parts[2]);
    const dataStr = parts.slice(3).join('/');
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0 || !dataStr) {
      return null;
    }

    const clues: MintonetteClue[] = [];
    const totalCells = width * height;
    let cellIndex = 0;
    let strIndex = 0;

    while (strIndex < dataStr.length && cellIndex < totalCells) {
      const ch = dataStr[strIndex];

      if (ch >= 'g' && ch <= 'z') {
        cellIndex += parseInt(ch, 36) - 15;
        strIndex += 1;
        continue;
      }

      const row = Math.floor(cellIndex / width);
      const col = cellIndex % width;

      if (ch === '.') {
        clues.push({ row, col, value: null });
        cellIndex += 1;
        strIndex += 1;
        continue;
      }

      const [value, consumed] = readNumber16(dataStr, strIndex);
      if (consumed <= 0 || value === null) return null;

      clues.push({ row, col, value });
      cellIndex += 1;
      strIndex += consumed;
    }

    return {
      type: 'mintonette',
      width,
      height,
      clues,
    };
  } catch {
    return null;
  }
}

export function getMintonetteEdgeKey(r1: number, c1: number, r2: number, c2: number): string | null {
  if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) return null;
  if (r1 < r2 || (r1 === r2 && c1 < c2)) {
    return `${r1},${c1}-${r2},${c2}`;
  }
  return `${r2},${c2}-${r1},${c1}`;
}

export function parseMintonetteEdgeKey(key: string) {
  const match = key.match(/^(\d+),(\d+)-(\d+),(\d+)$/);
  if (!match) return null;
  return {
    r1: Number(match[1]),
    c1: Number(match[2]),
    r2: Number(match[3]),
    c2: Number(match[4]),
  };
}

export function createMintonetteEdgeSet(edges: MintonetteSolutionEdge[]) {
  return new Set(
    edges
      .map((edge) => getMintonetteEdgeKey(edge.r1, edge.c1, edge.r2, edge.c2))
      .filter((key): key is string => key !== null)
  );
}

export function detectMintonetteHitTarget(
  x: number,
  y: number,
  width: number,
  height: number,
  cellSize: number
): MintonetteHitTarget {
  const col = Math.floor(x / cellSize);
  const row = Math.floor(y / cellSize);
  if (row < 0 || row >= height || col < 0 || col >= width) return null;

  const localX = x - col * cellSize;
  const localY = y - row * cellSize;
  if (localX < 0 || localX > cellSize || localY < 0 || localY > cellSize) return null;

  const centerHalf = cellSize * 0.26;
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
      edgeKey: row > 0 ? getMintonetteEdgeKey(row - 1, col, row, col) : null,
      cells: [{ row: row - 1, col }, { row, col }],
    },
    {
      distance: Math.hypot(localX - centerX, localY - cellSize),
      edgeKey: row + 1 < height ? getMintonetteEdgeKey(row, col, row + 1, col) : null,
      cells: [{ row, col }, { row: row + 1, col }],
    },
    {
      distance: Math.hypot(localX, localY - centerY),
      edgeKey: col > 0 ? getMintonetteEdgeKey(row, col - 1, row, col) : null,
      cells: [{ row, col: col - 1 }, { row, col }],
    },
    {
      distance: Math.hypot(localX - cellSize, localY - centerY),
      edgeKey: col + 1 < width ? getMintonetteEdgeKey(row, col, row, col + 1) : null,
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

function clueKey(row: number, col: number) {
  return `${row},${col}`;
}

function getDirection(from: { r: number; c: number }, to: { r: number; c: number }) {
  return `${to.r - from.r},${to.c - from.c}`;
}

function countTurnsInPath(path: { r: number; c: number }[]) {
  let turns = 0;
  for (let index = 1; index < path.length - 1; index += 1) {
    const prevDir = getDirection(path[index - 1], path[index]);
    const nextDir = getDirection(path[index], path[index + 1]);
    if (prevDir !== nextDir) turns += 1;
  }
  return turns;
}

export function validateMintonette(
  lineEdges: Set<string>,
  puzzle: MintonettePuzzleData
): MintonetteValidationResult {
  const { width, height, clues } = puzzle;
  const clueMap = new Map<string, { clue: MintonetteClue; index: number }>();
  clues.forEach((clue, index) => clueMap.set(clueKey(clue.row, clue.col), { clue, index }));

  const badCells = new Set<string>();
  const badClues = new Set<number>();
  let message: string | undefined;

  const setMessage = (nextMessage: string) => {
    if (!message) message = nextMessage;
  };

  const degree = Array.from({ length: height }, () => Array(width).fill(0));
  const adjacency = new Map<string, Set<string>>();

  const addAdjacency = (from: string, to: string) => {
    const neighbors = adjacency.get(from) ?? new Set<string>();
    neighbors.add(to);
    adjacency.set(from, neighbors);
  };

  for (const key of lineEdges) {
    const edge = parseMintonetteEdgeKey(key);
    if (!edge) continue;
    degree[edge.r1][edge.c1] += 1;
    degree[edge.r2][edge.c2] += 1;
    addAdjacency(`${edge.r1},${edge.c1}`, `${edge.r2},${edge.c2}`);
    addAdjacency(`${edge.r2},${edge.c2}`, `${edge.r1},${edge.c1}`);
  }

  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width; col += 1) {
      const clueInfo = clueMap.get(clueKey(row, col));
      const expectedDegree = clueInfo ? 1 : 2;
      if (degree[row][col] === expectedDegree) continue;

      badCells.add(`${row},${col}`);
      if (clueInfo) badClues.add(clueInfo.index);
      setMessage(clueInfo ? '所有圆圈都必须作为线段端点' : '所有格子都必须被线段使用');
    }
  }

  const visited = new Set<string>();

  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width; col += 1) {
      const startKey = `${row},${col}`;
      if (visited.has(startKey) || degree[row][col] === 0) continue;

      const stack = [startKey];
      const component: { r: number; c: number }[] = [];

      while (stack.length > 0) {
        const currentKey = stack.pop()!;
        if (visited.has(currentKey)) continue;
        visited.add(currentKey);
        const [rStr, cStr] = currentKey.split(',');
        const current = { r: Number(rStr), c: Number(cStr) };
        component.push(current);
        (adjacency.get(currentKey) ?? new Set<string>()).forEach((neighbor) => {
          if (!visited.has(neighbor)) stack.push(neighbor);
        });
      }

      const componentClues = component
        .map((cell) => ({ cell, clueInfo: clueMap.get(`${cell.r},${cell.c}`) ?? null }))
        .filter((item) => item.clueInfo !== null);
      const endpoints = component.filter((cell) => degree[cell.r][cell.c] === 1);

      if (componentClues.length !== 2 || endpoints.length !== 2) {
        component.forEach((cell) => badCells.add(`${cell.r},${cell.c}`));
        componentClues.forEach(({ clueInfo }) => badClues.add(clueInfo!.index));
        setMessage('每条线都必须恰好连接两个圆圈');
        continue;
      }

      if (!endpoints.every((cell) => clueMap.has(`${cell.r},${cell.c}`))) {
        component.forEach((cell) => badCells.add(`${cell.r},${cell.c}`));
        setMessage('只有圆圈格可以作为线段的端点');
        continue;
      }

      const path: { r: number; c: number }[] = [];
      let previousKey: string | null = null;
      let currentKey = `${endpoints[0].r},${endpoints[0].c}`;

      while (currentKey) {
        const [rStr, cStr] = currentKey.split(',');
        path.push({ r: Number(rStr), c: Number(cStr) });
        if (currentKey === `${endpoints[1].r},${endpoints[1].c}`) break;

        const nextNeighbors = [...(adjacency.get(currentKey) ?? new Set<string>())]
          .filter((neighbor) => neighbor !== previousKey);
        if (nextNeighbors.length !== 1) {
          component.forEach((cell) => badCells.add(`${cell.r},${cell.c}`));
          setMessage('线段不能分叉或形成自交');
          break;
        }

        previousKey = currentKey;
        [currentKey] = nextNeighbors;
      }

      if (path.length !== component.length) {
        component.forEach((cell) => badCells.add(`${cell.r},${cell.c}`));
        setMessage('线段不能形成闭环');
        continue;
      }

      const turnCount = countTurnsInPath(path);
      componentClues.forEach(({ cell, clueInfo }) => {
        if (clueInfo?.clue.value === null || clueInfo?.clue.value === turnCount) return;
        badCells.add(`${cell.r},${cell.c}`);
        badClues.add(clueInfo.index);
        setMessage('数字表示这条线到达另一端之前必须拐弯的次数');
      });
    }
  }

  return {
    valid: badCells.size === 0 && badClues.size === 0,
    message,
    badCells: [...badCells].map((entry) => {
      const [r, c] = entry.split(',').map(Number);
      return { r, c };
    }),
    badClues: [...badClues],
  };
}
