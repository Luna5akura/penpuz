import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePuzzleHistory } from '@/hooks/usePuzzleHistory';
import PuzzleAssistToolbar from '@/components/PuzzleAssistToolbar';
import { getTrialLevelColors } from '../trialStyles';
import type { AkariPuzzleData } from '../types';
import {
  commonBoardChrome,
  getBoardCellColors,
  getBoardCrossFontSize,
  getBoardNumberFontSize,
  getCellDividerStyle,
  getCrossMarkStyle,
  getInvalidBoardCellColors,
  getResponsiveCellSize,
  woodBoardTheme,
} from '../boardTheme';
import {
  createEmptyAkariGrid,
  getAkariIllumination,
  isAkariBlackCell,
  type AkariCellState,
  validateAkari,
} from './utils';

interface Props {
  puzzle: AkariPuzzleData;
  startTime: number;
  resetToken: number;
  onComplete: (time: number) => void;
  initialSnapshot?: unknown;
  onSnapshotChange?: (snapshot: unknown) => void;
  fixedCellSize?: number;
  showValidationMessage?: boolean;
}

type AkariSnapshot = {
  grid: AkariCellState[][];
  levels: number[][];
};

type PendingTap =
  | { kind: 'desktop-left-cell'; row: number; col: number }
  | { kind: 'desktop-right-cell'; row: number; col: number }
  | { kind: 'mobile-bulb'; row: number; col: number }
  | null;

type CellDragMode = 'desktop-mark' | 'desktop-clear' | 'mobile-mark' | 'mobile-clear' | null;
const BOARD_PADDING = commonBoardChrome.padding;
const BOARD_BORDER = commonBoardChrome.border;

export default function AkariBoard({
  puzzle,
  startTime,
  resetToken,
  onComplete,
  initialSnapshot,
  onSnapshotChange,
  fixedCellSize,
  showValidationMessage = false,
}: Props) {
  const { width, height, cells } = puzzle;
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === 'undefined' ? 1024 : window.innerWidth
  );
  const boardRef = useRef<HTMLDivElement>(null);
  const pointerState = useRef<{
    pointerId: number | null;
    activeMouseButton: 0 | 2 | null;
    pendingTap: PendingTap;
    cellDragMode: CellDragMode;
    lastCell: { row: number; col: number } | null;
    moved: boolean;
  }>({
    pointerId: null,
    activeMouseButton: null,
    pendingTap: null,
    cellDragMode: null,
    lastCell: null,
    moved: false,
  });
  const hasCompleted = useRef(false);

  const createInitialSnapshot = useCallback<() => AkariSnapshot>(() => ({
    grid: createEmptyAkariGrid(width, height),
    levels: Array.from({ length: height }, () => Array(width).fill(0)),
  }), [height, width]);
  const getResetSnapshot = useCallback(() => {
    return (initialSnapshot as AkariSnapshot | null) ?? createInitialSnapshot();
  }, [createInitialSnapshot, initialSnapshot]);

  const history = usePuzzleHistory<AkariSnapshot>(createInitialSnapshot(), {
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
    () => (hasEdited ? validateAkari(grid, puzzle) : null),
    [grid, hasEdited, puzzle]
  );
  const invalidCellSet = useMemo(
    () => new Set((validation?.badCells ?? []).map((cell) => `${cell.r},${cell.c}`)),
    [validation]
  );
  const illumination = useMemo(() => getAkariIllumination(grid, puzzle), [grid, puzzle]);

  const cellSize = useMemo(() => {
    return getResponsiveCellSize({
      fixedCellSize,
      viewportWidth,
      width,
    });
  }, [fixedCellSize, viewportWidth, width]);

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
      activeMouseButton: null,
      pendingTap: null,
      cellDragMode: null,
      lastCell: null,
      moved: false,
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

  const updateCellState = useCallback((row: number, col: number, nextState: AkariCellState) => {
    if (isAkariBlackCell(cells[row][col])) return;

    applyChange((currentSnapshot) => {
      if (currentSnapshot.grid[row][col] === nextState) return currentSnapshot;

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
  }, [applyChange, cells, currentTrialLevel, trialActive]);

  const toggleBulb = useCallback((row: number, col: number) => {
    if (isAkariBlackCell(cells[row][col])) return;
    const nextState = grid[row][col] === 1 ? 0 : 1;
    updateCellState(row, col, nextState);
  }, [cells, grid, updateCellState]);

  const applyDragModeToCell = useCallback((row: number, col: number, mode: Exclude<CellDragMode, null>) => {
    if (isAkariBlackCell(cells[row][col])) return;

    if (mode === 'desktop-mark' || mode === 'mobile-mark') {
      updateCellState(row, col, 2);
      return;
    }

    if (mode === 'desktop-clear') {
      if (grid[row][col] !== 2) return;
      updateCellState(row, col, 0);
      return;
    }

    updateCellState(row, col, 0);
  }, [cells, grid, updateCellState]);

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

  const applyDragToCell = useCallback((row: number, col: number) => {
    const current = pointerState.current;
    if (!current.cellDragMode) return;

    const sameCell = current.lastCell?.row === row && current.lastCell?.col === col;
    if (sameCell) return;

    if (!current.moved && current.pendingTap) {
      applyDragModeToCell(current.pendingTap.row, current.pendingTap.col, current.cellDragMode);
    }

    current.moved = true;
    current.pendingTap = null;
    current.lastCell = { row, col };
    applyDragModeToCell(row, col, current.cellDragMode);
  }, [applyDragModeToCell]);

  const finishPointer = useCallback((pointerId?: number) => {
    const current = pointerState.current;
    if (current.pointerId === null) return;
    if (pointerId !== undefined && current.pointerId !== pointerId) return;

    if (!current.moved) {
      if (current.pendingTap?.kind === 'desktop-left-cell') {
        toggleBulb(current.pendingTap.row, current.pendingTap.col);
      } else if (current.pendingTap?.kind === 'desktop-right-cell' && current.cellDragMode) {
        applyDragModeToCell(current.pendingTap.row, current.pendingTap.col, current.cellDragMode);
      } else if (current.pendingTap?.kind === 'mobile-bulb') {
        updateCellState(current.pendingTap.row, current.pendingTap.col, 1);
      } else if (current.pendingTap && current.cellDragMode) {
        applyDragModeToCell(current.pendingTap.row, current.pendingTap.col, current.cellDragMode);
      }
    }

    pointerState.current = {
      pointerId: null,
      activeMouseButton: null,
      pendingTap: null,
      cellDragMode: null,
      lastCell: null,
      moved: false,
    };
    finishBatch();
  }, [applyDragModeToCell, finishBatch, toggleBulb, updateCellState]);

  const handleCellPointerDown = (row: number, col: number, event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerState.current.pointerId !== null) return;
    if (isAkariBlackCell(cells[row][col])) return;

    const currentState = grid[row][col];
    const isTouchPointer = event.pointerType === 'touch' || (event.button === 0 && isMobile);

    let pendingTap: PendingTap = null;
    let cellDragMode: CellDragMode = null;

    if (isTouchPointer) {
      if (currentState === 0) {
        pendingTap = { kind: 'mobile-bulb', row, col };
      } else if (currentState === 1) {
        pendingTap = { kind: 'desktop-right-cell', row, col };
        cellDragMode = 'mobile-mark';
      } else {
        pendingTap = { kind: 'desktop-right-cell', row, col };
        cellDragMode = 'mobile-clear';
      }
    } else if (event.button === 0) {
      pendingTap = { kind: 'desktop-left-cell', row, col };
    } else if (event.button === 2) {
      pendingTap = { kind: 'desktop-right-cell', row, col };
      cellDragMode = currentState === 2 ? 'desktop-clear' : 'desktop-mark';
    }

    if (!pendingTap) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    pointerState.current = {
      pointerId: event.pointerId,
      activeMouseButton: isTouchPointer ? null : (event.button === 2 ? 2 : 0),
      pendingTap,
      cellDragMode,
      lastCell: { row, col },
      moved: false,
    };
    startBatch();
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const current = pointerState.current;
    if (current.pointerId !== event.pointerId || !current.pendingTap) return;

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

    if (!current.cellDragMode) {
      if (current.pendingTap.kind === 'desktop-left-cell' || current.pendingTap.kind === 'mobile-bulb') {
        if (hitCell.row !== current.pendingTap.row || hitCell.col !== current.pendingTap.col) {
          current.moved = true;
        }
      }
      return;
    }

    applyDragToCell(hitCell.row, hitCell.col);
  };

  const boardWidthPx = width * cellSize;
  const boardHeightPx = height * cellSize;
  const outerWidth = boardWidthPx + BOARD_PADDING * 2 + BOARD_BORDER * 2;
  const outerHeight = boardHeightPx + BOARD_PADDING * 2 + BOARD_BORDER * 2;
  const bulbDiameter = Math.max(20, Math.floor(cellSize * 0.8));
  const crossFontSize = getBoardCrossFontSize(cellSize);
  const clueFontSize = getBoardNumberFontSize(cellSize);

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={boardRef}
        className="relative select-none touch-none"
        style={{
          width: `${outerWidth}px`,
          height: `${outerHeight}px`,
          background: woodBoardTheme.frame,
          border: `${BOARD_BORDER}px solid ${woodBoardTheme.border}`,
          boxSizing: 'border-box',
          maxWidth: '100%',
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
          {Array.from({ length: height }).flatMap((_, row) =>
            Array.from({ length: width }).map((__, col) => {
              const puzzleCell = cells[row][col];
              const state = grid[row][col];
              const isBlack = isAkariBlackCell(puzzleCell);
              const isLit = illumination.illuminated[row][col];
              const isInvalid = showValidationMessage && invalidCellSet.has(`${row},${col}`);
              const isBulb = state === 1;
              const isMarked = state === 2;
              const trialColors = getTrialLevelColors(levels[row][col]);

              const baseStyle = getBoardCellColors(
                isBlack ? 'shaded' : isBulb ? 'brightLit' : isLit ? 'lit' : 'cell'
              );
              const invalidStyle = isInvalid
                ? getInvalidBoardCellColors(isBlack || isBulb ? 'dark' : 'soft')
                : undefined;
              const trialStyle = trialColors
                ? {
                    ...getCellDividerStyle(),
                    boxShadow: `inset 0 0 0 2px ${trialColors.line}`,
                  }
                : getCellDividerStyle();

              return (
                <div
                  key={`${row}-${col}`}
                  onPointerDown={(event) => handleCellPointerDown(row, col, event)}
                  className="relative flex items-center justify-center touch-none"
                  style={{
                    width: `${cellSize}px`,
                    height: `${cellSize}px`,
                    ...baseStyle,
                    ...trialStyle,
                    ...invalidStyle,
                  }}
                >
                  {typeof puzzleCell === 'number' ? (
                    <span
                      className="font-semibold tabular-nums"
                      style={{ fontSize: `${clueFontSize}px`, lineHeight: 1 }}
                    >
                      {puzzleCell}
                    </span>
                  ) : !isBlack && isBulb ? (
                    <span
                      aria-hidden="true"
                      style={{
                        width: `${bulbDiameter}px`,
                        height: `${bulbDiameter}px`,
                        borderRadius: '9999px',
                        background: woodBoardTheme.shaded,
                        display: 'block',
                      }}
                    />
                  ) : !isBlack && isMarked ? (
                    <span style={getCrossMarkStyle(crossFontSize)}>×</span>
                  ) : null}
                </div>
              );
            })
          )}
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

      {showValidationMessage && validation?.message ? (
        <div className="text-sm text-muted-foreground dark:text-gray-400 text-center">
          {validation.message}
        </div>
      ) : null}
    </div>
  );
}
