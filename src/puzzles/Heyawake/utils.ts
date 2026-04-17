import type { HeyawakeClue, HeyawakePuzzleData } from '../types';

export type HeyawakeCellState = 0 | 1 | 2;

export interface HeyawakeValidationResult {
  valid: boolean;
  message?: string;
  badCells: { r: number; c: number }[];
}

export function createEmptyHeyawakeGrid(width: number, height: number): HeyawakeCellState[][] {
  return Array.from({ length: height }, () => Array(width).fill(0) as HeyawakeCellState[]);
}

function readNumber16(bstr: string, i: number): [number, number] {
  if (i >= bstr.length) return [-1, 0];
  const ca = bstr[i];
  if (/[0-9a-f]/.test(ca)) {
    return [parseInt(ca, 16), 1];
  }
  if (ca === '-') {
    return i + 3 <= bstr.length ? [parseInt(bstr.substr(i + 1, 2), 16), 3] : [-1, 0];
  }
  if (ca === '+') {
    return i + 4 <= bstr.length ? [parseInt(bstr.substr(i + 1, 3), 16), 4] : [-1, 0];
  }
  if (ca === '=') {
    return i + 4 <= bstr.length ? [parseInt(bstr.substr(i + 1, 3), 16) + 4096, 4] : [-1, 0];
  }
  if (ca === '%' || ca === '@') {
    return i + 4 <= bstr.length ? [parseInt(bstr.substr(i + 1, 3), 16) + 8192, 4] : [-1, 0];
  }
  if (ca === '*') {
    return i + 5 <= bstr.length ? [parseInt(bstr.substr(i + 1, 4), 16) + 12240, 5] : [-1, 0];
  }
  if (ca === '$') {
    return i + 6 <= bstr.length ? [parseInt(bstr.substr(i + 1, 5), 16) + 77776, 6] : [-1, 0];
  }
  if (ca === '.') {
    return [-2, 1];
  }
  return [-1, 0];
}

function decodeRegionIds(
  width: number,
  height: number,
  encodedBorders: string
): number[][] | null {
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

      for (let index = 0; index < queue.length; index++) {
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

      regionId++;
    }
  }

  return regionIds;
}

function getRegionAnchorCells(regionIds: number[][], width: number, height: number) {
  const anchors = new Map<number, { row: number; col: number }>();

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const regionId = regionIds[row][col];
      if (!anchors.has(regionId)) {
        anchors.set(regionId, { row, col });
      }
    }
  }

  return Array.from(anchors.entries())
    .sort((a, b) => (a[1].row - b[1].row) || (a[1].col - b[1].col))
    .map(([, anchor]) => anchor);
}

function parseHeyawakeRoomClues(
  clueData: string,
  regionIds: number[][],
  width: number,
  height: number
) {
  const clues: HeyawakeClue[] = [];
  const anchors = getRegionAnchorCells(regionIds, width, height);
  let roomIndex = 0;
  let strIndex = 0;

  while (strIndex < clueData.length && roomIndex < anchors.length) {
    const ca = clueData[strIndex];
    const [value, consumed] = readNumber16(clueData, strIndex);

    if (value >= 0) {
      const anchor = anchors[roomIndex];
      clues.push({ row: anchor.row, col: anchor.col, value });
      roomIndex++;
      strIndex += consumed;
      continue;
    }

    if (value === -2) {
      roomIndex++;
      strIndex += consumed;
      continue;
    }

    if (ca >= 'g' && ca <= 'z') {
      roomIndex += parseInt(ca, 36) - 15;
      strIndex++;
      continue;
    }

    strIndex++;
  }

  return clues;
}

export function parseHeyawakeLink(link: string): HeyawakePuzzleData | null {
  try {
    let dataPart = link.includes('?') ? link.split('?')[1] : link;
    if (dataPart.startsWith('p?')) dataPart = dataPart.slice(2);

    const parts = dataPart.split('/');
    if (parts[0] !== 'heyawake' || parts.length < 4) return null;

    const width = Number(parts[1]);
    const height = Number(parts[2]);
    const encodedData = parts.slice(3).join('/');
    if (
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width <= 0 ||
      height <= 0 ||
      !encodedData
    ) {
      return null;
    }

    const expectedBitCount = height * (width - 1) + (height - 1) * width;
    const expectedCharCount = Math.ceil(expectedBitCount / 5);
    if (encodedData.length < expectedCharCount) return null;

    const regionIds = decodeRegionIds(width, height, encodedData.slice(0, expectedCharCount));
    if (!regionIds) return null;

    return {
      type: 'heyawake',
      width,
      height,
      regionIds,
      clues: parseHeyawakeRoomClues(encodedData.slice(expectedCharCount), regionIds, width, height),
    };
  } catch {
    return null;
  }
}

export function getHeyawakeBoundarySegments(regionIds: number[][], width: number, height: number) {
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

function collectRegionCells(regionIds: number[][], width: number, height: number) {
  const regions = new Map<number, Array<{ row: number; col: number }>>();

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

function getCluesByRegion(clues: HeyawakeClue[], regionIds: number[][]) {
  const cluesByRegion = new Map<number, HeyawakeClue[]>();

  for (const clue of clues) {
    const regionId = regionIds[clue.row]?.[clue.col];
    if (regionId === undefined) continue;
    const regionClues = cluesByRegion.get(regionId) ?? [];
    regionClues.push(clue);
    cluesByRegion.set(regionId, regionClues);
  }

  return cluesByRegion;
}

function floodWhiteArea(
  shaded: boolean[][],
  startRow: number,
  startCol: number,
  visited: boolean[][]
): number {
  const height = shaded.length;
  const width = shaded[0]?.length ?? 0;
  const queue = [{ row: startRow, col: startCol }];
  visited[startRow][startCol] = true;
  let size = 0;

  for (let index = 0; index < queue.length; index++) {
    const current = queue[index];
    size++;

    const neighbors = [
      [current.row - 1, current.col],
      [current.row + 1, current.col],
      [current.row, current.col - 1],
      [current.row, current.col + 1],
    ] as const;

    for (const [nextRow, nextCol] of neighbors) {
      if (
        nextRow < 0 ||
        nextRow >= height ||
        nextCol < 0 ||
        nextCol >= width ||
        shaded[nextRow][nextCol] ||
        visited[nextRow][nextCol]
      ) {
        continue;
      }

      visited[nextRow][nextCol] = true;
      queue.push({ row: nextRow, col: nextCol });
    }
  }

  return size;
}

function markRunCells(
  badCells: Set<string>,
  orientation: 'row' | 'col',
  fixedIndex: number,
  start: number,
  endExclusive: number
) {
  for (let index = start; index < endExclusive; index++) {
    if (orientation === 'row') {
      badCells.add(`${fixedIndex},${index}`);
    } else {
      badCells.add(`${index},${fixedIndex}`);
    }
  }
}

export function validateHeyawake(
  grid: HeyawakeCellState[][],
  puzzle: HeyawakePuzzleData
): HeyawakeValidationResult {
  const { width, height, regionIds, clues } = puzzle;
  const shaded = grid.map((row) => row.map((cell) => cell === 1));
  const badCells = new Set<string>();
  let message: string | undefined;

  const setMessage = (nextMessage: string) => {
    if (!message) message = nextMessage;
  };

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      if (!shaded[row][col]) continue;

      if (row + 1 < height && shaded[row + 1][col]) {
        badCells.add(`${row},${col}`);
        badCells.add(`${row + 1},${col}`);
        setMessage('涂黑格不能正交相邻');
      }

      if (col + 1 < width && shaded[row][col + 1]) {
        badCells.add(`${row},${col}`);
        badCells.add(`${row},${col + 1}`);
        setMessage('涂黑格不能正交相邻');
      }
    }
  }

  const regionCells = collectRegionCells(regionIds, width, height);
  const cluesByRegion = getCluesByRegion(clues, regionIds);

  for (const [regionId, regionClues] of cluesByRegion.entries()) {
    const cells = regionCells.get(regionId) ?? [];
    const shadedCount = cells.reduce((count, cell) => count + (shaded[cell.row][cell.col] ? 1 : 0), 0);
    const expectedCount = regionClues[0]?.value;

    if (expectedCount === undefined || shadedCount === expectedCount) continue;

    cells.forEach((cell) => badCells.add(`${cell.row},${cell.col}`));
    setMessage('某个区域的黑格数量与线索不符');
  }

  for (let row = 0; row < height; row++) {
    let col = 0;
    while (col < width) {
      while (col < width && shaded[row][col]) col++;
      const start = col;
      let borderCrossings = 0;

      while (col < width && !shaded[row][col]) {
        if (col > start && regionIds[row][col - 1] !== regionIds[row][col]) {
          borderCrossings++;
        }
        col++;
      }

      if (col > start && borderCrossings >= 2) {
        markRunCells(badCells, 'row', row, start, col);
        setMessage('留白线段不能穿过两个或以上的区域边界');
      }
    }
  }

  for (let col = 0; col < width; col++) {
    let row = 0;
    while (row < height) {
      while (row < height && shaded[row][col]) row++;
      const start = row;
      let borderCrossings = 0;

      while (row < height && !shaded[row][col]) {
        if (row > start && regionIds[row - 1][col] !== regionIds[row][col]) {
          borderCrossings++;
        }
        row++;
      }

      if (row > start && borderCrossings >= 2) {
        markRunCells(badCells, 'col', col, start, row);
        setMessage('留白线段不能穿过两个或以上的区域边界');
      }
    }
  }

  let firstWhite: { row: number; col: number } | null = null;
  let whiteCount = 0;
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      if (shaded[row][col]) continue;
      whiteCount++;
      if (!firstWhite) firstWhite = { row, col };
    }
  }

  if (!firstWhite) {
    setMessage('所有留白格必须连成一片');
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        badCells.add(`${row},${col}`);
      }
    }
  } else {
    const visited = Array.from({ length: height }, () => Array(width).fill(false));
    const connectedWhiteCount = floodWhiteArea(shaded, firstWhite.row, firstWhite.col, visited);

    if (connectedWhiteCount !== whiteCount) {
      setMessage('所有留白格必须连成一片');
      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          if (!shaded[row][col] && !visited[row][col]) {
            badCells.add(`${row},${col}`);
          }
        }
      }
    }
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
