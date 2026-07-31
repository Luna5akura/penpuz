import type { CSSProperties, ReactNode } from 'react';
import type { NoteReplayCellMark } from '@/notes/types';
import {
  commonBoardChrome,
  boardClassNames,
  getBoardCenterMarkMetrics,
  getBoardCellColors,
  getBoardDotRadius,
  getBoardFrameStyle,
  getBoardTextStyle,
  getCellDividerStyle,
  getLoopLineStrokeWidth,
  getLoopCrossStrokeWidth,
  getOutlinedBorderStrokeWidth,
  getRoomBoundaryStrokeWidth,
  woodBoardTheme,
  type BoardCellTone,
} from '@/puzzles/boardTheme';
import { countPlacedDominoPairs, getDominoPairKey } from '@/puzzles/DominoSearch/utils';
import { getRegionBoundarySegments, parseGridLineEdgeKey, parseSolutionEdgeKey } from '@/puzzles/gridUtils';
import { getTrialLevelColors } from '@/puzzles/trialStyles';
import type { PuzzleData, PuzzleType, YajilinDirection } from '@/puzzles/types';

interface NotePuzzleBoardProps {
  puzzle?: PuzzleData;
  puzzleType: PuzzleType;
  width: number;
  height: number;
  snapshot?: unknown;
  marks?: NoteReplayCellMark[];
  cellSize?: number;
  ariaLabel?: string;
}

interface CellView {
  tone: BoardCellTone;
  content?: ReactNode;
  locked?: boolean;
  fontRatio?: number;
}

type SlitherCellMark = 'circle' | 'cross';

const DEFAULT_CELL_SIZE = 38;
const BOARD_PADDING = commonBoardChrome.padding;
const BOARD_BORDER = commonBoardChrome.border;

const directionGlyphs: Record<YajilinDirection, string> = {
  up: '↑',
  right: '→',
  down: '↓',
  left: '←',
};

function getLocalCellKey(row: number, col: number) {
  return `${row}:${col}`;
}

function makePositionMap<T extends { row: number; col: number }>(items: T[]) {
  return new Map(items.map((item) => [getLocalCellKey(item.row, item.col), item]));
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' ? value as Record<string, unknown> : null;
}

function getStringArray(snapshot: unknown, key: string) {
  const value = asRecord(snapshot)?.[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function getGridValue(snapshot: unknown, row: number, col: number) {
  const grid = asRecord(snapshot)?.grid;
  if (!Array.isArray(grid)) return undefined;

  const rowValues = grid[row];
  if (!Array.isArray(rowValues)) return undefined;
  return rowValues[col];
}

function getNumberMatrixValue(snapshot: unknown, key: string, row: number, col: number) {
  const matrix = asRecord(snapshot)?.[key];
  if (!Array.isArray(matrix)) return 0;

  const rowValues = matrix[row];
  if (!Array.isArray(rowValues)) return 0;

  const value = rowValues[col];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function getRecordLevel(snapshot: unknown, key: string, itemKey: string) {
  const record = asRecord(snapshot)?.[key];
  if (!record || typeof record !== 'object' || Array.isArray(record)) return 0;

  const value = (record as Record<string, unknown>)[itemKey];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function getFirstRecordLevel(snapshot: unknown, itemKey: string, keys: string[]) {
  for (const key of keys) {
    const level = getRecordLevel(snapshot, key, itemKey);
    if (level > 0) return level;
  }
  return 0;
}

function getSlitherCellMark(snapshot: unknown, row: number, col: number): SlitherCellMark | null {
  const record = asRecord(snapshot)?.cellMarks;
  if (!record) return null;

  const value = record[`${row},${col}`] ?? record[getLocalCellKey(row, col)];
  return value === 'circle' || value === 'cross' ? value : null;
}

function SlitherCellMark({
  mark,
  cellSize,
  color,
}: {
  mark: SlitherCellMark;
  cellSize: number;
  color: string;
}) {
  const center = cellSize / 2;
  const { radius, crossSize, strokeWidth } = getBoardCenterMarkMetrics(cellSize);

  return (
    <svg
      className="pointer-events-none absolute inset-0"
      width={cellSize}
      height={cellSize}
      viewBox={`0 0 ${cellSize} ${cellSize}`}
      aria-hidden="true"
    >
      {mark === 'circle' ? (
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
        />
      ) : (
        <g stroke={color} strokeWidth={strokeWidth} strokeLinecap="round">
          <line x1={center - crossSize} y1={center - crossSize} x2={center + crossSize} y2={center + crossSize} />
          <line x1={center - crossSize} y1={center + crossSize} x2={center + crossSize} y2={center - crossSize} />
        </g>
      )}
    </svg>
  );
}

function getCellTrialLevel(snapshot: unknown, row: number, col: number) {
  return (
    getNumberMatrixValue(snapshot, 'gridLevels', row, col) ||
    getNumberMatrixValue(snapshot, 'cellLevels', row, col) ||
    getNumberMatrixValue(snapshot, 'levels', row, col)
  );
}

function getSnapshotTrialColor(
  snapshot: unknown,
  itemKey: string,
  levelKeys: string[],
  tone: 'line' | 'text',
  fallback: string
) {
  const trialColors = getTrialLevelColors(getFirstRecordLevel(snapshot, itemKey, levelKeys));
  return trialColors?.[tone] ?? fallback;
}

function isNumberValue(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function renderMintonetteClue(value: number | null, cellSize: number) {
  const diameter = Math.max(24, Math.floor(cellSize * 0.68));

  return (
    <span
      className={`flex items-center justify-center rounded-full border ${boardClassNames.cellText}`}
      style={{
        width: `${diameter}px`,
        height: `${diameter}px`,
        borderColor: woodBoardTheme.border,
        background: woodBoardTheme.panel,
        ...getBoardTextStyle(cellSize, 0.38, 14),
      }}
    >
      {value ?? '?'}
    </span>
  );
}

function renderKurarinClue(color: 'black' | 'white' | 'gray', cellSize: number) {
  const diameter = Math.max(20, Math.floor(cellSize * 0.58));
  const fill = color === 'black' ? woodBoardTheme.shaded : color === 'gray' ? woodBoardTheme.marked : woodBoardTheme.whiteCell;

  return (
    <span
      className="rounded-full border"
      style={{
        width: `${diameter}px`,
        height: `${diameter}px`,
        borderColor: woodBoardTheme.border,
        background: fill,
      }}
    />
  );
}

function renderSlovakClue(sum: number, count: number) {
  return (
    <span className="flex flex-col items-center justify-center text-[0.72em] leading-none">
      <span>{sum}</span>
      <span className="mt-0.5 border-t border-white/70 px-1 pt-0.5">{count}</span>
    </span>
  );
}

function getCellView(puzzle: PuzzleData | undefined, row: number, col: number, cellSize: number): CellView {
  if (!puzzle) return { tone: 'cell' };

  switch (puzzle.type) {
    case 'nurikabe': {
      const clue = puzzle.clues.find((item) => item.row === row && item.col === col);
      return clue ? { tone: 'clue', content: clue.value, locked: true } : { tone: 'cell' };
    }
    case 'fillomino': {
      const clue = puzzle.clues[row]?.[col] ?? null;
      return clue !== null ? { tone: 'prefilled', content: clue, locked: true } : { tone: 'cell' };
    }
    case 'yajilin': {
      const clue = puzzle.clues.find((item) => item.row === row && item.col === col);
      return clue
        ? {
            tone: 'shaded',
            content: (
              <span className="flex flex-col items-center justify-center text-[0.62em] leading-none">
                <span>{directionGlyphs[clue.direction]}</span>
                <span>{clue.value}</span>
              </span>
            ),
            locked: true,
            fontRatio: 0.88,
          }
        : { tone: 'cell' };
    }
    case 'starbattle':
      return { tone: 'cell' };
    case 'heyawake': {
      const clue = puzzle.clues.find((item) => item.row === row && item.col === col);
      return clue ? { tone: 'clue', content: clue.value, locked: true } : { tone: 'cell' };
    }
    case 'aqre': {
      const clue = puzzle.clues.find((item) => item.row === row && item.col === col);
      return clue ? { tone: 'clue', content: clue.value, locked: true } : { tone: 'cell' };
    }
    case 'mintonette': {
      const clue = puzzle.clues.find((item) => item.row === row && item.col === col);
      return clue
        ? { tone: 'cell', content: renderMintonetteClue(clue.value, cellSize), locked: true }
        : { tone: 'cell' };
    }
    case 'nikoji': {
      const letter = puzzle.letters[row]?.[col] ?? null;
      return letter ? { tone: 'clue', content: letter, locked: true } : { tone: 'cell' };
    }
    case 'akari': {
      const cell = puzzle.cells[row]?.[col] ?? null;
      if (cell === null) return { tone: 'cell' };
      return { tone: 'shaded', content: cell === 'black' ? undefined : cell, locked: true };
    }
    case 'kurarin': {
      const clue = puzzle.clues.find((item) => item.row === row && item.col === col);
      return clue
        ? { tone: 'cell', content: renderKurarinClue(clue.color, cellSize), locked: true }
        : { tone: 'cell' };
    }
    case 'walkwalk': {
      const clue = puzzle.clues.find((item) => item.row === row && item.col === col);
      return clue ? { tone: 'clue', content: clue.value, locked: true } : { tone: 'cell' };
    }
    case 'slither': {
      const clue = puzzle.clues[row]?.[col] ?? null;
      return clue !== null ? { tone: 'cell', content: clue, locked: true } : { tone: 'cell' };
    }
    case 'lits': {
      const excluded = puzzle.regionIds[row]?.[col] < 0;
      return excluded ? { tone: 'marked', content: '×', locked: true } : { tone: 'cell' };
    }
    case 'lakes': {
      const clue = puzzle.clues.find((item) => item.row === row && item.col === col);
      return clue ? { tone: 'clue', content: clue.value, locked: true } : { tone: 'cell' };
    }
    case 'domino-search': {
      const value = puzzle.numbers[row]?.[col] ?? null;
      return value === null ? { tone: 'shaded', locked: true } : { tone: 'cell', content: value, locked: true };
    }
    case 'snail': {
      const cell = puzzle.cells[row]?.[col] ?? null;
      if (cell === 'block') return { tone: 'shaded', locked: true };
      if (typeof cell === 'number') return { tone: 'prefilled', content: cell, locked: true };
      return { tone: 'cell' };
    }
    case 'slovak-sums': {
      const cell = puzzle.cells[row]?.[col] ?? null;
      if (cell && typeof cell === 'object') {
        return { tone: 'shaded', content: renderSlovakClue(cell.sum, cell.count), locked: true, fontRatio: 0.82 };
      }
      return { tone: 'cell' };
    }
    default:
      return { tone: 'cell' };
  }
}

function getSnapshotCellView(puzzleType: PuzzleType, snapshot: unknown, row: number, col: number): CellView | null {
  const value = getGridValue(snapshot, row, col);
  if (value === undefined || value === null || value === 0) return null;

  if (puzzleType === 'fillomino' || puzzleType === 'snail' || puzzleType === 'slovak-sums') {
    return isNumberValue(value) ? { tone: 'cell', content: value } : null;
  }

  if (puzzleType === 'starbattle') {
    if (value === 1) return { tone: 'cell', content: '★', fontRatio: 0.78 };
    if (value === 2) return { tone: 'marked', content: '×' };
    return null;
  }

  if (puzzleType === 'akari') {
    if (value === 1) return { tone: 'brightLit', content: '●', fontRatio: 0.72 };
    if (value === 2) return { tone: 'marked', content: '×' };
    return null;
  }

  if (value === 1) return { tone: 'playerShaded' };
  if (value === 2) return { tone: 'marked', content: '×' };
  return null;
}

function getRegionIds(puzzle: PuzzleData | undefined) {
  if (!puzzle) return null;

  switch (puzzle.type) {
    case 'starbattle':
    case 'heyawake':
    case 'aqre':
    case 'walkwalk':
    case 'lits':
      return puzzle.regionIds;
    default:
      return null;
  }
}

function getLegacyMarkView(mark?: NoteReplayCellMark): CellView | null {
  if (!mark) return null;
  if (mark.kind === 'shade') return { tone: 'playerShaded' };
  if (mark.kind === 'star') return { tone: 'lit', content: '★', fontRatio: 0.78 };
  if (mark.kind === 'path') return { tone: 'brightLit', content: '•', fontRatio: 0.78 };
  return { tone: 'marked', content: mark.label || '?' };
}

function mergeCellViews(base: CellView, overlay: CellView | null) {
  if (!overlay || base.locked) return base;
  return {
    ...base,
    ...overlay,
    locked: base.locked,
  };
}

function getSnapshotCellTrialStyle(
  puzzleType: PuzzleType,
  snapshot: unknown,
  value: unknown,
  row: number,
  col: number,
  locked?: boolean
): CSSProperties | undefined {
  if (locked || value === undefined || value === null || value === 0) return undefined;

  const trialColors = getTrialLevelColors(getCellTrialLevel(snapshot, row, col));
  if (!trialColors) return undefined;

  if (puzzleType === 'akari') {
    return {
      boxShadow: `inset 0 0 0 2px ${trialColors.line}`,
    };
  }

  if (value === 1) {
    return {
      background: trialColors.fill,
      color: woodBoardTheme.shadedText,
    };
  }

  return {
    background: trialColors.softFill,
    color: trialColors.text,
  };
}

function RegionBoundaries({
  regionIds,
  width,
  height,
  cellSize,
}: {
  regionIds: number[][];
  width: number;
  height: number;
  cellSize: number;
}) {
  const boundaries = getRegionBoundarySegments(regionIds, width, height);
  const strokeWidth = getRoomBoundaryStrokeWidth();
  const outlineWidth = getOutlinedBorderStrokeWidth(strokeWidth);

  return (
    <svg
      className="pointer-events-none absolute left-0 top-0"
      width={width * cellSize + BOARD_PADDING * 2}
      height={height * cellSize + BOARD_PADDING * 2}
    >
      {boundaries.horizontal.map((segment) => {
        const x1 = BOARD_PADDING + segment.col * cellSize;
        const y = BOARD_PADDING + segment.row * cellSize;
        return (
          <line
            key={`ho-${segment.row}-${segment.col}`}
            x1={x1}
            y1={y}
            x2={x1 + cellSize}
            y2={y}
            stroke={woodBoardTheme.cell}
            strokeWidth={outlineWidth}
          />
        );
      })}
      {boundaries.vertical.map((segment) => {
        const x = BOARD_PADDING + segment.col * cellSize;
        const y1 = BOARD_PADDING + segment.row * cellSize;
        return (
          <line
            key={`vo-${segment.row}-${segment.col}`}
            x1={x}
            y1={y1}
            x2={x}
            y2={y1 + cellSize}
            stroke={woodBoardTheme.cell}
            strokeWidth={outlineWidth}
          />
        );
      })}
      {boundaries.horizontal.map((segment) => {
        const x1 = BOARD_PADDING + segment.col * cellSize;
        const y = BOARD_PADDING + segment.row * cellSize;
        return (
          <line
            key={`h-${segment.row}-${segment.col}`}
            x1={x1}
            y1={y}
            x2={x1 + cellSize}
            y2={y}
            stroke={woodBoardTheme.border}
            strokeWidth={strokeWidth}
            strokeLinecap="square"
          />
        );
      })}
      {boundaries.vertical.map((segment) => {
        const x = BOARD_PADDING + segment.col * cellSize;
        const y1 = BOARD_PADDING + segment.row * cellSize;
        return (
          <line
            key={`v-${segment.row}-${segment.col}`}
            x1={x}
            y1={y1}
            x2={x}
            y2={y1 + cellSize}
            stroke={woodBoardTheme.border}
            strokeWidth={strokeWidth}
            strokeLinecap="square"
          />
        );
      })}
    </svg>
  );
}

function SlitherDots({ width, height, cellSize }: { width: number; height: number; cellSize: number }) {
  return (
    <svg
      className="pointer-events-none absolute left-0 top-0"
      width={width * cellSize + BOARD_PADDING * 2}
      height={height * cellSize + BOARD_PADDING * 2}
    >
      {Array.from({ length: height + 1 }, (_, row) =>
        Array.from({ length: width + 1 }, (_, col) => (
          <circle
            key={`dot-${row}-${col}`}
            cx={BOARD_PADDING + col * cellSize}
            cy={BOARD_PADDING + row * cellSize}
            r={getBoardDotRadius(cellSize, 0.06, 2)}
            fill={woodBoardTheme.border}
          />
        ))
      )}
    </svg>
  );
}

function getCellCenterLinePoints(key: string, cellSize: number) {
  const edge = parseSolutionEdgeKey(key);
  if (!edge) return null;

  return {
    x1: BOARD_PADDING + (edge.c1 + 0.5) * cellSize,
    y1: BOARD_PADDING + (edge.r1 + 0.5) * cellSize,
    x2: BOARD_PADDING + (edge.c2 + 0.5) * cellSize,
    y2: BOARD_PADDING + (edge.r2 + 0.5) * cellSize,
  };
}

function getDominoOutlineRect(key: string, cellSize: number) {
  const edge = parseSolutionEdgeKey(key);
  if (!edge) return null;

  const horizontal = edge.r1 === edge.r2 && Math.abs(edge.c1 - edge.c2) === 1;
  const vertical = edge.c1 === edge.c2 && Math.abs(edge.r1 - edge.r2) === 1;
  if (!horizontal && !vertical) return null;

  const row = Math.min(edge.r1, edge.r2);
  const col = Math.min(edge.c1, edge.c2);

  return {
    x: BOARD_PADDING + col * cellSize,
    y: BOARD_PADDING + row * cellSize,
    width: (horizontal ? 2 : 1) * cellSize,
    height: (vertical ? 2 : 1) * cellSize,
  };
}

function getGridLinePoints(key: string, cellSize: number) {
  const edge = parseGridLineEdgeKey(key);
  if (!edge) return null;

  if (edge.orientation === 'h') {
    return {
      x1: BOARD_PADDING + edge.col * cellSize,
      y1: BOARD_PADDING + edge.row * cellSize,
      x2: BOARD_PADDING + (edge.col + 1) * cellSize,
      y2: BOARD_PADDING + edge.row * cellSize,
    };
  }

  return {
    x1: BOARD_PADDING + edge.col * cellSize,
    y1: BOARD_PADDING + edge.row * cellSize,
    x2: BOARD_PADDING + edge.col * cellSize,
    y2: BOARD_PADDING + (edge.row + 1) * cellSize,
  };
}

function getCellBoundaryLinePoints(key: string, cellSize: number) {
  const match = key.match(/^([hv])-(\d+)-(\d+)$/);
  if (!match) return null;

  const type = match[1];
  const row = Number(match[2]);
  const col = Number(match[3]);

  if (type === 'h') {
    const x = BOARD_PADDING + (col + 1) * cellSize;
    const y1 = BOARD_PADDING + row * cellSize;
    return { x1: x, y1, x2: x, y2: y1 + cellSize };
  }

  const y = BOARD_PADDING + (row + 1) * cellSize;
  const x1 = BOARD_PADDING + col * cellSize;
  return { x1, y1: y, x2: x1 + cellSize, y2: y };
}

function getThinCellCenterLinePoints(key: string, cellSize: number) {
  const match = key.match(/^([hv])-(\d+)-(\d+)$/);
  if (!match) return null;

  const type = match[1];
  const row = Number(match[2]);
  const col = Number(match[3]);
  const x1 = BOARD_PADDING + (col + 0.5) * cellSize;
  const y1 = BOARD_PADDING + (row + 0.5) * cellSize;

  if (type === 'h') {
    return { x1, y1, x2: x1 + cellSize, y2: y1 };
  }

  return { x1, y1, x2: x1, y2: y1 + cellSize };
}

function DominoOutlineOverlay({ keys, cellSize, snapshot }: { keys: string[]; cellSize: number; snapshot: unknown }) {
  if (keys.length === 0) return null;

  return (
    <svg
      className="pointer-events-none absolute left-0 top-0"
      width="100%"
      height="100%"
      style={{ overflow: 'visible' }}
    >
      {keys.map((key) => {
        const rect = getDominoOutlineRect(key, cellSize);
        if (!rect) return null;

        return (
          <rect
            key={`domino-outline-${key}`}
            {...rect}
            fill="none"
            stroke={getSnapshotTrialColor(snapshot, key, ['levels'], 'line', woodBoardTheme.ink)}
            strokeWidth={getRoomBoundaryStrokeWidth()}
            strokeLinejoin="miter"
          />
        );
      })}
    </svg>
  );
}

function LineOverlay({
  keys,
  cellSize,
  stroke,
  strokeWidth,
  getPoints,
  keyPrefix,
}: {
  keys: string[];
  cellSize: number;
  stroke: string | ((key: string) => string);
  strokeWidth: number;
  getPoints: (key: string, cellSize: number) => { x1: number; y1: number; x2: number; y2: number } | null;
  keyPrefix: string;
}) {
  if (keys.length === 0) return null;

  return (
    <svg
      className="pointer-events-none absolute left-0 top-0"
      width="100%"
      height="100%"
      style={{ overflow: 'visible' }}
    >
      {keys.map((key) => {
        const points = getPoints(key, cellSize);
        if (!points) return null;

        return (
          <line
            key={`${keyPrefix}-${key}`}
            {...points}
            stroke={typeof stroke === 'function' ? stroke(key) : stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

function CrossOverlay({
  keys,
  cellSize,
  getPoints,
  keyPrefix,
  stroke = woodBoardTheme.border,
}: {
  keys: string[];
  cellSize: number;
  getPoints: (key: string, cellSize: number) => { x1: number; y1: number; x2: number; y2: number } | null;
  keyPrefix: string;
  stroke?: string | ((key: string) => string);
}) {
  if (keys.length === 0) return null;

  const size = Math.max(4, Math.floor(cellSize * 0.12));

  return (
    <svg className="pointer-events-none absolute left-0 top-0" width="100%" height="100%">
      {keys.map((key) => {
        const points = getPoints(key, cellSize);
        if (!points) return null;
        const x = (points.x1 + points.x2) / 2;
        const y = (points.y1 + points.y2) / 2;

        return (
          <g
            key={`${keyPrefix}-${key}`}
            stroke={typeof stroke === 'function' ? stroke(key) : stroke}
            strokeLinecap="round"
            strokeWidth={getLoopCrossStrokeWidth()}
          >
            <line x1={x - size} y1={y - size} x2={x + size} y2={y + size} />
            <line x1={x - size} y1={y + size} x2={x + size} y2={y - size} />
          </g>
        );
      })}
    </svg>
  );
}

function StarbattleDots({
  edgeDots,
  vertexDots,
  cellSize,
  snapshot,
}: {
  edgeDots: string[];
  vertexDots: string[];
  cellSize: number;
  snapshot: unknown;
}) {
  if (edgeDots.length === 0 && vertexDots.length === 0) return null;

  const dotRadius = getBoardDotRadius(cellSize, 0.09, 3);

  return (
    <svg className="pointer-events-none absolute left-0 top-0" width="100%" height="100%">
      {edgeDots.map((key) => {
        const match = key.match(/^([hv])-(\d+)-(\d+)$/);
        if (!match) return null;
        const orientation = match[1];
        const row = Number(match[2]);
        const col = Number(match[3]);
        const cx = BOARD_PADDING + (orientation === 'h' ? col * cellSize + cellSize / 2 : col * cellSize);
        const cy = BOARD_PADDING + (orientation === 'h' ? row * cellSize : row * cellSize + cellSize / 2);

        return (
          <circle
            key={`edge-dot-${key}`}
            cx={cx}
            cy={cy}
            r={dotRadius}
            fill={getSnapshotTrialColor(snapshot, key, ['edgeDotLevels'], 'line', woodBoardTheme.border)}
          />
        );
      })}
      {vertexDots.map((key) => {
        const match = key.match(/^p-(\d+)-(\d+)$/);
        if (!match) return null;
        const row = Number(match[1]);
        const col = Number(match[2]);

        return (
          <circle
            key={`vertex-dot-${key}`}
            cx={BOARD_PADDING + col * cellSize}
            cy={BOARD_PADDING + row * cellSize}
            r={dotRadius}
            fill={getSnapshotTrialColor(snapshot, key, ['vertexDotLevels'], 'line', woodBoardTheme.border)}
          />
        );
      })}
    </svg>
  );
}

export default function NotePuzzleBoard({
  puzzle,
  puzzleType,
  width,
  height,
  snapshot,
  marks = [],
  cellSize = DEFAULT_CELL_SIZE,
  ariaLabel,
}: NotePuzzleBoardProps) {
  const activePuzzle = puzzle?.type === puzzleType && puzzle.width === width && puzzle.height === height ? puzzle : undefined;
  const markMap = makePositionMap(marks);
  const regionIds = getRegionIds(activePuzzle);
  const isSlither = activePuzzle?.type === 'slither' || (!activePuzzle && puzzleType === 'slither');
  const isDominoSearch = activePuzzle?.type === 'domino-search' || (!activePuzzle && puzzleType === 'domino-search');
  const dominoes = activePuzzle?.type === 'domino-search' ? activePuzzle.dominoes : null;
  const lineEdges = getStringArray(snapshot, 'lineEdges');
  const loopEdges = getStringArray(snapshot, 'loopEdges');
  const dominoEdges = getStringArray(snapshot, 'edges');
  const placedDominoCounts = activePuzzle?.type === 'domino-search'
    ? countPlacedDominoPairs(dominoEdges, activePuzzle.numbers)
    : null;
  const dominoListItems = dominoes && placedDominoCounts
    ? (() => {
        const seenCounts = new Map<string, number>();

        return dominoes.map(([left, right], index) => {
          const key = getDominoPairKey(left, right);
          const seenCount = seenCounts.get(key) ?? 0;
          seenCounts.set(key, seenCount + 1);

          return {
            left,
            right,
            index,
            used: (placedDominoCounts.get(key) ?? 0) > seenCount,
          };
        });
      })()
    : null;
  const crossedEdges = getStringArray(snapshot, 'crossedEdges');
  const deepLines = getStringArray(snapshot, 'deepLines');
  const thinLines = getStringArray(snapshot, 'thinLines');
  const edgeDots = getStringArray(snapshot, 'edgeDots');
  const vertexDots = getStringArray(snapshot, 'vertexDots');
  const dominoOutlineKeys = isDominoSearch ? dominoEdges : [];
  const centerLoopKeys = loopEdges;
  const centerPathKeys = isSlither ? [] : lineEdges;
  const gridLineKeys = isSlither ? lineEdges : [];
  const centerCrossKeys = isSlither ? [] : crossedEdges;
  const gridCrossKeys = isSlither ? crossedEdges : [];
  const boardWidth = width * cellSize;
  const boardHeight = height * cellSize;
  const frameStyle: CSSProperties = {
    width: `${boardWidth + BOARD_PADDING * 2 + BOARD_BORDER * 2}px`,
    height: `${boardHeight + BOARD_PADDING * 2 + BOARD_BORDER * 2}px`,
    ...getBoardFrameStyle(BOARD_BORDER),
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="max-w-full overflow-x-auto">
        <div className="relative select-none" style={frameStyle} aria-label={ariaLabel}>
          <div
            className="absolute grid"
            style={{
              left: `${BOARD_PADDING}px`,
              top: `${BOARD_PADDING}px`,
              gridTemplateColumns: `repeat(${width}, ${cellSize}px)`,
            }}
          >
            {Array.from({ length: height }, (_, row) =>
              Array.from({ length: width }, (_, col) => {
                const base = getCellView(activePuzzle, row, col, cellSize);
                const snapshotValue = getGridValue(snapshot, row, col);
                const snapshotView = getSnapshotCellView(puzzleType, snapshot, row, col);
                const legacyView = snapshotView ? null : getLegacyMarkView(markMap.get(getLocalCellKey(row, col)));
                const view = mergeCellViews(base, snapshotView ?? legacyView);
                const slitherMark = isSlither ? getSlitherCellMark(snapshot, row, col) : null;
                const slitherMarkKey = `${row},${col}`;
                const trialStyle = getSnapshotCellTrialStyle(
                  puzzleType,
                  snapshot,
                  snapshotValue,
                  row,
                  col,
                  base.locked
                );
                const cellStyle: CSSProperties = {
                  width: `${cellSize}px`,
                  height: `${cellSize}px`,
                  ...getBoardCellColors(view.tone),
                  ...getCellDividerStyle(),
                  ...trialStyle,
                  ...getBoardTextStyle(cellSize, view.fontRatio ?? 0.58, 15),
                };

                return (
                  <div
                    key={`${row}-${col}`}
                    className={boardClassNames.cellContent}
                    style={cellStyle}
                  >
                    {slitherMark ? (
                      <SlitherCellMark
                        mark={slitherMark}
                        cellSize={cellSize}
                        color={getSnapshotTrialColor(
                          snapshot,
                          slitherMarkKey,
                          ['cellMarkLevels'],
                          'text',
                          woodBoardTheme.border
                        )}
                      />
                    ) : null}
                    <span className="relative z-10">{view.content}</span>
                  </div>
                );
              })
            )}
          </div>

          {regionIds ? <RegionBoundaries regionIds={regionIds} width={width} height={height} cellSize={cellSize} /> : null}
          {isSlither ? <SlitherDots width={width} height={height} cellSize={cellSize} /> : null}
          <LineOverlay
            keys={deepLines}
            cellSize={cellSize}
            stroke={(key) => getSnapshotTrialColor(snapshot, key, ['deepLineLevels'], 'line', woodBoardTheme.border)}
            strokeWidth={getRoomBoundaryStrokeWidth()}
            getPoints={getCellBoundaryLinePoints}
            keyPrefix="deep"
          />
          <LineOverlay
            keys={thinLines}
            cellSize={cellSize}
            stroke={(key) => getSnapshotTrialColor(snapshot, key, ['thinLineLevels'], 'line', woodBoardTheme.thinLine)}
            strokeWidth={2}
            getPoints={getThinCellCenterLinePoints}
            keyPrefix="thin"
          />
          <DominoOutlineOverlay keys={dominoOutlineKeys} cellSize={cellSize} snapshot={snapshot} />
          <LineOverlay
            keys={centerLoopKeys}
            cellSize={cellSize}
            stroke={(key) => getSnapshotTrialColor(snapshot, key, ['loopEdgeLevels'], 'line', woodBoardTheme.ink)}
            strokeWidth={getLoopLineStrokeWidth(cellSize, 0.1, 4)}
            getPoints={getCellCenterLinePoints}
            keyPrefix="center-loop"
          />
          <LineOverlay
            keys={centerPathKeys}
            cellSize={cellSize}
            stroke={(key) => getSnapshotTrialColor(snapshot, key, ['lineEdgeLevels'], 'line', woodBoardTheme.ink)}
            strokeWidth={getLoopLineStrokeWidth(cellSize, 0.1, 4)}
            getPoints={getCellCenterLinePoints}
            keyPrefix="center-path"
          />
          <LineOverlay
            keys={gridLineKeys}
            cellSize={cellSize}
            stroke={(key) => getSnapshotTrialColor(snapshot, key, ['lineLevels'], 'line', woodBoardTheme.ink)}
            strokeWidth={getLoopLineStrokeWidth(cellSize, 0.1, 4)}
            getPoints={getGridLinePoints}
            keyPrefix="grid"
          />
          <CrossOverlay
            keys={centerCrossKeys}
            cellSize={cellSize}
            getPoints={getCellCenterLinePoints}
            keyPrefix="center-cross"
            stroke={(key) =>
              getSnapshotTrialColor(
                snapshot,
                key,
                isDominoSearch ? ['levels'] : ['crossedEdgeLevels'],
                'text',
                woodBoardTheme.border
              )
            }
          />
          <CrossOverlay
            keys={gridCrossKeys}
            cellSize={cellSize}
            getPoints={getGridLinePoints}
            keyPrefix="grid-cross"
            stroke={(key) => getSnapshotTrialColor(snapshot, key, ['crossedLevels'], 'text', woodBoardTheme.border)}
          />
          <StarbattleDots edgeDots={edgeDots} vertexDots={vertexDots} cellSize={cellSize} snapshot={snapshot} />
        </div>
      </div>

      {dominoListItems ? (
        <div className="flex max-w-full flex-wrap justify-center gap-1 text-xs">
          {dominoListItems.map(({ left, right, index, used }) => (
            <span
              key={`${left}-${right}-${index}`}
              className="border px-1.5 py-0.5 font-medium tabular-nums"
              style={{
                borderColor: used ? woodBoardTheme.border : woodBoardTheme.accentBorder,
                background: used ? woodBoardTheme.shaded : woodBoardTheme.panel,
                color: used ? woodBoardTheme.shadedText : woodBoardTheme.accentText,
              }}
            >
              {left}-{right}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
