import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import PuzzleAssistToolbar from '@/components/PuzzleAssistToolbar';
import { usePuzzleHistory } from '@/hooks/usePuzzleHistory';
import { safeSetPointerCapture } from '@/lib/pointer';
import { sanitizeMatrix } from '../snapshotGuards';
import { getTrialLevelColors } from '../trialStyles';
import type { BoundarySegments, CellCoord } from '../gridUtils';
import {
  commonBoardChrome,
  getBoardCellColors,
  getBoardCrossFontSize,
  getBoardFrameStyle,
  getBoardNumberFontSize,
  getCellDividerStyle,
  getCrossMarkStyle,
  getOutlinedBorderStrokeWidth,
  getResponsiveCellSize,
  woodBoardTheme,
  type BoardCellTone,
} from '../boardTheme';

export type ShadingCellState = 0 | 1 | 2;

export interface ShadingValidationResult {
  valid: boolean;
  message?: string;
  badCells: CellCoord[];
}

interface ShadingSnapshot {
  grid: ShadingCellState[][];
  levels: number[][];
}

type DragMode = 'add-shade' | 'remove-shade' | 'add-mark' | 'remove-mark' | 'clear-all' | null;

interface ShadingBoardProps<TPuzzle extends { width: number; height: number }> {
  puzzle: TPuzzle;
  startTime: number;
  resetToken: number;
  onComplete: (time: number) => void;
  validate: (grid: ShadingCellState[][], puzzle: TPuzzle) => ShadingValidationResult;
  initialSnapshot?: unknown;
  onSnapshotChange?: (snapshot: unknown) => void;
  fixedCellSize?: number;
  showValidationMessage?: boolean;
  boundaries?: BoundarySegments;
  isLockedCell?: (row: number, col: number) => boolean;
  getCellTone?: (row: number, col: number, state: ShadingCellState) => BoardCellTone;
  renderCellContent?: (row: number, col: number, state: ShadingCellState, cellSize: number) => ReactNode;
}

const BOARD_PADDING = commonBoardChrome.padding;
const BOARD_BORDER = commonBoardChrome.border;

function createEmptyShadingGrid(width: number, height: number): ShadingCellState[][] {
  return Array.from({ length: height }, () => Array(width).fill(0) as ShadingCellState[]);
}

function normalizeShadingSnapshot(snapshot: unknown, width: number, height: number): ShadingSnapshot {
  const fallback = {
    grid: createEmptyShadingGrid(width, height),
    levels: Array.from({ length: height }, () => Array(width).fill(0)),
  };
  const source = snapshot as Partial<ShadingSnapshot> | null | undefined;

  return {
    grid: sanitizeMatrix(source?.grid, fallback.grid, (value) =>
      value === 0 || value === 1 || value === 2 ? value : 0
    ) as ShadingCellState[][],
    levels: sanitizeMatrix(source?.levels, fallback.levels, (value, fallbackCell) =>
      typeof value === 'number' && Number.isFinite(value) ? value : fallbackCell
    ),
  };
}

export default function ShadingBoard<TPuzzle extends { width: number; height: number }>({
  puzzle,
  startTime,
  resetToken,
  onComplete,
  validate,
  initialSnapshot,
  onSnapshotChange,
  fixedCellSize,
  showValidationMessage = false,
  boundaries,
  isLockedCell = () => false,
  getCellTone,
  renderCellContent,
}: ShadingBoardProps<TPuzzle>) {
  const { width, height } = puzzle;
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === 'undefined' ? 1024 : window.innerWidth
  );
  const boardRef = useRef<HTMLDivElement>(null);
  const pointerState = useRef<{
    pointerId: number | null;
    pendingTap: CellCoord | null;
    dragMode: DragMode;
    activeMouseButton: 0 | 2 | null;
    lastCell: CellCoord | null;
  }>({
    pointerId: null,
    pendingTap: null,
    dragMode: null,
    activeMouseButton: null,
    lastCell: null,
  });
  const hasCompleted = useRef(false);

  const createInitialSnapshot = useCallback<() => ShadingSnapshot>(() => ({
    grid: createEmptyShadingGrid(width, height),
    levels: Array.from({ length: height }, () => Array(width).fill(0)),
  }), [height, width]);
  const getResetSnapshot = useCallback(
    () => normalizeShadingSnapshot(initialSnapshot, width, height),
    [height, initialSnapshot, width]
  );

  const history = usePuzzleHistory<ShadingSnapshot>(createInitialSnapshot(), {
    normalizeTrialSnapshot: (trialSnapshot) => ({
      ...normalizeShadingSnapshot(trialSnapshot, width, height),
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
    startBatch,
    finishBatch,
  } = history;

  const normalizedSnapshot = useMemo(
    () => normalizeShadingSnapshot(snapshot, width, height),
    [height, snapshot, width]
  );
  const grid = normalizedSnapshot.grid;
  const levels = normalizedSnapshot.levels;
  const isMobile = viewportWidth < commonBoardChrome.mobileBreakpoint;
  const validation = useMemo(() => validate(grid, puzzle), [grid, puzzle, validate]);
  const visibleValidation = showValidationMessage ? validation : null;

  const cellSize = useMemo(
    () => getResponsiveCellSize({ fixedCellSize, viewportWidth, width }),
    [fixedCellSize, viewportWidth, width]
  );

  useEffect(() => {
    const updateSize = () => setViewportWidth(window.innerWidth);
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

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
    if (!validation.valid || hasCompleted.current) return;
    hasCompleted.current = true;
    onComplete(Math.floor((Date.now() - startTime) / 1000));
  }, [onComplete, startTime, validation.valid]);

  const applyCellState = useCallback((row: number, col: number, mode: Exclude<DragMode, null>) => {
    if (isLockedCell(row, col)) return;

    applyChange((currentSnapshot) => {
      const currentState = currentSnapshot.grid[row][col];
      let nextState = currentState;

      if (mode === 'add-shade') nextState = 1;
      else if (mode === 'remove-shade') nextState = currentState === 1 ? 0 : currentState;
      else if (mode === 'add-mark') nextState = 2;
      else if (mode === 'remove-mark') nextState = currentState === 2 ? 0 : currentState;
      else if (mode === 'clear-all') nextState = 0;

      if (nextState === currentState) return currentSnapshot;

      const nextGrid = currentSnapshot.grid.map((rowCells) => [...rowCells]);
      const nextLevels = currentSnapshot.levels.map((rowCells) => [...rowCells]);
      nextGrid[row][col] = nextState;
      nextLevels[row][col] = nextState === 0 ? 0 : trialActive ? currentTrialLevel : 0;

      return { grid: nextGrid, levels: nextLevels };
    }, { coalesce: true });
  }, [applyChange, currentTrialLevel, isLockedCell, trialActive]);

  const getBoardCell = useCallback((clientX: number, clientY: number) => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return null;

    const x = clientX - rect.left - BOARD_BORDER - BOARD_PADDING;
    const y = clientY - rect.top - BOARD_BORDER - BOARD_PADDING;
    if (x < 0 || y < 0) return null;

    const row = Math.floor(y / cellSize);
    const col = Math.floor(x / cellSize);
    if (row < 0 || row >= height || col < 0 || col >= width) return null;
    return { row, col };
  }, [cellSize, height, width]);

  const applyDragToCell = useCallback((row: number, col: number) => {
    const current = pointerState.current;
    if (!current.dragMode || isLockedCell(row, col)) return;
    if (current.lastCell?.row === row && current.lastCell?.col === col) return;

    if (current.pendingTap) {
      applyCellState(current.pendingTap.row, current.pendingTap.col, current.dragMode);
    }

    current.pendingTap = null;
    current.lastCell = { row, col };
    applyCellState(row, col, current.dragMode);
  }, [applyCellState, isLockedCell]);

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

  const handleCellPointerDown = (row: number, col: number, event: PointerEvent<HTMLDivElement>) => {
    if (pointerState.current.pointerId !== null || isLockedCell(row, col)) return;

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

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
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

  const boardWidthPx = width * cellSize;
  const boardHeightPx = height * cellSize;
  const outerWidth = boardWidthPx + BOARD_PADDING * 2 + BOARD_BORDER * 2;
  const outerHeight = boardHeightPx + BOARD_PADDING * 2 + BOARD_BORDER * 2;
  const numberFontSize = getBoardNumberFontSize(cellSize);
  const crossFontSize = getBoardCrossFontSize(cellSize);
  const boundaryStroke = Math.max(3, Math.floor(cellSize * 0.08));
  const boundaryOutlineStroke = getOutlinedBorderStrokeWidth(boundaryStroke);

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
        onPointerMove={handlePointerMove}
        onPointerUp={(event) => finishPointer(event.pointerId)}
        onPointerLeave={(event) => finishPointer(event.pointerId)}
        onPointerCancel={(event) => finishPointer(event.pointerId)}
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
          {grid.flatMap((currentRow, row) =>
            currentRow.map((state, col) => {
              const trialColors = getTrialLevelColors(levels[row][col]);
              const isShaded = state === 1;
              const isMarked = state === 2;
              const tone = getCellTone?.(row, col, state) ?? (isShaded ? 'playerShaded' : isMarked ? 'marked' : 'cell');
              const baseStyle = getBoardCellColors(tone);
              const trialStyle = trialColors
                ? isShaded
                  ? { background: trialColors.fill, color: woodBoardTheme.shadedText }
                  : isMarked
                    ? { background: trialColors.softFill, color: trialColors.text }
                    : { background: trialColors.softFill, color: woodBoardTheme.border }
                : undefined;

              return (
                <div
                  key={`${row}-${col}`}
                  onPointerDown={(event) => handleCellPointerDown(row, col, event)}
                  className="relative flex items-center justify-center touch-none"
                  style={{
                    width: `${cellSize}px`,
                    height: `${cellSize}px`,
                    ...baseStyle,
                    ...getCellDividerStyle(),
                    ...trialStyle,
                    cursor: isLockedCell(row, col) ? 'default' : 'pointer',
                    fontSize: `${numberFontSize}px`,
                    lineHeight: 1,
                  }}
                >
                  {renderCellContent?.(row, col, state, cellSize) ??
                    (isMarked ? (
                      <span style={getCrossMarkStyle(crossFontSize, trialColors?.text ?? woodBoardTheme.border)}>
                        ×
                      </span>
                    ) : null)}
                </div>
              );
            })
          )}
        </div>

        {boundaries ? (
          <svg
            className="pointer-events-none absolute left-0 top-0"
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
        ) : null}
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
