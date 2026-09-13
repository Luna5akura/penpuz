import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import PuzzleAssistToolbar from '@/components/PuzzleAssistToolbar';
import ValidationMessage from '@/components/ValidationMessage';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/useI18n';
import { usePuzzleHistory } from '@/hooks/usePuzzleHistory';
import { getKeyboardDigit, isKeyboardInputTarget } from '@/lib/keyboard';
import { safeSetPointerCapture } from '@/lib/pointer';
import { sanitizeMatrix } from '../snapshotGuards';
import { getTrialLevelColors } from '../trialStyles';
import type { CellCoord } from '../gridUtils';
import { getCellKey } from '../gridUtils';
import BoardCellOutline from './BoardCellOutline';
import { useBoardContainerWidth } from '../useBoardContainerWidth';
import {
  boardClassNames,
  commonBoardChrome,
  getBoardCellStyle,
  getBoardFrameStyle,
  getBoardGridStyle,
  getBoardInkStyle,
  getBoardOutsideClueLayout,
  getBoardOutsideClueMaxDigits,
  getBoardOutsideClueTextStyle,
  getBoardTextStyle,
  getBoardTrialCellStyle,
  getResponsiveCellSize,
  woodBoardTheme,
  type BoardCellTone,
  type BoardOutsideClues,
} from '../boardTheme';

export interface NumberPlacementValidationResult {
  valid: boolean;
  message?: string;
  badCells: CellCoord[];
}

export type NumberPlacementCellValue = number | 'circle' | 'cross' | null;
export type NumberPlacementInputMode = 'select' | 'cycle' | 'candidates';

/** The four sides used by a board with answer cells outside the main grid. */
export type NumberPlacementOutsideSide = 'top' | 'right' | 'bottom' | 'left';

/** Values stored for the optional outside answer ring. */
export interface NumberPlacementOutsideValues {
  top: NumberPlacementCellValue[];
  right: NumberPlacementCellValue[];
  bottom: NumberPlacementCellValue[];
  left: NumberPlacementCellValue[];
}

type NumberPlacementOutsideLevels = {
  top: number[];
  right: number[];
  bottom: number[];
  left: number[];
};

/**
 * Opt-in outside-cell editing.  A side is rendered as an editable answer
 * ring when its flag is true; `getFixedValue` can lock imported givens on
 * that side.  The regular `outsideClues` prop remains display-only for
 * puzzles whose outside numbers are clues rather than answers.
 */
export interface NumberPlacementOutsideInput {
  top?: boolean;
  right?: boolean;
  bottom?: boolean;
  left?: boolean;
  getFixedValue?: (side: NumberPlacementOutsideSide, index: number) => number | null;
  getCellTone?: (
    side: NumberPlacementOutsideSide,
    index: number,
    value: NumberPlacementCellValue
  ) => BoardCellTone;
}

export type NumberPlacementOutsideClues = BoardOutsideClues;
export type NumberPlacementOutsideClueResolver =
  (grid: (number | null)[][]) => NumberPlacementOutsideClues | null | undefined;

interface NumberPlacementSnapshot {
  grid: NumberPlacementCellValue[][];
  levels: number[][];
  candidates: number[][][];
  outside?: NumberPlacementOutsideValues;
  outsideLevels?: NumberPlacementOutsideLevels;
}

interface NumberPlacementBoardProps<TPuzzle extends { width: number; height: number }> {
  puzzle: TPuzzle;
  numbers: number[];
  startTime: number;
  resetToken: number;
  onComplete: (time: number) => void;
  validate: (
    grid: (number | null)[][],
    puzzle: TPuzzle,
    outsideValues?: NumberPlacementOutsideValues
  ) => NumberPlacementValidationResult;
  getFixedValue?: (row: number, col: number) => number | null;
  isBlockedCell?: (row: number, col: number) => boolean;
  renderBlockedCell?: (row: number, col: number, cellSize: number) => ReactNode;
  renderOverlay?: (cellSize: number, boardWidthPx: number, boardHeightPx: number) => ReactNode;
  renderCellValue?: (value: NumberPlacementCellValue, cellSize: number, row: number, col: number) => ReactNode;
  renderCandidates?: (values: number[], cellSize: number, row: number, col: number) => ReactNode;
  getCellTone?: (row: number, col: number, value: NumberPlacementCellValue) => BoardCellTone;
  extraCellValues?: Array<Exclude<NumberPlacementCellValue, number | null>>;
  cellInputMode?: NumberPlacementInputMode;
  cycleValues?: NumberPlacementCellValue[];
  inputModeOptions?: Array<{ mode: NumberPlacementInputMode; label: string }>;
  showValueButtons?: boolean;
  /** Static outside clues, or a resolver used for answer cells derived from the grid. */
  outsideClues?: NumberPlacementOutsideClues | NumberPlacementOutsideClueResolver;
  /** Enable editable answer cells in one or more outside sides. */
  outsideInput?: NumberPlacementOutsideInput;
  initialSnapshot?: unknown;
  onSnapshotChange?: (snapshot: unknown) => void;
  fixedCellSize?: number;
  maxCellSize?: number;
  /** Keep editable outside cells square with the main grid cells. */
  squareOutsideCells?: boolean;
  showValidationMessage?: boolean;
}

const BOARD_PADDING = commonBoardChrome.padding;
const BOARD_BORDER = commonBoardChrome.border;
const EMPTY_EXTRA_CELL_VALUES: Array<Exclude<NumberPlacementCellValue, number | null>> = [];
const EMPTY_CYCLE_VALUES: NumberPlacementCellValue[] = [];
const EMPTY_FIXED_VALUE = () => null;
const EMPTY_BLOCKED_CELL = () => false;
const KEYBOARD_ENTRY_TIMEOUT_MS = 1000;

function createEmptyNumberGrid(width: number, height: number): NumberPlacementCellValue[][] {
  return Array.from({ length: height }, () => Array(width).fill(null));
}

function createEmptyCandidateGrid(width: number, height: number): number[][][] {
  return Array.from({ length: height }, () => Array.from({ length: width }, () => []));
}

const OUTSIDE_SIDES: NumberPlacementOutsideSide[] = ['top', 'right', 'bottom', 'left'];

function outsideSideLength(
  outsideInput: NumberPlacementOutsideInput | undefined,
  side: NumberPlacementOutsideSide,
  width: number,
  height: number
) {
  if (!outsideInput?.[side]) return 0;
  return side === 'top' || side === 'bottom' ? width : height;
}

function createEmptyOutsideValues(
  outsideInput: NumberPlacementOutsideInput | undefined,
  width: number,
  height: number
): NumberPlacementOutsideValues {
  return {
    top: Array<NumberPlacementCellValue>(outsideSideLength(outsideInput, 'top', width, height)).fill(null),
    right: Array<NumberPlacementCellValue>(outsideSideLength(outsideInput, 'right', width, height)).fill(null),
    bottom: Array<NumberPlacementCellValue>(outsideSideLength(outsideInput, 'bottom', width, height)).fill(null),
    left: Array<NumberPlacementCellValue>(outsideSideLength(outsideInput, 'left', width, height)).fill(null),
  };
}

function createEmptyOutsideLevels(
  outsideInput: NumberPlacementOutsideInput | undefined,
  width: number,
  height: number
): NumberPlacementOutsideLevels {
  return {
    top: Array<number>(outsideSideLength(outsideInput, 'top', width, height)).fill(0),
    right: Array<number>(outsideSideLength(outsideInput, 'right', width, height)).fill(0),
    bottom: Array<number>(outsideSideLength(outsideInput, 'bottom', width, height)).fill(0),
    left: Array<number>(outsideSideLength(outsideInput, 'left', width, height)).fill(0),
  };
}

function normalizeOutsideSide(
  source: unknown,
  length: number,
  numberSet: Set<number>,
  extraCellValueSet: Set<Exclude<NumberPlacementCellValue, number | null>>
): NumberPlacementCellValue[] {
  const values = Array<NumberPlacementCellValue>(length).fill(null);
  if (!Array.isArray(source)) return values;
  for (let index = 0; index < length; index++) {
    const value = source[index];
    if (value === null || value === undefined) continue;
    if (typeof value === 'number' && numberSet.has(value)) values[index] = value;
    else if (typeof value === 'string' && extraCellValueSet.has(value as Exclude<NumberPlacementCellValue, number | null>)) {
      values[index] = value as NumberPlacementCellValue;
    }
  }
  return values;
}

function normalizeOutsideLevelSide(source: unknown, length: number): number[] {
  const values = Array<number>(length).fill(0);
  if (!Array.isArray(source)) return values;
  for (let index = 0; index < length; index++) {
    const value = source[index];
    if (typeof value === 'number' && Number.isFinite(value)) values[index] = value;
  }
  return values;
}

function normalizeNumberPlacementSnapshot(
  snapshot: unknown,
  width: number,
  height: number,
  numbers: number[],
  getFixedValue: (row: number, col: number) => number | null,
  isBlockedCell: (row: number, col: number) => boolean,
  extraCellValues: Array<Exclude<NumberPlacementCellValue, number | null>>,
  outsideInput?: NumberPlacementOutsideInput
): NumberPlacementSnapshot {
  const numberSet = new Set(numbers);
  const extraCellValueSet = new Set(extraCellValues);
  const fallback = {
    grid: createEmptyNumberGrid(width, height),
    levels: Array.from({ length: height }, () => Array(width).fill(0)),
    candidates: createEmptyCandidateGrid(width, height),
  };
  const source = snapshot as Partial<NumberPlacementSnapshot> | null | undefined;
  const grid = sanitizeMatrix(source?.grid, fallback.grid, (value) => {
    if (value === null) return null;
    if (typeof value === 'number' && numberSet.has(value)) return value;
    if (typeof value === 'string' && extraCellValueSet.has(value as Exclude<NumberPlacementCellValue, number | null>)) {
      return value as NumberPlacementCellValue;
    }
    return null;
  });
  const levels = sanitizeMatrix(source?.levels, fallback.levels, (value, fallbackCell) =>
    typeof value === 'number' && Number.isFinite(value) ? value : fallbackCell
  );
  const candidates = Array.from({ length: height }, (_, row) =>
    Array.from({ length: width }, (_, col) => {
      const candidateCell = Array.isArray(source?.candidates?.[row]?.[col])
        ? source.candidates[row][col]
        : [];
      return Array.from(
        new Set(candidateCell.filter((value): value is number => Number.isInteger(value) && numberSet.has(value)))
      ).sort((a, b) => numbers.indexOf(a) - numbers.indexOf(b));
    })
  );

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      if (isBlockedCell(row, col)) {
        grid[row][col] = null;
        levels[row][col] = 0;
        candidates[row][col] = [];
        continue;
      }

      const fixedValue = getFixedValue(row, col);
      if (fixedValue !== null) {
        grid[row][col] = fixedValue;
        levels[row][col] = 0;
        candidates[row][col] = [];
      } else if (grid[row][col] !== null) {
        candidates[row][col] = [];
      }
    }
  }

  if (!outsideInput || !OUTSIDE_SIDES.some((side) => outsideInput[side])) {
    return { grid, levels, candidates };
  }

  const outsideSource = source?.outside as Partial<NumberPlacementOutsideValues> | null | undefined;
  const outsideLevelsSource = source?.outsideLevels as Partial<NumberPlacementOutsideLevels> | null | undefined;
  const outside = createEmptyOutsideValues(outsideInput, width, height);
  const outsideLevels = createEmptyOutsideLevels(outsideInput, width, height);
  for (const side of OUTSIDE_SIDES) {
    const length = outsideSideLength(outsideInput, side, width, height);
    const values = normalizeOutsideSide(
      outsideSource?.[side],
      length,
      numberSet,
      extraCellValueSet
    );
    const fixedValue = outsideInput.getFixedValue;
    if (fixedValue) {
      for (let index = 0; index < length; index++) {
        const candidate = fixedValue(side, index);
        if (typeof candidate === 'number' && numberSet.has(candidate)) values[index] = candidate;
      }
    }
    outside[side] = values;
    outsideLevels[side] = normalizeOutsideLevelSide(outsideLevelsSource?.[side], length);
  }

  return { grid, levels, candidates, outside, outsideLevels };
}

export default function NumberPlacementBoard<TPuzzle extends { width: number; height: number }>({
  puzzle,
  numbers,
  startTime,
  resetToken,
  onComplete,
  validate,
  getFixedValue = EMPTY_FIXED_VALUE,
  isBlockedCell = EMPTY_BLOCKED_CELL,
  renderBlockedCell,
  renderOverlay,
  renderCellValue,
  renderCandidates,
  getCellTone,
  extraCellValues = EMPTY_EXTRA_CELL_VALUES,
  cellInputMode = 'select',
  cycleValues = EMPTY_CYCLE_VALUES,
  inputModeOptions,
  showValueButtons = true,
  outsideClues,
  outsideInput,
  initialSnapshot,
  onSnapshotChange,
  fixedCellSize,
  maxCellSize,
  squareOutsideCells = false,
  showValidationMessage = false,
}: NumberPlacementBoardProps<TPuzzle>) {
  const { copy } = useI18n();
  const { width, height } = puzzle;
  const [selectedCell, setSelectedCell] = useState<CellCoord | null>(null);
  const [activeCellInputMode, setActiveCellInputMode] = useState<NumberPlacementInputMode>(cellInputMode);
  const [containerRef, viewportWidth] = useBoardContainerWidth();
  const boardRef = useRef<HTMLDivElement>(null);
  const keyboardEntryRef = useRef<{ row: number; col: number; text: string; timestamp: number } | null>(null);
  const hasCompleted = useRef(false);
  const resetBoardRef = useRef<() => void>(() => {});
  const initialSnapshotRef = useRef(initialSnapshot);

  useEffect(() => {
    initialSnapshotRef.current = initialSnapshot;
  }, [initialSnapshot]);

  const createInitialSnapshot = useCallback<() => NumberPlacementSnapshot>(
      () => normalizeNumberPlacementSnapshot(
        null,
        width,
        height,
        numbers,
        getFixedValue,
        isBlockedCell,
        extraCellValues,
        outsideInput
      ),
    [extraCellValues, getFixedValue, height, isBlockedCell, numbers, outsideInput, width]
  );
  const getResetSnapshot = useCallback(
    () =>
      normalizeNumberPlacementSnapshot(
        initialSnapshotRef.current,
        width,
        height,
        numbers,
        getFixedValue,
        isBlockedCell,
        extraCellValues,
        outsideInput
      ),
    [extraCellValues, getFixedValue, height, isBlockedCell, numbers, outsideInput, width]
  );

  const history = usePuzzleHistory<NumberPlacementSnapshot>(createInitialSnapshot(), {
    normalizeTrialSnapshot: (trialSnapshot) => ({
      ...normalizeNumberPlacementSnapshot(
        trialSnapshot,
        width,
        height,
        numbers,
        getFixedValue,
        isBlockedCell,
        extraCellValues,
        outsideInput
      ),
      levels: Array.from({ length: height }, () => Array(width).fill(0)),
    }),
    onSnapshotChange,
  });
  const {
    snapshot,
    canUndo,
    canRedo,
    trialActive,
    trialCheckpointCount,
    currentTrialLevel,
    canUndoTrialCheckpoint,
    applyChange,
    reset,
    undo,
    redo,
    addTrialCheckpoint,
    undoTrialCheckpoint,
    startTrial,
    discardTrial,
    commitTrial,
  } = history;

  const normalizedSnapshot = useMemo(
    () => normalizeNumberPlacementSnapshot(
      snapshot,
      width,
      height,
      numbers,
      getFixedValue,
      isBlockedCell,
      extraCellValues,
      outsideInput
    ),
    [extraCellValues, getFixedValue, height, isBlockedCell, numbers, outsideInput, snapshot, width]
  );
  const grid = normalizedSnapshot.grid;
  const levels = normalizedSnapshot.levels;
  const candidates = normalizedSnapshot.candidates;
  const validationGrid = useMemo(
    () => grid.map((rowValues) => rowValues.map((value) => (typeof value === 'number' ? value : null))),
    [grid]
  );
  const validationOutsideValues = normalizedSnapshot.outside
    ? normalizedSnapshot.outside
    : undefined;
  const validation = useMemo(
    () => validate(validationGrid, puzzle, validationOutsideValues),
    [puzzle, validate, validationGrid, validationOutsideValues]
  );
  const visibleValidation = showValidationMessage ? validation : null;
  const resolvedOutsideClues = useMemo(
    () => typeof outsideClues === 'function' ? outsideClues(validationGrid) ?? undefined : outsideClues,
    [outsideClues, validationGrid]
  );
  const hasOutsideInput = OUTSIDE_SIDES.some((side) => outsideInput?.[side] === true);
  const layoutOutsideClues = resolvedOutsideClues ?? (
    hasOutsideInput
      ? {
          ...(outsideInput?.top ? { top: Array<number | null>(width).fill(null) } : {}),
          ...(outsideInput?.right ? { right: Array<number | null>(height).fill(null) } : {}),
          ...(outsideInput?.bottom ? { bottom: Array<number | null>(width).fill(null) } : {}),
          ...(outsideInput?.left ? { left: Array<number | null>(height).fill(null) } : {}),
        }
      : undefined
  );
  const outsideClueMaxDigits = getBoardOutsideClueMaxDigits(layoutOutsideClues);
  const cellSize = useMemo(
    () => getResponsiveCellSize({
      fixedCellSize,
      viewportWidth,
      width,
      outsideClueSides: Number(!!layoutOutsideClues?.left) + Number(!!layoutOutsideClues?.right),
      outsideClueMaxDigits,
      maxCellSize,
      containerWidth: true,
      // Keep three-digit clues at the regular clue font size; on narrow
      // screens the grid itself may scale below the normal 24px touch size
      // so the enlarged left/right gutter still fits the viewport.
      // Four-sided answer rings (Sky-neighbors) must use the same shared
      // minimum as ordinary boards.  Let the surrounding overflow container
      // handle narrow screens instead of shrinking only this puzzle's cells.
      minCellSize: squareOutsideCells
        ? commonBoardChrome.minCellSize
        : layoutOutsideClues?.left || layoutOutsideClues?.right
        ? outsideClueMaxDigits >= 3 ? 20 : 24
        : commonBoardChrome.minCellSize,
    }),
    [fixedCellSize, layoutOutsideClues?.left, layoutOutsideClues?.right, maxCellSize, outsideClueMaxDigits, squareOutsideCells, viewportWidth, width]
  );
  // Outside answer cells (Sky-neighbors) are part of the same grid as the
  // central cells.  Do not let the generic clue-gutter minimum (24px) make
  // them wider than a responsive central cell on narrow screens.
  const outsideClueLayout = squareOutsideCells
    ? {
        clueSize: cellSize,
        left: outsideInput?.left ? cellSize : 0,
        right: outsideInput?.right ? cellSize : 0,
        top: outsideInput?.top ? cellSize : 0,
        bottom: outsideInput?.bottom ? cellSize : 0,
      }
    : getBoardOutsideClueLayout(cellSize, layoutOutsideClues);
  const outsideLeft = outsideClueLayout.left;
  const outsideRight = outsideClueLayout.right;
  const outsideTop = outsideClueLayout.top;
  const outsideBottom = outsideClueLayout.bottom;
  const gridLeft = BOARD_PADDING + outsideLeft;
  const gridTop = BOARD_PADDING + outsideTop;

  const isOutsideCoordinate = useCallback((row: number, col: number) => {
    if (!hasOutsideInput) return false;
    if (row === -1 && col >= 0 && col < width && outsideInput?.top) return true;
    if (row === height && col >= 0 && col < width && outsideInput?.bottom) return true;
    if (col === -1 && row >= 0 && row < height && outsideInput?.left) return true;
    if (col === width && row >= 0 && row < height && outsideInput?.right) return true;
    return false;
  }, [hasOutsideInput, height, outsideInput, width]);

  const getOutsideCoordinate = useCallback((side: NumberPlacementOutsideSide, index: number): CellCoord => {
    if (side === 'top') return { row: -1, col: index };
    if (side === 'bottom') return { row: height, col: index };
    if (side === 'left') return { row: index, col: -1 };
    return { row: index, col: width };
  }, [height, width]);

  const getOutsideValue = useCallback((side: NumberPlacementOutsideSide, index: number) =>
    normalizedSnapshot.outside?.[side]?.[index] ?? null,
  [normalizedSnapshot.outside]);

  const getOutsideFixedValue = useCallback((side: NumberPlacementOutsideSide, index: number) => {
    const value = outsideInput?.getFixedValue?.(side, index);
    return typeof value === 'number' ? value : null;
  }, [outsideInput]);

  const isPositionEditable = useCallback((row: number, col: number) => {
    if (isOutsideCoordinate(row, col)) {
      const side: NumberPlacementOutsideSide = row === -1
        ? 'top'
        : row === height
          ? 'bottom'
          : col === -1
            ? 'left'
            : 'right';
      const index = row === -1 || row === height ? col : row;
      return getOutsideFixedValue(side, index) === null;
    }
    if (row < 0 || row >= height || col < 0 || col >= width) return false;
    return !isBlockedCell(row, col) && getFixedValue(row, col) === null;
  }, [getFixedValue, getOutsideFixedValue, height, isBlockedCell, isOutsideCoordinate, width]);

  const getOutsidePosition = useCallback((row: number, col: number) => {
    if (!isOutsideCoordinate(row, col)) return null;
    const side: NumberPlacementOutsideSide = row === -1
      ? 'top'
      : row === height
        ? 'bottom'
        : col === -1
          ? 'left'
          : 'right';
    return {
      side,
      index: row === -1 || row === height ? col : row,
    };
  }, [height, isOutsideCoordinate]);

  const selectedEditable = !!selectedCell && isPositionEditable(selectedCell.row, selectedCell.col);

  const resetBoard = useCallback(() => {
    reset(getResetSnapshot());
    hasCompleted.current = false;
  }, [getResetSnapshot, reset]);

  useEffect(() => {
    resetBoardRef.current = resetBoard;
  }, [resetBoard]);

  useEffect(() => {
    resetBoardRef.current();
  }, [puzzle, resetToken]);

  useEffect(() => {
    if (!validation.valid || hasCompleted.current) return;
    hasCompleted.current = true;
    onComplete(Math.floor((Date.now() - startTime) / 1000));
  }, [onComplete, startTime, validation.valid]);

  const setCellValue = useCallback((row: number, col: number, value: NumberPlacementCellValue) => {
    if (isBlockedCell(row, col) || getFixedValue(row, col) !== null) return;

    applyChange((currentSnapshot) => {
      const current = normalizeNumberPlacementSnapshot(
        currentSnapshot,
        width,
        height,
        numbers,
        getFixedValue,
        isBlockedCell,
        extraCellValues,
        outsideInput
      );
      if (current.grid[row][col] === value) return current;

      const nextGrid = current.grid.map((rowValues) => [...rowValues]);
      const nextLevels = current.levels.map((rowValues) => [...rowValues]);
      const nextCandidates = current.candidates.map((rowValues) => rowValues.map((values) => [...values]));
      nextGrid[row][col] = value;
      nextLevels[row][col] = value === null ? 0 : trialActive ? currentTrialLevel : 0;
      nextCandidates[row][col] = [];
      if (current.grid[row][col] === value && current.candidates[row][col].length === 0) return current;
      return { ...current, grid: nextGrid, levels: nextLevels, candidates: nextCandidates };
    });
  }, [applyChange, currentTrialLevel, extraCellValues, getFixedValue, height, isBlockedCell, numbers, outsideInput, trialActive, width]);

  const setOutsideCellValue = useCallback((
    side: NumberPlacementOutsideSide,
    index: number,
    value: NumberPlacementCellValue
  ) => {
    if (!outsideInput?.[side] || index < 0 || index >= outsideSideLength(outsideInput, side, width, height)) return;
    if (getOutsideFixedValue(side, index) !== null) return;

    applyChange((currentSnapshot) => {
      const current = normalizeNumberPlacementSnapshot(
        currentSnapshot,
        width,
        height,
        numbers,
        getFixedValue,
        isBlockedCell,
        extraCellValues,
        outsideInput
      );
      if (!current.outside) return current;
      const currentValue = current.outside[side][index] ?? null;
      if (currentValue === value) return current;
      const outside = {
        top: [...current.outside.top],
        right: [...current.outside.right],
        bottom: [...current.outside.bottom],
        left: [...current.outside.left],
      };
      const outsideLevels = {
        top: [...(current.outsideLevels?.top ?? [])],
        right: [...(current.outsideLevels?.right ?? [])],
        bottom: [...(current.outsideLevels?.bottom ?? [])],
        left: [...(current.outsideLevels?.left ?? [])],
      };
      outside[side][index] = value;
      outsideLevels[side][index] = value === null ? 0 : trialActive ? currentTrialLevel : 0;
      return { ...current, outside, outsideLevels };
    });
  }, [applyChange, currentTrialLevel, extraCellValues, getFixedValue, getOutsideFixedValue, height, isBlockedCell, numbers, outsideInput, trialActive, width]);

  const setPositionValue = useCallback((row: number, col: number, value: NumberPlacementCellValue) => {
    const outsidePosition = getOutsidePosition(row, col);
    if (outsidePosition) {
      setOutsideCellValue(outsidePosition.side, outsidePosition.index, value);
    } else {
      setCellValue(row, col, value);
    }
  }, [getOutsidePosition, setCellValue, setOutsideCellValue]);

  const toggleCandidate = useCallback((row: number, col: number, number: number) => {
    if (isBlockedCell(row, col) || getFixedValue(row, col) !== null) return;

    applyChange((currentSnapshot) => {
      const current = normalizeNumberPlacementSnapshot(
        currentSnapshot,
        width,
        height,
        numbers,
        getFixedValue,
        isBlockedCell,
        extraCellValues,
        outsideInput
      );
      if (!numbers.includes(number)) return current;
      if (current.grid[row][col] !== null && current.candidates[row][col].length === 0) return current;

      const currentCandidates = new Set(current.candidates[row][col]);
      if (currentCandidates.has(number)) {
        currentCandidates.delete(number);
      } else {
        currentCandidates.add(number);
      }

      const nextCandidates = current.candidates.map((rowValues) => rowValues.map((values) => [...values]));
      nextCandidates[row][col] = numbers.filter((value) => currentCandidates.has(value));
      const nextLevels = current.levels.map((rowValues) => [...rowValues]);
      nextLevels[row][col] = nextCandidates[row][col].length > 0
        ? trialActive ? currentTrialLevel : current.levels[row][col]
        : 0;
      return { ...current, candidates: nextCandidates, levels: nextLevels };
    });
  }, [
    applyChange,
    currentTrialLevel,
    extraCellValues,
    getFixedValue,
    height,
    isBlockedCell,
    numbers,
    outsideInput,
    trialActive,
    width,
  ]);

  const cycleCellValue = useCallback((row: number, col: number, direction: 1 | -1) => {
    if (isBlockedCell(row, col) || getFixedValue(row, col) !== null || cycleValues.length === 0) return;

    applyChange((currentSnapshot) => {
      const current = normalizeNumberPlacementSnapshot(
        currentSnapshot,
        width,
        height,
        numbers,
        getFixedValue,
        isBlockedCell,
        extraCellValues,
        outsideInput
      );
      const currentValue = current.grid[row][col];
      const currentIndex = cycleValues.findIndex((value) => value === currentValue);
      const nextIndex = currentIndex < 0
        ? direction === 1 ? 0 : cycleValues.length - 1
        : (currentIndex + direction + cycleValues.length) % cycleValues.length;
      const nextValue = cycleValues[nextIndex] ?? null;

      if (currentValue === nextValue) return current;

      const nextGrid = current.grid.map((rowValues) => [...rowValues]);
      const nextLevels = current.levels.map((rowValues) => [...rowValues]);
      const nextCandidates = current.candidates.map((rowValues) => rowValues.map((values) => [...values]));
      nextGrid[row][col] = nextValue;
      nextLevels[row][col] = nextValue === null ? 0 : trialActive ? currentTrialLevel : 0;
      nextCandidates[row][col] = [];
      return { ...current, grid: nextGrid, levels: nextLevels, candidates: nextCandidates };
    });
  }, [
    applyChange,
    currentTrialLevel,
    cycleValues,
    extraCellValues,
    getFixedValue,
    height,
    isBlockedCell,
    numbers,
    outsideInput,
    trialActive,
    width,
  ]);

  const cyclePositionValue = useCallback((row: number, col: number, direction: 1 | -1) => {
    const outsidePosition = getOutsidePosition(row, col);
    if (!outsidePosition) {
      cycleCellValue(row, col, direction);
      return;
    }
    if (cycleValues.length === 0 || !isPositionEditable(row, col)) return;
    const currentValue = getOutsideValue(outsidePosition.side, outsidePosition.index);
    const currentIndex = cycleValues.findIndex((value) => value === currentValue);
    const nextIndex = currentIndex < 0
      ? direction === 1 ? 0 : cycleValues.length - 1
      : (currentIndex + direction + cycleValues.length) % cycleValues.length;
    if (cycleValues[nextIndex] !== undefined) {
      setOutsideCellValue(
        outsidePosition.side,
        outsidePosition.index,
        cycleValues[nextIndex] ?? null
      );
    }
  }, [cycleCellValue, cycleValues, getOutsidePosition, getOutsideValue, isPositionEditable, setOutsideCellValue]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isKeyboardInputTarget(event.target)) return;
      if (!selectedCell || !selectedEditable || event.altKey || event.ctrlKey || event.metaKey) return;
      const selectedOutside = getOutsidePosition(selectedCell.row, selectedCell.col) !== null;

      const value = getKeyboardDigit(event);
      if (event.key === 'Backspace' || event.key === 'Delete' || value === 0) {
        event.preventDefault();
        keyboardEntryRef.current = null;
        setPositionValue(selectedCell.row, selectedCell.col, null);
        return;
      }

      if (value === null) return;

      if (activeCellInputMode === 'candidates' && !selectedOutside) {
        keyboardEntryRef.current = null;
        if (!numbers.includes(value)) return;
        event.preventDefault();
        toggleCandidate(selectedCell.row, selectedCell.col, value);
        return;
      }

      const now = Date.now();
      const previousEntry = keyboardEntryRef.current;
      const canAppend = previousEntry !== null &&
        previousEntry.row === selectedCell.row &&
        previousEntry.col === selectedCell.col &&
        now - previousEntry.timestamp <= KEYBOARD_ENTRY_TIMEOUT_MS;
      const nextText = canAppend ? `${previousEntry.text}${value}` : String(value);
      const nextNumber = Number(nextText);
      const hasAllowedPrefix = numbers.some((number) => String(number).startsWith(nextText));

      if (hasAllowedPrefix) {
        event.preventDefault();
        keyboardEntryRef.current = {
          row: selectedCell.row,
          col: selectedCell.col,
          text: nextText,
          timestamp: now,
        };
        if (numbers.includes(nextNumber)) {
          setPositionValue(selectedCell.row, selectedCell.col, nextNumber);
        }
        return;
      }

      keyboardEntryRef.current = null;
      if (numbers.includes(value)) {
        event.preventDefault();
        keyboardEntryRef.current = {
          row: selectedCell.row,
          col: selectedCell.col,
          text: String(value),
          timestamp: now,
        };
        setPositionValue(selectedCell.row, selectedCell.col, value);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeCellInputMode, getOutsidePosition, numbers, selectedCell, selectedEditable, setPositionValue, toggleCandidate]);

  const handleCellPointerDown = (row: number, col: number, event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    keyboardEntryRef.current = null;
    safeSetPointerCapture(boardRef.current ?? event.currentTarget, event.pointerId);
    if (activeCellInputMode === 'cycle') {
      if (!isPositionEditable(row, col)) return;
      if (event.button !== 0 && event.button !== 2) return;

      cycleCellValue(row, col, event.button === 2 ? -1 : 1);
      setSelectedCell({ row, col });
      return;
    }

    if (isBlockedCell(row, col) || getFixedValue(row, col) !== null) {
      setSelectedCell(null);
      return;
    }

    setSelectedCell({ row, col });
  };

  const handleOutsidePointerDown = (
    side: NumberPlacementOutsideSide,
    index: number,
    event: PointerEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    keyboardEntryRef.current = null;
    safeSetPointerCapture(boardRef.current ?? event.currentTarget, event.pointerId);
    const { row, col } = getOutsideCoordinate(side, index);
    if (!isPositionEditable(row, col)) {
      setSelectedCell(null);
      return;
    }
    if (activeCellInputMode === 'cycle') {
      if (event.button !== 0 && event.button !== 2) return;
      cyclePositionValue(row, col, event.button === 2 ? -1 : 1);
      setSelectedCell({ row, col });
      return;
    }
    setSelectedCell({ row, col });
  };

  const boardWidthPx = width * cellSize;
  const boardHeightPx = height * cellSize;
  const outerWidth = boardWidthPx + outsideLeft + outsideRight + BOARD_PADDING * 2 + BOARD_BORDER * 2;
  const outerHeight = boardHeightPx + outsideTop + outsideBottom + BOARD_PADDING * 2 + BOARD_BORDER * 2;
  const renderOutsideCell = (side: NumberPlacementOutsideSide, index: number) => {
    if (!outsideInput?.[side]) return null;
    const coordinate = getOutsideCoordinate(side, index);
    const value = getOutsideValue(side, index);
    const fixedValue = getOutsideFixedValue(side, index);
    const editable = fixedValue === null;
    const selected = activeCellInputMode !== 'cycle' &&
      selectedCell?.row === coordinate.row && selectedCell?.col === coordinate.col;
    const level = normalizedSnapshot.outsideLevels?.[side]?.[index] ?? 0;
    const trialColors = getTrialLevelColors(level);
    const tone = outsideInput.getCellTone?.(side, index, value) ??
      (fixedValue !== null ? 'prefilled' : 'cell');
    const colors = getBoardCellStyle(cellSize, tone);
    const widthPx = side === 'left' || side === 'right' ? outsideClueLayout.clueSize : cellSize;
    const heightPx = side === 'top' || side === 'bottom' ? outsideClueLayout.clueSize : cellSize;
    const position = side === 'top'
      ? { left: gridLeft + index * cellSize, top: BOARD_PADDING }
      : side === 'bottom'
        ? { left: gridLeft + index * cellSize, top: gridTop + boardHeightPx }
        : side === 'left'
          ? { left: BOARD_PADDING, top: gridTop + index * cellSize }
          : { left: gridLeft + boardWidthPx, top: gridTop + index * cellSize };

    return (
      <div
        key={`outside-${side}-${index}`}
        onPointerDown={(event) => handleOutsidePointerDown(side, index, event)}
        className={boardClassNames.touchCellContent}
        style={{
          ...getBoardCellStyle(cellSize, tone, { editable, selected, cursor: editable ? 'pointer' : 'default' }),
          position: 'absolute',
          left: `${position.left}px`,
          top: `${position.top}px`,
          width: `${widthPx}px`,
          height: `${heightPx}px`,
          ...(editable ? (trialColors ? getBoardTrialCellStyle(trialColors, 'soft') : { background: colors.background }) : undefined),
          ...getBoardInkStyle(trialColors?.text ?? colors.color),
          ...getBoardTextStyle(cellSize, 0.58, 15),
        }}
      >
        {tone === 'outlined' ? <BoardCellOutline cellSize={cellSize} /> : null}
        {renderCellValue?.(value, cellSize, coordinate.row, coordinate.col) ?? value}
      </div>
    );
  };

  const renderOutsideClue = (
    value: number | null | undefined,
    left: number,
    top: number,
    key: string,
    availableWidth: number,
  ) => (
    value === null || value === undefined ? null : (
      <span
        key={key}
        className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-center tabular-nums"
        style={{
          left: `${left}px`,
          top: `${top}px`,
          ...getBoardOutsideClueTextStyle(cellSize, availableWidth, value),
        }}
      >
        {value}
      </span>
    )
  );

  return (
    <div ref={containerRef} className="flex w-full min-w-0 max-w-full flex-col items-center gap-3">
      <div className="w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain pb-1">
        <div className="flex w-full min-w-0 justify-center">
          <div
            ref={boardRef}
            className="relative select-none touch-none"
            style={{
              width: `${outerWidth}px`,
              height: `${outerHeight}px`,
              ...getBoardFrameStyle(BOARD_BORDER),
              maxWidth: 'none',
            }}
            onContextMenu={(event) => event.preventDefault()}
          >
        <div
          className="absolute grid"
          style={getBoardGridStyle(gridLeft, gridTop, width, cellSize)}
        >
          {grid.flatMap((rowValues, row) =>
            rowValues.map((value, col) => {
              const key = getCellKey(row, col);
              const fixedValue = getFixedValue(row, col);
              const blocked = isBlockedCell(row, col);
              const editable = !blocked && fixedValue === null;
              const selected = activeCellInputMode !== 'cycle' && selectedCell?.row === row && selectedCell?.col === col;
              const trialColors = getTrialLevelColors(levels[row][col]);
              const tone = getCellTone?.(row, col, value) ?? (
                blocked ? 'shaded' : fixedValue !== null ? 'prefilled' : 'cell'
              );
              const trialStyle = trialColors
                ? getBoardTrialCellStyle(trialColors, 'soft')
                : undefined;

              return (
                <div
                  key={key}
                  onPointerDown={(event) => handleCellPointerDown(row, col, event)}
                  className={boardClassNames.touchCellContent}
                  style={{
                    ...getBoardCellStyle(cellSize, tone, {
                      editable,
                      selected,
                      cursor: editable ? 'pointer' : 'default',
                    }),
                    ...(editable ? trialStyle : undefined),
                    color: tone === 'outlined' || blocked
                      ? woodBoardTheme.darkCellText
                      : trialColors?.text ?? woodBoardTheme.border,
                    ...getBoardTextStyle(cellSize),
                  }}
                >
                  {tone === 'outlined' ? <BoardCellOutline cellSize={cellSize} /> : null}
                  {blocked
                    ? renderBlockedCell?.(row, col, cellSize)
                    : candidates[row][col].length > 0
                      ? (
                        <span style={getBoardInkStyle(trialColors?.text ?? woodBoardTheme.border)}>
                          {renderCandidates?.(candidates[row][col], cellSize, row, col) ?? candidates[row][col].join(' ')}
                        </span>
                      )
                      : renderCellValue?.(value, cellSize, row, col) ?? value}
                </div>
              );
            })
          )}
        </div>
        {hasOutsideInput ? (
          <>
            {Array.from({ length: width }, (_, index) => renderOutsideCell('top', index))}
            {Array.from({ length: width }, (_, index) => renderOutsideCell('bottom', index))}
            {Array.from({ length: height }, (_, index) => renderOutsideCell('left', index))}
            {Array.from({ length: height }, (_, index) => renderOutsideCell('right', index))}
          </>
        ) : null}
        {renderOverlay ? (
          <div
            className="pointer-events-none absolute"
            style={{
              left: `${gridLeft}px`,
              top: `${gridTop}px`,
              width: `${boardWidthPx}px`,
              height: `${boardHeightPx}px`,
            }}
          >
            {renderOverlay(cellSize, boardWidthPx, boardHeightPx)}
          </div>
        ) : null}
        {resolvedOutsideClues && !hasOutsideInput ? (
          <div className="pointer-events-none absolute inset-0">
            {resolvedOutsideClues.top?.map((value, col) =>
              renderOutsideClue(
                value,
                gridLeft + (col + 0.5) * cellSize,
                BOARD_PADDING + outsideTop / 2,
                `top-${col}`,
                cellSize,
              )
            )}
            {resolvedOutsideClues.bottom?.map((value, col) =>
              renderOutsideClue(
                value,
                gridLeft + (col + 0.5) * cellSize,
                gridTop + boardHeightPx + outsideBottom / 2,
                `bottom-${col}`,
                cellSize,
              )
            )}
            {resolvedOutsideClues.left?.map((value, row) =>
              renderOutsideClue(
                value,
                BOARD_PADDING + outsideLeft / 2,
                gridTop + (row + 0.5) * cellSize,
                `left-${row}`,
                outsideClueLayout.clueSize,
              )
            )}
            {resolvedOutsideClues.right?.map((value, row) =>
              renderOutsideClue(
                value,
                gridLeft + boardWidthPx + outsideRight / 2,
                gridTop + (row + 0.5) * cellSize,
                `right-${row}`,
                outsideClueLayout.clueSize,
              )
            )}
          </div>
        ) : null}
          </div>
        </div>
      </div>

      {inputModeOptions && inputModeOptions.length > 0 ? (
        <div className="flex flex-wrap justify-center gap-2">
          {inputModeOptions.map((option) => (
            <Button
              key={option.mode}
              variant={activeCellInputMode === option.mode ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setActiveCellInputMode(option.mode);
                setSelectedCell(null);
                keyboardEntryRef.current = null;
              }}
            >
              {option.label}
            </Button>
          ))}
        </div>
      ) : null}

      {showValueButtons ? (
        <div className="flex flex-wrap justify-center gap-2">
          {numbers.map((number) => (
            <Button
              key={number}
              variant={
                activeCellInputMode === 'candidates' &&
                selectedCell !== null &&
                getOutsidePosition(selectedCell.row, selectedCell.col) === null &&
                candidates[selectedCell.row][selectedCell.col].includes(number)
                  ? 'default'
                  : 'outline'
              }
              size="sm"
              disabled={
                !selectedEditable ||
                (activeCellInputMode === 'candidates' &&
                  selectedCell !== null &&
                  (getOutsidePosition(selectedCell.row, selectedCell.col) !== null ||
                    (grid[selectedCell.row][selectedCell.col] !== null &&
                      candidates[selectedCell.row][selectedCell.col].length === 0)))
              }
              onClick={() => {
                if (!selectedCell) return;
                if (activeCellInputMode === 'candidates' && getOutsidePosition(selectedCell.row, selectedCell.col) === null) {
                  toggleCandidate(selectedCell.row, selectedCell.col, number);
                } else {
                  setPositionValue(selectedCell.row, selectedCell.col, number);
                }
              }}
              className="min-w-10 tabular-nums"
            >
              {number}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            disabled={!selectedEditable}
            onClick={() => selectedCell && setPositionValue(selectedCell.row, selectedCell.col, null)}
          >
            {copy.shared.clearCell}
          </Button>
        </div>
      ) : null}

      <PuzzleAssistToolbar
        canUndo={canUndo}
        canRedo={canRedo}
        trialActive={trialActive}
        trialCheckpointCount={trialCheckpointCount}
        canUndoTrialCheckpoint={canUndoTrialCheckpoint}
        onUndo={undo}
        onRedo={redo}
        onAddTrialCheckpoint={addTrialCheckpoint}
        onUndoTrialCheckpoint={undoTrialCheckpoint}
        onStartTrial={startTrial}
        onDiscardTrial={discardTrial}
        onCommitTrial={commitTrial}
      />

      {showValidationMessage ? <ValidationMessage message={visibleValidation?.message} /> : null}
    </div>
  );
}
