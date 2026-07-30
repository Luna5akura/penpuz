import type { LitsPuzzleData } from '../types';
import type { ShadingCellState, ShadingValidationResult } from '../shared/ShadingBoard';
import {
  collectCellsByRegion,
  collectBooleanComponents,
  decodePzprCellMask,
  decodePzprRegionIds,
  getCellKey,
  getPzprRegionBorderCharCount,
  getOrthogonalNeighbors,
  isPositiveGridSize,
  parsePuzzLinkParts,
} from '../gridUtils';

function removeExcludedCellsFromRegions(
  regionIds: number[][],
  excludedCells: boolean[][],
  width: number,
  height: number
) {
  if (!excludedCells.some((row) => row.some(Boolean))) return regionIds;

  const nextRegionIds = Array.from({ length: height }, () => Array(width).fill(-1));
  let nextRegionId = 0;

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      if (excludedCells[row][col] || nextRegionIds[row][col] !== -1) continue;

      const sourceRegionId = regionIds[row][col];
      const queue = [{ row, col }];
      nextRegionIds[row][col] = nextRegionId;

      for (let index = 0; index < queue.length; index++) {
        const current = queue[index];
        for (const next of getOrthogonalNeighbors(current.row, current.col, width, height)) {
          if (
            excludedCells[next.row][next.col] ||
            nextRegionIds[next.row][next.col] !== -1 ||
            regionIds[next.row][next.col] !== sourceRegionId
          ) {
            continue;
          }

          nextRegionIds[next.row][next.col] = nextRegionId;
          queue.push(next);
        }
      }

      nextRegionId++;
    }
  }

  return nextRegionIds;
}

export function parseLitsLink(link: string): LitsPuzzleData | null {
  try {
    const parts = parsePuzzLinkParts(link);
    if (parts[0] !== 'lits' || parts.length < 4) return null;

    const width = Number(parts[1]);
    const height = Number(parts[2]);
    const encodedData = parts.slice(3).join('/');
    if (!isPositiveGridSize(width, height) || !encodedData) return null;

    const borderCharCount = getPzprRegionBorderCharCount(width, height);
    const encodedBorders = encodedData.slice(0, borderCharCount);
    const regionIds = decodePzprRegionIds(width, height, encodedBorders);
    if (!regionIds) return null;

    const encodedExcludedCells = encodedData.slice(borderCharCount);
    const excludedCells = encodedExcludedCells
      ? decodePzprCellMask(width, height, encodedExcludedCells)
      : null;
    if (encodedExcludedCells && !excludedCells) return null;

    return {
      type: 'lits',
      width,
      height,
      regionIds: excludedCells
        ? removeExcludedCellsFromRegions(regionIds, excludedCells, width, height)
        : regionIds,
    };
  } catch {
    return null;
  }
}

function markCells(badCells: Set<string>, cells: Array<{ row: number; col: number }>) {
  cells.forEach((cell) => badCells.add(getCellKey(cell.row, cell.col)));
}

function areCellsConnected(cells: Array<{ row: number; col: number }>) {
  if (cells.length === 0) return false;

  const cellSet = new Set(cells.map((cell) => getCellKey(cell.row, cell.col)));
  const visited = new Set<string>();
  const queue = [cells[0]];
  visited.add(getCellKey(cells[0].row, cells[0].col));

  for (let index = 0; index < queue.length; index++) {
    const current = queue[index];
    const neighbors = [
      { row: current.row - 1, col: current.col },
      { row: current.row + 1, col: current.col },
      { row: current.row, col: current.col - 1 },
      { row: current.row, col: current.col + 1 },
    ];

    for (const next of neighbors) {
      const key = getCellKey(next.row, next.col);
      if (!cellSet.has(key) || visited.has(key)) continue;
      visited.add(key);
      queue.push(next);
    }
  }

  return visited.size === cells.length;
}

function normalizeShape(points: Array<{ row: number; col: number }>) {
  const minRow = Math.min(...points.map((point) => point.row));
  const minCol = Math.min(...points.map((point) => point.col));
  return points
    .map((point) => `${point.row - minRow},${point.col - minCol}`)
    .sort()
    .join(';');
}

function canonicalTetromino(cells: Array<{ row: number; col: number }>) {
  const transforms = cells.map((cell) => {
    const { row, col } = cell;
    return [
      { row, col },
      { row, col: -col },
      { row: -row, col },
      { row: -row, col: -col },
      { row: col, col: row },
      { row: col, col: -row },
      { row: -col, col: row },
      { row: -col, col: -row },
    ];
  });

  const signatures = Array.from({ length: 8 }, (_, transformIndex) =>
    normalizeShape(transforms.map((cellTransforms) => cellTransforms[transformIndex]))
  );

  return signatures.sort()[0];
}

export function validateLits(grid: ShadingCellState[][], puzzle: LitsPuzzleData): ShadingValidationResult {
  const { width, height, regionIds } = puzzle;
  const shaded = grid.map((row, rowIndex) =>
    row.map((cell, colIndex) => regionIds[rowIndex][colIndex] >= 0 && cell === 1)
  );
  const badCells = new Set<string>();
  let message: string | undefined;
  const setMessage = (nextMessage: string) => {
    if (!message) message = nextMessage;
  };

  const regions = collectCellsByRegion(regionIds, width, height);
  const shadedCellsByRegion = new Map<number, Array<{ row: number; col: number }>>();
  const shapeByRegion = new Map<number, string>();

  for (const [regionId, cells] of regions.entries()) {
    if (regionId < 0) continue;

    const shadedCells = cells.filter((cell) => shaded[cell.row][cell.col]);
    shadedCellsByRegion.set(regionId, shadedCells);

    if (shadedCells.length !== 4) {
      markCells(badCells, cells);
      setMessage('每个区域必须恰好涂出一个四连块');
      continue;
    }

    if (!areCellsConnected(shadedCells)) {
      markCells(badCells, shadedCells);
      setMessage('每个区域内的四个黑格必须正交连通');
      continue;
    }

    shapeByRegion.set(regionId, canonicalTetromino(shadedCells));
  }

  for (let row = 0; row < height - 1; row++) {
    for (let col = 0; col < width - 1; col++) {
      if (shaded[row][col] && shaded[row + 1][col] && shaded[row][col + 1] && shaded[row + 1][col + 1]) {
        markCells(badCells, [
          { row, col },
          { row: row + 1, col },
          { row, col: col + 1 },
          { row: row + 1, col: col + 1 },
        ]);
        setMessage('黑格不能形成 2x2 方块');
      }
    }
  }

  const shadedComponents = collectBooleanComponents(shaded, true);
  if (shadedComponents.length > 1) {
    shadedComponents.forEach((component) => markCells(badCells, component));
    setMessage('所有黑格必须正交连成一片');
  }

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      if (!shaded[row][col]) continue;

      const regionId = regionIds[row][col];
      if (regionId < 0) continue;

      const shape = shapeByRegion.get(regionId);
      if (!shape) continue;

      for (const next of getOrthogonalNeighbors(row, col, width, height)) {
        if (!shaded[next.row][next.col]) continue;
        const nextRegionId = regionIds[next.row][next.col];
        if (nextRegionId === regionId || shapeByRegion.get(nextRegionId) !== shape) continue;

        markCells(badCells, shadedCellsByRegion.get(regionId) ?? []);
        markCells(badCells, shadedCellsByRegion.get(nextRegionId) ?? []);
        setMessage('相邻区域的四连块不能是相同形状');
      }
    }
  }

  return {
    valid: badCells.size === 0,
    message,
    badCells: Array.from(badCells).map((key) => {
      const [row, col] = key.split(',').map(Number);
      return { row, col };
    }),
  };
}
