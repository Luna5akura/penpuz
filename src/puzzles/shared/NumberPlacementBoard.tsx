import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import PuzzleAssistToolbar from '@/components/PuzzleAssistToolbar';
import { Button } from '@/components/ui/button';
import { usePuzzleHistory } from '@/hooks/usePuzzleHistory';
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

interface NumberPlacementSnapshot {
  grid: (number | null)[][];
  levels: number[][];
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
  getCellTone?: (row: number, col: number, value: number | null) => BoardCellTone;
  initialSnapshot?: unknown;
  onSnapshotChange?: (snapshot: unknown) => void;
  fixedCellSize?: number;
  showValidationMessage?: boolean;
}

const BOARD_PADDING = commonBoardChrome.padding;
const BOARD_BORDER = commonBoardChrome.border;

function createEmptyNumberGrid(width: number, height: number): (number | null)[][] {
  return Array.from({ length: height }, () => Array(width).fill(null));
}

function normalizeNumberPlacementSnapshot(
  snapshot: unknown,
  width: number,
  height: number,
  numbers: number[],
  getFixedValue: (row: number, col: number) => number | null,
  isBlockedCell: (row: number, col: number) => boolean
): NumberPlacementSnapshot {
  const numberSet = new Set(numbers);
  const fallback = {
    grid: createEmptyNumberGrid(width, height),
    levels: Array.from({ length: height }, () => Array(width).fill(0)),
  };
  const source = snapshot as Partial<NumberPlacementSnapshot> | null | undefined;
  const grid = sanitizeMatrix(source?.grid, fallback.grid, (value) =>
    value === null || numberSet.has(value as number) ? (value as number | null) : null
  );
  const levels = sanitizeMatrix(source?.levels, fallback.levels, (value, fallbackCell) =>
    typeof value === 'number' && Number.isFinite(value) ? value : fallbackCell
  );

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      if (isBlockedCell(row, col)) {
        grid[row][col] = null;
        levels[row][col] = 0;
        continue;
      }

      const fixedValue = getFixedValue(row, col);
      if (fixedValue !== null) {
        grid[row][col] = fixedValue;
        levels[row][col] = 0;
      }
    }
  }

  return { grid, levels };
}

export default function NumberPlacementBoard<TPuzzle extends { width: number; height: number }>({
  puzzle,
  numbers,
  startTime,
  resetToken,
  onComplete,
  validate,
  getFixedValue = () => null,
  isBlockedCell = () => false,
  renderBlockedCell,
  getCellTone,
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
  const boardRef = useRef<HTMLDivElement>(null);
  const hasCompleted = useRef(false);

  const createInitialSnapshot = useCallback<() => NumberPlacementSnapshot>(
    () => normalizeNumberPlacementSnapshot(null, width, height, numbers, getFixedValue, isBlockedCell),
    [getFixedValue, height, isBlockedCell, numbers, width]
  );
  const getResetSnapshot = useCallback(
    () => normalizeNumberPlacementSnapshot(initialSnapshot, width, height, numbers, getFixedValue, isBlockedCell),
    [getFixedValue, height, initialSnapshot, isBlockedCell, numbers, width]
  );

  const history = usePuzzleHistory<NumberPlacementSnapshot>(createInitialSnapshot(), {
    normalizeTrialSnapshot: (trialSnapshot) => ({
      ...normalizeNumberPlacementSnapshot(trialSnapshot, width, height, numbers, getFixedValue, isBlockedCell),
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
    () => normalizeNumberPlacementSnapshot(snapshot, width, height, numbers, getFixedValue, isBlockedCell),
    [getFixedValue, height, isBlockedCell, numbers, snapshot, width]
  );
  const grid = normalizedSnapshot.grid;
  const levels = normalizedSnapshot.levels;
  const validation = useMemo(() => validate(grid, puzzle), [grid, puzzle, validate]);
  const visibleValidation = showValidationMessage ? validation : null;
  const cellSize = useMemo(
    () => getResponsiveCellSize({ fixedCellSize, viewportWidth, width }),
    [fixedCellSize, viewportWidth, width]
  );
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
    resetBoard();
  }, [puzzle, resetBoard, resetToken]);

  useEffect(() => {
    if (!validation.valid || hasCompleted.current) return;
    hasCompleted.current = true;
    onComplete(Math.floor((Date.now() - startTime) / 1000));
  }, [onComplete, startTime, validation.valid]);

  const setCellValue = useCallback((row: number, col: number, value: number | null) => {
    if (isBlockedCell(row, col) || getFixedValue(row, col) !== null) return;

    applyChange((currentSnapshot) => {
      const current = normalizeNumberPlacementSnapshot(
        currentSnapshot,
        width,
        height,
        numbers,
        getFixedValue,
        isBlockedCell
      );
      if (current.grid[row][col] === value) return current;

      const nextGrid = current.grid.map((rowValues) => [...rowValues]);
      const nextLevels = current.levels.map((rowValues) => [...rowValues]);
      nextGrid[row][col] = value;
      nextLevels[row][col] = value === null ? 0 : trialActive ? currentTrialLevel : 0;
      return { grid: nextGrid, levels: nextLevels };
    });
  }, [applyChange, currentTrialLevel, getFixedValue, height, isBlockedCell, numbers, trialActive, width]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!selectedEditable || event.altKey || event.ctrlKey || event.metaKey) return;

      if (event.key === 'Backspace' || event.key === 'Delete' || event.key === '0') {
        event.preventDefault();
        setCellValue(selectedCell.row, selectedCell.col, null);
        return;
      }

      const value = Number(event.key);
      if (numbers.includes(value)) {
        event.preventDefault();
        setCellValue(selectedCell.row, selectedCell.col, value);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [numbers, selectedCell, selectedEditable, setCellValue]);

  const handleCellPointerDown = (row: number, col: number, event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    safeSetPointerCapture(boardRef.current ?? event.currentTarget, event.pointerId);
    if (isBlockedCell(row, col) || getFixedValue(row, col) !== null) {
      setSelectedCell(null);
      return;
    }

    setSelectedCell({ row, col });
  };

  const boardWidthPx = width * cellSize;
  const boardHeightPx = height * cellSize;
  const outerWidth = boardWidthPx + BOARD_PADDING * 2 + BOARD_BORDER * 2;
  const outerHeight = boardHeightPx + BOARD_PADDING * 2 + BOARD_BORDER * 2;
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
            left: `${BOARD_PADDING}px`,
            top: `${BOARD_PADDING}px`,
            gridTemplateColumns: `repeat(${width}, ${cellSize}px)`,
          }}
        >
          {grid.flatMap((rowValues, row) =>
            rowValues.map((value, col) => {
              const key = getCellKey(row, col);
              const fixedValue = getFixedValue(row, col);
              const blocked = isBlockedCell(row, col);
              const editable = !blocked && fixedValue === null;
              const selected = selectedCell?.row === row && selectedCell?.col === col;
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
                  {blocked ? renderBlockedCell?.(row, col, cellSize) : value}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {numbers.map((number) => (
          <Button
            key={number}
            variant="outline"
            size="sm"
            disabled={!selectedEditable}
            onClick={() => selectedCell && setCellValue(selectedCell.row, selectedCell.col, number)}
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
