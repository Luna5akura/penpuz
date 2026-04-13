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



// ==================== 完整 Fillomino 验证逻辑（最终版：集成 autoThinLines 自动封闭） ====================
export function validateFillomino(
  grid: (number | null)[][],
  width: number,
  height: number,
  deepLines: Set<string> = new Set()
) {
  console.log('[VALIDATE DEBUG] === 开始验证 Fillomino（最终版：集成 autoThinLines 自动封闭） ===');
  
  // ==================== 打印 grid 与 deepLines ====================
  console.log('[GRID DEBUG] 当前 grid：');
  console.table(grid);
  console.log('[DEEP LINES DEBUG] deepLines Set（共', deepLines.size, '条）：');
  console.log(Array.from(deepLines).sort());

  console.log('[VALIDATE DEBUG] grid size:', height, 'x', width);
  console.log('[VALIDATE DEBUG] filled cells:', grid.flat().filter(v => v !== null).length);
  console.log('[VALIDATE DEBUG] deepLines count:', deepLines.size);

  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]] as const;

  const getEdgeKey = (r1: number, c1: number, r2: number, c2: number): string | null => {
    if (r1 === r2 && Math.abs(c1 - c2) === 1) return `h-${r1}-${Math.min(c1, c2)}`;
    if (c1 === c2 && Math.abs(r1 - r2) === 1) return `v-${Math.min(r1, r2)}-${c1}`;
    return null;
  };

  // ==================== 计算 autoThinLines（完全复制自 Board.tsx） ====================
  const autoThinLines = (() => {
    const keys = new Set<string>();
    const visited = Array.from({ length: height }, () => Array(width).fill(false));
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        const val = grid[r][c];
        if (val === null || visited[r][c] || val === 0) continue;
        const component: { r: number; c: number }[] = [];
        const stack = [{ r, c }];
        visited[r][c] = true;
        while (stack.length > 0) {
          const cell = stack.pop()!;
          component.push(cell);
          for (const [dr, dc] of dirs) {
            const nr = cell.r + dr;
            const nc = cell.c + dc;
            if (nr >= 0 && nr < height && nc >= 0 && nc < width &&
                !visited[nr][nc] && grid[nr][nc] === val) {
              visited[nr][nc] = true;
              stack.push({ r: nr, c: nc });
            }
          }
        }
        if (component.length === val) {
          console.log(`[AUTO THIN LINES DEBUG] 发现已完成区域 (clue=${val}, size=${val})，自动封闭`);
          for (const cell of component) {
            for (const [dr, dc] of dirs) {
              const nr = cell.r + dr;
              const nc = cell.c + dc;
              if (nr >= 0 && nr < height && nc >= 0 && nc < width && grid[nr][nc] !== val) {
                const edgeKey = getEdgeKey(cell.r, cell.c, nr, nc);
                if (edgeKey) keys.add(edgeKey);
              }
            }
          }
        }
      }
    }
    console.log('[AUTO THIN LINES DEBUG] 自动边界数量:', keys.size);
    return keys;
  })();

  const hasBoundary = (r1: number, c1: number, r2: number, c2: number): boolean => {
    if (r1 < 0 || r1 >= height || c1 < 0 || c1 >= width ||
        r2 < 0 || r2 >= height || c2 < 0 || c2 >= width) return true;

    const key = getEdgeKey(r1, c1, r2, c2);
    if (!key) return true;

    if (deepLines.has(key)) {
      console.log(`[BOUNDARY DEBUG] hard boundary (deepLines) at ${key}`);
      return true;
    }
    if (autoThinLines.has(key)) {
      console.log(`[BOUNDARY DEBUG] auto closed boundary (autoThinLines) at ${key}`);
      return true;
    }

    const v1 = grid[r1][c1];
    const v2 = grid[r2][c2];
    if (v1 !== null && v2 !== null && v1 !== v2) {
      console.log(`[BOUNDARY DEBUG] auto boundary (different numbers) at ${key}`);
      return true;
    }
    return false;
  };

  // ==================== clue 锚点区域发现（尊重 auto 封闭） ====================
  const visited = Array.from({ length: height }, () => Array(width).fill(false));
  const regions: { size: number; clueValue: number; cells: { r: number; c: number }[] }[] = [];
  const invalidCells: { r: number; c: number }[] = [];

  console.log('[VALIDATE DEBUG] 开始 clue 锚点区域发现...');
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (visited[r][c]) continue;
      const clueValue = grid[r][c];
      if (clueValue === null) continue;

      console.log(`[REGION DEBUG] 发现新区域起点 (${r},${c}), clue=${clueValue}`);

      const cells: { r: number; c: number }[] = [];
      const stack = [{ r, c }];
      visited[r][c] = true;

      while (stack.length > 0) {
        const cell = stack.pop()!;
        cells.push(cell);

        for (const [dr, dc] of dirs) {
          const nr = cell.r + dr;
          const nc = cell.c + dc;
          if (nr >= 0 && nr < height && nc >= 0 && nc < width &&
              !visited[nr][nc] &&
              !hasBoundary(cell.r, cell.c, nr, nc) &&
              (grid[nr][nc] === null || grid[nr][nc] === clueValue)) {
            visited[nr][nc] = true;
            stack.push({ r: nr, c: nc });
          }
        }
      }

      const size = cells.length;
      console.log(`[REGION DEBUG] → 区域大小=${size} (含 ${cells.filter(p => grid[p.r][p.c] === null).length} 个 null), cells=${cells.map(p => `(${p.r},${p.c})`).join(' ')}`);

      if (size !== clueValue) {
        console.log(`[INVALID] 区域大小不匹配: clue=${clueValue}, size=${size}`);
        invalidCells.push(...cells);
      }

      regions.push({ size, clueValue, cells });
    }
  }

  // ==================== 相同大小区域不能正交相邻 ====================
  console.log(`[VALIDATE DEBUG] 共发现 ${regions.length} 个区域，开始相邻检查...`);
  for (let i = 0; i < regions.length; i++) {
    for (let j = i + 1; j < regions.length; j++) {
      const regA = regions[i];
      const regB = regions[j];
      if (regA.size !== regB.size) continue;

      let adjacent = false;
      for (const cellA of regA.cells) {
        for (const [dr, dc] of dirs) {
          const nr = cellA.r + dr;
          const nc = cellA.c + dc;
          if (nr < 0 || nr >= height || nc < 0 || nc >= width) continue;
          const isInRegB = regB.cells.some(cellB => cellB.r === nr && cellB.c === nc);
          if (isInRegB) {
            adjacent = true;
            break;
          }
        }
        if (adjacent) break;
      }

      if (adjacent) {
        console.log(`[INVALID] 发现两个大小为 ${regA.size} 的区域正交相邻`);
        invalidCells.push(...regA.cells, ...regB.cells);
      }
    }
  }

  const valid = invalidCells.length === 0;
  const uniqueInvalid = [...new Set(invalidCells.map(cell => `${cell.r},${cell.c}`))]
    .map(key => {
      const [rr, cc] = key.split(',').map(Number);
      return { r: rr, c: cc };
    });

  console.log('[VALIDATE DEBUG] 验证完成 - valid:', valid);
  console.log('[VALIDATE DEBUG] invalidCells count:', uniqueInvalid.length);
  console.log('[VALIDATE DEBUG] === 验证结束 ===');

  return {
    valid,
    message: valid ? undefined : '存在区域大小不匹配或相同大小区域正交相邻',
    invalidCells: uniqueInvalid
  };
}