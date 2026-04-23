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
  // 1. 线索格必须为空白
  for (const clue of clues) {
    if (grid[clue.row][clue.col]) return { valid: false, message: '线索格不可涂黑' };
  }

  for (const island of collectIslands(grid, clues, width, height)) {
    if (island.clueIndices.length === 0) {
      return { valid: false, message: '存在未连接数字的空白格' };
    }
    if (island.clueIndices.length > 1) {
      return { valid: false, message: '每个岛屿必须且只能包含一个线索' };
    }

    const clue = clues[island.clueIndices[0]];
    if (clue.value !== '?' && island.size !== clue.value) {
      return { valid: false, message: `岛屿面积不符：预期 ${clue.value}，实际 ${island.size}` };
    }
  }

  // 5~6：海域连通、无2×2黑块
  if (!isSeaConnected(grid, width, height)) {
    return { valid: false, message: '海域必须全部连通' };
  }
  if (has2x2Shaded(grid, width, height)) {
    return { valid: false, message: '不能出现 2×2 全黑区域' };
  }

  return { valid: true };
}

type NurikabeIsland = {
  size: number;
  clueIndices: number[];
};

function collectIslands(
  grid: boolean[][],
  clues: NurikabeClue[],
  width: number,
  height: number
): NurikabeIsland[] {
  const visited = Array.from({ length: height }, () => Array(width).fill(false));
  const clueIndexMap = new Map<string, number>();

  clues.forEach((clue, index) => {
    clueIndexMap.set(`${clue.row},${clue.col}`, index);
  });

  const islands: NurikabeIsland[] = [];
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (grid[r][c] || visited[r][c]) continue;
      islands.push(collectSingleIsland(grid, r, c, visited, clueIndexMap, width, height));
    }
  }

  return islands;
}

function collectSingleIsland(
  grid: boolean[][],
  r: number,
  c: number,
  visited: boolean[][],
  clueIndexMap: Map<string, number>,
  width: number,
  height: number
) : NurikabeIsland {
  const stack: Array<[number, number]> = [[r, c]];
  let size = 0;
  const clueIndices: number[] = [];

  while (stack.length > 0) {
    const [currentRow, currentCol] = stack.pop()!;
    if (
      currentRow < 0 ||
      currentRow >= height ||
      currentCol < 0 ||
      currentCol >= width ||
      grid[currentRow][currentCol] ||
      visited[currentRow][currentCol]
    ) {
      continue;
    }

    visited[currentRow][currentCol] = true;
    size++;

    const clueIndex = clueIndexMap.get(`${currentRow},${currentCol}`);
    if (clueIndex !== undefined) {
      clueIndices.push(clueIndex);
    }

    stack.push(
      [currentRow - 1, currentCol],
      [currentRow + 1, currentCol],
      [currentRow, currentCol - 1],
      [currentRow, currentCol + 1]
    );
  }

  return { size, clueIndices };
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

// ==================== 新增：详细违规检测（供例题实时高亮使用） ====================
export interface NurikabeViolations {
  violatedRules: number[];           // 违反的规则序号 [1,2,3,4,5,6]
  bad2x2Cells: { r: number; c: number }[];   // 需要标红的 2×2 左上角坐标
  badClueIndices: number[];          // 需要标红的线索下标（对应 clues 数组）
}

export function getNurikabeViolations(
  grid: boolean[][],
  clues: NurikabeClue[],
  width: number,
  height: number
): NurikabeViolations {
  const violations: NurikabeViolations = {
    violatedRules: [],
    bad2x2Cells: [],
    badClueIndices: [],
  };

  // 规则1：线索格被涂黑
  for (let i = 0; i < clues.length; i++) {
    const clue = clues[i];
    if (grid[clue.row][clue.col]) {
      violations.violatedRules.push(1);
      violations.badClueIndices.push(i);
    }
  }

  for (const island of collectIslands(grid, clues, width, height)) {
    if (island.clueIndices.length === 0) {
      violations.violatedRules.push(3);
      continue;
    }

    if (island.clueIndices.length > 1) {
      violations.violatedRules.push(4);
      violations.badClueIndices.push(...island.clueIndices);
      continue;
    }

    const clueIndex = island.clueIndices[0];
    const clue = clues[clueIndex];
    if (clue.value !== '?' && island.size !== clue.value) {
      violations.violatedRules.push(2);
      violations.badClueIndices.push(clueIndex);
    }
  }

  // 规则5：海域未连通
  if (!isSeaConnected(grid, width, height)) violations.violatedRules.push(5);

  // 规则6：2×2 全黑区域（同时记录具体位置）
  for (let r = 0; r < height - 1; r++) {
    for (let c = 0; c < width - 1; c++) {
      if (grid[r][c] && grid[r][c + 1] && grid[r + 1][c] && grid[r + 1][c + 1]) {
        violations.violatedRules.push(6);
        violations.bad2x2Cells.push({ r, c });
      }
    }
  }

  // 去重规则序号
  violations.violatedRules = [...new Set(violations.violatedRules)];
  violations.badClueIndices = [...new Set(violations.badClueIndices)];

  return violations;
}
