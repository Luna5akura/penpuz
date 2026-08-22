import type {
  BattleshipCellClue,
  BattleshipPuzzleData,
  BattleshipSegment,
  BattleshipShipShape,
} from '../types';
import type { ShadingCellState, ShadingValidationResult } from '../shared/ShadingBoard';
import { getCellKey, isPositiveGridSize, parsePuzzLinkParts } from '../gridUtils';

const SEGMENTS: Record<number, BattleshipSegment> = {
  1: 'up',
  2: 'down',
  3: 'left',
  4: 'right',
  5: 'center',
  6: 'single',
  7: 'up-left',
  8: 'up-right',
  9: 'down-left',
  10: 'down-right',
};

const FLEET_PRESETS: Record<string, string[]> = {
  c: ['11g', '11g', '11g', '21o', '21o', '31s'],
  d: ['11g', '11g', '11g', '11g', '21o', '21o', '21o', '31s', '31s', '41u'],
  e: [
    '11g', '11g', '11g', '11g', '11g',
    '21o', '21o', '21o', '21o',
    '31s', '31s', '31s',
    '41u', '41u', '51v',
  ],
  t: ['14u', '23bg', '22u', '23f', '23eg'],
  p: ['337k', '15v', '24as', '24bo', '23fg', '337i', '23rg', '334u', '335s', '33bk', '24bk', '337o'],
  z: [],
};

interface DecodedNumbers {
  values: (number | null)[];
  consumed: number;
}

function readNumber16(encoded: string, index: number): [number, number] | null {
  const char = encoded[index];
  if (/^[0-9a-f]$/.test(char)) return [parseInt(char, 16), 1];
  if (char === '.') return [-2, 1];

  const prefixedLengths: Record<string, number> = {
    '-': 2,
    '+': 3,
    '=': 3,
    '%': 3,
    '@': 3,
    '*': 4,
    '$': 5,
  };
  const digitCount = prefixedLengths[char];
  if (!digitCount) return null;

  const digits = encoded.slice(index + 1, index + 1 + digitCount);
  if (digits.length !== digitCount || !/^[0-9a-f]+$/.test(digits)) return null;

  const offsets: Record<string, number> = {
    '-': 0,
    '+': 0,
    '=': 4096,
    '%': 8192,
    '@': 8192,
    '*': 12240,
    '$': 77776,
  };
  return [parseInt(digits, 16) + offsets[char], digitCount + 1];
}

function decodeNumber16Values(encoded: string, count: number): DecodedNumbers | null {
  const values = Array<number | null>(count).fill(null);
  let cursor = 0;
  let index = 0;

  while (cursor < count && index < encoded.length) {
    const char = encoded[index];
    const number = readNumber16(encoded, index);
    if (number) {
      values[cursor] = number[0];
      cursor += 1;
      index += number[1];
      continue;
    }

    if (char >= 'g' && char <= 'z') {
      cursor += parseInt(char, 36) - 15;
      index += 1;
      if (cursor > count) return null;
      continue;
    }

    return null;
  }

  return cursor === count ? { values, consumed: index } : null;
}

export function decodeBattleshipShipShape(encoded: string): BattleshipShipShape | null {
  if (!/^[0-9a-z]{3,}$/.test(encoded)) return null;

  const width = parseInt(encoded[0], 36);
  const height = parseInt(encoded[1], 36);
  if (!isPositiveGridSize(width, height)) return null;

  let bits = '';
  for (const char of encoded.slice(2)) {
    const value = parseInt(char, 32);
    if (!Number.isFinite(value) || value < 0 || value >= 32) return null;
    bits += value.toString(2).padStart(5, '0');
  }

  const cellCount = width * height;
  const shapeBits = bits.slice(0, cellCount).padEnd(cellCount, '0');
  const cells = Array.from({ length: height }, (_, row) =>
    Array.from({ length: width }, (_, col) => shapeBits[row * width + col] === '1')
  );

  const occupied = cells.flatMap((row, y) =>
    row.flatMap((value, x) => value ? [{ row: y, col: x }] : [])
  );
  if (occupied.length === 0) return null;

  const seen = new Set<string>();
  const queue = [occupied[0]];
  while (queue.length > 0) {
    const cell = queue.pop()!;
    const key = getCellKey(cell.row, cell.col);
    if (seen.has(key)) continue;
    seen.add(key);

    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const row = cell.row + dr;
      const col = cell.col + dc;
      if (cells[row]?.[col]) queue.push({ row, col });
    }
  }
  if (seen.size !== occupied.length) return null;

  return { width, height, cells };
}

function parseFleet(parts: string[]): BattleshipShipShape[] | null {
  if (parts[0] === '') {
    const preset = FLEET_PRESETS[parts[1]];
    if (!preset || parts.length > 2 && parts.slice(2).some(Boolean)) return null;
    const fleet = preset.map(decodeBattleshipShipShape);
    return fleet.every((shape): shape is BattleshipShipShape => shape !== null) ? fleet : null;
  }

  if (!/^\d+$/.test(parts[0])) return null;
  const count = Number(parts[0]);
  if (!Number.isSafeInteger(count) || count < 0 || parts.length < count + 1) return null;

  const fleet = parts.slice(1, count + 1).map(decodeBattleshipShipShape);
  if (!fleet.every((shape): shape is BattleshipShipShape => shape !== null)) return null;
  if (parts.slice(count + 1).some(Boolean)) return null;
  return fleet;
}

export function parseBattleshipLink(link: string): BattleshipPuzzleData | null {
  try {
    const parts = parsePuzzLinkParts(link);
    if (parts[0] !== 'battleship' || parts.length < 5) return null;

    const width = Number(parts[1]);
    const height = Number(parts[2]);
    if (!isPositiveGridSize(width, height)) return null;

    const outside = decodeNumber16Values(parts[3], width + height);
    if (!outside || outside.values.some((value) => value === -2)) return null;

    const cells = decodeNumber16Values(parts[3].slice(outside.consumed), width * height);
    if (!cells || outside.consumed + cells.consumed !== parts[3].length) return null;

    const columnClues = outside.values.slice(0, width);
    const rowClues = outside.values.slice(width);
    if (columnClues.some((value) => value !== null && (value < 0 || value > height))) return null;
    if (rowClues.some((value) => value !== null && (value < 0 || value > width))) return null;

    const cellClues: BattleshipCellClue[] = [];
    cells.values.forEach((value, cellIndex) => {
      if (value === null) return;
      const row = Math.floor(cellIndex / width);
      const col = cellIndex % width;

      if (value === 0) {
        cellClues.push({ row, col, kind: 'water' });
      } else if (value === -2) {
        cellClues.push({ row, col, kind: 'ship', segment: 'unknown' });
      } else if (SEGMENTS[value]) {
        cellClues.push({ row, col, kind: 'ship', segment: SEGMENTS[value] });
      } else {
        throw new Error('Unsupported Battleship segment clue.');
      }
    });

    const fleet = parseFleet(parts.slice(4));
    if (!fleet) return null;

    return {
      type: 'battleship',
      width,
      height,
      columnClues,
      rowClues,
      cellClues,
      fleet,
    };
  } catch {
    return null;
  }
}

type Coord = { row: number; col: number };

function canonicalizeCoords(coords: Coord[]) {
  const variants = Array.from({ length: 8 }, (_, transform) => {
    const transformed = coords.map(({ row, col }) => {
      const x = col;
      const y = row;
      switch (transform) {
        case 0: return { x, y };
        case 1: return { x: -x, y };
        case 2: return { x, y: -y };
        case 3: return { x: -x, y: -y };
        case 4: return { x: y, y: x };
        case 5: return { x: -y, y: x };
        case 6: return { x: y, y: -x };
        default: return { x: -y, y: -x };
      }
    });
    const minX = Math.min(...transformed.map((cell) => cell.x));
    const minY = Math.min(...transformed.map((cell) => cell.y));
    return transformed
      .map((cell) => `${cell.x - minX},${cell.y - minY}`)
      .sort()
      .join(';');
  });

  return variants.sort()[0];
}

export function getBattleshipShapeKey(shape: BattleshipShipShape) {
  const coords = shape.cells.flatMap((row, rowIndex) =>
    row.flatMap((occupied, colIndex) => occupied ? [{ row: rowIndex, col: colIndex }] : [])
  );
  return canonicalizeCoords(coords);
}

function collectOccupiedComponents(occupied: boolean[][]) {
  const height = occupied.length;
  const width = occupied[0]?.length ?? 0;
  const componentIds = Array.from({ length: height }, () => Array(width).fill(-1));
  const components: Coord[][] = [];

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      if (!occupied[row][col] || componentIds[row][col] !== -1) continue;

      const id = components.length;
      const component: Coord[] = [];
      const queue: Coord[] = [{ row, col }];
      componentIds[row][col] = id;

      while (queue.length > 0) {
        const cell = queue.pop()!;
        component.push(cell);
        for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const nextRow = cell.row + dr;
          const nextCol = cell.col + dc;
          if (!occupied[nextRow]?.[nextCol] || componentIds[nextRow][nextCol] !== -1) continue;
          componentIds[nextRow][nextCol] = id;
          queue.push({ row: nextRow, col: nextCol });
        }
      }

      components.push(component);
    }
  }

  return { components, componentIds };
}

export function getBattleshipOccupiedGrid(grid: ShadingCellState[][], puzzle: BattleshipPuzzleData) {
  const occupied = Array.from({ length: puzzle.height }, (_, row) =>
    Array.from({ length: puzzle.width }, (_, col) => grid[row]?.[col] === 1)
  );

  puzzle.cellClues.forEach((clue) => {
    if (clue.kind === 'ship') occupied[clue.row][clue.col] = true;
  });
  return occupied;
}

export function inferBattleshipSegment(occupied: boolean[][], row: number, col: number): BattleshipSegment {
  const top = occupied[row - 1]?.[col] === true;
  const bottom = occupied[row + 1]?.[col] === true;
  const left = occupied[row]?.[col - 1] === true;
  const right = occupied[row]?.[col + 1] === true;

  if ((top && bottom) || (left && right)) return 'center';
  if (top) {
    if (left) return 'down-right';
    if (right) return 'down-left';
    return 'down';
  }
  if (bottom) {
    if (left) return 'up-right';
    if (right) return 'up-left';
    return 'up';
  }
  if (left) return 'right';
  if (right) return 'left';
  return 'single';
}

export function isBattleshipSegmentResolved(
  grid: ShadingCellState[][],
  puzzle: BattleshipPuzzleData,
  occupied: boolean[][],
  row: number,
  col: number
) {
  const waterClues = new Set(
    puzzle.cellClues
      .filter((clue) => clue.kind === 'water')
      .map((clue) => getCellKey(clue.row, clue.col))
  );
  const directions = {
    top: [-1, 0],
    right: [0, 1],
    bottom: [1, 0],
    left: [0, -1],
  } as const;
  const connected = Object.fromEntries(
    Object.entries(directions).map(([direction, [dr, dc]]) => [
      direction,
      occupied[row + dr]?.[col + dc] === true,
    ])
  ) as Record<keyof typeof directions, boolean>;
  // A visible cap is closed only by the board edge or a confirmed non-ship
  // cell. Connected neighbours are handled separately as ship continuations.
  const closed = (direction: keyof typeof directions) => {
    const [dr, dc] = directions[direction];
    const nextRow = row + dr;
    const nextCol = col + dc;
    if (nextRow < 0 || nextRow >= puzzle.height || nextCol < 0 || nextCol >= puzzle.width) return true;
    return grid[nextRow]?.[nextCol] === 2 || waterClues.has(getCellKey(nextRow, nextCol));
  };

  const decided = (direction: keyof typeof directions) => connected[direction] || closed(direction);
  const horizontalConnectionCount = Number(connected.left) + Number(connected.right);
  const verticalConnectionCount = Number(connected.top) + Number(connected.bottom);
  // A single cell needs every side closed. For a straight endpoint, only
  // the side away from its connected neighbour forms the visible cap.
  if (horizontalConnectionCount === 0 && verticalConnectionCount === 0) {
    return (Object.keys(directions) as Array<keyof typeof directions>).every(closed);
  }
  if (horizontalConnectionCount === 1 && verticalConnectionCount === 0) {
    return (connected.left ? closed('right') : closed('left'));
  }
  if (verticalConnectionCount === 1 && horizontalConnectionCount === 0) {
    return (connected.top ? closed('bottom') : closed('top'));
  }

  // Straight centers and junctions have no rounded cap, but retain the
  // resolved result for callers that use this helper generally.
  return (Object.keys(directions) as Array<keyof typeof directions>).every(decided);
}

function markCells(target: Set<string>, cells: Coord[]) {
  cells.forEach((cell) => target.add(getCellKey(cell.row, cell.col)));
}

function increment(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

export function validateBattleship(
  grid: ShadingCellState[][],
  puzzle: BattleshipPuzzleData
): ShadingValidationResult {
  const badCells = new Set<string>();
  let message: string | undefined;
  const setMessage = (nextMessage: string) => {
    message ??= nextMessage;
  };

  if (grid.length !== puzzle.height || grid.some((row) => row.length !== puzzle.width)) {
    return { valid: false, message: '盘面数据尺寸不正确', badCells: [] };
  }

  const occupied = getBattleshipOccupiedGrid(grid, puzzle);
  const clueMap = new Map(puzzle.cellClues.map((clue) => [getCellKey(clue.row, clue.col), clue]));

  puzzle.cellClues.forEach((clue) => {
    if (clue.kind === 'water') {
      if (grid[clue.row][clue.col] === 1) {
        badCells.add(getCellKey(clue.row, clue.col));
        setMessage('水域线索格不能放置船只');
      }
      return;
    }

    if (clue.segment && clue.segment !== 'unknown') {
      const actual = inferBattleshipSegment(occupied, clue.row, clue.col);
      if (actual !== clue.segment) {
        badCells.add(getCellKey(clue.row, clue.col));
        setMessage('给定船段的形状或方向不匹配');
      }
    }
  });

  for (let row = 0; row < puzzle.height; row++) {
    const clue = puzzle.rowClues[row];
    if (clue === null) continue;
    const count = occupied[row].filter(Boolean).length;
    if (count !== clue) {
      markCells(badCells, Array.from({ length: puzzle.width }, (_, col) => ({ row, col })));
      setMessage('行列外侧数字必须等于该行或该列中的船格数');
    }
  }

  for (let col = 0; col < puzzle.width; col++) {
    const clue = puzzle.columnClues[col];
    if (clue === null) continue;
    const count = occupied.reduce((total, row) => total + (row[col] ? 1 : 0), 0);
    if (count !== clue) {
      markCells(badCells, Array.from({ length: puzzle.height }, (_, row) => ({ row, col })));
      setMessage('行列外侧数字必须等于该行或该列中的船格数');
    }
  }

  const { components, componentIds } = collectOccupiedComponents(occupied);
  for (let row = 0; row < puzzle.height - 1; row++) {
    for (let col = 0; col < puzzle.width; col++) {
      for (const nextCol of [col - 1, col + 1]) {
        if (!occupied[row][col] || !occupied[row + 1]?.[nextCol]) continue;
        if (componentIds[row][col] === componentIds[row + 1][nextCol]) continue;
        badCells.add(getCellKey(row, col));
        badCells.add(getCellKey(row + 1, nextCol));
        setMessage('两艘不同的船不能斜向接触');
      }
    }
  }

  const expected = new Map<string, number>();
  puzzle.fleet.forEach((shape) => increment(expected, getBattleshipShapeKey(shape)));
  const actual = new Map<string, number>();
  const componentKeys = components.map(canonicalizeCoords);
  componentKeys.forEach((key) => increment(actual, key));

  const allShapeKeys = new Set([...expected.keys(), ...actual.keys()]);
  if (Array.from(allShapeKeys).some((key) => expected.get(key) !== actual.get(key))) {
    components.forEach((component, index) => {
      const key = componentKeys[index];
      if ((actual.get(key) ?? 0) > (expected.get(key) ?? 0)) markCells(badCells, component);
    });
    setMessage('盘面上的船只必须与舰队中的形状和数量完全一致');
  }

  for (let row = 0; row < puzzle.height; row++) {
    for (let col = 0; col < puzzle.width; col++) {
      const clue = clueMap.get(getCellKey(row, col));
      if (clue?.kind === 'water' && occupied[row][col]) badCells.add(getCellKey(row, col));
    }
  }

  return {
    valid: !message,
    message,
    badCells: Array.from(badCells).map((key) => {
      const [row, col] = key.split(',').map(Number);
      return { row, col };
    }),
  };
}
