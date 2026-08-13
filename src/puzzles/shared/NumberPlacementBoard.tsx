import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import PuzzleAssistToolbar from '@/components/PuzzleAssistToolbar';
import { Button } from '@/components/ui/button';
import { usePuzzleHistory } from '@/hooks/usePuzzleHistory';
import { getKeyboardDigit, isKeyboardInputTarget } from '@/lib/keyboard';
import { safeSetPointerCapture } from '@/lib/pointer';
import { sanitizeMatrix } from '../snapshotGuards';
import { getTrialLevelColors } from '../trialStyles';
import type { CellCoord } from '../gridUtils';
import { getCellKey } from '../gridUtils';
import {
  boardClassNames,
  commonBoardChrome,
  getBoardCellColors,
  getBoardFrameStyle,
  getBoardTextStyle,
  getCellDividerStyle,
  getResponsiveCellSize,
  woodBoardTheme,
  type BoardCellTone,
} from '../boardTheme';

export interface NumberPlacementValidationResult {
  valid: boolean;
  message?: string;
  badCells: CellCoord[];
}

export type NumberPlacementCellValue = number | 'circle' | 'cross' | null;
export type NumberPlacementInputMode = 'select' | 'cycle' | 'candidates';

export interface NumberPlacementOutsideClues {
  top?: (number | null)[];
  bottom?: (number | null)[];
  left?: (number | null)[];
  right?: (number | null)[];
}

interface NumberPlacementSnapshot {
  grid: NumberPlacementCellValue[][];
  levels: number[][];
  candidates: number[][][];
}

interface NumberPlacementBoardProps<TPuzzle extends { width: number; height: number }> {
  puzzle: TPuzzle;
  numbers: number[];
  startTime: number;
  resetToken: number;
  onComplete: (time: number) => void;
  validate: (grid: (number | null)[][], puzzle: TPuzzle) => NumberPlacementValidationResult;
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
  outsideClues?: NumberPlacementOutsideClues;
  initialSnapshot?: unknown;
  onSnapshotChange?: (snapshot: unknown) => void;
  fixedCellSize?: number;
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

function normalizeNumberPlacementSnapshot(
  snapshot: unknown,
  width: number,
  height: number,
  numbers: number[],
  getFixedValue: (row: number, col: number) => number | null,
  isBlockedCell: (row: number, col: number) => boolean,
  extraCellValues: Array<Exclude<NumberPlacementCellValue, number | null>>
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

  return { grid, levels, candidates };
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
  initialSnapshot,
  onSnapshotChange,
  fixedCellSize,
  showValidationMessage = false,
}: NumberPlacementBoardProps<TPuzzle>) {
  const { width, height } = puzzle;
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === 'undefined' ? 1024 : window.innerWidth
  );
  const [selectedCell, setSelectedCell] = useState<CellCoord | null>(null);
  const [activeCellInputMode, setActiveCellInputMode] = useState<NumberPlacementInputMode>(cellInputMode);
  const boardRef = useRef<HTMLDivElement>(null);
  const keyboardEntryRef = useRef<{ row: number; col: number; text: string; timestamp: number } | null>(null);
  const hasCompleted = useRef(false);
  const resetBoardRef = useRef<() => void>(() => {});
  const initialSnapshotRef = useRef(initialSnapshot);

  useEffect(() => {
    initialSnapshotRef.current = initialSnapshot;
  }, [initialSnapshot]);

  const createInitialSnapshot = useCallback<() => NumberPlacementSnapshot>(
    () => normalizeNumberPlacementSnapshot(null, width, height, numbers, getFixedValue, isBlockedCell, extraCellValues),
    [extraCellValues, getFixedValue, height, isBlockedCell, numbers, width]
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
        extraCellValues
      ),
    [extraCellValues, getFixedValue, height, isBlockedCell, numbers, width]
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
        extraCellValues
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
    () => normalizeNumberPlacementSnapshot(snapshot, width, height, numbers, getFixedValue, isBlockedCell, extraCellValues),
    [extraCellValues, getFixedValue, height, isBlockedCell, numbers, snapshot, width]
  );
  const grid = normalizedSnapshot.grid;
  const levels = normalizedSnapshot.levels;
  const candidates = normalizedSnapshot.candidates;
  const validationGrid = useMemo(
    () => grid.map((rowValues) => rowValues.map((value) => (typeof value === 'number' ? value : null))),
    [grid]
  );
  const validation = useMemo(() => validate(validationGrid, puzzle), [puzzle, validate, validationGrid]);
  const visibleValidation = showValidationMessage ? validation : null;
  const cellSize = useMemo(
    () => getResponsiveCellSize({ fixedCellSize, viewportWidth, width }),
    [fixedCellSize, viewportWidth, width]
  );
  const outsideClueSize = outsideClues ? Math.max(24, Math.floor(cellSize * 0.62)) : 0;
  const outsideLeft = outsideClues?.left ? outsideClueSize : 0;
  const outsideRight = outsideClues?.right ? outsideClueSize : 0;
  const outsideTop = outsideClues?.top ? outsideClueSize : 0;
  const outsideBottom = outsideClues?.bottom ? outsideClueSize : 0;
  const gridLeft = BOARD_PADDING + outsideLeft;
  const gridTop = BOARD_PADDING + outsideTop;
  const selectedEditable = !!selectedCell && !isBlockedCell(selectedCell.row, selectedCell.col) &&
    getFixedValue(selectedCell.row, selectedCell.col) === null;

  useEffect(() => {
    const updateSize = () => setViewportWidth(window.innerWidth);
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

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
        extraCellValues
      );
      if (current.grid[row][col] === value) return current;

      const nextGrid = current.grid.map((rowValues) => [...rowValues]);
      const nextLevels = current.levels.map((rowValues) => [...rowValues]);
      const nextCandidates = current.candidates.map((rowValues) => rowValues.map((values) => [...values]));
      nextGrid[row][col] = value;
      nextLevels[row][col] = value === null ? 0 : trialActive ? currentTrialLevel : 0;
      nextCandidates[row][col] = [];
      if (current.grid[row][col] === value && current.candidates[row][col].length === 0) return current;
      return { grid: nextGrid, levels: nextLevels, candidates: nextCandidates };
    });
  }, [applyChange, currentTrialLevel, extraCellValues, getFixedValue, height, isBlockedCell, numbers, trialActive, width]);

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
        extraCellValues
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
        extraCellValues
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
      return { grid: nextGrid, levels: nextLevels, candidates: nextCandidates };
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
    trialActive,
    width,
  ]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isKeyboardInputTarget(event.target)) return;
      if (!selectedEditable || event.altKey || event.ctrlKey || event.metaKey) return;

      const value = getKeyboardDigit(event);
      if (event.key === 'Backspace' || event.key === 'Delete' || value === 0) {
        event.preventDefault();
        keyboardEntryRef.current = null;
        setCellValue(selectedCell.row, selectedCell.col, null);
        return;
      }

      if (value === null) return;

      if (activeCellInputMode === 'candidates') {
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
          setCellValue(selectedCell.row, selectedCell.col, nextNumber);
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
        setCellValue(selectedCell.row, selectedCell.col, value);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeCellInputMode, numbers, selectedCell, selectedEditable, setCellValue, toggleCandidate]);

  const handleCellPointerDown = (row: number, col: number, event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    keyboardEntryRef.current = null;
    safeSetPointerCapture(boardRef.current ?? event.currentTarget, event.pointerId);
    if (activeCellInputMode === 'cycle') {
      if (isBlockedCell(row, col) || getFixedValue(row, col) !== null) return;
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

  const boardWidthPx = width * cellSize;
  const boardHeightPx = height * cellSize;
  const outerWidth = boardWidthPx + outsideLeft + outsideRight + BOARD_PADDING * 2 + BOARD_BORDER * 2;
  const outerHeight = boardHeightPx + outsideTop + outsideBottom + BOARD_PADDING * 2 + BOARD_BORDER * 2;
  const outsideClueTextStyle = getBoardTextStyle(cellSize, 0.48, 14);

  const renderOutsideClue = (
    value: number | null | undefined,
    left: number,
    top: number,
    key: string
  ) => (
    value === null || value === undefined ? null : (
      <span
        key={key}
        className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-center tabular-nums"
        style={{
          left: `${left}px`,
          top: `${top}px`,
          color: woodBoardTheme.border,
          ...outsideClueTextStyle,
        }}
      >
        {value}
      </span>
    )
  );

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={boardRef}
        className="relative select-none touch-none"
        style={{
          width: `${outerWidth}px`,
          height: `${outerHeight}px`,
          ...getBoardFrameStyle(BOARD_BORDER),
        }}
        onContextMenu={(event) => event.preventDefault()}
      >
        <div
          className="absolute grid"
          style={{
            left: `${gridLeft}px`,
            top: `${gridTop}px`,
            gridTemplateColumns: `repeat(${width}, ${cellSize}px)`,
          }}
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
              const baseStyle = getBoardCellColors(tone);
              const trialStyle = trialColors
                ? { background: trialColors.softFill, color: trialColors.text }
                : undefined;

              return (
                <div
                  key={key}
                  onPointerDown={(event) => handleCellPointerDown(row, col, event)}
                  className={boardClassNames.touchCellContent}
                  style={{
                    width: `${cellSize}px`,
                    height: `${cellSize}px`,
                    ...baseStyle,
                    ...getCellDividerStyle(),
                    ...(editable ? trialStyle : undefined),
                    color: blocked ? woodBoardTheme.shadedText : trialColors?.text ?? woodBoardTheme.border,
                    cursor: editable ? 'pointer' : 'default',
                    ...getBoardTextStyle(cellSize),
                    outline: selected ? `3px solid ${woodBoardTheme.accentBorder}` : undefined,
                    outlineOffset: selected ? '-4px' : undefined,
                  }}
                >
                  {blocked
                    ? renderBlockedCell?.(row, col, cellSize)
                    : candidates[row][col].length > 0
                      ? (
                        <span style={{ color: trialColors?.text ?? woodBoardTheme.border }}>
                          {renderCandidates?.(candidates[row][col], cellSize, row, col) ?? candidates[row][col].join(' ')}
                        </span>
                      )
                      : renderCellValue?.(value, cellSize, row, col) ?? value}
                </div>
              );
            })
          )}
        </div>
        {outsideClues ? (
          <div className="pointer-events-none absolute inset-0">
            {outsideClues.top?.map((value, col) =>
              renderOutsideClue(
                value,
                gridLeft + (col + 0.5) * cellSize,
                BOARD_PADDING + outsideTop / 2,
                `top-${col}`
              )
            )}
            {outsideClues.bottom?.map((value, col) =>
              renderOutsideClue(
                value,
                gridLeft + (col + 0.5) * cellSize,
                gridTop + boardHeightPx + outsideBottom / 2,
                `bottom-${col}`
              )
            )}
            {outsideClues.left?.map((value, row) =>
              renderOutsideClue(
                value,
                BOARD_PADDING + outsideLeft / 2,
                gridTop + (row + 0.5) * cellSize,
                `left-${row}`
              )
            )}
            {outsideClues.right?.map((value, row) =>
              renderOutsideClue(
                value,
                gridLeft + boardWidthPx + outsideRight / 2,
                gridTop + (row + 0.5) * cellSize,
                `right-${row}`
              )
            )}
          </div>
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
                candidates[selectedCell.row][selectedCell.col].includes(number)
                  ? 'default'
                  : 'outline'
              }
              size="sm"
              disabled={
                !selectedEditable ||
                (activeCellInputMode === 'candidates' &&
                  selectedCell !== null &&
                  grid[selectedCell.row][selectedCell.col] !== null &&
                  candidates[selectedCell.row][selectedCell.col].length === 0)
              }
              onClick={() => {
                if (!selectedCell) return;
                if (activeCellInputMode === 'candidates') {
                  toggleCandidate(selectedCell.row, selectedCell.col, number);
                } else {
                  setCellValue(selectedCell.row, selectedCell.col, number);
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
            onClick={() => selectedCell && setCellValue(selectedCell.row, selectedCell.col, null)}
          >
            清空
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

      {showValidationMessage && visibleValidation?.message ? (
        <div className="text-center text-sm text-muted-foreground dark:text-gray-400">
          {visibleValidation.message}
        </div>
      ) : null}
    </div>
  );
}
