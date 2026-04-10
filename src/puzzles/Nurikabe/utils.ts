import { PuzzleData, NurikabeClue } from '../types';

// ==================== 新增：pzprjs 链接解析逻辑 ====================
function readNumber16(bstr: string, i: number): [number, number] {
  if (i >= bstr.length) return [-1, 0];
  const ca = bstr[i];
  if (/[0-9a-f]/.test(ca)) {
    return [parseInt(ca, 16), 1];
  } else if (ca === '-') {
    return i + 3 <= bstr.length ? [parseInt(bstr.substr(i + 1, 2), 16), 3] : [-1, 0];
  } else if (ca === '+') {
    return i + 4 <= bstr.length ? [parseInt(bstr.substr(i + 1, 3), 16), 4] : [-1, 0];
  } else if (ca === '=') {
    return i + 4 <= bstr.length ? [parseInt(bstr.substr(i + 1, 3), 16) + 4096, 4] : [-1, 0];
  } else if (ca === '%' || ca === '@') {
    return i + 4 <= bstr.length ? [parseInt(bstr.substr(i + 1, 3), 16) + 8192, 4] : [-1, 0];
  } else if (ca === '*') {
    return i + 5 <= bstr.length ? [parseInt(bstr.substr(i + 1, 4), 16) + 12240, 5] : [-1, 0];
  } else if (ca === '$') {
    return i + 6 <= bstr.length ? [parseInt(bstr.substr(i + 1, 5), 16) + 77776, 6] : [-1, 0];
  } else if (ca === '.') {
    return [-2, 1];
  } else {
    return [-1, 0];
  }
}

export function parsePuzzLink(link: string): PuzzleData | null {
  try {
    // 支持完整 URL 或纯数据字符串
    let dataPart = link.includes('?') ? link.split('?')[1] : link;
    if (dataPart.startsWith('p?')) dataPart = dataPart.slice(2);

    const parts = dataPart.split('/');
    if (parts[0] !== 'nurikabe' || parts.length < 3) return null;

    const width = parseInt(parts[1], 10);
    const height = parseInt(parts[2], 10);
    const dataStr = parts.slice(3).join('/'); // 编码数据段（支持潜在多段但 Nurikabe 通常为单段）

    if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0 || !dataStr) {
      return null;
    }

    const clues: NurikabeClue[] = [];
    const totalCells = width * height;
    let cellIndex = 0;
    let strIndex = 0;

    while (strIndex < dataStr.length && cellIndex < totalCells) {
      const ca = dataStr[strIndex];
      const [value, consumed] = readNumber16(dataStr, strIndex);

      if (value !== -1) {
        // 仅当存在有效线索时记录（qnum >= 0 或 -2）
        const row = Math.floor(cellIndex / width);
        const col = cellIndex % width;
        const clueValue: number | '?' = value === -2 ? '?' : value;
        clues.push({ row, col, value: clueValue });
        strIndex += consumed;
        cellIndex++;
      } else if (ca >= 'g' && ca <= 'z') {
        // g-z 为跳过计数（无线索的连续空单元格）
        cellIndex += parseInt(ca, 36) - 15;
        strIndex++;
      } else {
        strIndex++;
      }
    }

    return {
      type: 'nurikabe',
      width,
      height,
      clues,
    };
  } catch {
    return null;
  }
}

export function validateNurikabe(
  grid: boolean[][],
  clues: NurikabeClue[],
  width: number,
  height: number
): { valid: boolean; message?: string } {
  const visited = Array.from({ length: height }, () => Array(width).fill(false));

  // 1. 线索格必须为空白
  for (const clue of clues) {
    if (grid[clue.row][clue.col]) return { valid: false, message: '线索格不可涂黑' };
  }

  // 2. 检查每个岛屿面积（关键修复在此）
  for (const clue of clues) {
    const size = floodFillIsland(grid, clue.row, clue.col, visited, width, height);
    if (clue.value !== '?' && size !== clue.value) {
      return { valid: false, message: `岛屿面积不符：预期 ${clue.value}，实际 ${size}` };
    }
  }

  // 3. 所有空白格必须属于某个岛屿
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (!grid[r][c] && !visited[r][c]) {
        return { valid: false, message: '存在未连接数字的空白格' };
      }
    }
  }

  // 4~6 保持完全不变（岛屿不正交相邻、海域连通、无2×2黑块）
  if (hasAdjacentIslands(grid, width, height)) {
    return { valid: false, message: '岛屿之间不能正交相邻' };
  }
  if (!isSeaConnected(grid, width, height)) {
    return { valid: false, message: '海域必须全部连通' };
  }
  if (has2x2Shaded(grid, width, height)) {
    return { valid: false, message: '不能出现 2×2 全黑区域' };
  }

  return { valid: true };
}

// Flood Fill 辅助函数（岛屿面积）
function floodFillIsland(
  grid: boolean[][],
  r: number,
  c: number,
  visited: boolean[][],
  width: number,
  height: number
): number {
  if (r < 0 || r >= height || c < 0 || c >= width || grid[r][c] || visited[r][c]) return 0;
  visited[r][c] = true;
  let size = 1;
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dr, dc] of dirs) {
    size += floodFillIsland(grid, r + dr, c + dc, visited, width, height);
  }
  return size;
}

// 4. 岛屿之间不能正交相邻（不同岛屿不可正交接触）
function hasAdjacentIslands(grid: boolean[][], width: number, height: number): boolean {
  const islandId = Array.from({ length: height }, () => Array(width).fill(-1));
  let id = 0;
  const tempVisited = Array.from({ length: height }, () => Array(width).fill(false));

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (!grid[r][c] && !tempVisited[r][c]) {
        floodFillAssignId(grid, r, c, tempVisited, islandId, id, width, height);
        id++;
      }
    }
  }

  const dirs = [[0, 1], [1, 0]]; // 只检查右和下，避免重复
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (grid[r][c]) continue;
      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < height && nc < width && !grid[nr][nc] && islandId[r][c] !== islandId[nr][nc]) {
          return true;
        }
      }
    }
  }
  return false;
}

function floodFillAssignId(
  grid: boolean[][],
  r: number,
  c: number,
  visited: boolean[][],
  islandId: number[][],
  id: number,
  width: number,
  height: number
) {
  if (r < 0 || r >= height || c < 0 || c >= width || grid[r][c] || visited[r][c]) return;
  visited[r][c] = true;
  islandId[r][c] = id;
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dr, dc] of dirs) {
    floodFillAssignId(grid, r + dr, c + dc, visited, islandId, id, width, height);
  }
}

// 5. 海域必须全部连通
function isSeaConnected(grid: boolean[][], width: number, height: number): boolean {
  const visited = Array.from({ length: height }, () => Array(width).fill(false));
  let startFound = false;

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (grid[r][c] && !startFound) {
        floodFillSea(grid, r, c, visited, width, height);
        startFound = true;
        break;
      }
    }
    if (startFound) break;
  }

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (grid[r][c] && !visited[r][c]) return false;
    }
  }
  return true;
}

function floodFillSea(
  grid: boolean[][],
  r: number,
  c: number,
  visited: boolean[][],
  width: number,
  height: number
) {
  if (r < 0 || r >= height || c < 0 || c >= width || !grid[r][c] || visited[r][c]) return;
  visited[r][c] = true;
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dr, dc] of dirs) {
    floodFillSea(grid, r + dr, c + dc, visited, width, height);
  }
}

// 6. 无 2×2 全黑区域
function has2x2Shaded(grid: boolean[][], width: number, height: number): boolean {
  for (let r = 0; r < height - 1; r++) {
    for (let c = 0; c < width - 1; c++) {
      if (grid[r][c] && grid[r][c + 1] && grid[r + 1][c] && grid[r + 1][c + 1]) {
        return true;
      }
    }
  }
  return false;
}