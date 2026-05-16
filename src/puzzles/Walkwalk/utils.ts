import type {
  WalkwalkClue,
  WalkwalkPuzzleData,
  YajilinSolutionEdge,
} from '../types';

export interface WalkwalkValidationResult {
  valid: boolean;
  message?: string;
  badCells: { r: number; c: number }[];
  badClueIndices: number[];
}

export type WalkwalkHitTarget =
  | { kind: 'cell'; row: number; col: number }
  | { kind: 'edge'; key: string; cells: [{ row: number; col: number }, { row: number; col: number }] }
  | null;

function extractWalkwalkDataPart(link: string) {
  let dataPart = link.includes('?') ? link.split('?')[1] : link;
  if (dataPart.startsWith('p?')) dataPart = dataPart.slice(2);
  return decodeURIComponent(dataPart);
}

function readNumber16(source: string, index: number): [number, number] {
  if (index >= source.length) return [-1, 0];
  const ch = source[index];
  if (/[0-9a-f]/.test(ch)) return [parseInt(ch, 16), 1];
  if (ch === '-') return index + 3 <= source.length ? [parseInt(source.slice(index + 1, index + 3), 16), 3] : [-1, 0];
  if (ch === '+') return index + 4 <= source.length ? [parseInt(source.slice(index + 1, index + 4), 16), 4] : [-1, 0];
  if (ch === '=') return index + 4 <= source.length ? [parseInt(source.slice(index + 1, index + 4), 16) + 4096, 4] : [-1, 0];
  if (ch === '%' || ch === '@') {
    return index + 4 <= source.length ? [parseInt(source.slice(index + 1, index + 4), 16) + 8192, 4] : [-1, 0];
  }
  if (ch === '*') return index + 5 <= source.length ? [parseInt(source.slice(index + 1, index + 5), 16) + 12240, 5] : [-1, 0];
  if (ch === '$') return index + 6 <= source.length ? [parseInt(source.slice(index + 1, index + 6), 16) + 77776, 6] : [-1, 0];
  return [-1, 0];
}

function decodeRegionIds(width: number, height: number, encodedBorders: string): number[][] | null {
  const expectedBitCount = height * (width - 1) + (height - 1) * width;
  const expectedCharCount = Math.ceil(expectedBitCount / 5);
  if (encodedBorders.length < expectedCharCount) return null;

  const bits: number[] = [];
  for (const char of encodedBorders.slice(0, expectedCharCount)) {
    const value = parseInt(char, 32);
    if (!Number.isFinite(value)) return null;
    for (let bit = 4; bit >= 0; bit -= 1) {
      bits.push((value >> bit) & 1);
    }
  }

  let bitIndex = 0;
  const verticalBorders = Array.from({ length: height }, () => Array(width - 1).fill(0));
  const horizontalBorders = Array.from({ length: height - 1 }, () => Array(width).fill(0));

  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width - 1; col += 1) {
      verticalBorders[row][col] = bits[bitIndex++] ?? 0;
    }
  }

  for (let row = 0; row < height - 1; row += 1) {
    for (let col = 0; col < width; col += 1) {
      horizontalBorders[row][col] = bits[bitIndex++] ?? 0;
    }
  }

  const regionIds = Array.from({ length: height }, () => Array(width).fill(-1));
  let regionId = 0;

  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width; col += 1) {
      if (regionIds[row][col] !== -1) continue;

      const queue = [{ row, col }];
      regionIds[row][col] = regionId;

      for (let index = 0; index < queue.length; index += 1) {
        const current = queue[index];

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

      regionId += 1;
    }
  }

  return regionIds;
}

function parseWalkwalkClues(clueData: string, width: number, height: number) {
  const clues: WalkwalkClue[] = [];
  const totalCells = width * height;
  let cellIndex = 0;
  let strIndex = 0;

  while (strIndex < clueData.length && cellIndex < totalCells) {
    const ch = clueData[strIndex];
    const [value, consumed] = readNumber16(clueData, strIndex);

    if (value >= 0) {
      clues.push({
        row: Math.floor(cellIndex / width),
        col: cellIndex % width,
        value,
      });
      cellIndex += 1;
      strIndex += consumed;
      continue;
    }

    if (ch >= 'g' && ch <= 'z') {
      cellIndex += parseInt(ch, 36) - 15;
      strIndex += 1;
      continue;
    }

    strIndex += 1;
  }

  return clues;
}

export function parseWalkwalkLink(link: string): WalkwalkPuzzleData | null {
  try {
    const parts = extractWalkwalkDataPart(link).split('/');
    if (parts[0] !== 'walkwalk' || parts.length < 4) return null;

    const width = Number(parts[1]);
    const height = Number(parts[2]);
    const encodedData = parts.slice(3).join('/');
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      return null;
    }

    const expectedBitCount = height * (width - 1) + (height - 1) * width;
    const expectedCharCount = Math.ceil(expectedBitCount / 5);
    if (!encodedData || encodedData.length < expectedCharCount) return null;

    const regionIds = decodeRegionIds(width, height, encodedData.slice(0, expectedCharCount));
    if (!regionIds) return null;

    return {
      type: 'walkwalk',
      width,
      height,
      regionIds,
      clues: parseWalkwalkClues(encodedData.slice(expectedCharCount), width, height),
    };
  } catch {
    return null;
  }
}

export function getWalkwalkEdgeKey(r1: number, c1: number, r2: number, c2: number): string | null {
  if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) return null;
  if (r1 < r2 || (r1 === r2 && c1 < c2)) {
    return `${r1},${c1}-${r2},${c2}`;
  }
  return `${r2},${c2}-${r1},${c1}`;
}

export function parseWalkwalkEdgeKey(key: string) {
  const match = key.match(/^(\d+),(\d+)-(\d+),(\d+)$/);
  if (!match) return null;
  return {
    r1: Number(match[1]),
    c1: Number(match[2]),
    r2: Number(match[3]),
    c2: Number(match[4]),
  };
}

export function createWalkwalkEdgeSet(edges: YajilinSolutionEdge[]) {
  return new Set(
    edges
      .map((edge) => getWalkwalkEdgeKey(edge.r1, edge.c1, edge.r2, edge.c2))
      .filter((key): key is string => key !== null)
  );
}

export function getWalkwalkBoundarySegments(regionIds: number[][], width: number, height: number) {
  const horizontal: Array<{ row: number; col: number }> = [];
  const vertical: Array<{ row: number; col: number }> = [];

  for (let row = 0; row <= height; row += 1) {
    for (let col = 0; col < width; col += 1) {
      if (row === 0 || row === height || regionIds[row - 1][col] !== regionIds[row][col]) {
        horizontal.push({ row, col });
      }
    }
  }

  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col <= width; col += 1) {
      if (col === 0 || col === width || regionIds[row][col - 1] !== regionIds[row][col]) {
        vertical.push({ row, col });
      }
    }
  }

  return { horizontal, vertical };
}

export function detectWalkwalkHitTarget(
  x: number,
  y: number,
  width: number,
  height: number,
  cellSize: number
): WalkwalkHitTarget {
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
  const candidates: Array<{
    distance: number;
    edgeKey: string | null;
    cells: [{ row: number; col: number }, { row: number; col: number }];
  }> = [
    {
      distance: Math.hypot(localX - centerX, localY),
      edgeKey: row > 0 ? getWalkwalkEdgeKey(row - 1, col, row, col) : null,
      cells: [{ row: row - 1, col }, { row, col }],
    },
    {
      distance: Math.hypot(localX - centerX, localY - cellSize),
      edgeKey: row + 1 < height ? getWalkwalkEdgeKey(row, col, row + 1, col) : null,
      cells: [{ row, col }, { row: row + 1, col }],
    },
    {
      distance: Math.hypot(localX, localY - centerY),
      edgeKey: col > 0 ? getWalkwalkEdgeKey(row, col - 1, row, col) : null,
      cells: [{ row, col: col - 1 }, { row, col }],
    },
    {
      distance: Math.hypot(localX - cellSize, localY - centerY),
      edgeKey: col + 1 < width ? getWalkwalkEdgeKey(row, col, row, col + 1) : null,
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

function cellKey(row: number, col: number) {
  return `${row},${col}`;
}

function parseCellKey(key: string) {
  const [row, col] = key.split(',').map(Number);
  return { row, col };
}

function getWalkwalkClueSegment(
  clue: WalkwalkClue,
  adjacency: Map<string, Set<string>>,
  regionIds: number[][]
) {
  const startKey = cellKey(clue.row, clue.col);
  const targetRegion = regionIds[clue.row][clue.col];
  const segmentKeys = new Set<string>([startKey]);
  const neighbors = Array.from(adjacency.get(startKey) ?? []);

  const extend = (previousKey: string, currentKey: string | undefined) => {
    let prev = previousKey;
    let current = currentKey;

    while (current) {
      const currentCell = parseCellKey(current);
      if (regionIds[currentCell.row][currentCell.col] !== targetRegion) break;
      if (segmentKeys.has(current)) break;

      segmentKeys.add(current);

      const nextCandidates = Array.from(adjacency.get(current) ?? []).filter((key) => key !== prev);
      if (nextCandidates.length !== 1) break;
      prev = current;
      current = nextCandidates[0];
    }
  };

  neighbors.forEach((neighborKey) => {
    extend(startKey, neighborKey);
  });

  return Array.from(segmentKeys).map(parseCellKey);
}

export function validateWalkwalk(
  lineEdges: Set<string>,
  puzzle: WalkwalkPuzzleData
): WalkwalkValidationResult {
  const { width, height, clues, regionIds } = puzzle;
  const badCells = new Set<string>();
  const badClues = new Set<number>();
  let message: string | undefined;

  const setMessage = (nextMessage: string) => {
    if (!message) message = nextMessage;
  };

  const degree = Array.from({ length: height }, () => Array(width).fill(0));
  const adjacency = new Map<string, Set<string>>();
  const ensureAdjacency = (key: string) => {
    if (!adjacency.has(key)) adjacency.set(key, new Set());
  };

  for (const key of lineEdges) {
    const edge = parseWalkwalkEdgeKey(key);
    if (!edge) continue;
    const endpoints = [
      { row: edge.r1, col: edge.c1 },
      { row: edge.r2, col: edge.c2 },
    ];

    endpoints.forEach((cell) => {
      degree[cell.row][cell.col] += 1;
      ensureAdjacency(cellKey(cell.row, cell.col));
    });

    const key1 = cellKey(edge.r1, edge.c1);
    const key2 = cellKey(edge.r2, edge.c2);
    adjacency.get(key1)!.add(key2);
    adjacency.get(key2)!.add(key1);
  }

  const usedCells = Array.from({ length: height }, () => Array(width).fill(false));
  const loopCells: string[] = [];

  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width; col += 1) {
      if (degree[row][col] === 0) continue;
      usedCells[row][col] = true;
      loopCells.push(cellKey(row, col));
      if (degree[row][col] !== 2) {
        badCells.add(cellKey(row, col));
        setMessage('回路不能分叉，也不能出现断头线段');
      }
    }
  }

  clues.forEach((clue, index) => {
    if (degree[clue.row][clue.col] === 2) return;
    badCells.add(cellKey(clue.row, clue.col));
    badClues.add(index);
    setMessage('单一回路必须经过所有数字');
  });

  if (loopCells.length === 0) {
    return {
      valid: false,
      message: message ?? '请先画出经过所有数字的单一回路',
      badCells: Array.from(badCells).map((key) => {
        const [r, c] = key.split(',').map(Number);
        return { r, c };
      }),
      badClues: Array.from(badClues),
    };
  }

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

  if (visited.size !== loopCells.length) {
    loopCells.forEach((key) => {
      if (visited.has(key)) return;
      badCells.add(key);
    });
    setMessage('所有线段必须连成一条单一回路');
  }

  clues.forEach((clue, index) => {
    if (!usedCells[clue.row][clue.col]) return;
    const segment = getWalkwalkClueSegment(clue, adjacency, regionIds);
    if (segment.length === clue.value) return;

    segment.forEach((cell) => badCells.add(cellKey(cell.row, cell.col)));
    badCells.add(cellKey(clue.row, clue.col));
    badClues.add(index);
    setMessage('数字表示回路在该区域内连续经过的格子数量');
  });

  return {
    valid: badCells.size === 0 && badClues.size === 0,
    message,
    badCells: Array.from(badCells).map((key) => {
      const [r, c] = key.split(',').map(Number);
      return { r, c };
    }),
    badClues: Array.from(badClues),
  };
}
