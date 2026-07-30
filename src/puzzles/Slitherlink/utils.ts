import type { SlitherlinkPuzzleData } from '../types';
import {
  decodePzpr4CellClues,
  getGridLineEdgeKey,
  isPositiveGridSize,
  parseGridLineEdgeKey,
  parsePuzzLinkParts,
} from '../gridUtils';

export interface SlitherlinkValidationResult {
  valid: boolean;
  message?: string;
  badCells: Array<{ row: number; col: number }>;
}

export function parseSlitherlinkLink(link: string): SlitherlinkPuzzleData | null {
  try {
    const parts = parsePuzzLinkParts(link);
    if ((parts[0] !== 'slither' && parts[0] !== 'slitherlink') || parts.length < 4) return null;

    const width = Number(parts[1]);
    const height = Number(parts[2]);
    const encodedClues = parts.slice(3).join('/');
    if (!isPositiveGridSize(width, height) || !encodedClues) return null;

    const clues = decodePzpr4CellClues(width, height, encodedClues);
    if (!clues) return null;

    return {
      type: 'slither',
      width,
      height,
      clues,
    };
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

export function getSlitherlinkCellEdgeKeys(row: number, col: number) {
  return [
    getGridLineEdgeKey('h', row, col),
    getGridLineEdgeKey('h', row + 1, col),
    getGridLineEdgeKey('v', row, col),
    getGridLineEdgeKey('v', row, col + 1),
  ];
}

export function validateSlitherlink(
  lineEdges: string[],
  puzzle: SlitherlinkPuzzleData
): SlitherlinkValidationResult {
  const { width, height, clues } = puzzle;
  const lineSet = new Set(lineEdges);
  const badCells = new Set<string>();
  let message: string | undefined;
  const setMessage = (nextMessage: string) => {
    if (!message) message = nextMessage;
  };

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const clue = clues[row][col];
      if (clue === null) continue;

      const count = getSlitherlinkCellEdgeKeys(row, col).reduce(
        (total, key) => total + (lineSet.has(key) ? 1 : 0),
        0
      );
      if (count !== clue) {
        badCells.add(`${row},${col}`);
        setMessage('数字周围的线段数量不正确');
      }
    }
  }

  if (lineSet.size === 0) {
    setMessage('需要画出一条单一回路');
    return {
      valid: false,
      message,
      badCells: Array.from(badCells).map((key) => {
        const [row, col] = key.split(',').map(Number);
        return { row, col };
      }),
    };
  }

  const adjacency = new Map<string, Set<string>>();
  const edgeByVertex = new Map<string, Set<string>>();

  for (const key of lineSet) {
    const vertices = getEdgeVertices(key);
    if (!vertices) {
      setMessage('存档中存在无法识别的线段');
      continue;
    }

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
      edgeByVertex.get(vertex)?.forEach((edgeKey) => visitedEdges.add(edgeKey));

      adjacency.get(vertex)?.forEach((nextVertex) => {
        if (visitedVertices.has(nextVertex)) return;
        visitedVertices.add(nextVertex);
        queue.push(nextVertex);
      });
    }

    if (visitedEdges.size !== lineSet.size) {
      setMessage('所有线段必须连成一个单一回路');
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
