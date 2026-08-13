import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { NoteReplayCellMark } from '@/notes/types';
import {
  commonBoardChrome,
  boardClassNames,
  getBoardBoundaryStrokeWidth,
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
import { getMagicSnailBoundaryLines } from '@/puzzles/MagicSnail/utils';
import { getRegionBoundarySegments, parseGridLineEdgeKey, parseSolutionEdgeKey } from '@/puzzles/gridUtils';
import { getTrialLevelColors } from '@/puzzles/trialStyles';
import SlovakSumsClue from '@/puzzles/SlovakSums/SlovakSumsClue';
import TapaClue from '@/puzzles/Tapa/TapaClue';
import type { PuzzleData, PuzzleType, YajilinDirection } from '@/puzzles/types';
import { Button } from '../ui/button';

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

function getCandidateValues(snapshot: unknown, row: number, col: number) {
  const candidates = asRecord(snapshot)?.candidates;
  if (!Array.isArray(candidates)) return [];

  const rowValues = candidates[row];
  if (!Array.isArray(rowValues)) return [];

  const values = rowValues[col];
  if (!Array.isArray(values)) return [];

  return values.filter((value): value is number => Number.isFinite(value));
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
  fallback: string,
  visibleTrialLevel = Number.POSITIVE_INFINITY
) {
  const trialLevel = getFirstRecordLevel(snapshot, itemKey, levelKeys);
  if (trialLevel > visibleTrialLevel) return 'transparent';

  const trialColors = getTrialLevelColors(trialLevel);
  return trialColors?.[tone] ?? fallback;
}

function getMaxTrialLevel(snapshot: unknown) {
  let maxLevel = 0;

  const visit = (value: unknown, key: string, insideLevelField: boolean) => {
    if (typeof value === 'number') {
      if (insideLevelField && Number.isFinite(value)) {
        maxLevel = Math.max(maxLevel, value);
      }
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => visit(item, key, insideLevelField));
      return;
    }

    const record = asRecord(value);
    if (!record) return;

    Object.entries(record).forEach(([childKey, childValue]) => {
      const childIsLevelField = insideLevelField || childKey.toLowerCase().includes('level');
      visit(childValue, childKey, childIsLevelField);
    });
  };

  visit(snapshot, '', false);
  return Math.floor(maxLevel);
}

function getTrialDisplayLabel(visibleTrialLevel: number, maxTrialLevel: number) {
  if (visibleTrialLevel <= 0) return '不显示试错';
  if (visibleTrialLevel === 1) return '仅第1层试错';
  if (visibleTrialLevel < maxTrialLevel) return `第1-${visibleTrialLevel}层试错`;
  return `第1-${maxTrialLevel}层试错`;
}

function SnapshotCandidates({
  values,
  cellSize,
  color,
}: {
  values: number[];
  cellSize: number;
  color: string;
}) {
  const columns = Math.min(3, Math.max(values.length, 1));

  return (
    <span
      className="grid w-[78%] min-w-0 place-items-center text-center tabular-nums"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        color,
        ...getBoardTextStyle(cellSize, 0.25, 10, 1),
      }}
    >
      {values.map((value) => <span key={value}>{value}</span>)}
    </span>
  );
}

function isNumberValue(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function renderMintonetteClue(value: number | null, cellSize: number) {
  const diameter = Math.max(12, Math.floor(cellSize * 0.68));

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
  const diameter = Math.max(10, Math.floor(cellSize * 0.58));
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
    case 'tapa': {
      const clue = puzzle.clues[row]?.[col] ?? null;
      return clue
        ? { tone: 'clue', content: <TapaClue clue={clue} cellSize={cellSize} />, locked: true }
        : { tone: 'cell' };
    }
    case 'magic-summer': {
      const cell = puzzle.cells[row]?.[col] ?? null;
      if (cell === 'block') return { tone: 'marked', content: '×', locked: true };
      if (typeof cell === 'number') return { tone: 'prefilled', content: cell, locked: true };
      return { tone: 'cell' };
    }
    case 'skyscrapers': {
      const given = puzzle.givens[row]?.[col] ?? null;
      return given === null ? { tone: 'cell' } : { tone: 'prefilled', content: given, locked: true };
    }
    case 'domino-search': {
      const value = puzzle.numbers[row]?.[col] ?? null;
      return value === null ? { tone: 'shaded', locked: true } : { tone: 'cell', content: value, locked: true };
    }
    case 'snail': {
      const cell = puzzle.cells[row]?.[col] ?? null;
      if (cell === 'block') return { tone: 'marked', content: '×', locked: true };
      if (typeof cell === 'number') return { tone: 'prefilled', content: cell, locked: true };
      return { tone: 'cell' };
    }
    case 'slovak-sums': {
      const cell = puzzle.cells[row]?.[col] ?? null;
      if (cell && typeof cell === 'object') {
        return {
          tone: 'shaded',
          content: <SlovakSumsClue sum={cell.sum} count={cell.count} cellSize={cellSize} />,
          locked: true,
        };
      }
      return { tone: 'cell' };
    }
    default:
      return { tone: 'cell' };
  }
}

function getSnapshotCellView(
  puzzleType: PuzzleType,
  snapshot: unknown,
  row: number,
  col: number,
  visibleTrialLevel: number
): CellView | null {
  const value = getGridValue(snapshot, row, col);
  if (value === undefined || value === null || value === 0) return null;
  if (getCellTrialLevel(snapshot, row, col) > visibleTrialLevel) return null;

  if (puzzleType === 'snail') {
    if (value === 'circle') return { tone: 'cell' };
    if (value === 'cross') return { tone: 'marked' };
    return isNumberValue(value) ? { tone: 'cell', content: value } : null;
  }

  if (
    puzzleType === 'fillomino' ||
    puzzleType === 'slovak-sums' ||
    puzzleType === 'magic-summer' ||
    puzzleType === 'skyscrapers'
  ) {
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
  visibleTrialLevel: number,
  hasCandidates = false,
  locked?: boolean
): CSSProperties | undefined {
  if (
    locked ||
    (!hasCandidates && (value === undefined || value === null || value === 0))
  ) {
    return undefined;
  }

  const trialLevel = getCellTrialLevel(snapshot, row, col);
  if (trialLevel > visibleTrialLevel) return undefined;

  const trialColors = getTrialLevelColors(trialLevel);
  if (!trialColors) return undefined;

  if (puzzleType === 'skyscrapers') {
    return {
      background: trialColors.softFill,
      color: trialColors.text,
    };
  }

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

function DominoOutlineOverlay({
  keys,
  cellSize,
  snapshot,
  visibleTrialLevel,
}: {
  keys: string[];
  cellSize: number;
  snapshot: unknown;
  visibleTrialLevel: number;
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
        const rect = getDominoOutlineRect(key, cellSize);
        if (!rect) return null;

        return (
          <rect
            key={`domino-outline-${key}`}
            {...rect}
            fill="none"
            stroke={getSnapshotTrialColor(snapshot, key, ['levels'], 'line', woodBoardTheme.ink, visibleTrialLevel)}
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

function MagicSnailOverlay({
  puzzle,
  cellSize,
}: {
  puzzle: PuzzleData | undefined;
  cellSize: number;
}) {
  if (puzzle?.type !== 'snail') return null;

  const boundaryStrokeWidth = getBoardBoundaryStrokeWidth(cellSize);

  return (
    <svg className="pointer-events-none absolute left-0 top-0" width="100%" height="100%">
      {getMagicSnailBoundaryLines(puzzle.width, puzzle.height).map((line, index) => (
        <line
          key={`snail-boundary-${index}`}
          x1={BOARD_PADDING + line.x1 * cellSize}
          y1={BOARD_PADDING + line.y1 * cellSize}
          x2={BOARD_PADDING + line.x2 * cellSize}
          y2={BOARD_PADDING + line.y2 * cellSize}
          stroke={woodBoardTheme.border}
          strokeLinecap="square"
          strokeWidth={boundaryStrokeWidth}
        />
      ))}
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
  visibleTrialLevel,
}: {
  edgeDots: string[];
  vertexDots: string[];
  cellSize: number;
  snapshot: unknown;
  visibleTrialLevel: number;
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
            fill={getSnapshotTrialColor(
              snapshot,
              key,
              ['edgeDotLevels'],
              'line',
              woodBoardTheme.border,
              visibleTrialLevel
            )}
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
            fill={getSnapshotTrialColor(
              snapshot,
              key,
              ['vertexDotLevels'],
              'line',
              woodBoardTheme.border,
              visibleTrialLevel
            )}
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
  cellSize: requestedCellSize = DEFAULT_CELL_SIZE,
  ariaLabel,
}: NotePuzzleBoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [availableWidth, setAvailableWidth] = useState<number | null>(null);
  const maxTrialLevel = useMemo(() => getMaxTrialLevel(snapshot), [snapshot]);
  const [visibleTrialLevel, setVisibleTrialLevel] = useState(maxTrialLevel);

  useEffect(() => {
    setVisibleTrialLevel(maxTrialLevel);
  }, [maxTrialLevel]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return undefined;

    const updateAvailableWidth = () => {
      const nextWidth = element.getBoundingClientRect().width;
      setAvailableWidth(Number.isFinite(nextWidth) && nextWidth > 0 ? nextWidth : null);
    };

    updateAvailableWidth();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateAvailableWidth);
      observer.observe(element);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', updateAvailableWidth);
    return () => window.removeEventListener('resize', updateAvailableWidth);
  }, []);

  const cellSize = useMemo(() => {
    if (!availableWidth || width <= 0) return requestedCellSize;

    const chromeWidth = (BOARD_PADDING + BOARD_BORDER) * 2;
    const fittedCellSize = (availableWidth - chromeWidth) / width;

    if (!Number.isFinite(fittedCellSize) || fittedCellSize <= 0) return requestedCellSize;
    return Math.min(requestedCellSize, fittedCellSize);
  }, [availableWidth, requestedCellSize, width]);

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
  const outsideClues = activePuzzle?.type === 'skyscrapers' ? activePuzzle.clues : null;
  const outsideClueSize = outsideClues ? Math.max(24, Math.floor(cellSize * 0.62)) : 0;
  const outsideLeft = outsideClues ? outsideClueSize : 0;
  const outsideRight = outsideClues ? outsideClueSize : 0;
  const outsideTop = outsideClues ? outsideClueSize : 0;
  const outsideBottom = outsideClues ? outsideClueSize : 0;
  const gridLeft = BOARD_PADDING + outsideLeft;
  const gridTop = BOARD_PADDING + outsideTop;
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
  const boardWidth = width * cellSize + outsideLeft + outsideRight;
  const boardHeight = height * cellSize + outsideTop + outsideBottom;
  const frameWidth = boardWidth + BOARD_PADDING * 2 + BOARD_BORDER * 2;
  const frameHeight = boardHeight + BOARD_PADDING * 2 + BOARD_BORDER * 2;
  const frameStyle: CSSProperties = {
    ...getBoardFrameStyle(BOARD_BORDER),
    width: `${frameWidth}px`,
    minWidth: `${frameWidth}px`,
    maxWidth: 'none',
    height: `${frameHeight}px`,
  };

  return (
    <div ref={containerRef} className="flex w-full min-w-0 max-w-full flex-col items-center gap-2">
      <div className="w-full max-w-full overflow-hidden">
        <div className="relative mx-auto select-none" style={frameStyle} aria-label={ariaLabel}>
          <div
            className="absolute grid"
            style={{
              left: `${gridLeft}px`,
              top: `${gridTop}px`,
              gridTemplateColumns: `repeat(${width}, ${cellSize}px)`,
            }}
          >
            {Array.from({ length: height }, (_, row) =>
              Array.from({ length: width }, (_, col) => {
                const base = getCellView(activePuzzle, row, col, cellSize);
                const snapshotValue = getGridValue(snapshot, row, col);
                const candidateValues = getCandidateValues(snapshot, row, col);
                const snapshotTrialLevel = getCellTrialLevel(snapshot, row, col);
                const snapshotTrialVisible = snapshotTrialLevel <= visibleTrialLevel;
                const snapshotView = getSnapshotCellView(
                  puzzleType,
                  snapshot,
                  row,
                  col,
                  visibleTrialLevel
                );
                const candidateView = snapshotView || candidateValues.length === 0 || !snapshotTrialVisible
                  ? null
                  : {
                      tone: 'cell' as const,
                      content: (
                        <SnapshotCandidates
                          values={candidateValues}
                          cellSize={cellSize}
                          color={getTrialLevelColors(snapshotTrialLevel)?.text ?? woodBoardTheme.border}
                        />
                      ),
                    };
                const snapshotOverlay = snapshotView ?? candidateView;
                const legacyView = snapshotOverlay ? null : getLegacyMarkView(markMap.get(getLocalCellKey(row, col)));
                const view = mergeCellViews(base, snapshotOverlay ?? legacyView);
                const slitherMark = isSlither && snapshotTrialVisible
                  ? getSlitherCellMark(snapshot, row, col)
                  : null;
                const snailMark = puzzleType === 'snail' && snapshotTrialVisible &&
                  (snapshotValue === 'circle' || snapshotValue === 'cross')
                  ? snapshotValue
                  : null;
                const slovakMark = puzzleType === 'slovak-sums' && snapshotTrialVisible &&
                  (snapshotValue === 'circle' || snapshotValue === 'cross')
                  ? snapshotValue
                  : null;
                const slitherMarkKey = `${row},${col}`;
                const centerMark = slitherMark ?? snailMark ?? slovakMark;
                const trialStyle = getSnapshotCellTrialStyle(
                  puzzleType,
                  snapshot,
                  snapshotValue,
                  row,
                  col,
                  visibleTrialLevel,
                  candidateValues.length > 0,
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
                    {centerMark ? (
                      <SlitherCellMark
                        mark={centerMark}
                        cellSize={cellSize}
                        color={
                          snailMark || slovakMark
                            ? getSnapshotTrialColor(
                                snapshot,
                                slitherMarkKey,
                                ['levels'],
                                'text',
                                woodBoardTheme.border,
                                visibleTrialLevel
                              )
                            : getSnapshotTrialColor(
                                snapshot,
                                slitherMarkKey,
                                ['cellMarkLevels'],
                                'text',
                                woodBoardTheme.border,
                                visibleTrialLevel
                              )
                        }
                      />
                    ) : null}
                    <span className="relative z-10 flex h-full w-full items-center justify-center">
                      {view.content}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {outsideClues ? (
            <div className="pointer-events-none absolute inset-0">
              {outsideClues.top.map((value, col) =>
                value === null ? null : (
                  <span
                    key={`top-${col}`}
                    className="absolute -translate-x-1/2 -translate-y-1/2 text-center tabular-nums"
                    style={{
                      left: `${gridLeft + (col + 0.5) * cellSize}px`,
                      top: `${BOARD_PADDING + outsideTop / 2}px`,
                      color: woodBoardTheme.border,
                      ...getBoardTextStyle(cellSize, 0.48, 14),
                    }}
                  >
                    {value}
                  </span>
                )
              )}
              {outsideClues.bottom.map((value, col) =>
                value === null ? null : (
                  <span
                    key={`bottom-${col}`}
                    className="absolute -translate-x-1/2 -translate-y-1/2 text-center tabular-nums"
                    style={{
                      left: `${gridLeft + (col + 0.5) * cellSize}px`,
                      top: `${gridTop + height * cellSize + outsideBottom / 2}px`,
                      color: woodBoardTheme.border,
                      ...getBoardTextStyle(cellSize, 0.48, 14),
                    }}
                  >
                    {value}
                  </span>
                )
              )}
              {outsideClues.left.map((value, row) =>
                value === null ? null : (
                  <span
                    key={`left-${row}`}
                    className="absolute -translate-x-1/2 -translate-y-1/2 text-center tabular-nums"
                    style={{
                      left: `${BOARD_PADDING + outsideLeft / 2}px`,
                      top: `${gridTop + (row + 0.5) * cellSize}px`,
                      color: woodBoardTheme.border,
                      ...getBoardTextStyle(cellSize, 0.48, 14),
                    }}
                  >
                    {value}
                  </span>
                )
              )}
              {outsideClues.right.map((value, row) =>
                value === null ? null : (
                  <span
                    key={`right-${row}`}
                    className="absolute -translate-x-1/2 -translate-y-1/2 text-center tabular-nums"
                    style={{
                      left: `${gridLeft + width * cellSize + outsideRight / 2}px`,
                      top: `${gridTop + (row + 0.5) * cellSize}px`,
                      color: woodBoardTheme.border,
                      ...getBoardTextStyle(cellSize, 0.48, 14),
                    }}
                  >
                    {value}
                  </span>
                )
              )}
            </div>
          ) : null}

          {regionIds ? <RegionBoundaries regionIds={regionIds} width={width} height={height} cellSize={cellSize} /> : null}
          {isSlither ? <SlitherDots width={width} height={height} cellSize={cellSize} /> : null}
          <MagicSnailOverlay puzzle={activePuzzle} cellSize={cellSize} />
          <LineOverlay
            keys={deepLines}
            cellSize={cellSize}
            stroke={(key) =>
              getSnapshotTrialColor(
                snapshot,
                key,
                ['deepLineLevels'],
                'line',
                woodBoardTheme.border,
                visibleTrialLevel
              )
            }
            strokeWidth={getRoomBoundaryStrokeWidth()}
            getPoints={getCellBoundaryLinePoints}
            keyPrefix="deep"
          />
          <LineOverlay
            keys={thinLines}
            cellSize={cellSize}
            stroke={(key) =>
              getSnapshotTrialColor(
                snapshot,
                key,
                ['thinLineLevels'],
                'line',
                woodBoardTheme.thinLine,
                visibleTrialLevel
              )
            }
            strokeWidth={2}
            getPoints={getThinCellCenterLinePoints}
            keyPrefix="thin"
          />
          <DominoOutlineOverlay
            keys={dominoOutlineKeys}
            cellSize={cellSize}
            snapshot={snapshot}
            visibleTrialLevel={visibleTrialLevel}
          />
          <LineOverlay
            keys={centerLoopKeys}
            cellSize={cellSize}
            stroke={(key) =>
              getSnapshotTrialColor(
                snapshot,
                key,
                ['loopEdgeLevels'],
                'line',
                woodBoardTheme.ink,
                visibleTrialLevel
              )
            }
            strokeWidth={getLoopLineStrokeWidth(cellSize, 0.1, 4)}
            getPoints={getCellCenterLinePoints}
            keyPrefix="center-loop"
          />
          <LineOverlay
            keys={centerPathKeys}
            cellSize={cellSize}
            stroke={(key) =>
              getSnapshotTrialColor(
                snapshot,
                key,
                ['lineEdgeLevels'],
                'line',
                woodBoardTheme.ink,
                visibleTrialLevel
              )
            }
            strokeWidth={getLoopLineStrokeWidth(cellSize, 0.1, 4)}
            getPoints={getCellCenterLinePoints}
            keyPrefix="center-path"
          />
          <LineOverlay
            keys={gridLineKeys}
            cellSize={cellSize}
            stroke={(key) =>
              getSnapshotTrialColor(
                snapshot,
                key,
                ['lineLevels'],
                'line',
                woodBoardTheme.ink,
                visibleTrialLevel
              )
            }
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
                woodBoardTheme.border,
                visibleTrialLevel
              )
            }
          />
          <CrossOverlay
            keys={gridCrossKeys}
            cellSize={cellSize}
            getPoints={getGridLinePoints}
            keyPrefix="grid-cross"
            stroke={(key) =>
              getSnapshotTrialColor(
                snapshot,
                key,
                ['crossedLevels'],
                'text',
                woodBoardTheme.border,
                visibleTrialLevel
              )
            }
          />
          <StarbattleDots
            edgeDots={edgeDots}
            vertexDots={vertexDots}
            cellSize={cellSize}
            snapshot={snapshot}
            visibleTrialLevel={visibleTrialLevel}
          />
        </div>
      </div>

      {maxTrialLevel > 0 ? (
        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground" aria-live="polite">
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            disabled={visibleTrialLevel <= 0}
            onClick={() => setVisibleTrialLevel((current) => Math.max(0, current - 1))}
            aria-label="减少显示的试错层级"
            title="减少显示的试错层级"
          >
            <ChevronLeft />
          </Button>
          <span className="min-w-28 text-center tabular-nums">
            {getTrialDisplayLabel(visibleTrialLevel, maxTrialLevel)}
          </span>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            disabled={visibleTrialLevel >= maxTrialLevel}
            onClick={() => setVisibleTrialLevel((current) => Math.min(maxTrialLevel, current + 1))}
            aria-label="增加显示的试错层级"
            title="增加显示的试错层级"
          >
            <ChevronRight />
          </Button>
        </div>
      ) : null}

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
