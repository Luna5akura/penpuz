import type { NikojiPuzzleData } from '../types';

export interface NikojiValidationResult {
  valid: boolean;
  message?: string;
  badCells: { r: number; c: number }[];
}

type RegionInfo = {
  regionId: number;
  cells: { r: number; c: number }[];
  letter: string;
  shapeKey: string;
  clueOffsetKey: string;
  canonicalShapeKey: string;
};

function normalizePointList(points: Array<[number, number]>) {
  const minRow = Math.min(...points.map(([row]) => row));
  const minCol = Math.min(...points.map(([, col]) => col));
  return points
    .map(([row, col]) => [row - minRow, col - minCol] as const)
    .sort((a, b) => (a[0] - b[0]) || (a[1] - b[1]));
}

function stringifyPointList(points: ReadonlyArray<readonly [number, number]>) {
  return points.map(([row, col]) => `${row},${col}`).join(';');
}

function getCanonicalShapeKey(cells: { r: number; c: number }[]) {
  const points = cells.map((cell) => [cell.r, cell.c] as [number, number]);
  const transforms = [
    ([row, col]: [number, number]) => [row, col] as [number, number],
    ([row, col]: [number, number]) => [row, -col] as [number, number],
    ([row, col]: [number, number]) => [-row, col] as [number, number],
    ([row, col]: [number, number]) => [-row, -col] as [number, number],
    ([row, col]: [number, number]) => [col, row] as [number, number],
    ([row, col]: [number, number]) => [col, -row] as [number, number],
    ([row, col]: [number, number]) => [-col, row] as [number, number],
    ([row, col]: [number, number]) => [-col, -row] as [number, number],
  ];

  return transforms
    .map((transform) => stringifyPointList(normalizePointList(points.map(transform))))
    .sort()[0];
}

function getShapeKey(cells: { r: number; c: number }[]) {
  return stringifyPointList(normalizePointList(cells.map((cell) => [cell.r, cell.c] as [number, number])));
}

function getClueOffsetKey(cells: { r: number; c: number }[], clueCell: { r: number; c: number }) {
  const minRow = Math.min(...cells.map((cell) => cell.r));
  const minCol = Math.min(...cells.map((cell) => cell.c));
  return `${clueCell.r - minRow},${clueCell.c - minCol}`;
}

export function getNikojiEdgeKey(r1: number, c1: number, r2: number, c2: number): string | null {
  if (r1 === r2 && Math.abs(c1 - c2) === 1) return `h-${r1}-${Math.min(c1, c2)}`;
  if (c1 === c2 && Math.abs(r1 - r2) === 1) return `v-${Math.min(r1, r2)}-${c1}`;
  return null;
}

export function getNikojiBoundarySegments(regionIds: number[][], width: number, height: number) {
  const horizontal: Array<{ row: number; col: number }> = [];
  const vertical: Array<{ row: number; col: number }> = [];

  for (let row = 0; row < height - 1; row++) {
    for (let col = 0; col < width; col++) {
      if (regionIds[row][col] !== regionIds[row + 1][col]) {
        horizontal.push({ row, col });
      }
    }
  }

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width - 1; col++) {
      if (regionIds[row][col] !== regionIds[row][col + 1]) {
        vertical.push({ row, col });
      }
    }
  }

  return { horizontal, vertical };
}

function getNikojiDisplayLabel(index: number) {
  let value = index;
  let label = '';

  do {
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26) - 1;
  } while (value >= 0);

  return label;
}

function normalizeNikojiLettersGrid(grid: (string | null)[][]) {
  const tokenToLetter = new Map<string, string>();
  let nextIndex = 0;

  return grid.map((row) =>
    row.map((token) => {
      if (!token) return null;
      const existing = tokenToLetter.get(token);
      if (existing) return existing;

      const nextLetter = getNikojiDisplayLabel(nextIndex);
      nextIndex += 1;
      tokenToLetter.set(token, nextLetter);
      return nextLetter;
    })
  );
}

export function parseNikojiLink(link: string): NikojiPuzzleData | null {
  try {
    let dataPart = link.includes('?') ? link.split('?')[1] : link;
    if (dataPart.startsWith('p?')) dataPart = dataPart.slice(2);

    const parts = dataPart.split('/');
    if (parts[0] !== 'nikoji' || parts.length < 3) return null;

    const width = Number(parts[1]);
    const height = Number(parts[2]);
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      return null;
    }

    const encoded = parts.slice(3).join('/');
    const letters = Array.from({ length: height }, () => Array(width).fill(null) as (string | null)[]);
    let cellIndex = 0;
    let strIndex = 0;
    const totalCells = width * height;

    while (strIndex < encoded.length && cellIndex < totalCells) {
      const char = encoded[strIndex];

      if (char >= 'g' && char <= 'z') {
        cellIndex += parseInt(char, 36) - 15;
        strIndex += 1;
        continue;
      }

      const row = Math.floor(cellIndex / width);
      const col = cellIndex % width;
      letters[row][col] = char;
      cellIndex += 1;
      strIndex += 1;
    }

    return {
      type: 'nikoji',
      width,
      height,
      letters: normalizeNikojiLettersGrid(letters),
    };
  } catch {
    return null;
  }
}

function buildRegionsFromBorders(deepLines: Set<string>, puzzle: NikojiPuzzleData) {
  const { width, height } = puzzle;
  const visited = Array.from({ length: height }, () => Array(width).fill(false));
  const regionIds = Array.from({ length: height }, () => Array(width).fill(-1));
  const regions: Array<{ regionId: number; cells: { r: number; c: number }[] }> = [];
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]] as const;

  const hasBoundary = (r1: number, c1: number, r2: number, c2: number) => {
    if (
      r1 < 0 || r1 >= height || c1 < 0 || c1 >= width ||
      r2 < 0 || r2 >= height || c2 < 0 || c2 >= width
    ) {
      return true;
    }

    const key = getNikojiEdgeKey(r1, c1, r2, c2);
    return key ? deepLines.has(key) : true;
  };

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      if (visited[row][col]) continue;

      const regionId = regions.length;
      const cells: { r: number; c: number }[] = [];
      const stack = [{ r: row, c: col }];
      visited[row][col] = true;
      regionIds[row][col] = regionId;

      while (stack.length > 0) {
        const current = stack.pop()!;
        cells.push(current);

        for (const [dr, dc] of directions) {
          const nr = current.r + dr;
          const nc = current.c + dc;
          if (
            nr < 0 || nr >= height || nc < 0 || nc >= width ||
            visited[nr][nc] || hasBoundary(current.r, current.c, nr, nc)
          ) {
            continue;
          }

          visited[nr][nc] = true;
          regionIds[nr][nc] = regionId;
          stack.push({ r: nr, c: nc });
        }
      }

      regions.push({ regionId, cells });
    }
  }

  return { regionIds, regions };
}

export function validateNikoji(
  deepLines: Set<string>,
  puzzle: NikojiPuzzleData
): NikojiValidationResult {
  const badCells = new Set<string>();
  let message: string | undefined;

  const setMessage = (nextMessage: string) => {
    if (!message) message = nextMessage;
  };

  const { regions } = buildRegionsFromBorders(deepLines, puzzle);
  const resolvedRegions: RegionInfo[] = [];

  for (const region of regions) {
    const clueCells = region.cells.filter((cell) => puzzle.letters[cell.r][cell.c]);
    if (clueCells.length !== 1) {
      region.cells.forEach((cell) => badCells.add(`${cell.r},${cell.c}`));
      setMessage('每个区域必须恰好包含一个字母');
      continue;
    }

    const clueCell = clueCells[0];
    const letter = puzzle.letters[clueCell.r][clueCell.c]!;
    resolvedRegions.push({
      regionId: region.regionId,
      cells: region.cells,
      letter,
      shapeKey: getShapeKey(region.cells),
      clueOffsetKey: getClueOffsetKey(region.cells, clueCell),
      canonicalShapeKey: getCanonicalShapeKey(region.cells),
    });
  }

  const regionsByLetter = new Map<string, RegionInfo[]>();
  for (const region of resolvedRegions) {
    const group = regionsByLetter.get(region.letter) ?? [];
    group.push(region);
    regionsByLetter.set(region.letter, group);
  }

  for (const group of regionsByLetter.values()) {
    const shapeKeys = new Set(group.map((region) => region.shapeKey));
    const clueOffsets = new Set(group.map((region) => region.clueOffsetKey));
    if (shapeKeys.size === 1 && clueOffsets.size === 1) continue;

    group.forEach((region) => region.cells.forEach((cell) => badCells.add(`${cell.r},${cell.c}`)));
    setMessage('相同字母的区域必须形状、朝向和字母相对位置都一致');
  }

  const shapeOwners = new Map<string, string>();
  for (const group of regionsByLetter.entries()) {
    const [letter, regionsForLetter] = group;
    const canonicalShapeKey = regionsForLetter[0]?.canonicalShapeKey;
    if (!canonicalShapeKey) continue;

    const existingLetter = shapeOwners.get(canonicalShapeKey);
    if (existingLetter && existingLetter !== letter) {
      regionsForLetter.forEach((region) => region.cells.forEach((cell) => badCells.add(`${cell.r},${cell.c}`)));
      (regionsByLetter.get(existingLetter) ?? []).forEach((region) =>
        region.cells.forEach((cell) => badCells.add(`${cell.r},${cell.c}`))
      );
      setMessage('不同字母的区域不能是相同形状（旋转或镜像后也不行）');
      continue;
    }

    shapeOwners.set(canonicalShapeKey, letter);
  }

  return {
    valid: badCells.size === 0,
    message,
    badCells: Array.from(badCells).map((key) => {
      const [r, c] = key.split(',').map(Number);
      return { r, c };
    }),
  };
}
