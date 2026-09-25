import type { MasyuCell, MasyuPuzzleData } from '../types';
import { parsePuzzLinkParts, isPositiveGridSize } from '../gridUtils';

export interface MasyuValidationResult {
  valid: boolean;
  message?: string;
  badCells: Array<{ row: number; col: number }>;
}

/**
 * pzpr link format: masyu/<w>/<h>/<number16 stream>.
 * Cell values 0 (empty), 1 (white circle), 2 (black circle); 'g'-'z' skip
 * empty cells (g = 1, …, z = 21), '.' marks an empty cell explicitly.
 */
export function parseMasyuLink(link: string): MasyuPuzzleData | null {
  try {
    const parts = parsePuzzLinkParts(link);
    if (parts[0]?.toLowerCase() !== 'masyu' || parts.length < 4) return null;
    const width = Number(parts[1]);
    const height = Number(parts[2]);
    if (!isPositiveGridSize(width, height) || width > 40 || height > 40) return null;
    const encoded = parts.slice(3).join('/').replace(/\/+$/u, '');
    if (!encoded) return null;

    const cells: MasyuCell[][] = Array.from({ length: height }, () => Array<MasyuCell>(width).fill(0));
    const cellCount = width * height;
    let cell = 0;
    let index = 0;

    while (index < encoded.length && cell < cellCount) {
      const char = encoded[index];
      if (char >= '0' && char <= '2') {
        cells[Math.floor(cell / width)][cell % width] = Number(char) as MasyuCell;
        cell += 1;
        index += 1;
      } else if (char >= '3' && char <= '9') {
        return null; // masyu cells only use 0/1/2
      } else if (char >= 'a' && char <= 'f') {
        return null;
      } else if (char >= 'g' && char <= 'z') {
        cell += Number.parseInt(char, 36) - 15;
        index += 1;
      } else if (char === '.') {
        cell += 1;
        index += 1;
      } else {
        return null;
      }
    }

    return { type: 'masyu', width, height, cells };
  } catch {
    return null;
  }
}

export function parseMasyuEdgeKey(key: string) {
  const match = key.match(/^(\d+),(\d+)-(\d+),(\d+)$/u);
  if (!match) return null;
  return {
    r1: Number(match[1]),
    c1: Number(match[2]),
    r2: Number(match[3]),
    c2: Number(match[4]),
  };
}

export function getMasyuEdgeKey(r1: number, c1: number, r2: number, c2: number): string | null {
  if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) return null;
  if (r1 < r2 || (r1 === r2 && c1 < c2)) {
    return `${r1},${c1}-${r2},${c2}`;
  }
  return `${r2},${c2}-${r1},${c1}`;
}

function getCellEdges(edges: Set<string>, row: number, col: number) {
  const north = `${row - 1},${col}-${row},${col}`;
  const south = `${row},${col}-${row + 1},${col}`;
  const west = `${row},${col - 1}-${row},${col}`;
  const east = `${row},${col}-${row},${col + 1}`;
  return {
    north: edges.has(north),
    south: edges.has(south),
    west: edges.has(west),
    east: edges.has(east),
  };
}

/** A cell is "straight" when its two loop edges are opposite. */
function isStraight(dirs: { north: boolean; south: boolean; west: boolean; east: boolean }) {
  return (dirs.north && dirs.south) || (dirs.west && dirs.east);
}

export function validateMasyu(
  lineEdges: Set<string>,
  puzzle: MasyuPuzzleData
): MasyuValidationResult {
  const { width, height, cells } = puzzle;
  const badCells = new Set<string>();
  let message: string | undefined;
  const setMessage = (nextMessage: string) => {
    if (!message) message = nextMessage;
  };

  if (lineEdges.size === 0) {
    return { valid: false, message: '需要画出通过所有圆圈的单一回路', badCells: [] };
  }

  // 1. Every vertex (cell) has degree 0 or 2, and the loop is a single cycle.
  const degree = new Map<string, number>();
  for (const key of lineEdges) {
    const edge = parseMasyuEdgeKey(key);
    if (!edge) {
      return { valid: false, message: '存档中存在无法识别的线段', badCells: [] };
    }
    const a = `${edge.r1},${edge.c1}`;
    const b = `${edge.r2},${edge.c2}`;
    degree.set(a, (degree.get(a) ?? 0) + 1);
    degree.set(b, (degree.get(b) ?? 0) + 1);
  }

  const loopCells: string[] = [];
  for (const [cell, d] of degree) {
    if (d !== 0 && d !== 2) {
      setMessage('回路不能分叉或在格子中交叉');
      const [row, col] = cell.split(',').map(Number);
      badCells.add(`${row},${col}`);
    }
    if (d > 0) loopCells.push(cell);
  }

  if (loopCells.length > 0) {
    const adjacency = new Map<string, string[]>();
    for (const key of lineEdges) {
      const edge = parseMasyuEdgeKey(key)!;
      const a = `${edge.r1},${edge.c1}`;
      const b = `${edge.r2},${edge.c2}`;
      if (!adjacency.has(a)) adjacency.set(a, []);
      if (!adjacency.has(b)) adjacency.set(b, []);
      adjacency.get(a)!.push(b);
      adjacency.get(b)!.push(a);
    }
    const start = loopCells[0];
    const seen = new Set<string>();
    let current = start;
    let previous: string | null = null;
    let steps = 0;
    let closed = false;
    while (steps <= loopCells.length) {
      seen.add(current);
      steps += 1;
      const neighbors = (adjacency.get(current) ?? []).filter((n) => n !== previous);
      const next = previous === null ? (neighbors[0] ?? null) : (neighbors.length === 1 ? neighbors[0] : null);
      if (next === null) break;
      previous = current;
      current = next;
      if (current === start) {
        closed = true;
        break;
      }
    }
    if (!closed || seen.size !== loopCells.length) {
      setMessage('需要画出单一闭合回路');
    }
  }

  // 2. Circle rules.
  const dirsCache = new Map<string, ReturnType<typeof getCellEdges>>();
  const cellDirs = (row: number, col: number) => {
    const key = `${row},${col}`;
    let dirs = dirsCache.get(key);
    if (!dirs) {
      dirs = getCellEdges(lineEdges, row, col);
      dirsCache.set(key, dirs);
    }
    return dirs;
  };
  const edgeCountOf = (dirs: ReturnType<typeof getCellEdges>) =>
    (dirs.north ? 1 : 0) + (dirs.south ? 1 : 0) + (dirs.west ? 1 : 0) + (dirs.east ? 1 : 0);

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const value = cells[row][col];
      if (value === 0) continue;
      const dirs = cellDirs(row, col);
      const count = edgeCountOf(dirs);
      if (count === 0) {
        badCells.add(`${row},${col}`);
        setMessage('每个圆圈都必须被回路通过');
        continue;
      }
      if (count !== 2) {
        badCells.add(`${row},${col}`);
        setMessage('圆圈上的回路必须恰好通过两条相邻线段');
        continue;
      }
      if (value === 1) {
        // White circle: the loop goes straight through.
        if (!isStraight(dirs)) {
          badCells.add(`${row},${col}`);
          setMessage('回路必须从白圈中直行穿过');
          continue;
        }
        const neighborRows = dirs.north ? [row - 1, row + 1] : [row, row];
        const neighborCols = dirs.north ? [col, col] : [col - 1, col + 1];
        const turnNeighbors = [0, 1].filter((i) => {
          const nr = neighborRows[i];
          const nc = neighborCols[i];
          if (nr < 0 || nr >= height || nc < 0 || nc >= width) return false;
          const nd = cellDirs(nr, nc);
          return edgeCountOf(nd) === 2 && !isStraight(nd);
        });
        if (turnNeighbors.length === 0) {
          badCells.add(`${row},${col}`);
          setMessage('白圈前后的格子中至少一个必须转弯');
        }
      } else {
        // Black circle: the loop turns in the cell.
        if (isStraight(dirs)) {
          badCells.add(`${row},${col}`);
          setMessage('回路必须在黑圈中转弯');
          continue;
        }
        // Both adjacent cells must go straight through.
        const candidates: Array<[number, number]> = [];
        if (dirs.north && dirs.east) candidates.push([row - 1, col], [row, col + 1]);
        if (dirs.north && dirs.west) candidates.push([row - 1, col], [row, col - 1]);
        if (dirs.south && dirs.east) candidates.push([row + 1, col], [row, col + 1]);
        if (dirs.south && dirs.west) candidates.push([row + 1, col], [row, col - 1]);
        for (const [nr, nc] of candidates) {
          if (nr < 0 || nr >= height || nc < 0 || nc >= width) continue;
          const nd = cellDirs(nr, nc);
          if (edgeCountOf(nd) === 2 && !isStraight(nd)) {
            badCells.add(`${row},${col}`);
            setMessage('黑圈前后的格子必须直行穿过');
            break;
          }
        }
      }
    }
  }

  if (message) {
    return {
      valid: false,
      message,
      badCells: Array.from(badCells).map((key) => {
        const [row, col] = key.split(',').map(Number);
        return { row, col };
      }),
    };
  }
  return { valid: true, badCells: [] };
}

export type MasyuHitTarget =
  | { kind: 'cell'; row: number; col: number }
  | { kind: 'edge'; key: string }
  | null;

export function detectMasyuHitTarget(
  x: number,
  y: number,
  width: number,
  height: number,
  cellSize: number
): MasyuHitTarget {
  const col = Math.floor(x / cellSize);
  const row = Math.floor(y / cellSize);
  if (row < 0 || row >= height || col < 0 || col >= width) return null;

  const localX = x - col * cellSize;
  const localY = y - row * cellSize;
  const centerHalf = cellSize * 0.26;
  const centerX = cellSize / 2;
  const centerY = cellSize / 2;

  if (Math.abs(localX - centerX) <= centerHalf && Math.abs(localY - centerY) <= centerHalf) {
    return { kind: 'cell', row, col };
  }

  const threshold = Math.max(8, cellSize * 0.18);
  const candidates = [
    {
      distance: Math.hypot(localX - centerX, localY),
      edgeKey: row > 0 ? getMasyuEdgeKey(row - 1, col, row, col) : null,
    },
    {
      distance: Math.hypot(localX - centerX, localY - cellSize),
      edgeKey: row + 1 < height ? getMasyuEdgeKey(row, col, row + 1, col) : null,
    },
    {
      distance: Math.hypot(localX, localY - centerY),
      edgeKey: col > 0 ? getMasyuEdgeKey(row, col - 1, row, col) : null,
    },
    {
      distance: Math.hypot(localX - cellSize, localY - centerY),
      edgeKey: col + 1 < width ? getMasyuEdgeKey(row, col, row, col + 1) : null,
    },
  ]
    .filter((item) => item.edgeKey !== null)
    .sort((a, b) => a.distance - b.distance) as Array<{ distance: number; edgeKey: string | null }>;

  if (candidates.length > 0 && candidates[0].distance <= threshold) {
    return { kind: 'edge', key: candidates[0].edgeKey as string };
  }
  return null;
}
