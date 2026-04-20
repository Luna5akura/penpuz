import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePuzzleHistory } from '@/hooks/usePuzzleHistory';
import PuzzleAssistToolbar from '@/components/PuzzleAssistToolbar';
import { getTrialLevelColors } from '../trialStyles';
import type { AqrePuzzleData } from '../types';
import {
  commonBoardChrome,
  getBoardCellColors,
  getBoardCrossFontSize,
  getBoardFrameStyle,
  getBoardNumberFontSize,
  getCellDividerStyle,
  getCrossMarkStyle,
  getInvalidBoardCellColors,
  getOutlinedBorderStrokeWidth,
  getResponsiveCellSize,
  woodBoardTheme,
} from '../boardTheme';
import {
  createEmptyAqreGrid,
  getAqreBoundarySegments,
  type AqreCellState,
  validateAqre,
} from './utils';

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
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === 'undefined' ? 1024 : window.innerWidth
  );
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
  const getResetSnapshot = useCallback(() => {
    return (initialSnapshot as AqreSnapshot | null) ?? createInitialSnapshot();
  }, [createInitialSnapshot, initialSnapshot]);

  const history = usePuzzleHistory<AqreSnapshot>(createInitialSnapshot(), {
    normalizeTrialSnapshot: (trialSnapshot) => ({
      ...trialSnapshot,
      levels: trialSnapshot.levels.map((row) => row.map(() => 0)),
    }),
    onSnapshotChange: (nextSnapshot) => onSnapshotChange?.(nextSnapshot),
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
  }), [fixedCellSize, viewportWidth, width]);

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

    const x = clientX - rect.left - BOARD_PADDING;
    const y = clientY - rect.top - BOARD_PADDING;
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
    event.currentTarget.setPointerCapture(event.pointerId);

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

  const boardWidthPx = width * cellSize;
  const boardHeightPx = height * cellSize;
  const outerWidth = boardWidthPx + BOARD_PADDING * 2 + BOARD_BORDER * 2;
  const outerHeight = boardHeightPx + BOARD_PADDING * 2 + BOARD_BORDER * 2;
  const clueFontSize = getBoardNumberFontSize(cellSize);
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
              const clueValue = clueMap.get(`${row},${col}`);
              const trialColors = getTrialLevelColors(levels[row][col]);
              const isInvalid = showValidationMessage && invalidCellSet.has(`${row},${col}`);
              const isShaded = state === 1;
              const isMarked = state === 2;
              const baseStyle = getBoardCellColors(isShaded ? 'playerShaded' : isMarked ? 'marked' : 'cell');
              const invalidStyle = isInvalid
                ? getInvalidBoardCellColors(isShaded ? 'dark' : isMarked ? 'marked' : 'soft')
                : undefined;
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
                    ...invalidStyle,
                    ...trialStyle,
                  }}
                >
                  {clueValue !== undefined ? (
                    <span
                      className="font-semibold tabular-nums"
                      style={{
                        fontSize: `${clueFontSize}px`,
                        lineHeight: 1,
                        color: isShaded ? woodBoardTheme.shadedText : trialColors?.text ?? woodBoardTheme.border,
                      }}
                    >
                      {clueValue}
                    </span>
                  ) : isMarked ? (
                    <span
                      style={getCrossMarkStyle(
                        crossFontSize,
                        trialColors?.text ?? woodBoardTheme.border
                      )}
                    >
                      ×
                    </span>
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

      {showValidationMessage && validation?.message ? (
        <div className="text-sm text-muted-foreground dark:text-gray-400 text-center">
          {validation.message}
        </div>
      ) : null}
    </div>
  );
}
