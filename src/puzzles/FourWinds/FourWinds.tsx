import { useCallback, useEffect, useMemo, useRef, type PointerEvent } from 'react';
import PuzzleAssistToolbar from '@/components/PuzzleAssistToolbar';
import ValidationMessage from '@/components/ValidationMessage';
import { usePuzzleHistory } from '@/hooks/usePuzzleHistory';
import { LONG_PRESS_MS, LONG_PRESS_MOVE_TOLERANCE, safeSetPointerCapture, triggerHapticFeedback } from '@/lib/pointer';
import { sanitizeMatrix } from '../snapshotGuards';
import { getTrialLevelColors } from '../trialStyles';
import { useBoardContainerWidth } from '../useBoardContainerWidth';
import type { FourWindsCellValue, FourWindsDirection, FourWindsPuzzleData } from '../types';
import {
  boardClassNames,
  commonBoardChrome,
  getBoardCellStyle,
  getBoardClueTextStyle,
  getBoardFrameDimensions,
  getBoardFrameStyle,
  getBoardGridStyle,
  getBoardSatisfiedClueTextStyle,
  getBoardTextStyle,
  getBoardTrialCellStyle,
  getResponsiveCellSize,
} from '../boardTheme';
import FourWindsMark from './FourWindsVisuals';
import { getSatisfiedFourWindsClues, validateFourWinds } from './utils';

interface Props {
  puzzle: FourWindsPuzzleData;
  startTime: number;
  resetToken: number;
  onComplete: (time: number) => void;
  initialSnapshot?: unknown;
  onSnapshotChange?: (snapshot: unknown) => void;
  fixedCellSize?: number;
  showValidationMessage?: boolean;
}

interface FourWindsSnapshot {
  grid: FourWindsCellValue[][];
  levels: number[][];
}

type CellCoord = { row: number; col: number };
type PointerButton = 0 | 2;

interface PointerState {
  pointerId: number | null;
  button: PointerButton | null;
  startCell: CellCoord | null;
  lastCell: CellCoord | null;
  lastArrowTarget: CellCoord | null;
  moved: boolean;
}

const BOARD_PADDING = commonBoardChrome.padding;
const BOARD_BORDER = commonBoardChrome.border;
const FOUR_WINDS_VALUES = new Set([1, 2, 3, 4]);

function emptyGrid(width: number, height: number): FourWindsCellValue[][] {
  return Array.from({ length: height }, () => Array<FourWindsCellValue>(width).fill(null));
}

function normalizeFourWindsSnapshot(snapshot: unknown, width: number, height: number): FourWindsSnapshot {
  const fallbackGrid = emptyGrid(width, height);
  const source = snapshot as Partial<FourWindsSnapshot> | null | undefined;
  const grid = sanitizeMatrix(source?.grid, fallbackGrid, (value) => {
    if (value === 'cross') return 'cross';
    return typeof value === 'number' && Number.isInteger(value) && FOUR_WINDS_VALUES.has(value)
      ? value as FourWindsDirection
      : null;
  });
  const levels = sanitizeMatrix(
    source?.levels,
    Array.from({ length: height }, () => Array(width).fill(0)),
    (value, fallbackCell) => typeof value === 'number' && Number.isFinite(value) ? value : fallbackCell
  );

  return { grid, levels };
}

function sameCell(a: CellCoord | null, b: CellCoord | null) {
  return a !== null && b !== null && a.row === b.row && a.col === b.col;
}

function getBoardPoint(clientX: number, clientY: number, rect: DOMRect) {
  return {
    x: clientX - rect.left - BOARD_BORDER - BOARD_PADDING,
    y: clientY - rect.top - BOARD_BORDER - BOARD_PADDING,
  };
}

function getCellAtPoint(x: number, y: number, width: number, height: number, cellSize: number): CellCoord | null {
  if (x < 0 || y < 0 || x >= width * cellSize || y >= height * cellSize) return null;
  return { row: Math.floor(y / cellSize), col: Math.floor(x / cellSize) };
}

function getArrowDirection(from: CellCoord, to: CellCoord): FourWindsDirection | null {
  if (from.row === to.row) {
    if (to.col > from.col) return 2;
    if (to.col < from.col) return 4;
  }
  if (from.col === to.col) {
    if (to.row > from.row) return 3;
    if (to.row < from.row) return 1;
  }
  return null;
}

function resetPointerState(): PointerState {
  return {
    pointerId: null,
    button: null,
    startCell: null,
    lastCell: null,
    lastArrowTarget: null,
    moved: false,
  };
}

export default function FourWindsBoard({
  puzzle,
  startTime,
  resetToken,
  onComplete,
  initialSnapshot,
  onSnapshotChange,
  fixedCellSize,
  showValidationMessage = false,
}: Props) {
  const { width, height } = puzzle;
  const [containerRef, viewportWidth] = useBoardContainerWidth();
  const boardRef = useRef<HTMLDivElement>(null);
  const pointerState = useRef<PointerState>(resetPointerState());
  const pendingTouchRightClickRef = useRef<{ cell: CellCoord; startX: number; startY: number } | null>(null);
  const pendingTouchTimerRef = useRef<number | null>(null);
  const hasCompleted = useRef(false);
  // The parent persists every snapshot through `onSnapshotChange`. Keep the
  // latest value available for an explicit reset without making the reset
  // effect run again after every ordinary move (which would erase history).
  const initialSnapshotRef = useRef(initialSnapshot);
  useEffect(() => {
    initialSnapshotRef.current = initialSnapshot;
  }, [initialSnapshot]);
  const createInitialSnapshot = useCallback<() => FourWindsSnapshot>(() => ({
    grid: emptyGrid(width, height),
    levels: Array.from({ length: height }, () => Array(width).fill(0)),
  }), [height, width]);
  const getResetSnapshot = useCallback(
    () => {
      const normalized = normalizeFourWindsSnapshot(initialSnapshotRef.current, width, height);
      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          if (puzzle.clues[row][col] !== null) {
            normalized.grid[row][col] = null;
            normalized.levels[row][col] = 0;
          }
        }
      }
      return normalized;
    }, [height, puzzle.clues, width]
  );

  const history = usePuzzleHistory<FourWindsSnapshot>(createInitialSnapshot(), {
    normalizeTrialSnapshot: (trialSnapshot) => {
      const normalized = normalizeFourWindsSnapshot(trialSnapshot, width, height);
      normalized.levels = Array.from({ length: height }, () => Array(width).fill(0));
      return normalized;
    },
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
    startBatch,
    finishBatch,
  } = history;
  const normalizedSnapshot = useMemo(
    () => normalizeFourWindsSnapshot(snapshot, width, height),
    [height, snapshot, width]
  );
  const grid = normalizedSnapshot.grid;
  const validation = useMemo(
    () => validateFourWinds(grid, puzzle),
    [grid, puzzle]
  );
  const satisfiedClues = useMemo(
    () => getSatisfiedFourWindsClues(grid, puzzle),
    [grid, puzzle]
  );
  const cellSize = useMemo(
    () => getResponsiveCellSize({ fixedCellSize, viewportWidth, width, containerWidth: true }),
    [fixedCellSize, viewportWidth, width]
  );
  const { outerWidth, outerHeight } = getBoardFrameDimensions(width, height, cellSize, {
    borderWidth: BOARD_BORDER,
    padding: BOARD_PADDING,
  });
  const gridLeft = BOARD_PADDING;
  const gridTop = BOARD_PADDING;

  const resetBoard = useCallback(() => {
    reset(getResetSnapshot());
    pointerState.current = resetPointerState();
    hasCompleted.current = false;
  }, [getResetSnapshot, reset]);

  useEffect(() => {
    return () => {
      if (pendingTouchTimerRef.current !== null) window.clearTimeout(pendingTouchTimerRef.current);
    };
  }, []);

  useEffect(() => {
    resetBoard();
  }, [puzzle, resetBoard, resetToken]);

  useEffect(() => {
    if (!validation.valid || hasCompleted.current) return;
    hasCompleted.current = true;
    onComplete(Math.floor((Date.now() - startTime) / 1000));
  }, [onComplete, startTime, validation.valid]);

  const updateCell = useCallback((row: number, col: number, nextValue: FourWindsCellValue) => {
    if (puzzle.clues[row]?.[col] !== null) return;
    applyChange((currentSnapshot) => {
      const current = normalizeFourWindsSnapshot(currentSnapshot, width, height);
      if (current.grid[row][col] === nextValue) return current;
      const nextGrid = current.grid.map((rowValues) => [...rowValues]);
      const nextLevels = current.levels.map((rowValues) => [...rowValues]);
      nextGrid[row][col] = nextValue;
      nextLevels[row][col] = nextValue === null ? 0 : trialActive ? currentTrialLevel : 0;
      return { ...current, grid: nextGrid, levels: nextLevels };
    }, { coalesce: true });
  }, [applyChange, currentTrialLevel, height, puzzle.clues, trialActive, width]);

  const applyCellClick = useCallback((cell: CellCoord, button: PointerButton) => {
    if (puzzle.clues[cell.row]?.[cell.col] !== null) return;
    const currentValue = grid[cell.row]?.[cell.col] ?? null;
    // Left-click clears an existing arrow or auxiliary cross.
    if (button === 0) {
      if (currentValue !== null) updateCell(cell.row, cell.col, null);
      return;
    }
    // Right-click toggles the cross mark; arrows are cleared directly.
    if (typeof currentValue === 'number' && currentValue >= 1 && currentValue <= 4) {
      updateCell(cell.row, cell.col, null);
      return;
    }
    updateCell(cell.row, cell.col, currentValue === 'cross' ? null : 'cross');
  }, [grid, puzzle.clues, updateCell]);

  const placeArrow = useCallback((from: CellCoord, to: CellCoord) => {
    if (puzzle.clues[to.row]?.[to.col] !== null) return;
    const direction = getArrowDirection(from, to);
    if (direction === null) return;
    updateCell(to.row, to.col, direction);
  }, [puzzle.clues, updateCell]);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 && event.button !== 2) return;
    if (pointerState.current.pointerId !== null) return;
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const point = getBoardPoint(event.clientX, event.clientY, rect);
    const cell = getCellAtPoint(point.x, point.y, width, height, cellSize);
    if (!cell) return;
    event.preventDefault();
    safeSetPointerCapture(boardRef.current ?? event.currentTarget, event.pointerId);
    pointerState.current = {
      pointerId: event.pointerId,
      button: event.pointerType === 'touch' ? 0 : event.button,
      startCell: cell,
      lastCell: cell,
      lastArrowTarget: null,
      moved: false,
    };
    // The right button applies its action immediately on press; the drag
    // below then extends the same action over every cell it enters.
    if (event.button === 2) {
      applyCellClick(cell, 2);
    }
    startBatch();

    // Touch: a quick tap performs the left action on release, while a long
    // press triggers the right-button action in place.
    if (event.pointerType === 'touch') {
      pendingTouchRightClickRef.current = { cell, startX: event.clientX, startY: event.clientY };
      if (pendingTouchTimerRef.current !== null) window.clearTimeout(pendingTouchTimerRef.current);
      pendingTouchTimerRef.current = window.setTimeout(() => {
        const pending = pendingTouchRightClickRef.current;
        if (!pending) return;
        pendingTouchRightClickRef.current = null;
        pendingTouchTimerRef.current = null;
        pointerState.current.moved = true;
        triggerHapticFeedback();
        applyCellClick(pending.cell, 2);
      }, LONG_PRESS_MS);
    }
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const current = pointerState.current;
    if (current.pointerId !== event.pointerId) return;
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const point = getBoardPoint(event.clientX, event.clientY, rect);
    const cell = getCellAtPoint(point.x, point.y, width, height, cellSize);
    // Leaving the grid cancels a click gesture.  Without this, a tiny drag
    // into the frame padding could be mistaken for a click on the origin cell
    // when the pointer is released outside the board.
    if (!cell) {
      current.moved = true;
      current.lastCell = null;
      return;
    }
    const pending = pendingTouchRightClickRef.current;
    if (pending && (
      Math.abs(event.clientX - pending.startX) > LONG_PRESS_MOVE_TOLERANCE ||
      Math.abs(event.clientY - pending.startY) > LONG_PRESS_MOVE_TOLERANCE
    )) {
      pendingTouchRightClickRef.current = null;
      if (pendingTouchTimerRef.current !== null) {
        window.clearTimeout(pendingTouchTimerRef.current);
        pendingTouchTimerRef.current = null;
      }
    }

    if (!sameCell(current.startCell, cell)) {
      current.moved = true;

      if (current.button === 2) {
        // Batch modification: the right-button action is applied to every
        // newly entered cell while the button stays held down.
        if (current.lastCell && !sameCell(current.lastCell, cell)) {
          applyCellClick(cell, 2);
        }
      } else if (
        // A left drag is recognized as soon as it reaches a different cell on
        // the same row or column. Draw the arrow during the drag instead of
        // waiting for pointerup. Keep the target guard so a stream of
        // pointermove events over one cell does not enqueue duplicate
        // history updates.
        current.button === 0 &&
        current.startCell &&
        !sameCell(current.lastArrowTarget, cell) &&
        getArrowDirection(current.startCell, cell) !== null
      ) {
        placeArrow(current.startCell, cell);
        current.lastArrowTarget = cell;
      }
    }
    current.lastCell = cell;
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const current = pointerState.current;
    if (current.pointerId !== event.pointerId) return;
    if (pendingTouchTimerRef.current !== null) {
      window.clearTimeout(pendingTouchTimerRef.current);
      pendingTouchTimerRef.current = null;
    }
    pendingTouchRightClickRef.current = null;
    // The right button already applied its action on pointerdown; only the
    // left button treats a stationary press as a click.
    if (current.button === 0 && current.startCell && !current.moved) {
      applyCellClick(current.startCell, 0);
    }
    pointerState.current = resetPointerState();
    finishBatch();
  };

  const handlePointerCancel = (event: PointerEvent<HTMLDivElement>) => {
    const current = pointerState.current;
    if (current.pointerId !== event.pointerId) return;
    pointerState.current = resetPointerState();
    finishBatch();
  };

  return (
    <div ref={containerRef} className="flex w-full min-w-0 max-w-full flex-col items-center gap-3">
      <div className="w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain pb-1">
        <div className="flex w-full min-w-0 justify-center">
          <div
            ref={boardRef}
            className="relative select-none touch-none"
            style={{ width: `${outerWidth}px`, height: `${outerHeight}px`, ...getBoardFrameStyle(BOARD_BORDER), maxWidth: 'none' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onContextMenu={(event) => event.preventDefault()}
          >
            <div className="absolute grid" style={getBoardGridStyle(gridLeft, gridTop, width, cellSize)}>
              {grid.flatMap((rowValues, row) => rowValues.map((value, col) => {
                const clue = puzzle.clues[row][col];
                const trialColors = getTrialLevelColors(normalizedSnapshot.levels[row][col]);
                const tone = clue !== null ? 'clue' : value === 'cross' ? 'marked' : 'cell';
                return (
                  <div
                    key={`${row},${col}`}
                    className={boardClassNames.cellContent}
                    style={{
                      ...getBoardCellStyle(cellSize, tone),
                      ...(clue === null && value !== null && trialColors ? getBoardTrialCellStyle(trialColors, 'soft') : undefined),
                      ...getBoardTextStyle(cellSize),
                    }}
                  >
                    {clue !== null
                      ? <span className={boardClassNames.cellTextTight} style={satisfiedClues[row][col] ? getBoardSatisfiedClueTextStyle(cellSize) : getBoardClueTextStyle(cellSize)}>{clue}</span>
                      : value === null
                        ? null
                        : <FourWindsMark value={value} cellSize={cellSize} />}
                  </div>
                );
              }))}
            </div>
          </div>
        </div>
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

      {showValidationMessage ? <ValidationMessage message={validation.message} /> : null}
    </div>
  );
}
