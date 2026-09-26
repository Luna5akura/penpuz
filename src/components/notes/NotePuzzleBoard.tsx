import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '@/i18n/useI18n';
import type { NoteReplayCellMark } from '@/notes/types';
import {
  commonBoardChrome,
  boardClassNames,
  boardLayoutMetrics,
  getBoardBoundaryStrokeMetrics,
  getBoardBoundaryStrokeWidth,
  getBoardPillCapsuleMetrics,
  getBoardCellColors,
  getBoardCellStyle,
  getBoardCellOutlineRect,
  getBoardClueCircleMetrics,
  getBoardDotRadius,
  getBoardFrameStyle,
  getBoardGridStyle,
  getBoardDominoBadgeStyle,
  getBoardGridStrokeWidth,
  getBoardPanelColors,
  getBoardThinStrokeWidth,
  getBoardOutsideClueLayout,
  getBoardOutsideClueGutter,
  getBoardOutsideClueMaxDigits,
  getBoardOutsideClueTextStyle,
  getBoardTextStyle,
  getBoardTrialCellStyle,
  getLoopLineStrokeWidth,
  getRoomBoundaryStrokeWidth,
  getKurarinClueColors,
  woodBoardTheme,
  type BoardCellTone,
  type BoardOutsideClues,
} from '@/puzzles/boardTheme';
import BoardCellOutline from '@/puzzles/shared/BoardCellOutline';
import BoardCellMark from '@/puzzles/shared/BoardCellMark';
import BoardEdgeCross from '@/puzzles/shared/BoardEdgeCross';
import { countPlacedDominoPairs, getDominoPairKey } from '@/puzzles/DominoSearch/utils';
import { getMagicSnailBoundaryLines } from '@/puzzles/MagicSnail/utils';
import { getPillsPipsLayout } from '@/puzzles/Pills/utils';
import { getSkyNeighborDisplayClues } from '@/puzzles/SkyNeighbor/utils';
import {
  filterValidCellEdgeKeys,
  filterValidGridLineEdgeKeys,
  filterValidGridVertexKeys,
  filterValidInternalBoundaryEdgeKeys,
  getRegionBoundarySegments,
  parseGridLineEdgeKey,
  parseSolutionEdgeKey,
} from '@/puzzles/gridUtils';
import { getTrialLevelColors } from '@/puzzles/trialStyles';
import SlovakSumsClue from '@/puzzles/SlovakSums/SlovakSumsClue';
import KakuroClue from '@/puzzles/Kakuro/KakuroClue';
import WolvesAndSheepSymbol from '@/puzzles/WolvesAndSheep/WolvesAndSheepSymbol';
import TapaClue from '@/puzzles/Tapa/TapaClue';
import FourWindsWithParksMark, { type FourWindsWithParksMarkValue } from '@/puzzles/FourWindsWithParks/FourWindsWithParksVisuals';
import FourWindsMark, { type FourWindsMarkValue } from '@/puzzles/FourWinds/FourWindsVisuals';
import {
  BattleshipFleet,
  BattleshipSegmentSymbol,
  BattleshipWaterSymbol,
} from '@/puzzles/Battleship/BattleshipVisuals';
import {
  getBattleshipOccupiedGrid,
  getBattleshipNeighborConnections,
  getBattleshipWaterClueKeys,
  inferBattleshipSegment,
  isBattleshipSegmentResolved,
} from '@/puzzles/Battleship/utils';
import type { BattleshipPuzzleData, PuzzleData, PuzzleType, YajilinDirection, JapaneseArrowDirection } from '@/puzzles/types';
import { Button } from '../ui/button';
import StarMark from '@/puzzles/shared/StarMark';

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

interface BattleshipSnapshotContext {
  puzzle: BattleshipPuzzleData;
  grid: ReadonlyArray<ReadonlyArray<unknown>>;
  occupied: boolean[][];
  waterClueKeys: Set<string>;
}

const DEFAULT_CELL_SIZE = boardLayoutMetrics.replayCellSize;
const BOARD_PADDING = commonBoardChrome.padding;
const BOARD_BORDER = commonBoardChrome.border;

const directionGlyphs: Record<YajilinDirection, string> = {
  up: '↑',
  right: '→',
  down: '↓',
  left: '←',
};

const japaneseArrowGlyphs: Record<JapaneseArrowDirection, string> = {
  N: '↑', NE: '↗', E: '→', SE: '↘', S: '↓', SW: '↙', W: '←', NW: '↖',
};

function getLocalCellKey(row: number, col: number) {
  return `${row}:${col}`;
}

function makePositionMap<T extends { row: number; col: number }>(items: readonly T[]) {
  const map = new Map<string, T>();
  // A puzzle should never contain duplicate clues at one coordinate. If a
  // malformed payload does, keep the first item (the same item a historical
  // `find()` lookup would have returned) and make the fallback deterministic.
  for (const item of items) {
    const key = getLocalCellKey(item.row, item.col);
    if (!map.has(key)) map.set(key, item);
  }
  return map;
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

function getSkyNeighborSnapshotOutside(
  snapshot: unknown,
  width: number,
  height: number
): BoardOutsideClues | null {
  const outside = asRecord(snapshot)?.outside;
  if (!outside || typeof outside !== 'object' || Array.isArray(outside)) return null;

  const readSide = (value: unknown, length: number) => {
    if (!Array.isArray(value) || value.length !== length) return null;
    const side = value.map((item) =>
      item === null || item === undefined
        ? null
        : typeof item === 'number' && Number.isInteger(item) && item >= 1 && item <= 3
          ? item
          : Number.NaN
    );
    return side.some((item) => typeof item === 'number' && Number.isNaN(item))
      ? null
      : side as (number | null)[];
  };

  const source = outside as Record<string, unknown>;
  const top = readSide(source.top, width);
  const right = readSide(source.right, height);
  const bottom = readSide(source.bottom, width);
  const left = readSide(source.left, height);
  return top && right && bottom && left ? { top, right, bottom, left } : null;
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
  const record = asRecord(asRecord(snapshot)?.cellMarks);
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
  return <BoardCellMark kind={mark} cellSize={cellSize} color={color} />;
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

function getTrialDisplayLabel(
  visibleTrialLevel: number,
  maxTrialLevel: number,
  trialDisplay: {
    hidden: string;
    only: (level: number) => string;
    range: (level: number) => string;
  }
) {
  if (visibleTrialLevel <= 0) return trialDisplay.hidden;
  if (visibleTrialLevel === 1) return trialDisplay.only(1);
  return trialDisplay.range(Math.min(visibleTrialLevel, maxTrialLevel));
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
        ...getBoardPanelColors(),
        ...getBoardTextStyle(cellSize, 0.38, 14),
      }}
    >
      {value ?? '?'}
    </span>
  );
}

function renderKurarinClue(color: 'black' | 'white' | 'gray', cellSize: number) {
  const diameter = Math.max(10, Math.floor(cellSize * 0.58));
  const fill = getKurarinClueColors(color).fill;

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

function getCellView(
  puzzle: PuzzleData | undefined,
  row: number,
  col: number,
  cellSize: number,
  battleshipOccupied?: boolean[][],
  clueMap?: ReadonlyMap<string, unknown>
): CellView {
  if (!puzzle) return { tone: 'cell' };

  switch (puzzle.type) {
    case 'nurikabe': {
      const clue = clueMap?.get(getLocalCellKey(row, col)) as (typeof puzzle.clues)[number] | undefined;
      return clue ? { tone: 'clue', content: clue.value, locked: true } : { tone: 'cell' };
    }
    case 'fillomino': {
      const clue = puzzle.clues[row]?.[col] ?? null;
      return clue !== null ? { tone: 'clue', content: clue, locked: true } : { tone: 'cell' };
    }
    case 'yajilin': {
      const clue = clueMap?.get(getLocalCellKey(row, col)) as (typeof puzzle.clues)[number] | undefined;
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
    case 'koburin': {
      const clue = clueMap?.get(getLocalCellKey(row, col)) as (typeof puzzle.clues)[number] | undefined;
      return clue
        ? { tone: 'shaded', content: clue.value, locked: true }
        : { tone: 'cell' };
    }
    case 'neighbor': {
      const given = puzzle.givens[row]?.[col] ?? null;
      if (given !== null) {
        return {
          tone: puzzle.grayCells[row]?.[col] ? 'outlined' : 'clue',
          content: given,
          locked: true,
        };
      }
      return { tone: puzzle.grayCells[row]?.[col] ? 'outlined' : 'cell' };
    }
    case 'sky-neighbor': {
      const given = puzzle.givens[row]?.[col] ?? null;
      if (given !== null) {
        return {
          tone: puzzle.grayCells[row]?.[col] ? 'outlined' : 'clue',
          content: given,
          locked: true,
        };
      }
      return { tone: puzzle.grayCells[row]?.[col] ? 'outlined' : 'cell' };
    }
    case 'starbattle':
      return { tone: 'cell' };
    case 'heyawake': {
      const clue = clueMap?.get(getLocalCellKey(row, col)) as (typeof puzzle.clues)[number] | undefined;
      return clue ? { tone: 'clue', content: clue.value, locked: true } : { tone: 'cell' };
    }
    case 'aqre': {
      const clue = clueMap?.get(getLocalCellKey(row, col)) as (typeof puzzle.clues)[number] | undefined;
      return clue ? { tone: 'clue', content: clue.value, locked: true } : { tone: 'cell' };
    }
    case 'mintonette': {
      const clue = clueMap?.get(getLocalCellKey(row, col)) as (typeof puzzle.clues)[number] | undefined;
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
      const clue = clueMap?.get(getLocalCellKey(row, col)) as (typeof puzzle.clues)[number] | undefined;
      return clue
        ? { tone: 'cell', content: renderKurarinClue(clue.color, cellSize), locked: true }
        : { tone: 'cell' };
    }
    case 'walkwalk': {
      const clue = clueMap?.get(getLocalCellKey(row, col)) as (typeof puzzle.clues)[number] | undefined;
      return clue ? { tone: 'clue', content: clue.value, locked: true } : { tone: 'cell' };
    }
    case 'slither': {
      const clue = puzzle.clues[row]?.[col] ?? null;
      return clue !== null ? { tone: 'cell', content: clue, locked: true } : { tone: 'cell' };
    }
    case 'wolvesandsheepfences': {
      const clue = puzzle.clues[row]?.[col] ?? null;
      if (clue === 'sheep' || clue === 'wolf') {
        return {
          tone: 'cell',
          content: <WolvesAndSheepSymbol kind={clue} cellSize={cellSize} />,
          locked: true,
        };
      }
      return clue !== null ? { tone: 'cell', content: clue, locked: true } : { tone: 'cell' };
    }
    case 'lits': {
      const excluded = puzzle.regionIds[row]?.[col] < 0;
      return excluded
        ? { tone: 'marked', content: <BoardCellMark kind="cross" cellSize={cellSize} />, locked: true }
        : { tone: 'cell' };
    }
    case 'lakes': {
      const clue = clueMap?.get(getLocalCellKey(row, col)) as (typeof puzzle.clues)[number] | undefined;
      return clue ? { tone: 'clue', content: clue.value, locked: true } : { tone: 'cell' };
    }
    case 'shape-minesweeper': {
      const clue = puzzle.clues[row]?.[col] ?? null;
      return clue === null ? { tone: 'cell' } : { tone: 'clue', content: clue, locked: true };
    }
    case 'cave': {
      const clue = puzzle.clues[row]?.[col] ?? null;
      return clue === null ? { tone: 'cell' } : { tone: 'clue', content: clue, locked: true };
    }
    case 'japanese-arrows': {
      const clue = puzzle.clues[row]?.[col] ?? null;
      return {
        tone: clue === null ? 'cell' : 'clue',
        content: clue !== null ? clue : undefined,
        locked: clue !== null,
        fontRatio: 0.72,
      };
    }
    case 'four-winds-with-parks': {
      const clue = puzzle.clues[row]?.[col] ?? null;
      return clue === null
        ? { tone: 'cell' }
        : { tone: 'clue', content: clue, locked: true };
    }
    case 'fourwinds': {
      const clue = puzzle.clues[row]?.[col] ?? null;
      return clue === null
        ? { tone: 'cell' }
        : { tone: 'clue', content: clue, locked: true };
    }
    case 'consecutive-kakuro': {
      const clue = puzzle.cells[row]?.[col] ?? null;
      return clue
        ? { tone: 'shaded', content: <KakuroClue right={clue.right} down={clue.down} cellSize={cellSize} />, locked: true }
        : { tone: 'cell' };
    }
    case 'japanese-sums-with-zeroes':
      return { tone: 'cell' };
    case 'abc-box': {
      const given = puzzle.givens[row]?.[col] ?? null;
      return given ? { tone: 'clue', content: given, locked: true } : { tone: 'cell' };
    }
    case 'magnets': {
      const given = puzzle.givens[row]?.[col] ?? null;
      return given ? { tone: 'clue', content: given, locked: true } : { tone: 'cell' };
    }
    case 'pills': {
      const count = puzzle.dots[row]?.[col] ?? 0;
      if (count <= 0) return { tone: 'cell' };
      const { radius, positions } = getPillsPipsLayout(count, cellSize);
      return {
        tone: 'cell',
        content: (
          <span
            className="relative flex h-full w-full items-center justify-center"
            style={{ transform: count > 1 ? 'rotate(18deg)' : undefined }}
          >
            {positions.map((position, index) => (
              <span
                key={index}
                className="absolute block rounded-full"
                style={{
                  width: `${radius * 2}px`,
                  height: `${radius * 2}px`,
                  left: `calc(${(position.x * 100).toFixed(2)}% - ${radius}px)`,
                  top: `calc(${(position.y * 100).toFixed(2)}% - ${radius}px)`,
                  background: woodBoardTheme.ink,
                }}
              />
            ))}
          </span>
        ),
      };
    }
    case 'tapa': {
      const clue = puzzle.clues[row]?.[col] ?? null;
      return clue
        ? { tone: 'clue', content: <TapaClue clue={clue} cellSize={cellSize} />, locked: true }
        : { tone: 'cell' };
    }
    case 'magic-summer': {
      const cell = puzzle.cells[row]?.[col] ?? null;
      if (cell === 'block') return { tone: 'marked', content: <BoardCellMark kind="cross" cellSize={cellSize} />, locked: true };
      if (typeof cell === 'number') return { tone: 'prefilled', content: cell, locked: true };
      return { tone: 'cell' };
    }
    case 'skyscrapers': {
      const given = puzzle.givens[row]?.[col] ?? null;
      return given === null ? { tone: 'cell' } : { tone: 'prefilled', content: given, locked: true };
    }
    case 'battleship': {
      const clue = clueMap?.get(getLocalCellKey(row, col)) as (typeof puzzle.cellClues)[number] | undefined;
      if (!clue) return { tone: 'cell' };
      return {
        tone: 'clue',
        content: clue.kind === 'water'
          ? <BattleshipWaterSymbol cellSize={cellSize} />
          : <BattleshipSegmentSymbol
              segment={clue.segment ?? 'unknown'}
              cellSize={cellSize}
              given
              neighbors={battleshipOccupied
                ? getBattleshipNeighborConnections(battleshipOccupied, row, col)
                : undefined}
            />,
        locked: true,
      };
    }
    case 'domino-search': {
      const value = puzzle.numbers[row]?.[col] ?? null;
      return value === null ? { tone: 'shaded', locked: true } : { tone: 'cell', content: value, locked: true };
    }
    case 'snail': {
      const cell = puzzle.cells[row]?.[col] ?? null;
      if (cell === 'block') return { tone: 'marked', content: <BoardCellMark kind="cross" cellSize={cellSize} />, locked: true };
      if (typeof cell === 'number') return { tone: 'clue', content: cell, locked: true };
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
    case 'kakuro': {
      const clue = puzzle.cells[row]?.[col] ?? null;
      return clue
        ? {
            tone: 'shaded',
            content: <KakuroClue right={clue.right} down={clue.down} cellSize={cellSize} />,
            locked: true,
          }
        : { tone: 'cell' };
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
  visibleTrialLevel: number,
  cellSize: number,
  battleshipContext?: BattleshipSnapshotContext
): CellView | null {
  const value = getGridValue(snapshot, row, col);
  if (value === undefined || value === null || (value === 0 && puzzleType !== 'four-winds-with-parks')) return null;
  if (getCellTrialLevel(snapshot, row, col) > visibleTrialLevel) return null;

  if (puzzleType === 'snail') {
    if (value === 'circle') return { tone: 'cell' };
    if (value === 'cross') return { tone: 'marked', content: <BoardCellMark kind="cross" cellSize={cellSize} /> };
    return isNumberValue(value) ? { tone: 'cell', content: value } : null;
  }

  if (puzzleType === 'magic-summer') {
    if (value === 'circle') return { tone: 'cell' };
    if (value === 'cross') return { tone: 'marked', content: <BoardCellMark kind="cross" cellSize={cellSize} /> };
    return isNumberValue(value) ? { tone: 'cell', content: value } : null;
  }

  if (puzzleType === 'yajilin' || puzzleType === 'kurarin') {
    const markColor = getTrialLevelColors(getCellTrialLevel(snapshot, row, col))?.text
      ?? woodBoardTheme.border;
    return value === 2
      ? { tone: 'cell', content: <BoardCellMark kind="circle" cellSize={cellSize} color={markColor} /> }
      : value === 1
        ? { tone: 'playerShaded' }
        : null;
  }

  if (
    puzzleType === 'kakuro' ||
    puzzleType === 'consecutive-kakuro' ||
    puzzleType === 'fillomino' ||
    puzzleType === 'slovak-sums' ||
    puzzleType === 'skyscrapers' ||
    puzzleType === 'neighbor' ||
    puzzleType === 'sky-neighbor'
  ) {
    if (puzzleType === 'slovak-sums' && value === 'cross') {
      return { tone: 'marked' };
    }
    return isNumberValue(value) ? { tone: 'cell', content: value } : null;
  }

  if (puzzleType === 'four-winds-with-parks') {
    const isDirection = typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 4;
    const isMark = value === 'circle' || value === 'cross';
    if (!isDirection && !isMark) return null;

    // `0` is the legacy park representation; both it and the explicit
    // `circle` mark are rendered as a circle. Crosses remain auxiliary marks.
    const mark = (value === 0 ? 'circle' : value) as FourWindsWithParksMarkValue;
    return {
      tone: value === 'cross' ? 'marked' : 'cell',
      content: <FourWindsWithParksMark value={mark} cellSize={cellSize} />,
    };
  }

  if (puzzleType === 'fourwinds') {
    const isDirection = typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 4;
    if (!isDirection && value !== 'cross') return null;
    return {
      tone: value === 'cross' ? 'marked' : 'cell',
      content: <FourWindsMark value={value as FourWindsMarkValue} cellSize={cellSize} />,
    };
  }

  if (puzzleType === 'japanese-arrows') {
    return isNumberValue(value) ? { tone: 'cell', content: value } : null;
  }

  if (puzzleType === 'japanese-sums-with-zeroes' || puzzleType === 'abc-box') {
    if (puzzleType === 'japanese-sums-with-zeroes' && value === 'circle') return { tone: 'cell', content: '○' };
    if (puzzleType === 'japanese-sums-with-zeroes' && value === 'cross') return { tone: 'marked', content: <BoardCellMark kind="cross" cellSize={cellSize} /> };
    return isNumberValue(value) ? { tone: 'cell', content: puzzleType === 'abc-box' ? ['','A','B','C'][value] : value } : null;
  }

  if (puzzleType === 'starbattle') {
    if (value === 1) return { tone: 'cell', content: <StarMark cellSize={cellSize} /> };
    if (value === 2) return { tone: 'marked', content: <BoardCellMark kind="cross" cellSize={cellSize} /> };
    return null;
  }

  if (puzzleType === 'magnets') {
    if (value === 1) return { tone: 'cell', content: '+', fontRatio: 0.7 };
    if (value === 2) return { tone: 'cell', content: '−', fontRatio: 0.7 };
    return null;
  }

  if (puzzleType === 'pills') {
    if (value === 1) {
      const { inset, radius } = getBoardPillCapsuleMetrics(cellSize);
      return {
        tone: 'cell',
        content: (
          <span
            className="absolute rounded-full"
            style={{
              left: `${inset}px`,
              top: `${inset}px`,
              width: `${radius * 2}px`,
              height: `${radius * 2}px`,
              border: `${getBoardThinStrokeWidth(cellSize)}px solid ${woodBoardTheme.ink}`,
              boxSizing: 'border-box',
            }}
          />
        ),
      };
    }
    return null;
  }

  if (puzzleType === 'akari') {
    if (value === 1) return { tone: 'brightLit', content: '●', fontRatio: 0.72 };
    if (value === 2) return { tone: 'marked', content: <BoardCellMark kind="cross" cellSize={cellSize} /> };
    return null;
  }

  if (puzzleType === 'battleship') {
    if (value === 1 && battleshipContext) {
      const trialLevel = getCellTrialLevel(snapshot, row, col);
      return {
        tone: 'cell',
        content: (
          <BattleshipSegmentSymbol
            segment={inferBattleshipSegment(battleshipContext.occupied, row, col)}
            cellSize={cellSize}
            resolved={isBattleshipSegmentResolved(
              battleshipContext.grid,
              battleshipContext.puzzle,
              battleshipContext.occupied,
              row,
              col,
              battleshipContext.waterClueKeys
            )}
            color={getTrialLevelColors(trialLevel)?.line}
            neighbors={getBattleshipNeighborConnections(battleshipContext.occupied, row, col)}
          />
        ),
      };
    }
    if (value === 2) return { tone: 'marked', content: <BoardCellMark kind="cross" cellSize={cellSize} /> };
    return null;
  }

  if (puzzleType === 'yinyang' && value === 2) {
    return { tone: 'cell', content: <BoardCellMark kind="circle" cellSize={cellSize} /> };
  }

  if (value === 1) return { tone: 'playerShaded' };
  if (value === 2) return { tone: 'marked', content: <BoardCellMark kind="cross" cellSize={cellSize} /> };
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

function getLegacyMarkView(mark: NoteReplayCellMark | undefined, cellSize: number): CellView | null {
  if (!mark) return null;
  if (mark.kind === 'shade') return { tone: 'playerShaded' };
  if (mark.kind === 'star') return { tone: 'lit', content: <StarMark cellSize={cellSize} /> };
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
    return getBoardTrialCellStyle(trialColors, 'soft');
  }

  if (puzzleType === 'akari') {
    return getBoardTrialCellStyle(trialColors, 'line');
  }

  // Yajilin and Kurarin circles are overlays on regular cells. Do not tint
  // the cell background when a circle is recorded during a trial.
  if ((puzzleType === 'yajilin' || puzzleType === 'kurarin') && value === 2) {
    return undefined;
  }

  if (puzzleType === 'battleship' && value === 1) {
    return getBoardTrialCellStyle(trialColors, 'soft', trialColors.line);
  }

  return getBoardTrialCellStyle(trialColors, value === 1 ? 'filled' : 'soft');
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
  const { strokeWidth, outlineWidth } = getBoardBoundaryStrokeMetrics(cellSize);

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

function ConsecutiveBarsOverlay({
  puzzle,
  cellSize,
  gridLeft,
  gridTop,
}: {
  puzzle: Extract<PuzzleData, { type: 'consecutive-kakuro' }>;
  cellSize: number;
  gridLeft: number;
  gridTop: number;
}) {
  const { radius, strokeWidth, outerRadiusOffset } = getBoardClueCircleMetrics(cellSize);
  const dotColors = getKurarinClueColors('white');
  const haloFill = getBoardCellColors('cell').background;
  const renderDot = (key: string, x: number, y: number) => (
    <g key={key}>
      <circle cx={x} cy={y} r={radius + outerRadiusOffset} fill={haloFill} />
      <circle cx={x} cy={y} r={radius} fill={dotColors.fill} stroke={dotColors.stroke} strokeWidth={strokeWidth} />
    </g>
  );
  const bars = [
    ...puzzle.horizontalBars.flatMap((row, r) => row.map((bar, c) => bar ? renderDot(
      `h-${r}-${c}`,
      gridLeft + (c + 1) * cellSize,
      gridTop + r * cellSize + cellSize / 2
    ) : null)),
    ...puzzle.verticalBars.flatMap((row, r) => row.map((bar, c) => bar ? renderDot(
      `v-${r}-${c}`,
      gridLeft + c * cellSize + cellSize / 2,
      gridTop + (r + 1) * cellSize
    ) : null)),
  ];
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
      {bars}
    </svg>
  );
}

function SkyNeighborOutsideCells({
  puzzle,
  cellSize,
  outsideLeft,
  outsideRight,
  outsideTop,
  outsideBottom,
}: {
  puzzle: Extract<PuzzleData, { type: 'sky-neighbor' }>;
  cellSize: number;
  outsideLeft: number;
  outsideRight: number;
  outsideTop: number;
  outsideBottom: number;
}) {
  const outside = puzzle.outsideGrayCells ?? {
    top: Array<boolean>(puzzle.width).fill(false),
    right: Array<boolean>(puzzle.height).fill(false),
    bottom: Array<boolean>(puzzle.width).fill(false),
    left: Array<boolean>(puzzle.height).fill(false),
  };
  const gridLeft = BOARD_PADDING + outsideLeft;
  const gridTop = BOARD_PADDING + outsideTop;
  const rectangles: ReactNode[] = [];

  const add = (
    key: string,
    x: number,
    y: number,
    width: number,
    height: number,
    isGray: boolean,
    isClue: boolean,
  ) => {
    const tone = isGray ? 'outlined' : isClue ? 'clue' : 'cell';
    const fill = getBoardCellColors(tone).background;
    rectangles.push(
      <rect
        key={`${key}-base`}
        // SVG strokes are centered on the rectangle edge. Inset the one-pixel
        // frame so its painted bounds stay exactly within the cell geometry,
        // matching the CSS grid cells used by the main board.
        x={x + 0.5}
        y={y + 0.5}
        width={Math.max(0, width - 1)}
        height={Math.max(0, height - 1)}
        fill={fill}
        stroke={woodBoardTheme.gridLine}
        strokeWidth={getBoardGridStrokeWidth()}
      />
    );
    if (isGray) {
      rectangles.push(
        <rect
          key={`${key}-outline`}
          {...getBoardCellOutlineRect(x, y, width, height, cellSize)}
        />
      );
    }
  };

  puzzle.clues.top.forEach((_, col) => add(
    `top-${col}`,
    gridLeft + col * cellSize,
    BOARD_PADDING,
    cellSize,
    outsideTop,
    outside.top[col] === true,
    puzzle.clues.top[col] !== null
  ));
  puzzle.clues.bottom.forEach((_, col) => add(
    `bottom-${col}`,
    gridLeft + col * cellSize,
    gridTop + puzzle.height * cellSize,
    cellSize,
    outsideBottom,
    outside.bottom[col] === true,
    puzzle.clues.bottom[col] !== null
  ));
  puzzle.clues.left.forEach((_, row) => add(
    `left-${row}`,
    BOARD_PADDING,
    gridTop + row * cellSize,
    outsideLeft,
    cellSize,
    outside.left[row] === true,
    puzzle.clues.left[row] !== null
  ));
  puzzle.clues.right.forEach((_, row) => add(
    `right-${row}`,
    gridLeft + puzzle.width * cellSize,
    gridTop + row * cellSize,
    outsideRight,
    cellSize,
    outside.right[row] === true,
    puzzle.clues.right[row] !== null
  ));

  return (
    <svg
      className="pointer-events-none absolute inset-0"
      width={puzzle.width * cellSize + outsideLeft + outsideRight + BOARD_PADDING * 2}
      height={puzzle.height * cellSize + outsideTop + outsideBottom + BOARD_PADDING * 2}
      aria-hidden="true"
    >
      {rectangles}
      <rect
        x={gridLeft + (getRoomBoundaryStrokeWidth() + 1) / 2}
        y={gridTop + (getRoomBoundaryStrokeWidth() + 1) / 2}
        width={Math.max(0, puzzle.width * cellSize - (getRoomBoundaryStrokeWidth() + 1))}
        height={Math.max(0, puzzle.height * cellSize - (getRoomBoundaryStrokeWidth() + 1))}
        fill="none"
        stroke={woodBoardTheme.border}
        strokeWidth={getRoomBoundaryStrokeWidth()}
        vectorEffect="non-scaling-stroke"
      />
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
        const stroke = getSnapshotTrialColor(snapshot, key, ['levels'], 'line', woodBoardTheme.ink, visibleTrialLevel);
        // Domino boundaries share the bold loop-line style used by
        // Slitherlink's player-drawn lines.
        const perimeter = [
          { x1: rect.x, y1: rect.y, x2: rect.x + rect.width, y2: rect.y },
          { x1: rect.x, y1: rect.y + rect.height, x2: rect.x + rect.width, y2: rect.y + rect.height },
          { x1: rect.x, y1: rect.y, x2: rect.x, y2: rect.y + rect.height },
          { x1: rect.x + rect.width, y1: rect.y, x2: rect.x + rect.width, y2: rect.y + rect.height },
        ];

        return (
          <g key={`domino-outline-${key}`}>
            {perimeter.map((segment, index) => (
              <line
                key={index}
                x1={segment.x1}
                y1={segment.y1}
                x2={segment.x2}
                y2={segment.y2}
                stroke={stroke}
                strokeWidth={getLoopLineStrokeWidth(cellSize)}
                strokeLinecap="round"
              />
            ))}
          </g>
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

  return (
    <svg className="pointer-events-none absolute left-0 top-0" width="100%" height="100%">
      {keys.map((key) => {
        const points = getPoints(key, cellSize);
        if (!points) return null;
        const x = (points.x1 + points.x2) / 2;
        const y = (points.y1 + points.y2) / 2;

        return (
          <BoardEdgeCross
            key={`${keyPrefix}-${key}`}
            x={x}
            y={y}
            cellSize={cellSize}
            color={typeof stroke === 'function' ? stroke(key) : stroke}
          />
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
  const { copy } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const [availableWidth, setAvailableWidth] = useState<number | null>(null);
  const activePuzzle = puzzle?.type === puzzleType && puzzle.width === width && puzzle.height === height ? puzzle : undefined;
  const clueMap = useMemo<ReadonlyMap<string, unknown>>(() => {
    if (!activePuzzle) return new Map();

    switch (activePuzzle.type) {
      case 'nurikabe':
      case 'yajilin':
      case 'koburin':
      case 'heyawake':
      case 'aqre':
      case 'mintonette':
      case 'kurarin':
      case 'walkwalk':
      case 'lakes':
        return makePositionMap<{ row: number; col: number }>(activePuzzle.clues);
      case 'battleship':
        return makePositionMap<{ row: number; col: number }>(activePuzzle.cellClues);
      default:
        return new Map();
    }
  }, [activePuzzle]);
  const skyNeighborDisplayClues = useMemo(() => {
    if (activePuzzle?.type !== 'sky-neighbor') return null;
    const snapshotOutside = getSkyNeighborSnapshotOutside(
      snapshot,
      activePuzzle.width,
      activePuzzle.height
    );
    const grid = Array.from({ length: activePuzzle.height }, (_, row) =>
      Array.from({ length: activePuzzle.width }, (_, col) => {
        const value = getGridValue(snapshot, row, col);
        return typeof value === 'number' ? value : null;
      })
    );
    return snapshotOutside ?? getSkyNeighborDisplayClues(grid, activePuzzle);
  }, [activePuzzle, snapshot]);
  const outsideClues: BoardOutsideClues | null = activePuzzle?.type === 'skyscrapers'
    ? activePuzzle.clues
    : activePuzzle?.type === 'sky-neighbor'
      ? skyNeighborDisplayClues
    : activePuzzle?.type === 'battleship'
      ? {
          top: activePuzzle.columnClues,
          left: activePuzzle.rowClues,
        }
      : activePuzzle?.type === 'pills'
        ? {
            top: activePuzzle.topClues,
            left: activePuzzle.leftClues,
          }
        : activePuzzle?.type === 'magnets'
          ? {
              top: activePuzzle.topClues,
              left: activePuzzle.leftClues,
            }
          : null;
  const outsideDirectionCount = Number(outsideClues?.left !== undefined) +
    Number(outsideClues?.right !== undefined) +
    Number(outsideClues?.top !== undefined) +
    Number(outsideClues?.bottom !== undefined);
  const outsideHorizontalDirectionCount = Number(outsideClues?.left !== undefined) +
    Number(outsideClues?.right !== undefined);
  const outsideClueMaxDigits = getBoardOutsideClueMaxDigits(outsideClues);
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
    // Sky-neighbors uses the same base cell sizing as every other replay.
    // Its outside ring remains square, but does not use a separate scale.
    const sizeLimit = requestedCellSize;
    const minimumCellSize = commonBoardChrome.minCellSize;
    if (!availableWidth || width <= 0) return sizeLimit;

    const chromeWidth = (BOARD_PADDING + BOARD_BORDER) * 2;
    // A clue gutter is proportional to the cell size (with a 24px floor), so
    // solve the fit once or twice instead of letting the thumbnail overflow
    // its container on narrow screens.
    let fittedCellSize = sizeLimit;
    for (let iteration = 0; iteration < 2; iteration++) {
      const clueGutter = outsideDirectionCount > 0
        ? activePuzzle?.type === 'sky-neighbor'
          ? fittedCellSize
          : getBoardOutsideClueGutter(fittedCellSize, outsideClueMaxDigits)
        : 0;
      fittedCellSize = (availableWidth - chromeWidth - outsideHorizontalDirectionCount * clueGutter) / width;
    }

    if (!Number.isFinite(fittedCellSize) || fittedCellSize <= 0) return sizeLimit;
    return Math.max(
      minimumCellSize,
      Math.min(sizeLimit, fittedCellSize)
    );
  }, [activePuzzle?.type, availableWidth, outsideClueMaxDigits, outsideDirectionCount, outsideHorizontalDirectionCount, requestedCellSize, width]);

  const markMap = makePositionMap(marks);
  const regionIds = getRegionIds(activePuzzle);
  const isSlither = activePuzzle?.type === 'slither' || activePuzzle?.type === 'wolvesandsheepfences' ||
    (!activePuzzle && (puzzleType === 'slither' || puzzleType === 'wolvesandsheepfences'));
  const isPills = activePuzzle?.type === 'pills' || (!activePuzzle && puzzleType === 'pills');
  const isFourWindsWithParks = activePuzzle?.type === 'four-winds-with-parks' ||
    (!activePuzzle && puzzleType === 'four-winds-with-parks');
  const isDominoSearch = activePuzzle?.type === 'domino-search' || (!activePuzzle && puzzleType === 'domino-search');
  const dominoes = activePuzzle?.type === 'domino-search' ? activePuzzle.dominoes : null;
  const lineEdges = (isSlither || isPills)
    ? filterValidGridLineEdgeKeys(getStringArray(snapshot, 'lineEdges'), width, height)
    : filterValidCellEdgeKeys(getStringArray(snapshot, 'lineEdges'), width, height);
  const loopEdges = filterValidCellEdgeKeys(getStringArray(snapshot, 'loopEdges'), width, height);
  const dominoEdges = filterValidCellEdgeKeys(getStringArray(snapshot, 'edges'), width, height);
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
  // Sky-neighbors renders a four-sided ring of actual cells.  Match the
  // gutter dimensions to the central cell size so every square has exactly
  // the same geometry at every responsive size.
  const outsideClueLayout = activePuzzle?.type === 'sky-neighbor'
    ? {
        clueSize: cellSize,
        left: outsideClues?.left !== undefined ? cellSize : 0,
        right: outsideClues?.right !== undefined ? cellSize : 0,
        top: outsideClues?.top !== undefined ? cellSize : 0,
        bottom: outsideClues?.bottom !== undefined ? cellSize : 0,
      }
    : getBoardOutsideClueLayout(cellSize, outsideClues);
  const outsideLeft = outsideClueLayout.left;
  const outsideRight = outsideClueLayout.right;
  const outsideTop = outsideClueLayout.top;
  const outsideBottom = outsideClueLayout.bottom;
  const gridLeft = BOARD_PADDING + outsideLeft;
  const gridTop = BOARD_PADDING + outsideTop;
  const battleshipContext = useMemo<BattleshipSnapshotContext | undefined>(() => {
    if (activePuzzle?.type !== 'battleship') return undefined;

    const snapshotGrid = Array.from({ length: activePuzzle.height }, (_, row) =>
      Array.from({ length: activePuzzle.width }, (_, col) => {
        const value = getGridValue(snapshot, row, col);
        return value === 1 || value === 2 ? value : 0;
      })
    );
    const snapshotLevels = Array.from({ length: activePuzzle.height }, (_, row) =>
      Array.from({ length: activePuzzle.width }, (_, col) => getCellTrialLevel(snapshot, row, col))
    );

    return {
      puzzle: activePuzzle,
      grid: snapshotGrid,
      occupied: getBattleshipOccupiedGrid(snapshotGrid, activePuzzle, {
        levels: snapshotLevels,
        visibleTrialLevel,
      }),
      waterClueKeys: getBattleshipWaterClueKeys(activePuzzle),
    };
  }, [activePuzzle, snapshot, visibleTrialLevel]);
  const crossedEdges = isSlither || isFourWindsWithParks
    ? filterValidGridLineEdgeKeys(getStringArray(snapshot, 'crossedEdges'), width, height)
    : filterValidCellEdgeKeys(getStringArray(snapshot, 'crossedEdges'), width, height);
  const deepLines = filterValidInternalBoundaryEdgeKeys(
    getStringArray(snapshot, 'deepLines'),
    width,
    height
  );
  const thinLines = filterValidInternalBoundaryEdgeKeys(
    getStringArray(snapshot, 'thinLines'),
    width,
    height
  );
  const edgeDots = filterValidGridLineEdgeKeys(getStringArray(snapshot, 'edgeDots'), width, height);
  const vertexDots = filterValidGridVertexKeys(getStringArray(snapshot, 'vertexDots'), width, height);
  const dominoOutlineKeys = isDominoSearch ? dominoEdges : [];
  const centerLoopKeys = loopEdges;
  const centerPathKeys = isSlither || isPills ? [] : lineEdges;
  const gridLineKeys = isSlither || isPills ? lineEdges : [];
  const centerCrossKeys = isSlither || isFourWindsWithParks ? [] : crossedEdges;
  const gridCrossKeys = isSlither || isFourWindsWithParks ? crossedEdges : [];
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
      <div className="w-full max-w-full overflow-x-auto overflow-y-hidden overscroll-x-contain pb-1">
        <div className="relative mx-auto select-none" style={frameStyle} aria-label={ariaLabel}>
          <div
            className="absolute grid"
            style={getBoardGridStyle(gridLeft, gridTop, width, cellSize)}
          >
            {Array.from({ length: height }, (_, row) =>
              Array.from({ length: width }, (_, col) => {
                const base = getCellView(
                  activePuzzle,
                  row,
                  col,
                  cellSize,
                  battleshipContext?.occupied,
                  clueMap
                );
                const snapshotValue = getGridValue(snapshot, row, col);
                const candidateValues = getCandidateValues(snapshot, row, col);
                const snapshotTrialLevel = getCellTrialLevel(snapshot, row, col);
                const snapshotTrialVisible = snapshotTrialLevel <= visibleTrialLevel;
                const snapshotView = getSnapshotCellView(
                  puzzleType,
                  snapshot,
                  row,
                  col,
                  visibleTrialLevel,
                  cellSize,
                  battleshipContext
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
                const legacyView = snapshotOverlay ? null : getLegacyMarkView(markMap.get(getLocalCellKey(row, col)), cellSize);
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
                const magicSummerMark = puzzleType === 'magic-summer' && snapshotTrialVisible &&
                  (snapshotValue === 'circle' || snapshotValue === 'cross')
                  ? snapshotValue
                  : null;
                const slitherMarkKey = `${row},${col}`;
                const centerMark = slitherMark ?? snailMark ?? slovakMark ?? magicSummerMark;
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
                  ...getBoardCellStyle(cellSize, view.tone),
                  ...trialStyle,
                  ...getBoardTextStyle(cellSize, view.fontRatio ?? 0.58, 15),
                };

                return (
                  <div
                    key={`${row}-${col}`}
                    className={boardClassNames.cellContent}
                    style={cellStyle}
                  >
                    {view.tone === 'outlined' ? <BoardCellOutline cellSize={cellSize} /> : null}
                    {centerMark ? (
                      <SlitherCellMark
                        mark={centerMark}
                        cellSize={cellSize}
                        color={
                          snailMark || slovakMark || magicSummerMark
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
                      {activePuzzle?.type === 'japanese-arrows' ? (
                        <span className="pointer-events-none absolute top-0 text-[0.55em] leading-none">
                          {japaneseArrowGlyphs[activePuzzle.arrows[row]?.[col]]}
                        </span>
                      ) : null}
                      {view.content}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {activePuzzle?.type === 'sky-neighbor' ? (
            <SkyNeighborOutsideCells
              puzzle={activePuzzle}
              cellSize={cellSize}
              outsideLeft={outsideLeft}
              outsideRight={outsideRight}
              outsideTop={outsideTop}
              outsideBottom={outsideBottom}
            />
          ) : null}

          {outsideClues ? (
            <div className="pointer-events-none absolute inset-0">
              {outsideClues.top?.map((value, col) =>
                value === null ? null : (
                  <span
                    key={`top-${col}`}
                    className="absolute -translate-x-1/2 -translate-y-1/2 text-center tabular-nums"
                    style={{
                      left: `${gridLeft + (col + 0.5) * cellSize}px`,
                      top: `${BOARD_PADDING + outsideTop / 2}px`,
                      color: woodBoardTheme.border,
                      ...getBoardOutsideClueTextStyle(cellSize, cellSize, value),
                    }}
                  >
                    {value}
                  </span>
                )
              )}
              {outsideClues.bottom?.map((value, col) =>
                value === null ? null : (
                  <span
                    key={`bottom-${col}`}
                    className="absolute -translate-x-1/2 -translate-y-1/2 text-center tabular-nums"
                    style={{
                      left: `${gridLeft + (col + 0.5) * cellSize}px`,
                      top: `${gridTop + height * cellSize + outsideBottom / 2}px`,
                      color: woodBoardTheme.border,
                      ...getBoardOutsideClueTextStyle(cellSize, cellSize, value),
                    }}
                  >
                    {value}
                  </span>
                )
              )}
              {outsideClues.left?.map((value, row) =>
                value === null ? null : (
                  <span
                    key={`left-${row}`}
                    className="absolute -translate-x-1/2 -translate-y-1/2 text-center tabular-nums"
                    style={{
                      left: `${BOARD_PADDING + outsideLeft / 2}px`,
                      top: `${gridTop + (row + 0.5) * cellSize}px`,
                      color: woodBoardTheme.border,
                      ...getBoardOutsideClueTextStyle(cellSize, outsideClueLayout.clueSize, value),
                    }}
                  >
                    {value}
                  </span>
                )
              )}
              {outsideClues.right?.map((value, row) =>
                value === null ? null : (
                  <span
                    key={`right-${row}`}
                    className="absolute -translate-x-1/2 -translate-y-1/2 text-center tabular-nums"
                    style={{
                      left: `${gridLeft + width * cellSize + outsideRight / 2}px`,
                      top: `${gridTop + (row + 0.5) * cellSize}px`,
                      color: woodBoardTheme.border,
                      ...getBoardOutsideClueTextStyle(cellSize, outsideClueLayout.clueSize, value),
                    }}
                  >
                    {value}
                  </span>
                )
              )}
            </div>
          ) : null}

          {regionIds ? <RegionBoundaries regionIds={regionIds} width={width} height={height} cellSize={cellSize} /> : null}
          {activePuzzle?.type === 'consecutive-kakuro' ? (
            <ConsecutiveBarsOverlay puzzle={activePuzzle} cellSize={cellSize} gridLeft={gridLeft} gridTop={gridTop} />
          ) : null}
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
            strokeWidth={getBoardThinStrokeWidth(cellSize)}
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
                isFourWindsWithParks ? ['crossedEdgeLevels'] : ['crossedLevels'],
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

      {activePuzzle?.type === 'battleship' ? (
        <BattleshipFleet fleet={activePuzzle.fleet} boardCellSize={cellSize} compact />
      ) : null}

      {maxTrialLevel > 0 ? (
        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground" aria-live="polite">
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            disabled={visibleTrialLevel <= 0}
            onClick={() => setVisibleTrialLevel((current) => Math.max(0, current - 1))}
            aria-label={copy.shared.trialDisplay.decrease}
            title={copy.shared.trialDisplay.decrease}
          >
            <ChevronLeft />
          </Button>
          <span className="min-w-28 text-center tabular-nums">
            {getTrialDisplayLabel(visibleTrialLevel, maxTrialLevel, copy.shared.trialDisplay)}
          </span>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            disabled={visibleTrialLevel >= maxTrialLevel}
            onClick={() => setVisibleTrialLevel((current) => Math.min(maxTrialLevel, current + 1))}
            aria-label={copy.shared.trialDisplay.increase}
            title={copy.shared.trialDisplay.increase}
          >
            <ChevronRight />
          </Button>
        </div>
      ) : null}

      {dominoListItems ? (
        <div className="flex w-full min-w-0 max-w-full self-stretch flex-wrap justify-center gap-1 overflow-hidden text-xs">
          {dominoListItems.map(({ left, right, index, used }) => (
            <span
              key={`${left}-${right}-${index}`}
              className="shrink-0 whitespace-nowrap border px-1.5 py-0.5 font-medium tabular-nums"
              style={getBoardDominoBadgeStyle(used)}
            >
              {left}-{right}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
