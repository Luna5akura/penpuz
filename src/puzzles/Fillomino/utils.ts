// src/puzzles/Fillomino/utils.ts
import type { FillominoPuzzleData } from '../types';

// ==================== pzpr 数字解析函数 ====================
function readNumber16(bstr: string, i: number): [number, number] {
  if (i >= bstr.length) return [-1, 0];
  const ca = bstr[i];
  if (/[0-9a-f]/.test(ca)) return [parseInt(ca, 16), 1];
  if (ca === '-') return i + 3 <= bstr.length ? [parseInt(bstr.substr(i + 1, 2), 16), 3] : [-1, 0];
  if (ca === '+') return i + 4 <= bstr.length ? [parseInt(bstr.substr(i + 1, 3), 16), 4] : [-1, 0];
  if (ca === '=') return i + 4 <= bstr.length ? [parseInt(bstr.substr(i + 1, 3), 16) + 4096, 4] : [-1, 0];
  if (ca === '%' || ca === '@') return i + 4 <= bstr.length ? [parseInt(bstr.substr(i + 1, 3), 16) + 8192, 4] : [-1, 0];
  if (ca === '*') return i + 5 <= bstr.length ? [parseInt(bstr.substr(i + 1, 4), 16) + 12240, 5] : [-1, 0];
  if (ca === '$') return i + 6 <= bstr.length ? [parseInt(bstr.substr(i + 1, 5), 16) + 77776, 6] : [-1, 0];
  if (ca === '.') return [-2, 1];
  return [-1, 0];
}

// ==================== Fillomino 链接解析 ====================
export function parseFillominoLink(link: string): FillominoPuzzleData | null {
  try {
    let dataPart = link.includes('?') ? link.split('?')[1] : link;
    if (dataPart.startsWith('p?')) dataPart = dataPart.slice(2);
    const parts = dataPart.split('/');
    if (parts[0] !== 'fillomino' || parts.length < 3) return null;
    const width = parseInt(parts[1], 10);
    const height = parseInt(parts[2], 10);
    const dataStr = parts.slice(3).join('/');
    if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0 || !dataStr) return null;
    const clues: (number | null)[][] = Array.from({ length: height }, () => Array(width).fill(null));
    let cellIndex = 0;
    let strIndex = 0;
    const totalCells = width * height;
    while (strIndex < dataStr.length && cellIndex < totalCells) {
      const [value, consumed] = readNumber16(dataStr, strIndex);
      if (value >= 0) {
        const row = Math.floor(cellIndex / width);
        const col = cellIndex % width;
        clues[row][col] = value;
        strIndex += consumed;
        cellIndex++;
      } else if (value === -2) {
        strIndex += 1;
        cellIndex++;
      } else if (dataStr[strIndex] >= 'g' && dataStr[strIndex] <= 'z') {
        cellIndex += parseInt(dataStr[strIndex], 36) - 15;
        strIndex++;
      } else {
        strIndex++;
      }
    }
    return { type: 'fillomino', width, height, clues };
  } catch {
    return null;
  }
}

export function getFillominoEdgeKey(r1: number, c1: number, r2: number, c2: number): string | null {
  if (r1 === r2 && Math.abs(c1 - c2) === 1) return `h-${r1}-${Math.min(c1, c2)}`;
  if (c1 === c2 && Math.abs(r1 - r2) === 1) return `v-${Math.min(r1, r2)}-${c1}`;
  return null;
}

export function getFillominoAutoBoundaryLines(
  grid: (number | null)[][],
  width: number,
  height: number
): Set<string> {
  const keys = new Set<string>();
  const visited = Array.from({ length: height }, () => Array(width).fill(false));
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]] as const;

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      const value = grid[r][c];
      if (value === null) continue;

      if (c + 1 < width) {
        const rightValue = grid[r][c + 1];
        if (rightValue !== null && rightValue !== value) {
          const edgeKey = getFillominoEdgeKey(r, c, r, c + 1);
          if (edgeKey) keys.add(edgeKey);
        }
      }

      if (r + 1 < height) {
        const downValue = grid[r + 1][c];
        if (downValue !== null && downValue !== value) {
          const edgeKey = getFillominoEdgeKey(r, c, r + 1, c);
          if (edgeKey) keys.add(edgeKey);
        }
      }
    }
  }

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      const value = grid[r][c];
      if (value === null || visited[r][c]) continue;

      const component: { r: number; c: number }[] = [];
      const stack = [{ r, c }];
      visited[r][c] = true;

      while (stack.length > 0) {
        const cell = stack.pop()!;
        component.push(cell);

        for (const [dr, dc] of directions) {
          const nr = cell.r + dr;
          const nc = cell.c + dc;
          if (
            nr >= 0 &&
            nr < height &&
            nc >= 0 &&
            nc < width &&
            !visited[nr][nc] &&
            grid[nr][nc] === value
          ) {
            visited[nr][nc] = true;
            stack.push({ r: nr, c: nc });
          }
        }
      }

      if (component.length !== value) continue;

      for (const cell of component) {
        for (const [dr, dc] of directions) {
          const nr = cell.r + dr;
          const nc = cell.c + dc;
          if (nr < 0 || nr >= height || nc < 0 || nc >= width) continue;
          if (grid[nr][nc] === value) continue;

          const edgeKey = getFillominoEdgeKey(cell.r, cell.c, nr, nc);
          if (edgeKey) keys.add(edgeKey);
        }
      }
    }
  }

  return keys;
}

export function validateFillomino(
  grid: (number | null)[][],
  width: number,
  height: number,
  deepLines: Set<string> = new Set()
) {
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]] as const;
  const autoThinLines = getFillominoAutoBoundaryLines(grid, width, height);

  const hasBoundary = (r1: number, c1: number, r2: number, c2: number): boolean => {
    if (
      r1 < 0 ||
      r1 >= height ||
      c1 < 0 ||
      c1 >= width ||
      r2 < 0 ||
      r2 >= height ||
      c2 < 0 ||
      c2 >= width
    ) {
      return true;
    }

    const key = getFillominoEdgeKey(r1, c1, r2, c2);
    if (!key) return true;
    return deepLines.has(key) || autoThinLines.has(key);
  };

  const visited = Array.from({ length: height }, () => Array(width).fill(false));
  const regionIds = Array.from({ length: height }, () => Array(width).fill(-1));
  const regions: { size: number; values: Set<number>; cells: { r: number; c: number }[] }[] = [];
  const invalidRegionIds = new Set<number>();

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (visited[r][c]) continue;

      const regionId = regions.length;
      const cells: { r: number; c: number }[] = [];
      const values = new Set<number>();
      const stack = [{ r, c }];
      visited[r][c] = true;
      regionIds[r][c] = regionId;

      while (stack.length > 0) {
        const cell = stack.pop()!;
        cells.push(cell);

        const value = grid[cell.r][cell.c];
        if (value !== null) values.add(value);

        for (const [dr, dc] of dirs) {
          const nr = cell.r + dr;
          const nc = cell.c + dc;
          if (
            nr >= 0 &&
            nr < height &&
            nc >= 0 &&
            nc < width &&
            !visited[nr][nc] &&
            !hasBoundary(cell.r, cell.c, nr, nc)
          ) {
            visited[nr][nc] = true;
            regionIds[nr][nc] = regionId;
            stack.push({ r: nr, c: nc });
          }
        }
      }

      if (values.size > 1) invalidRegionIds.add(regionId);

      const [regionValue] = values;
      if (regionValue !== undefined && cells.length !== regionValue) {
        invalidRegionIds.add(regionId);
      }

      regions.push({ size: cells.length, values, cells });
    }
  }

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      const currentRegionId = regionIds[r][c];

      if (c + 1 < width) {
        const rightRegionId = regionIds[r][c + 1];
        if (
          currentRegionId !== rightRegionId &&
          regions[currentRegionId].size === regions[rightRegionId].size
        ) {
          invalidRegionIds.add(currentRegionId);
          invalidRegionIds.add(rightRegionId);
        }
      }

      if (r + 1 < height) {
        const bottomRegionId = regionIds[r + 1][c];
        if (
          currentRegionId !== bottomRegionId &&
          regions[currentRegionId].size === regions[bottomRegionId].size
        ) {
          invalidRegionIds.add(currentRegionId);
          invalidRegionIds.add(bottomRegionId);
        }
      }
    }
  }

  const invalidCells = Array.from(invalidRegionIds).flatMap((regionId) => regions[regionId].cells);
  const valid = invalidCells.length === 0;
  const uniqueInvalid = [...new Set(invalidCells.map((cell) => `${cell.r},${cell.c}`))].map((key) => {
    const [rr, cc] = key.split(',').map(Number);
    return { r: rr, c: cc };
  });

  let message: string | undefined;
  if (!valid) {
    message = '存在区域大小不匹配、同一区域内数字冲突，或相同大小区域正交相邻';
  }

  return {
    valid,
    message,
    invalidCells: uniqueInvalid,
  };
}
