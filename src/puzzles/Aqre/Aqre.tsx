import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useBoardContainerWidth } from '../useBoardContainerWidth';
import { usePuzzleHistory } from '@/hooks/usePuzzleHistory';
import PuzzleAssistToolbar from '@/components/PuzzleAssistToolbar';
import ValidationMessage from '@/components/ValidationMessage';
import { getTrialLevelColors } from '../trialStyles';
import type { AqrePuzzleData } from '../types';
import {
  boardClassNames,
  commonBoardChrome,
  getBoardCellStyle,
  getBoardBoundaryStrokeMetrics,
  getBoardFrameStyle,
  getBoardFrameDimensions,
  getBoardGridStyle,
  getBoardTextStyle,
  getBoardTrialCellStyle,
  getInvalidBoardCellColors,
  getResponsiveCellSize,
  woodBoardTheme,
} from '../boardTheme';
import {
  createEmptyAqreGrid,
  getAqreBoundarySegments,
  type AqreCellState,
  validateAqre,
} from './utils';
import { safeSetPointerCapture } from '@/lib/pointer';
import { sanitizeMatrix } from '../snapshotGuards';
import BoardCellMark from '../shared/BoardCellMark';

interface Props {
  puzzle: AqrePuzzleData;
  startTime: number;
  resetToken: number;
  onComplete: (time: number) => void;
  initialSnapshot?: unknown;
  onSnapshotChange?: (snapshot: unknown) => void;
  fixedCellSize?: number;
  showValidationMessage?: boolean;
}

type AqreSnapshot = {
  grid: AqreCellState[][];
  levels: number[][];
};

type DragMode =
  | 'add-shade'
  | 'remove-shade'
  | 'add-mark'
  | 'remove-mark'
  | 'clear-all'
  | null;

const BOARD_PADDING = commonBoardChrome.padding;
const BOARD_BORDER = commonBoardChrome.border;

function isValidAqreGrid(grid: unknown, width: number, height: number): grid is AqreCellState[][] {
  if (!Array.isArray(grid) || grid.length !== height) return false;
  return grid.every((row) =>
    Array.isArray(row) &&
    row.length === width &&
    row.every((cell) => cell === 0 || cell === 1 || cell === 2)
  );
}

function isValidAqreLevels(levels: unknown, width: number, height: number): levels is number[][] {
  if (!Array.isArray(levels) || levels.length !== height) return false;
  return levels.every((row) =>
    Array.isArray(row) &&
    row.length === width &&
    row.every((cell) => typeof cell === 'number' && Number.isFinite(cell))
  );
}

function sanitizeAqreSnapshot(
  snapshot: unknown,
  width: number,
  height: number,
  fallback: AqreSnapshot
): AqreSnapshot {
  return {
    grid: isValidAqreGrid((snapshot as Partial<AqreSnapshot> | null)?.grid, width, height)
      ? sanitizeMatrix((snapshot as Partial<AqreSnapshot>).grid, fallback.grid, (value) =>
        value === 0 || value === 1 || value === 2 ? value : 0
      )
      : fallback.grid.map((row) => [...row]),
    levels: isValidAqreLevels((snapshot as Partial<AqreSnapshot> | null)?.levels, width, height)
      ? sanitizeMatrix((snapshot as Partial<AqreSnapshot>).levels, fallback.levels, (value) =>
        typeof value === 'number' && Number.isFinite(value) ? value : 0
      )
      : fallback.levels.map((row) => [...row]),
  };
}

export default function AqreBoard({
  puzzle,
  startTime,
  resetToken,
  onComplete,
  initialSnapshot,
  onSnapshotChange,
  fixedCellSize,
  showValidationMessage = false,
}: Props) {
  const { width, height, clues, regionIds } = puzzle;
  const [containerRef, viewportWidth] = useBoardContainerWidth();
  const boardRef = useRef<HTMLDivElement>(null);
  const pointerState = useRef<{
    pointerId: number | null;
    pendingTap: { row: number; col: number } | null;
    dragMode: DragMode;
    activeMouseButton: 0 | 2 | null;
    lastCell: { row: number; col: number } | null;
  }>({
    pointerId: null,
    pendingTap: null,
    dragMode: null,
    activeMouseButton: null,
    lastCell: null,
  });
  const hasCompleted = useRef(false);

  const createInitialSnapshot = useCallback<() => AqreSnapshot>(() => ({
    grid: createEmptyAqreGrid(width, height),
    levels: Array.from({ length: height }, () => Array(width).fill(0)),
  }), [height, width]);
  const initialSnapshotRef = useRef(initialSnapshot);
  useEffect(() => {
    initialSnapshotRef.current = initialSnapshot;
  }, [initialSnapshot]);
  const getResetSnapshot = useCallback(() => {
    return sanitizeAqreSnapshot(initialSnapshotRef.current, width, height, createInitialSnapshot());
  }, [createInitialSnapshot, height, width]);

  const history = usePuzzleHistory<AqreSnapshot>(createInitialSnapshot(), {
    normalizeTrialSnapshot: (trialSnapshot) => ({
      ...trialSnapshot,
      levels: trialSnapshot.levels.map((row) => row.map(() => 0)),
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
    startBatch,
    finishBatch,
  } = history;

  const grid = snapshot.grid;
  const levels = snapshot.levels;
  const hasEdited = canUndo || canRedo || trialActive || trialCheckpointCount > 0;
  const isMobile = viewportWidth < 640;
  const validation = useMemo(
    () => (hasEdited ? validateAqre(grid, puzzle) : null),
    [grid, hasEdited, puzzle]
  );
  const invalidCellSet = useMemo(
    () => new Set((validation?.badCells ?? []).map((cell) => `${cell.r},${cell.c}`)),
    [validation]
  );
  const boundaries = useMemo(
    () => getAqreBoundarySegments(regionIds, width, height),
    [height, regionIds, width]
  );
  const clueMap = useMemo(
    () => new Map(clues.map((clue) => [`${clue.row},${clue.col}`, clue.value])),
    [clues]
  );

  const cellSize = useMemo(() => getResponsiveCellSize({
    fixedCellSize,
    viewportWidth,
    width,
    containerWidth: true,
  }), [fixedCellSize, viewportWidth, width]);

  const resetBoard = useCallback(() => {
    reset(getResetSnapshot());
    pointerState.current = {
      pointerId: null,
      pendingTap: null,
      dragMode: null,
      activeMouseButton: null,
      lastCell: null,
    };
    hasCompleted.current = false;
  }, [getResetSnapshot, reset]);

  useEffect(() => {
    resetBoard();
  }, [puzzle, resetBoard, resetToken]);

  useEffect(() => {
    if (!validation?.valid || hasCompleted.current) return;
    hasCompleted.current = true;
    onComplete(Math.floor((Date.now() - startTime) / 1000));
  }, [onComplete, startTime, validation]);

  const applyCellState = useCallback((row: number, col: number, mode: Exclude<DragMode, null>) => {
    applyChange((currentSnapshot) => {
      const currentState = currentSnapshot.grid[row][col];
      let nextState = currentState;

      if (mode === 'add-shade') {
        nextState = 1;
      } else if (mode === 'remove-shade') {
        if (currentState !== 1) return currentSnapshot;
        nextState = 0;
      } else if (mode === 'add-mark') {
        nextState = 2;
      } else if (mode === 'remove-mark') {
        if (currentState !== 2) return currentSnapshot;
        nextState = 0;
      } else if (mode === 'clear-all') {
        if (currentState === 0) return currentSnapshot;
        nextState = 0;
      }

      if (nextState === currentState) return currentSnapshot;

      const nextGrid = currentSnapshot.grid.map((currentRow) => [...currentRow]);
      const nextLevels = currentSnapshot.levels.map((currentRow) => [...currentRow]);
      nextGrid[row][col] = nextState;
      nextLevels[row][col] = nextState === 0 ? 0 : trialActive ? currentTrialLevel : 0;

      return {
        ...currentSnapshot,
        grid: nextGrid,
        levels: nextLevels,
      };
    }, { coalesce: true });
  }, [applyChange, currentTrialLevel, trialActive]);

  const applyDragToCell = useCallback((row: number, col: number) => {
    const current = pointerState.current;
    if (!current.dragMode) return;

    const sameCell = current.lastCell?.row === row && current.lastCell?.col === col;
    if (sameCell) return;

    if (current.pendingTap) {
      applyCellState(current.pendingTap.row, current.pendingTap.col, current.dragMode);
    }

    current.pendingTap = null;
    current.lastCell = { row, col };
    applyCellState(row, col, current.dragMode);
  }, [applyCellState]);

  const getBoardCell = useCallback((clientX: number, clientY: number) => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return null;

    const boardInset = BOARD_BORDER + BOARD_PADDING;
    const x = clientX - rect.left - boardInset;
    const y = clientY - rect.top - boardInset;
    if (x < 0 || y < 0) return null;

    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);
    if (row < 0 || row >= height || col < 0 || col >= width) return null;

    return { row, col };
  }, [cellSize, height, width]);

  const finishPointer = useCallback((pointerId?: number) => {
    const current = pointerState.current;
    if (current.pointerId === null) return;
    if (pointerId !== undefined && current.pointerId !== pointerId) return;

    if (current.pendingTap && current.dragMode) {
      applyCellState(current.pendingTap.row, current.pendingTap.col, current.dragMode);
    }

    pointerState.current = {
      pointerId: null,
      pendingTap: null,
      dragMode: null,
      activeMouseButton: null,
      lastCell: null,
    };
    finishBatch();
  }, [applyCellState, finishBatch]);

  const handleCellPointerDown = (row: number, col: number, event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerState.current.pointerId !== null) return;

    const currentState = grid[row][col];
    const isTouchPointer = event.pointerType === 'touch' || (event.button === 0 && isMobile);

    let nextDragMode: DragMode = null;
    if (isTouchPointer) {
      if (currentState === 0) nextDragMode = 'add-shade';
      else if (currentState === 1) nextDragMode = 'add-mark';
      else nextDragMode = 'clear-all';
    } else if (event.button === 0) {
      nextDragMode = currentState === 1 ? 'remove-shade' : 'add-shade';
    } else if (event.button === 2) {
      nextDragMode = currentState === 2 ? 'remove-mark' : 'add-mark';
    }

    if (!nextDragMode) return;

    event.preventDefault();
    safeSetPointerCapture(boardRef.current ?? event.currentTarget, event.pointerId);

    pointerState.current = {
      pointerId: event.pointerId,
      pendingTap: { row, col },
      dragMode: nextDragMode,
      activeMouseButton: isTouchPointer ? null : (event.button === 2 ? 2 : 0),
      lastCell: { row, col },
    };
    startBatch();
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const current = pointerState.current;
    if (current.pointerId !== event.pointerId || !current.dragMode) return;

    if (current.activeMouseButton === 0 && (event.buttons & 1) === 0) {
      finishPointer(event.pointerId);
      return;
    }

    if (current.activeMouseButton === 2 && (event.buttons & 2) === 0) {
      finishPointer(event.pointerId);
      return;
    }

    const hitCell = getBoardCell(event.clientX, event.clientY);
    if (!hitCell) return;

    applyDragToCell(hitCell.row, hitCell.col);
  };

  const { outerWidth, outerHeight } = getBoardFrameDimensions(
    width,
    height,
    cellSize,
    { borderWidth: BOARD_BORDER, padding: BOARD_PADDING }
  );
  const clueTextStyle = getBoardTextStyle(cellSize);
  const { strokeWidth: boundaryStroke, outlineWidth: boundaryOutlineStroke } = getBoardBoundaryStrokeMetrics(cellSize);

  return (
    <div ref={containerRef} className="flex w-full min-w-0 max-w-full flex-col items-center gap-3">
      <div
        ref={boardRef}
        className="relative select-none touch-none"
        style={{
          width: `${outerWidth}px`,
          height: `${outerHeight}px`,
          ...getBoardFrameStyle(BOARD_BORDER),
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={(event) => finishPointer(event.pointerId)}
        onPointerLeave={(event) => finishPointer(event.pointerId)}
        onPointerCancel={(event) => finishPointer(event.pointerId)}
        onContextMenu={(event) => event.preventDefault()}
      >
        <div
          className="absolute grid"
          style={getBoardGridStyle(BOARD_PADDING, BOARD_PADDING, width, cellSize)}
        >
          {grid.flatMap((currentRow, row) =>
            currentRow.map((state, col) => {
              const clueValue = clueMap.get(`${row},${col}`);
              const trialColors = getTrialLevelColors(levels[row][col]);
              const isInvalid = showValidationMessage && invalidCellSet.has(`${row},${col}`);
              const isShaded = state === 1;
              const isMarked = state === 2;
              const baseTone = isShaded ? 'playerShaded' as const : isMarked ? 'marked' as const : 'cell' as const;
              const invalidStyle = isInvalid
                ? getInvalidBoardCellColors(isShaded ? 'dark' : isMarked ? 'marked' : 'soft')
                : undefined;
              const trialStyle = trialColors
                ? getBoardTrialCellStyle(trialColors, isShaded ? 'filled' : 'soft')
                : undefined;

              return (
                <div
                  key={`${row}-${col}`}
                  onPointerDown={(event) => handleCellPointerDown(row, col, event)}
                  className="relative flex items-center justify-center touch-none"
                  style={{
                    ...getBoardCellStyle(cellSize, baseTone),
                    ...invalidStyle,
                    ...trialStyle,
                  }}
                >
                  {clueValue !== undefined ? (
                    <span
                      className={boardClassNames.cellText}
                      style={{
                        ...clueTextStyle,
                        color: isShaded ? woodBoardTheme.darkCellText : trialColors?.text ?? woodBoardTheme.border,
                      }}
                    >
                      {clueValue}
                    </span>
                  ) : isMarked ? (
                    <BoardCellMark
                      kind="cross"
                      cellSize={cellSize}
                    />
                  ) : null}
                </div>
              );
            })
          )}
        </div>

        <svg
          className="absolute top-0 left-0 pointer-events-none"
          width={outerWidth - BOARD_BORDER * 2}
          height={outerHeight - BOARD_BORDER * 2}
        >
          {boundaries.horizontal.map((segment) => {
            const x1 = BOARD_PADDING + segment.col * cellSize;
            const y = BOARD_PADDING + segment.row * cellSize;
            const x2 = x1 + cellSize;
            return (
              <line
                key={`h-outline-${segment.row}-${segment.col}`}
                x1={x1}
                y1={y}
                x2={x2}
                y2={y}
                stroke={woodBoardTheme.cell}
                strokeWidth={boundaryOutlineStroke}
                strokeLinecap="butt"
              />
            );
          })}

          {boundaries.vertical.map((segment) => {
            const x = BOARD_PADDING + segment.col * cellSize;
            const y1 = BOARD_PADDING + segment.row * cellSize;
            const y2 = y1 + cellSize;
            return (
              <line
                key={`v-outline-${segment.row}-${segment.col}`}
                x1={x}
                y1={y1}
                x2={x}
                y2={y2}
                stroke={woodBoardTheme.cell}
                strokeWidth={boundaryOutlineStroke}
                strokeLinecap="butt"
              />
            );
          })}

          {boundaries.horizontal.map((segment) => {
            const x1 = BOARD_PADDING + segment.col * cellSize;
            const y = BOARD_PADDING + segment.row * cellSize;
            const x2 = x1 + cellSize;
            return (
              <line
                key={`h-stroke-${segment.row}-${segment.col}`}
                x1={x1}
                y1={y}
                x2={x2}
                y2={y}
                stroke={woodBoardTheme.border}
                strokeWidth={boundaryStroke}
                strokeLinecap="square"
              />
            );
          })}

          {boundaries.vertical.map((segment) => {
            const x = BOARD_PADDING + segment.col * cellSize;
            const y1 = BOARD_PADDING + segment.row * cellSize;
            const y2 = y1 + cellSize;
            return (
              <line
                key={`v-stroke-${segment.row}-${segment.col}`}
                x1={x}
                y1={y1}
                x2={x}
                y2={y2}
                stroke={woodBoardTheme.border}
                strokeWidth={boundaryStroke}
                strokeLinecap="square"
              />
            );
          })}
        </svg>
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

      {showValidationMessage ? <ValidationMessage message={validation?.message} /> : null}
    </div>
  );
}
