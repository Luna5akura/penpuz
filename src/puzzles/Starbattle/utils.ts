import type { StarbattlePuzzleData } from '../types';

export type StarbattleCellState = 0 | 1 | 2;
export type StarbattleEdgeOrientation = 'h' | 'v';

export interface StarbattleValidationResult {
  valid: boolean;
  message?: string;
  badCells: { r: number; c: number }[];
}

export type StarbattleHitTarget =
  | { kind: 'cell'; row: number; col: number }
  | { kind: 'edge'; key: string; orientation: StarbattleEdgeOrientation; row: number; col: number }
  | { kind: 'vertex'; key: string; row: number; col: number }
  | null;

export function createEmptyStarbattleGrid(width: number, height: number): StarbattleCellState[][] {
  return Array.from({ length: height }, () => Array(width).fill(0) as StarbattleCellState[]);
}

export function parseStarbattleLink(link: string): StarbattlePuzzleData | null {
  try {
    let dataPart = link.includes('?') ? link.split('?')[1] : link;
    if (dataPart.startsWith('p?')) dataPart = dataPart.slice(2);

    const parts = dataPart.split('/');
    if (parts[0] !== 'starbattle' || parts.length < 5) return null;

    const width = Number(parts[1]);
    const height = Number(parts[2]);
    const starsPerUnit = Number(parts[3]);
    const encodedBorders = parts.slice(4).join('/');
    if (
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      !Number.isFinite(starsPerUnit) ||
      width <= 0 ||
      height <= 0 ||
      starsPerUnit <= 0 ||
      !encodedBorders
    ) {
      return null;
    }

    const expectedBitCount = height * (width - 1) + (height - 1) * width;
    const expectedCharCount = Math.ceil(expectedBitCount / 5);
    if (encodedBorders.length < expectedCharCount) return null;

    const bits: number[] = [];
    for (const char of encodedBorders.slice(0, expectedCharCount)) {
      const value = parseInt(char, 32);
      if (!Number.isFinite(value)) return null;
      for (let bit = 4; bit >= 0; bit--) {
        bits.push((value >> bit) & 1);
      }
    }

    let bitIndex = 0;
    const verticalBorders = Array.from({ length: height }, () => Array(width - 1).fill(0));
    const horizontalBorders = Array.from({ length: height - 1 }, () => Array(width).fill(0));

    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width - 1; col++) {
        verticalBorders[row][col] = bits[bitIndex++] ?? 0;
      }
    }

    for (let row = 0; row < height - 1; row++) {
      for (let col = 0; col < width; col++) {
        horizontalBorders[row][col] = bits[bitIndex++] ?? 0;
      }
    }

    const regionIds = Array.from({ length: height }, () => Array(width).fill(-1));
    let regionId = 0;

    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        if (regionIds[row][col] !== -1) continue;

        const queue = [{ row, col }];
        regionIds[row][col] = regionId;

        for (let i = 0; i < queue.length; i++) {
          const current = queue[i];

          if (
            current.row > 0 &&
            horizontalBorders[current.row - 1][current.col] === 0 &&
            regionIds[current.row - 1][current.col] === -1
          ) {
            regionIds[current.row - 1][current.col] = regionId;
            queue.push({ row: current.row - 1, col: current.col });
          }

          if (
            current.row + 1 < height &&
            horizontalBorders[current.row][current.col] === 0 &&
            regionIds[current.row + 1][current.col] === -1
          ) {
            regionIds[current.row + 1][current.col] = regionId;
            queue.push({ row: current.row + 1, col: current.col });
          }

          if (
            current.col > 0 &&
            verticalBorders[current.row][current.col - 1] === 0 &&
            regionIds[current.row][current.col - 1] === -1
          ) {
            regionIds[current.row][current.col - 1] = regionId;
            queue.push({ row: current.row, col: current.col - 1 });
          }

          if (
            current.col + 1 < width &&
            verticalBorders[current.row][current.col] === 0 &&
            regionIds[current.row][current.col + 1] === -1
          ) {
            regionIds[current.row][current.col + 1] = regionId;
            queue.push({ row: current.row, col: current.col + 1 });
          }
        }

        regionId++;
      }
    }

    return {
      type: 'starbattle',
      width,
      height,
      starsPerUnit,
      regionIds,
    };
  } catch {
    return null;
  }
}

export function getStarbattleEdgeKey(
  orientation: StarbattleEdgeOrientation,
  row: number,
  col: number
) {
  return `${orientation}-${row}-${col}`;
}

export function parseStarbattleEdgeKey(key: string) {
  const match = key.match(/^([hv])-(\d+)-(\d+)$/);
  if (!match) return null;
  return {
    orientation: match[1] as StarbattleEdgeOrientation,
    row: Number(match[2]),
    col: Number(match[3]),
  };
}

export function getStarbattleVertexKey(row: number, col: number) {
  return `p-${row}-${col}`;
}

export function parseStarbattleVertexKey(key: string) {
  const match = key.match(/^p-(\d+)-(\d+)$/);
  if (!match) return null;
  return {
    row: Number(match[1]),
    col: Number(match[2]),
  };
}

export function getStarbattleBoundarySegments(regionIds: number[][], width: number, height: number) {
  const horizontal: Array<{ row: number; col: number }> = [];
  const vertical: Array<{ row: number; col: number }> = [];

  for (let row = 0; row <= height; row++) {
    for (let col = 0; col < width; col++) {
      const hasBoundary =
        row === 0 ||
        row === height ||
        regionIds[row - 1][col] !== regionIds[row][col];
      if (hasBoundary) {
        horizontal.push({ row, col });
      }
    }
  }

  for (let row = 0; row < height; row++) {
    for (let col = 0; col <= width; col++) {
      const hasBoundary =
        col === 0 ||
        col === width ||
        regionIds[row][col - 1] !== regionIds[row][col];
      if (hasBoundary) {
        vertical.push({ row, col });
      }
    }
  }

  return { horizontal, vertical };
}

export function validateStarbattle(
  grid: StarbattleCellState[][],
  puzzle: StarbattlePuzzleData
): StarbattleValidationResult {
  const { width, height, starsPerUnit, regionIds } = puzzle;
  const badCells = new Set<string>();
  const rowCounts = Array(height).fill(0);
  const colCounts = Array(width).fill(0);
  const regionCounts = new Map<number, number>();
  const rowStars = Array.from({ length: height }, () => [] as string[]);
  const colStars = Array.from({ length: width }, () => [] as string[]);
  const regionStars = new Map<number, string[]>();
  let adjacencyError = false;
  let countError = false;

  const markCell = (row: number, col: number) => {
    badCells.add(`${row},${col}`);
  };

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const regionId = regionIds[row][col];
      if (!regionCounts.has(regionId)) regionCounts.set(regionId, 0);
      if (!regionStars.has(regionId)) regionStars.set(regionId, []);

      if (grid[row][col] !== 1) continue;

      const cellKey = `${row},${col}`;
      rowCounts[row]++;
      colCounts[col]++;
      regionCounts.set(regionId, (regionCounts.get(regionId) ?? 0) + 1);
      rowStars[row].push(cellKey);
      colStars[col].push(cellKey);
      regionStars.get(regionId)!.push(cellKey);
    }
  }

  const neighborDeltas = [
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ] as const;

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      if (grid[row][col] !== 1) continue;

      for (const [dr, dc] of neighborDeltas) {
        const nextRow = row + dr;
        const nextCol = col + dc;
        if (nextRow < 0 || nextRow >= height || nextCol < 0 || nextCol >= width) continue;
        if (grid[nextRow][nextCol] !== 1) continue;
        adjacencyError = true;
        markCell(row, col);
        markCell(nextRow, nextCol);
      }
    }
  }

  for (let row = 0; row < height; row++) {
    if (rowCounts[row] === starsPerUnit) continue;
    countError = true;
    rowStars[row].forEach((cellKey) => badCells.add(cellKey));
  }

  for (let col = 0; col < width; col++) {
    if (colCounts[col] === starsPerUnit) continue;
    countError = true;
    colStars[col].forEach((cellKey) => badCells.add(cellKey));
  }

  for (const [regionId, count] of regionCounts.entries()) {
    if (count === starsPerUnit) continue;
    countError = true;
    (regionStars.get(regionId) ?? []).forEach((cellKey) => badCells.add(cellKey));
  }

  let message: string | undefined;
  if (adjacencyError && countError) {
    message = '星星之间有接触，或每行、每列、每个区域的星星数量不正确。';
  } else if (adjacencyError) {
    message = '星星之间不能横向、纵向或对角相邻。';
  } else if (countError) {
    message = '每行、每列、每个区域中的星星数量都必须等于右上角提示。';
  }

  return {
    valid: !adjacencyError && !countError,
    message,
    badCells: [...badCells].map((key) => {
      const [r, c] = key.split(',').map(Number);
      return { r, c };
    }),
  };
}

export function detectStarbattleHitTarget(
  x: number,
  y: number,
  width: number,
  height: number,
  cellSize: number
): StarbattleHitTarget {
  const boardWidth = width * cellSize;
  const boardHeight = height * cellSize;

  if (x < 0 || x > boardWidth || y < 0 || y > boardHeight) return null;

  const vertexThreshold = Math.max(8, cellSize * 0.16);
  const edgeThreshold = Math.max(8, cellSize * 0.14);

  const vertexRow = Math.round(y / cellSize);
  const vertexCol = Math.round(x / cellSize);
  if (
    vertexRow >= 0 &&
    vertexRow <= height &&
    vertexCol >= 0 &&
    vertexCol <= width &&
    Math.hypot(x - vertexCol * cellSize, y - vertexRow * cellSize) <= vertexThreshold
  ) {
    return {
      kind: 'vertex',
      key: getStarbattleVertexKey(vertexRow, vertexCol),
      row: vertexRow,
      col: vertexCol,
    };
  }

  let bestEdge:
    | { kind: 'edge'; key: string; orientation: StarbattleEdgeOrientation; row: number; col: number; distance: number }
    | null = null;

  const horizontalRow = Math.round(y / cellSize);
  const horizontalCol = Math.floor(x / cellSize);
  if (
    horizontalRow >= 0 &&
    horizontalRow <= height &&
    horizontalCol >= 0 &&
    horizontalCol < width &&
    Math.abs(y - horizontalRow * cellSize) <= edgeThreshold
  ) {
    bestEdge = {
      kind: 'edge',
      key: getStarbattleEdgeKey('h', horizontalRow, horizontalCol),
      orientation: 'h',
      row: horizontalRow,
      col: horizontalCol,
      distance: Math.abs(y - horizontalRow * cellSize),
    };
  }

  const verticalRow = Math.floor(y / cellSize);
  const verticalCol = Math.round(x / cellSize);
  if (
    verticalRow >= 0 &&
    verticalRow < height &&
    verticalCol >= 0 &&
    verticalCol <= width &&
    Math.abs(x - verticalCol * cellSize) <= edgeThreshold
  ) {
    const candidate = {
      kind: 'edge' as const,
      key: getStarbattleEdgeKey('v', verticalRow, verticalCol),
      orientation: 'v' as const,
      row: verticalRow,
      col: verticalCol,
      distance: Math.abs(x - verticalCol * cellSize),
    };
    if (!bestEdge || candidate.distance < bestEdge.distance) {
      bestEdge = candidate;
    }
  }

  if (bestEdge) {
    return {
      kind: 'edge',
      key: bestEdge.key,
      orientation: bestEdge.orientation,
      row: bestEdge.row,
      col: bestEdge.col,
    };
  }

  const row = Math.min(height - 1, Math.max(0, Math.floor(y / cellSize)));
  const col = Math.min(width - 1, Math.max(0, Math.floor(x / cellSize)));
  return { kind: 'cell', row, col };
}
