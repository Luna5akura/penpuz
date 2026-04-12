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

// ==================== 完整 Fillomino 验证逻辑（含边界线模式 + 无效格子标记） ====================
// ==================== 完整 Fillomino 验证逻辑（精确标记数字不符的格子） ====================
export function validateFillomino(
  grid: (number | null)[][],
  width: number,
  height: number,
  deepLines: Set<string> = new Set()
) {
  if (grid.some(row => row.some(cell => cell === null))) {
    return { valid: false, message: '仍有空白格未填写', invalidCells: [] };
  }

  const visited = Array.from({ length: height }, () => Array(width).fill(false));
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]] as const;

  const hasBoundary = (r1: number, c1: number, r2: number, c2: number): boolean => {
    if (r1 < 0 || r1 >= height || c1 < 0 || c1 >= width ||
        r2 < 0 || r2 >= height || c2 < 0 || c2 >= width) return true;
    if (r1 === r2 && Math.abs(c1 - c2) === 1) {
      const minC = Math.min(c1, c2);
      const key = `h-${r1}-${minC}`;
      const numDiff = grid[r1][c1] !== grid[r1][c2];
      return deepLines.has(key) || numDiff;
    }
    if (c1 === c2 && Math.abs(r1 - r2) === 1) {
      const minR = Math.min(r1, r2);
      const key = `v-${minR}-${c1}`;
      const numDiff = grid[r1][c1] !== grid[r2][c1];
      return deepLines.has(key) || numDiff;
    }
    return true;
  };

  const floodFill = (r: number, c: number, target: number): number => {
    if (r < 0 || r >= height || c < 0 || c >= width || visited[r][c] || grid[r][c] !== target) {
      return 0;
    }
    visited[r][c] = true;
    let size = 1;
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (!hasBoundary(r, c, nr, nc)) {
        size += floodFill(nr, nc, target);
      }
    }
    return size;
  };

  // 第一遍：计算每个区域的实际面积
  const regionSizeMap = new Map<string, number>(); // key = `${r},${c}` → 实际面积
  visited.forEach(row => row.fill(false));

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (grid[r][c] !== null && !visited[r][c]) {
        const num = grid[r][c]!;
        const size = floodFill(r, c, num);
        // 把该区域内所有格子都记录为这个实际面积
        for (let i = 0; i < height; i++) {
          for (let j = 0; j < width; j++) {
            if (grid[i][j] === num && !visited[i][j]) continue; // 已访问跳过
            // 重新 floodFill 只是为了标记，但我们已经知道 size
          }
        }
        // 简单方式：再次 floodFill 把所有格子记录
        visited.forEach(row => row.fill(false));
        const markRegion = (rr: number, cc: number) => {
          if (rr < 0 || rr >= height || cc < 0 || cc >= width || visited[rr][cc] || grid[rr][cc] !== num) return;
          visited[rr][cc] = true;
          regionSizeMap.set(`${rr},${cc}`, size);
          for (const [dr, dc] of dirs) {
            if (!hasBoundary(rr, cc, rr + dr, cc + dc)) markRegion(rr + dr, cc + dc);
          }
        };
        markRegion(r, c);
      }
    }
  }

  // 第二遍：收集数字与实际面积不符的格子
  const invalidCells: { r: number; c: number }[] = [];
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (grid[r][c] !== null) {
        const actualSize = regionSizeMap.get(`${r},${c}`);
        if (actualSize !== undefined && grid[r][c] !== actualSize) {
          invalidCells.push({ r, c });
        }
      }
    }
  }

  const valid = invalidCells.length === 0;

  return { 
    valid, 
    message: valid ? undefined : '存在区域面积不符',
    invalidCells 
  };
}