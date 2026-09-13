import type { YajilinSolutionEdge } from './types';

export type CellCoord = { row: number; col: number };
export type EdgeOrientation = 'h' | 'v';

export interface BoundarySegments {
  horizontal: Array<{ row: number; col: number }>;
  vertical: Array<{ row: number; col: number }>;
}

export function normalizePuzzLinkDataPart(link: string) {
  let dataPart = link.trim();
  const queryIndex = dataPart.indexOf('?');
  if (queryIndex >= 0) dataPart = dataPart.slice(queryIndex + 1);
  if (/%2f/i.test(dataPart)) {
    const firstQueryPart = dataPart.split('&')[0];
    dataPart = firstQueryPart.endsWith('=') ? firstQueryPart.slice(0, -1) : firstQueryPart;
    try {
      dataPart = decodeURIComponent(dataPart);
    } catch {
      return '';
    }
  }
  if (dataPart.startsWith('p?')) dataPart = dataPart.slice(2);
  return dataPart;
}

export function parsePuzzLinkParts(link: string) {
  return normalizePuzzLinkDataPart(link).split('/');
}

export function isPositiveGridSize(width: number, height: number) {
  return Number.isInteger(width) && Number.isInteger(height) && width > 0 && height > 0;
}

function decodeBase64Url(input: string) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');

  if (typeof globalThis.atob === 'function') {
    return globalThis.atob(padded);
  }

  // `atob` is available in every supported browser and in the current Node
  // runtime. Do not depend on Node's Buffer here: this module is shipped to
  // the browser and should remain portable to other runtimes and workers.
  throw new Error('Base64 decoding is not available in this runtime.');
}

export function decodeCustomPayload<T>(encoded: string): T | null {
  try {
    const decoded = decodeBase64Url(encoded);
    const bytes = Uint8Array.from(decoded, (char) => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as T;
  } catch {
    return null;
  }
}

export function decodePzpr4CellClues(width: number, height: number, encoded: string) {
  const clues = Array.from({ length: height }, () => Array<number | null>(width).fill(null));
  let cellIndex = 0;
  const cellCount = width * height;

  for (const char of encoded) {
    if (cellIndex >= cellCount) break;

    const row = Math.floor(cellIndex / width);
    const col = cellIndex % width;

    if (char >= '0' && char <= '4') {
      clues[row][col] = parseInt(char, 16);
      cellIndex += 1;
    } else if (char >= '5' && char <= '9') {
      clues[row][col] = parseInt(char, 16) - 5;
      cellIndex += 2;
    } else if (char >= 'a' && char <= 'e') {
      clues[row][col] = parseInt(char, 16) - 10;
      cellIndex += 3;
    } else if (char >= 'g' && char <= 'z') {
      cellIndex += parseInt(char, 36) - 15;
    } else if (char === '.') {
      cellIndex += 1;
    } else {
      return null;
    }
  }

  return cellIndex >= cellCount ? clues : null;
}

function readPzprBase32Bits(encoded: string, bitCount: number) {
  const bits: number[] = [];

  for (const char of encoded) {
    const value = parseInt(char, 32);
    if (!Number.isFinite(value)) return null;
    for (let bit = 4; bit >= 0 && bits.length < bitCount; bit--) {
      bits.push((value >> bit) & 1);
    }
  }

  return bits.length === bitCount ? bits : null;
}

export function getPzprRegionBorderCharCount(width: number, height: number) {
  const verticalBitCount = height * (width - 1);
  const horizontalBitCount = (height - 1) * width;
  const verticalCharCount = Math.ceil(verticalBitCount / 5);
  const horizontalCharCount = Math.ceil(horizontalBitCount / 5);
  return verticalCharCount + horizontalCharCount;
}

export function decodePzprCellMask(width: number, height: number, encodedMask: string) {
  const cellCount = width * height;
  const expectedCharCount = Math.ceil(cellCount / 5);
  if (encodedMask.length < expectedCharCount) return null;

  const bits = readPzprBase32Bits(encodedMask.slice(0, expectedCharCount), cellCount);
  if (!bits) return null;

  return Array.from({ length: height }, (_, row) =>
    Array.from({ length: width }, (_, col) => bits[row * width + col] === 1)
  );
}

export function decodePzprRegionIds(width: number, height: number, encodedBorders: string): number[][] | null {
  const verticalBitCount = height * (width - 1);
  const horizontalBitCount = (height - 1) * width;
  const verticalCharCount = Math.ceil(verticalBitCount / 5);
  const horizontalCharCount = Math.ceil(horizontalBitCount / 5);
  const expectedCharCount = verticalCharCount + horizontalCharCount;
  if (encodedBorders.length < expectedCharCount) return null;

  const verticalBits = readPzprBase32Bits(encodedBorders.slice(0, verticalCharCount), verticalBitCount);
  const horizontalBits = readPzprBase32Bits(
    encodedBorders.slice(verticalCharCount, expectedCharCount),
    horizontalBitCount
  );
  if (!verticalBits || !horizontalBits) return null;

  let bitIndex = 0;
  const verticalBorders = Array.from({ length: height }, () => Array(width - 1).fill(0));
  const horizontalBorders = Array.from({ length: height - 1 }, () => Array(width).fill(0));

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width - 1; col++) {
      verticalBorders[row][col] = verticalBits[bitIndex++] ?? 0;
    }
  }

  bitIndex = 0;
  for (let row = 0; row < height - 1; row++) {
    for (let col = 0; col < width; col++) {
      horizontalBorders[row][col] = horizontalBits[bitIndex++] ?? 0;
    }
  }

  const regionIds = Array.from({ length: height }, () => Array(width).fill(-1));
  let nextRegionId = 0;

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      if (regionIds[row][col] !== -1) continue;

      const queue = [{ row, col }];
      regionIds[row][col] = nextRegionId;

      for (let index = 0; index < queue.length; index++) {
        const current = queue[index];
        const neighbors = [
          {
            row: current.row - 1,
            col: current.col,
            blocked: current.row === 0 || horizontalBorders[current.row - 1][current.col] === 1,
          },
          {
            row: current.row + 1,
            col: current.col,
            blocked: current.row + 1 >= height || horizontalBorders[current.row][current.col] === 1,
          },
          {
            row: current.row,
            col: current.col - 1,
            blocked: current.col === 0 || verticalBorders[current.row][current.col - 1] === 1,
          },
          {
            row: current.row,
            col: current.col + 1,
            blocked: current.col + 1 >= width || verticalBorders[current.row][current.col] === 1,
          },
        ];

        for (const next of neighbors) {
          if (
            next.blocked ||
            next.row < 0 ||
            next.row >= height ||
            next.col < 0 ||
            next.col >= width ||
            regionIds[next.row][next.col] !== -1
          ) {
            continue;
          }

          regionIds[next.row][next.col] = nextRegionId;
          queue.push({ row: next.row, col: next.col });
        }
      }

      nextRegionId++;
    }
  }

  return regionIds;
}

export function getRegionBoundarySegments(regionIds: number[][], width: number, height: number): BoundarySegments {
  const horizontal: BoundarySegments['horizontal'] = [];
  const vertical: BoundarySegments['vertical'] = [];

  for (let row = 0; row <= height; row++) {
    for (let col = 0; col < width; col++) {
      if (row === 0 || row === height || regionIds[row - 1][col] !== regionIds[row][col]) {
        horizontal.push({ row, col });
      }
    }
  }

  for (let row = 0; row < height; row++) {
    for (let col = 0; col <= width; col++) {
      if (col === 0 || col === width || regionIds[row][col - 1] !== regionIds[row][col]) {
        vertical.push({ row, col });
      }
    }
  }

  return { horizontal, vertical };
}

export function getCellKey(row: number, col: number) {
  return `${row},${col}`;
}

export function parseCellKey(key: string): CellCoord | null {
  const match = key.match(/^(\d+),(\d+)$/);
  if (!match) return null;
  return { row: Number(match[1]), col: Number(match[2]) };
}

export function getEdgeKey(edge: YajilinSolutionEdge) {
  const first = { row: edge.r1, col: edge.c1 };
  const second = { row: edge.r2, col: edge.c2 };
  const [a, b] =
    first.row < second.row || (first.row === second.row && first.col <= second.col)
      ? [first, second]
      : [second, first];
  return `${a.row},${a.col}-${b.row},${b.col}`;
}

export function parseSolutionEdgeKey(key: string): YajilinSolutionEdge | null {
  const match = key.match(/^(\d+),(\d+)-(\d+),(\d+)$/);
  if (!match) return null;
  return {
    r1: Number(match[1]),
    c1: Number(match[2]),
    r2: Number(match[3]),
    c2: Number(match[4]),
  };
}

export function getGridLineEdgeKey(orientation: EdgeOrientation, row: number, col: number) {
  return `${orientation}-${row}-${col}`;
}

export function parseGridLineEdgeKey(key: string) {
  const match = key.match(/^([hv])-(\d+)-(\d+)$/);
  if (!match) return null;
  return {
    orientation: match[1] as EdgeOrientation,
    row: Number(match[2]),
    col: Number(match[3]),
  };
}

/**
 * Check that a grid-line edge belongs to a board of the given dimensions.
 *
 * Grid-line keys are shared by Slitherlink variants and several replay
 * renderers.  Parsing the shape alone is not enough: a persisted snapshot
 * may contain a syntactically valid edge outside the board, which would
 * otherwise be painted beyond the SVG frame (or counted by a validator).
 */
export function isValidGridLineEdgeKey(key: string, width: number, height: number) {
  const edge = parseGridLineEdgeKey(key);
  if (!edge || !isPositiveGridSize(width, height)) return false;

  if (edge.orientation === 'h') {
    return edge.row >= 0 && edge.row <= height && edge.col >= 0 && edge.col < width;
  }

  return edge.row >= 0 && edge.row < height && edge.col >= 0 && edge.col <= width;
}

/** Keep only unique, in-bounds grid-line keys from untrusted snapshots. */
export function filterValidGridLineEdgeKeys(
  keys: readonly string[],
  width: number,
  height: number
) {
  return Array.from(new Set(keys.filter((key) => isValidGridLineEdgeKey(key, width, height))));
}

/**
 * Check a cell-centre edge (the `r,c-r,c` format used by Kurarin,
 * Mintonette, Walkwalk, and Domino Search).  Parsing the four numbers is not
 * enough: persisted snapshots can contain diagonal, distant, or out-of-grid
 * endpoints and those values must never reach a validator or SVG renderer.
 */
export function isValidCellEdgeKey(key: string, width: number, height: number) {
  const edge = parseSolutionEdgeKey(key);
  if (!edge || !isPositiveGridSize(width, height)) return false;

  const inBounds = (row: number, col: number) =>
    row >= 0 && row < height && col >= 0 && col < width;

  return (
    inBounds(edge.r1, edge.c1) &&
    inBounds(edge.r2, edge.c2) &&
    areOrthogonallyAdjacent(
      { row: edge.r1, col: edge.c1 },
      { row: edge.r2, col: edge.c2 }
    )
  );
}

/** Keep only unique, in-bounds orthogonal cell-centre edges. */
export function filterValidCellEdgeKeys(
  keys: readonly string[],
  width: number,
  height: number
) {
  return Array.from(new Set(keys.filter((key) => isValidCellEdgeKey(key, width, height))));
}

/**
 * Internal boundary keys (`h-row-col` / `v-row-col`) are distinct from
 * grid-line keys: they never include the outer perimeter.  Fillomino and
 * NIKOJI use this format for their manually drawn borders and centre marks.
 */
export function isValidInternalBoundaryEdgeKey(key: string, width: number, height: number) {
  const edge = parseGridLineEdgeKey(key);
  if (!edge || !isPositiveGridSize(width, height)) return false;

  if (edge.orientation === 'h') {
    return edge.row >= 0 && edge.row < height && edge.col >= 0 && edge.col < width - 1;
  }

  return edge.row >= 0 && edge.row < height - 1 && edge.col >= 0 && edge.col < width;
}

/** Keep only unique internal boundary keys. */
export function filterValidInternalBoundaryEdgeKeys(
  keys: readonly string[],
  width: number,
  height: number
) {
  return Array.from(new Set(keys.filter((key) => isValidInternalBoundaryEdgeKey(key, width, height))));
}

/** Vertex-dot keys (`p-row-col`) used by Star Battle. */
export function isValidGridVertexKey(key: string, width: number, height: number) {
  const match = key.match(/^p-(\d+)-(\d+)$/);
  if (!match || !isPositiveGridSize(width, height)) return false;
  const row = Number(match[1]);
  const col = Number(match[2]);
  return row >= 0 && row <= height && col >= 0 && col <= width;
}

export function filterValidGridVertexKeys(
  keys: readonly string[],
  width: number,
  height: number
) {
  return Array.from(new Set(keys.filter((key) => isValidGridVertexKey(key, width, height))));
}

export function areOrthogonallyAdjacent(a: CellCoord, b: CellCoord) {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
}

export function getOrthogonalNeighbors(row: number, col: number, width: number, height: number) {
  return [
    { row: row - 1, col },
    { row: row + 1, col },
    { row, col: col - 1 },
    { row, col: col + 1 },
  ].filter((cell) => cell.row >= 0 && cell.row < height && cell.col >= 0 && cell.col < width);
}

export function collectCellsByRegion(regionIds: number[][], width: number, height: number) {
  const regions = new Map<number, CellCoord[]>();

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const regionId = regionIds[row][col];
      const cells = regions.get(regionId) ?? [];
      cells.push({ row, col });
      regions.set(regionId, cells);
    }
  }

  return regions;
}

export function collectBooleanComponents(grid: boolean[][], target: boolean) {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;
  const visited = Array.from({ length: height }, () => Array(width).fill(false));
  const components: CellCoord[][] = [];

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      if (visited[row][col] || grid[row][col] !== target) continue;

      const component: CellCoord[] = [];
      const queue = [{ row, col }];
      visited[row][col] = true;

      for (let index = 0; index < queue.length; index++) {
        const current = queue[index];
        component.push(current);

        for (const next of getOrthogonalNeighbors(current.row, current.col, width, height)) {
          if (visited[next.row][next.col] || grid[next.row][next.col] !== target) continue;
          visited[next.row][next.col] = true;
          queue.push(next);
        }
      }

      components.push(component);
    }
  }

  return components;
}
