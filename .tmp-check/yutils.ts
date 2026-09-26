import type { YinYangPuzzleData } from './types.ts';
import type { ShadingCellState, ShadingValidationResult } from './ShadingBoard.ts';
import { collectBooleanComponents, getCellKey, isPositiveGridSize, parsePuzzLinkParts } from './gridUtils.ts';

/**
 * PuzzLink stores a Yin-Yang grid in the pzpr "circle" encoding: every three
 * cells share one base-27 digit with weights 9/3/1, where 0 is an empty cell,
 * 1 a white circle and 2 a black circle.
 */
export function parseYinYangLink(link: string): YinYangPuzzleData | null {
  try {
    const parts = parsePuzzLinkParts(link);
    if (parts[0] !== 'yinyang' || parts.length < 4) return null;

    const width = Number(parts[1]);
    const height = Number(parts[2]);
    if (!isPositiveGridSize(width, height)) return null;

    const data = parts.slice(3).join('/').replace(/\/+$/u, '');
    if (!data) return null;

    const totalCells = width * height;
    const expectedChars = Math.ceil(totalCells / 3);
    if (data.length !== expectedChars) return null;

    const givens: (0 | 1 | null)[][] = Array.from({ length: height }, () => Array<0 | 1 | null>(width).fill(null));
    let cellIndex = 0;
    for (const char of data) {
      const digit = parseInt(char, 27);
      if (!Number.isInteger(digit) || digit < 0 || digit >= 27) return null;
      for (const weight of [9, 3, 1] as const) {
        if (cellIndex >= totalCells) break;
        const value = (Math.floor(digit / weight)) % 3;
        if (value !== 0) {
          givens[Math.floor(cellIndex / width)][cellIndex % width] = value === 2 ? 1 : 0;
        }
        cellIndex++;
      }
    }
    return { type: 'yinyang', width, height, givens };
  } catch {
    return null;
  }
}

/**
 * Yin-Yang rules: every cell must carry a circle, the black circles form one
 * orthogonally connected area, the white circles form one orthogonally
 * connected area, and no 2×2 block is monochromatic.
 */
export function validateYinYang(
  grid: ShadingCellState[][],
  puzzle: YinYangPuzzleData
): ShadingValidationResult {
  const badCells = new Set<string>();
  let message: string | undefined;
  const setMessage = (nextMessage: string) => {
    message ??= nextMessage;
  };

  const black = grid.map((row) => row.map((cell) => cell === 1));
  const white = grid.map((row) => row.map((cell) => cell === 2));

  // 1. Givens must keep their colour.
  for (let row = 0; row < puzzle.height; row++) {
    for (let col = 0; col < puzzle.width; col++) {
      const given = puzzle.givens[row][col];
      if (given === null) continue;
      const expected = given === 1 ? black : white;
      if (!expected[row][col]) {
        badCells.add(getCellKey(row, col));
        setMessage('给定的圆圈不能改变颜色');
      }
    }
  }

  // 2. Every cell must be filled.
  for (let row = 0; row < puzzle.height; row++) {
    for (let col = 0; col < puzzle.width; col++) {
      if (!black[row][col] && !white[row][col]) {
        badCells.add(getCellKey(row, col));
        setMessage('还有格子没有画圆圈');
      }
    }
  }

  // 3. No monochromatic 2×2 block.
  for (let row = 0; row < puzzle.height - 1; row++) {
    for (let col = 0; col < puzzle.width - 1; col++) {
      const cells = [black[row][col], black[row][col + 1], black[row + 1][col], black[row + 1][col + 1]];
      if (cells.every(Boolean) || cells.every((cell) => !cell)) {
        badCells.add(getCellKey(row, col));
        badCells.add(getCellKey(row, col + 1));
        badCells.add(getCellKey(row + 1, col));
        badCells.add(getCellKey(row + 1, col + 1));
        setMessage('任意2×2区域必须同时包含黑色和白色圆圈');
      }
    }
  }

  // 4. Both colours must be orthogonally connected.
  const blackComponents = collectBooleanComponents(black, true);
  const whiteComponents = collectBooleanComponents(white, true);
  if (blackComponents.length > 1 || whiteComponents.length > 1) {
    blackComponents.slice(1).forEach((component) => component.forEach((cell) => badCells.add(getCellKey(cell.row, cell.col))));
    whiteComponents.slice(1).forEach((component) => component.forEach((cell) => badCells.add(getCellKey(cell.row, cell.col))));
    setMessage('同色的圆圈必须连通成一个整体');
  }
  if (blackComponents.length === 0 || whiteComponents.length === 0) {
    setMessage('黑色和白色的圆圈都必须出现');
  }

  return {
    valid: message === undefined,
    message,
    badCells: Array.from(badCells).map((key) => {
      const [row, col] = key.split(',').map(Number);
      return { row, col };
    }),
  };
}
