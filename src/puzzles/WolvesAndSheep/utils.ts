import type { WolvesAndSheepClue, WolvesAndSheepPuzzleData } from '../types';
import type { SlitherlinkValidationResult } from '../Slitherlink/utils';
import {
  getGridLineEdgeKey,
  filterValidGridLineEdgeKeys,
  isPositiveGridSize,
  isValidGridLineEdgeKey,
  parseGridLineEdgeKey,
  parsePuzzLinkParts,
} from '../gridUtils';

function decodeClueCharacter(char: string): WolvesAndSheepClue | undefined {
  if (char === '.') return null;
  if (/^[0-4]$/.test(char)) return Number(char);
  if (char === '5') return 'sheep';
  if (char === '6') return 'wolf';
  return undefined;
}

function decodeClues(
  encoded: string,
  width: number,
  height: number
): { clues: WolvesAndSheepClue[][]; consumed: number } | null {
  const flat: WolvesAndSheepClue[] = Array(width * height).fill(null);
  let cellIndex = 0;
  let index = 0;

  while (cellIndex < flat.length && index < encoded.length) {
    const char = encoded[index];
    if (char >= 'a' && char <= 'z') {
      // Number10 encoding: a skips one empty cell, b skips two, etc.
      const skip = parseInt(char, 36) - 9;
      if (!Number.isInteger(skip) || skip <= 0 || cellIndex + skip > flat.length) return null;
      cellIndex += skip;
      index += 1;
      continue;
    }

    const clue = decodeClueCharacter(char);
    if (clue === undefined) return null;
    flat[cellIndex] = clue;
    cellIndex += 1;
    index += 1;
  }

  if (cellIndex !== flat.length) return null;

  return {
    clues: Array.from({ length: height }, (_, row) =>
      flat.slice(row * width, (row + 1) * width)
    ),
    consumed: index,
  };
}

export function parseWolvesAndSheepLink(link: string): WolvesAndSheepPuzzleData | null {
  try {
    const parts = parsePuzzLinkParts(link);
    const id = parts[0];
    if (id !== 'wolvesandsheepfences') {
      return null;
    }

    const width = Number(parts[1]);
    const height = Number(parts[2]);
    // The first data segment is the puzzle.  PuzzLink may append an answer
    // segment after it; keeping that segment separate prevents answer data
    // from being mistaken for extra clue cells.
    const encoded = parts[3] ?? '';
    if (!isPositiveGridSize(width, height) || !encoded) return null;

    const decoded = decodeClues(encoded, width, height);
    if (!decoded || decoded.consumed !== encoded.length) return null;

    return { type: 'wolvesandsheepfences', width, height, clues: decoded.clues };
  } catch {
    return null;
  }
}

function getEdgeVertices(key: string) {
  const edge = parseGridLineEdgeKey(key);
  if (!edge) return null;
  if (edge.orientation === 'h') {
    return [
      `${edge.row},${edge.col}`,
      `${edge.row},${edge.col + 1}`,
    ] as const;
  }
  return [
    `${edge.row},${edge.col}`,
    `${edge.row + 1},${edge.col}`,
  ] as const;
}

const isValidEdge = isValidGridLineEdgeKey;

function getCellBoundaryKey(row: number, col: number, nextRow: number, nextCol: number): string | null {
  if (nextRow === row && nextCol === col + 1) return getGridLineEdgeKey('v', row, col + 1);
  if (nextRow === row && nextCol === col - 1) return getGridLineEdgeKey('v', row, col);
  if (nextRow === row + 1 && nextCol === col) return getGridLineEdgeKey('h', row + 1, col);
  if (nextRow === row - 1 && nextCol === col) return getGridLineEdgeKey('h', row, col);
  return null;
}

/** Return cells reachable from outside the loop through unlined borders. */
export function getWolvesAndSheepInsideGrid(lineEdges: string[], width: number, height: number) {
  const lineSet = new Set(filterValidGridLineEdgeKeys(lineEdges, width, height));
  const paddedWidth = width + 2;
  const paddedHeight = height + 2;
  const visited = Array.from({ length: paddedHeight }, () => Array(paddedWidth).fill(false));
  const queue = [{ row: 0, col: 0 }];
  visited[0][0] = true;

  for (let index = 0; index < queue.length; index++) {
    const current = queue[index];
    const neighbors = [
      { row: current.row - 1, col: current.col },
      { row: current.row + 1, col: current.col },
      { row: current.row, col: current.col - 1 },
      { row: current.row, col: current.col + 1 },
    ];

    for (const next of neighbors) {
      if (
        next.row < 0 || next.row >= paddedHeight ||
        next.col < 0 || next.col >= paddedWidth ||
        visited[next.row][next.col]
      ) continue;

      // A loop edge blocks transitions between two interior cells as well as
      // transitions across the perimeter. (The padded ring itself has no
      // edges.)
      const currentInterior = current.row >= 1 && current.row <= height && current.col >= 1 && current.col <= width;
      const nextInterior = next.row >= 1 && next.row <= height && next.col >= 1 && next.col <= width;
      if (currentInterior || nextInterior) {
        const interior = currentInterior ? current : next;
        const neighbor = currentInterior ? next : current;
        const cellRow = interior.row - 1;
        const cellCol = interior.col - 1;
        const neighborRow = neighbor.row - 1;
        const neighborCol = neighbor.col - 1;
        const key = getCellBoundaryKey(cellRow, cellCol, neighborRow, neighborCol);
        if (key && lineSet.has(key)) continue;
      }

      visited[next.row][next.col] = true;
      queue.push(next);
    }
  }

  return Array.from({ length: height }, (_, row) =>
    Array.from({ length: width }, (_, col) => !visited[row + 1][col + 1])
  );
}

function addCell(badCells: Set<string>, row: number, col: number) {
  badCells.add(`${row},${col}`);
}

export function validateWolvesAndSheep(
  lineEdges: string[],
  puzzle: WolvesAndSheepPuzzleData
): SlitherlinkValidationResult {
  const { width, height, clues } = puzzle;
  const badCells = new Set<string>();
  let message: string | undefined;
  const setMessage = (nextMessage: string) => {
    if (!message) message = nextMessage;
  };

  const invalidEdge = lineEdges.some((key) => !isValidEdge(key, width, height));
  if (invalidEdge) {
      setMessage('存档中存在无法识别的线段');
  }
  const lineSet = new Set(filterValidGridLineEdgeKeys(lineEdges, width, height));

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const clue = clues[row][col];
      if (typeof clue !== 'number') continue;
      const edges = [
        getGridLineEdgeKey('h', row, col),
        getGridLineEdgeKey('h', row + 1, col),
        getGridLineEdgeKey('v', row, col),
        getGridLineEdgeKey('v', row, col + 1),
      ];
      const count = edges.reduce((total, key) => total + (lineSet.has(key) ? 1 : 0), 0);
      if (count !== clue) {
        addCell(badCells, row, col);
        setMessage('数字周围的线段数量不正确');
      }
    }
  }

  if (lineSet.size === 0) {
    setMessage('需要画出一条单一回路');
  } else {
    const adjacency = new Map<string, Set<string>>();
    const edgeByVertex = new Map<string, Set<string>>();

    for (const key of lineSet) {
      const vertices = getEdgeVertices(key);
      if (!vertices) continue;
      const [a, b] = vertices;
      const aNeighbors = adjacency.get(a) ?? new Set<string>();
      const bNeighbors = adjacency.get(b) ?? new Set<string>();
      aNeighbors.add(b);
      bNeighbors.add(a);
      adjacency.set(a, aNeighbors);
      adjacency.set(b, bNeighbors);
      const aEdges = edgeByVertex.get(a) ?? new Set<string>();
      const bEdges = edgeByVertex.get(b) ?? new Set<string>();
      aEdges.add(key);
      bEdges.add(key);
      edgeByVertex.set(a, aEdges);
      edgeByVertex.set(b, bEdges);
    }

    for (const neighbors of adjacency.values()) {
      if (neighbors.size !== 2) {
        setMessage('回路不能分叉或产生端点');
        break;
      }
    }

    const startVertex = adjacency.keys().next().value as string | undefined;
    if (startVertex) {
      const visitedVertices = new Set([startVertex]);
      const visitedEdges = new Set<string>();
      const queue = [startVertex];
      for (let index = 0; index < queue.length; index++) {
        const vertex = queue[index];
        edgeByVertex.get(vertex)?.forEach((edge) => visitedEdges.add(edge));
        adjacency.get(vertex)?.forEach((next) => {
          if (visitedVertices.has(next)) return;
          visitedVertices.add(next);
          queue.push(next);
        });
      }
      if (visitedEdges.size !== lineSet.size) setMessage('所有线段必须连成一个单一回路');
    }
  }

  // Animal placement is meaningful only after a valid closed loop exists;
  // still compute it for partial input so the affected cells can be shown.
  const inside = getWolvesAndSheepInsideGrid(
    Array.from(lineSet).filter((key) => isValidEdge(key, width, height)),
    width,
    height
  );
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const clue = clues[row][col];
      if (clue === 'sheep' && !inside[row][col]) {
        addCell(badCells, row, col);
        setMessage('羊必须在回路内');
      } else if (clue === 'wolf' && inside[row][col]) {
        addCell(badCells, row, col);
        setMessage('狼必须在回路外');
      }
    }
  }

  return {
    valid: !message && badCells.size === 0,
    message,
    badCells: Array.from(badCells).map((key) => {
      const [row, col] = key.split(',').map(Number);
      return { row, col };
    }),
  };
}
