import type { KoburinClue, KoburinPuzzleData, YajilinSolutionEdge } from '../types';
import {
  areOrthogonallyAdjacent,
  filterValidCellEdgeKeys,
  getOrthogonalNeighbors,
  getEdgeKey,
  isPositiveGridSize,
  isValidCellEdgeKey,
  parsePuzzLinkParts,
  parseSolutionEdgeKey,
} from '../gridUtils';

/** 0 = undecided, 1 = shaded, 2 = user mark/cross. */
export type KoburinCellState = 0 | 1 | 2;

export interface KoburinValidationResult {
  valid: boolean;
  message?: string;
  badCells: { r: number; c: number }[];
  badClueIndices: number[];
}

export type KoburinHitTarget =
  | { kind: 'cell'; row: number; col: number }
  | { kind: 'edge'; key: string; cells: [{ row: number; col: number }, { row: number; col: number }] }
  | null;

function decode4CellCharacter(character: string) {
  if (character >= '0' && character <= '4') {
    return { value: Number(character), advance: 1 };
  }
  if (character >= '5' && character <= '9') {
    return { value: Number(character) - 5, advance: 2 };
  }
  if (character >= 'a' && character <= 'e') {
    return { value: parseInt(character, 16) - 10, advance: 3 };
  }
  if (character === '.') {
    return { value: '?' as const, advance: 1 };
  }
  return null;
}

/**
 * Parse the native PuzzLink `koburin` encoding.  Koburin uses pzpr's
 * `encode4Cell` format: digits 0–4 encode a clue, 5–9/a–e encode a clue
 * followed by one/two empty cells, `g`–`z` encode runs of empty cells, and
 * `.` is a question-mark clue.
 */
export function parseKoburinLink(link: string): KoburinPuzzleData | null {
  try {
    const parts = parsePuzzLinkParts(link);
    const id = parts[0]?.toLowerCase();
    if (id !== 'koburin') return null;

    let partIndex = 1;
    let flags = '';
    // PuzzLink places optional flags before the dimensions (`koburin/m/9/9`)
    // while a few shared links append them after the payload.  Accept both
    // forms so imported links remain interoperable.
    if (parts[partIndex] && !/^\d+$/.test(parts[partIndex])) {
      flags = parts[partIndex];
      partIndex += 1;
    }

    const width = Number(parts[partIndex]);
    const height = Number(parts[partIndex + 1]);
    if (!isPositiveGridSize(width, height) || parts.length <= partIndex + 2) return null;

    let payloadIndex = partIndex + 2;
    if (/^[mob]{1,3}$/.test(parts[payloadIndex] ?? '') && parts[payloadIndex + 1]) {
      flags += parts[payloadIndex];
      payloadIndex += 1;
    }
    const encoded = parts[payloadIndex] ?? '';
    if (!encoded) return null;

    const totalCells = width * height;
    const clues: KoburinClue[] = [];
    let cellIndex = 0;
    let stringIndex = 0;

    while (stringIndex < encoded.length && cellIndex < totalCells) {
      const character = encoded[stringIndex];

      if (character >= 'g' && character <= 'z') {
        const skip = parseInt(character, 36) - 15;
        if (!Number.isInteger(skip) || skip <= 0 || cellIndex + skip > totalCells) return null;
        cellIndex += skip;
        stringIndex += 1;
        continue;
      }

      const decoded = decode4CellCharacter(character);
      if (!decoded || cellIndex + decoded.advance > totalCells) return null;

      clues.push({
        row: Math.floor(cellIndex / width),
        col: cellIndex % width,
        value: decoded.value,
      });
      cellIndex += decoded.advance;
      stringIndex += 1;
    }

    // A puzzle payload must describe every cell.  Optional pzpr flags are
    // accepted after the payload; unknown flags are rejected rather than
    // silently changing the clue semantics.
    if (cellIndex !== totalCells || stringIndex !== encoded.length) return null;
    const trailing = parts.slice(payloadIndex + 1).filter(Boolean).join('');
    // A trailing single flag is used by a few exporters.  Other trailing
    // segments are answer data and are intentionally ignored, as pzpr does.
    if (trailing && /^[mob]{1,3}$/.test(trailing)) flags += trailing;
    if (flags && [...flags].some((flag) => !'mob'.includes(flag))) return null;

    return {
      type: 'koburin',
      width,
      height,
      clues,
      minesweeper: flags.includes('m') || undefined,
    };
  } catch {
    return null;
  }
}

export function createEmptyKoburinGrid(width: number, height: number): KoburinCellState[][] {
  return Array.from({ length: height }, () => Array(width).fill(0) as KoburinCellState[]);
}

export function getKoburinEdgeKey(r1: number, c1: number, r2: number, c2: number) {
  if (!areOrthogonallyAdjacent({ row: r1, col: c1 }, { row: r2, col: c2 })) return null;
  return getEdgeKey({ r1, c1, r2, c2 });
}

export function parseKoburinEdgeKey(key: string) {
  return parseSolutionEdgeKey(key);
}

export function createKoburinEdgeSet(edges: YajilinSolutionEdge[]) {
  return new Set(
    edges
      .map((edge) => getKoburinEdgeKey(edge.r1, edge.c1, edge.r2, edge.c2))
      .filter((key): key is string => key !== null)
  );
}

export function getIncidentKoburinEdgeKeys(row: number, col: number, width: number, height: number) {
  return filterValidCellEdgeKeys([
    getKoburinEdgeKey(row, col, row - 1, col),
    getKoburinEdgeKey(row, col, row + 1, col),
    getKoburinEdgeKey(row, col, row, col - 1),
    getKoburinEdgeKey(row, col, row, col + 1),
  ].filter((key): key is string => key !== null), width, height);
}

function clueKey(row: number, col: number) {
  return `${row},${col}`;
}

function normaliseValidationInput(
  cluesOrPuzzle: KoburinClue[] | KoburinPuzzleData,
  width?: number,
  height?: number
) {
  if ('type' in cluesOrPuzzle) {
    return {
      clues: cluesOrPuzzle.clues,
      width: cluesOrPuzzle.width,
      height: cluesOrPuzzle.height,
      minesweeper: cluesOrPuzzle.minesweeper === true,
    };
  }

  return {
    clues: cluesOrPuzzle,
    width: width ?? 0,
    height: height ?? 0,
    minesweeper: false,
  };
}

/**
 * Validate both the shading rules and the cell-centre loop.  The third
 * argument can be either a complete puzzle (recommended) or a clue list with
 * explicit width/height, mirroring the older Yajilin validator API.
 */
export function validateKoburin(
  grid: KoburinCellState[][],
  loopEdges: Set<string> | readonly string[],
  cluesOrPuzzle: KoburinClue[] | KoburinPuzzleData,
  width?: number,
  height?: number
): KoburinValidationResult {
  const input = normaliseValidationInput(cluesOrPuzzle, width, height);
  const clues = input.clues;
  const boardWidth = input.width;
  const boardHeight = input.height;
  const edgeSet = loopEdges instanceof Set ? loopEdges : new Set(loopEdges);
  const badCells = new Set<string>();
  const badClues = new Set<number>();
  const clueCells = new Set<string>();
  let invalidEdge = false;

  const addBadCell = (row: number, col: number) => {
    if (row >= 0 && row < boardHeight && col >= 0 && col < boardWidth) {
      badCells.add(clueKey(row, col));
    }
  };

  for (const clue of clues) {
    if (
      !Number.isInteger(clue.row) ||
      !Number.isInteger(clue.col) ||
      clue.row < 0 || clue.row >= boardHeight ||
      clue.col < 0 || clue.col >= boardWidth ||
      clueCells.has(clueKey(clue.row, clue.col))
    ) {
      invalidEdge = true;
      continue;
    }
    clueCells.add(clueKey(clue.row, clue.col));
  }

  // Shaded cells may not be clue cells or orthogonally adjacent to another
  // shaded cell.
  for (let row = 0; row < boardHeight; row++) {
    for (let col = 0; col < boardWidth; col++) {
      if (grid[row]?.[col] !== 1) continue;
      if (clueCells.has(clueKey(row, col))) addBadCell(row, col);

      if (row + 1 < boardHeight && grid[row + 1]?.[col] === 1) {
        addBadCell(row, col);
        addBadCell(row + 1, col);
      }
      if (col + 1 < boardWidth && grid[row]?.[col + 1] === 1) {
        addBadCell(row, col);
        addBadCell(row, col + 1);
      }
    }
  }

  clues.forEach((clue, index) => {
    if (clue.row < 0 || clue.row >= boardHeight || clue.col < 0 || clue.col >= boardWidth) {
      badClues.add(index);
      return;
    }
    if (grid[clue.row]?.[clue.col] === 1) badClues.add(index);
    if (clue.value === '?') return;

    const neighbours = input.minesweeper
      ? Array.from({ length: 3 }, (_, rowOffset) =>
          Array.from({ length: 3 }, (_, colOffset) => ({
            row: clue.row + rowOffset - 1,
            col: clue.col + colOffset - 1,
          }))
        ).flat().filter((cell) => cell.row !== clue.row || cell.col !== clue.col)
      : getOrthogonalNeighbors(clue.row, clue.col, boardWidth, boardHeight);
    const count = neighbours.reduce(
      (total, cell) => total + (grid[cell.row]?.[cell.col] === 1 ? 1 : 0),
      0
    );
    if (count !== clue.value) badClues.add(index);
  });

  const degree = Array.from({ length: boardHeight }, () => Array(boardWidth).fill(0));
  const adjacency = new Map<string, Set<string>>();

  for (const key of edgeSet) {
    const edge = parseKoburinEdgeKey(key);
    if (!edge || !isValidCellEdgeKey(key, boardWidth, boardHeight)) {
      invalidEdge = true;
      continue;
    }

    const first = clueKey(edge.r1, edge.c1);
    const second = clueKey(edge.r2, edge.c2);
    degree[edge.r1][edge.c1] += 1;
    degree[edge.r2][edge.c2] += 1;
    const firstNeighbours = adjacency.get(first) ?? new Set<string>();
    const secondNeighbours = adjacency.get(second) ?? new Set<string>();
    firstNeighbours.add(second);
    secondNeighbours.add(first);
    adjacency.set(first, firstNeighbours);
    adjacency.set(second, secondNeighbours);

    if (clueCells.has(first) || clueCells.has(second) ||
        grid[edge.r1]?.[edge.c1] === 1 || grid[edge.r2]?.[edge.c2] === 1) {
      addBadCell(edge.r1, edge.c1);
      addBadCell(edge.r2, edge.c2);
    }
  }

  const loopCells: string[] = [];
  for (let row = 0; row < boardHeight; row++) {
    for (let col = 0; col < boardWidth; col++) {
      const key = clueKey(row, col);
      const expectedLoopCell = !clueCells.has(key) && grid[row]?.[col] !== 1;
      if (expectedLoopCell) {
        loopCells.push(key);
        if (degree[row][col] !== 2) addBadCell(row, col);
      } else if (degree[row][col] !== 0) {
        addBadCell(row, col);
      }
    }
  }

  if (loopCells.length === 0) {
    invalidEdge = true;
  } else {
    const visited = new Set<string>([loopCells[0]]);
    const stack = [loopCells[0]];
    while (stack.length > 0) {
      const current = stack.pop()!;
      for (const next of adjacency.get(current) ?? []) {
        if (!visited.has(next)) {
          visited.add(next);
          stack.push(next);
        }
      }
    }
    for (const key of loopCells) {
      if (!visited.has(key)) {
        const [row, col] = key.split(',').map(Number);
        addBadCell(row, col);
      }
    }
  }

  let message: string | undefined;
  if (invalidEdge) {
    message = '存档中存在无法识别的线段，或回路为空。';
  } else if (badClues.size > 0) {
    message = '数字周围的黑格数量不正确，或线索格被错误使用。';
  } else if (badCells.size > 0) {
    message = '回路、黑格或相邻关系不满足 Koburin 规则。';
  }

  return {
    valid: !invalidEdge && badCells.size === 0 && badClues.size === 0,
    message,
    badCells: [...badCells].map((key) => {
      const [r, c] = key.split(',').map(Number);
      return { r, c };
    }),
    badClueIndices: [...badClues].sort((a, b) => a - b),
  };
}

export function detectKoburinHitTarget(
  x: number,
  y: number,
  width: number,
  height: number,
  cellSize: number,
  gap: number
): KoburinHitTarget {
  const step = cellSize + gap;
  const col = Math.floor(x / step);
  const row = Math.floor(y / step);
  if (row < 0 || row >= height || col < 0 || col >= width) return null;

  const localX = x - col * step;
  const localY = y - row * step;
  if (localX < 0 || localX > cellSize || localY < 0 || localY > cellSize) return null;

  const centerHalf = cellSize * 0.24;
  const centerX = cellSize / 2;
  const centerY = cellSize / 2;
  if (Math.abs(localX - centerX) <= centerHalf && Math.abs(localY - centerY) <= centerHalf) {
    return { kind: 'cell', row, col };
  }

  const threshold = Math.max(8, cellSize * 0.18);
  const candidates: Array<{
    distance: number;
    edgeKey: string | null;
    cells: [{ row: number; col: number }, { row: number; col: number }];
  }> = [
    {
      distance: Math.hypot(localX - centerX, localY),
      edgeKey: row > 0 ? getKoburinEdgeKey(row - 1, col, row, col) : null,
      cells: [{ row: row - 1, col }, { row, col }],
    },
    {
      distance: Math.hypot(localX - centerX, localY - cellSize),
      edgeKey: row + 1 < height ? getKoburinEdgeKey(row, col, row + 1, col) : null,
      cells: [{ row, col }, { row: row + 1, col }],
    },
    {
      distance: Math.hypot(localX, localY - centerY),
      edgeKey: col > 0 ? getKoburinEdgeKey(row, col - 1, row, col) : null,
      cells: [{ row, col: col - 1 }, { row, col }],
    },
    {
      distance: Math.hypot(localX - cellSize, localY - centerY),
      edgeKey: col + 1 < width ? getKoburinEdgeKey(row, col, row, col + 1) : null,
      cells: [{ row, col }, { row, col: col + 1 }],
    },
  ];

  const candidate = candidates
    .filter((item) => item.edgeKey !== null)
    .sort((a, b) => a.distance - b.distance)[0];
  if (!candidate || candidate.distance > threshold) return null;
  return { kind: 'edge', key: candidate.edgeKey!, cells: candidate.cells };
}
