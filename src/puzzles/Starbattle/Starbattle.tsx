import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '@/i18n/useI18n';
import type { StarbattlePuzzleData } from '../types';
import { usePuzzleHistory } from '../../hooks/usePuzzleHistory';
import PuzzleAssistToolbar from '../../components/PuzzleAssistToolbar';
import { getTrialLevelColors } from '../trialStyles';
import {
  commonBoardChrome,
  getBoardCellColors,
  getBoardCrossFontSize,
  getCellDividerStyle,
  getCrossMarkStyle,
  getInvalidBoardCellColors,
  getResponsiveCellSize,
  woodBoardTheme,
} from '../boardTheme';
import {
  createEmptyStarbattleGrid,
  detectStarbattleHitTarget,
  getStarbattleBoundarySegments,
  parseStarbattleEdgeKey,
  parseStarbattleVertexKey,
  type StarbattleCellState,
  validateStarbattle,
} from './utils';

interface Props {
  puzzle: StarbattlePuzzleData;
  startTime: number;
  resetToken: number;
  onComplete: (time: number) => void;
  initialSnapshot?: unknown;
  onSnapshotChange?: (snapshot: unknown) => void;
  fixedCellSize?: number;
  showValidationMessage?: boolean;
}

type PendingTap =
  | { kind: 'desktop-left-cell'; row: number; col: number }
  | { kind: 'desktop-right-cell'; row: number; col: number }
  | { kind: 'mobile-cell'; row: number; col: number }
  | { kind: 'mobile-edge'; key: string }
  | { kind: 'mobile-vertex'; key: string }
  | null;

type StarbattleSnapshot = {
  grid: StarbattleCellState[][];
  edgeDots: string[];
  vertexDots: string[];
  cellLevels: number[][];
  edgeDotLevels: Record<string, number>;
  vertexDotLevels: Record<string, number>;
};

const BOARD_PADDING = commonBoardChrome.padding;
const BOARD_BORDER = commonBoardChrome.border;

export default function StarbattleBoard({
  puzzle,
  startTime,
  resetToken,
  onComplete,
  initialSnapshot,
  onSnapshotChange,
  fixedCellSize,
  showValidationMessage = false,
}: Props) {
  const { copy } = useI18n();
  const { width, height, starsPerUnit } = puzzle;
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === 'undefined' ? 1024 : window.innerWidth
  );
  const boardRef = useRef<HTMLDivElement>(null);
  const pointerState = useRef<{
    pointerId: number | null;
    isTouch: boolean;
    pendingTap: PendingTap;
    cellDragMode: 'mark' | 'clear' | null;
    lastCell: { row: number; col: number } | null;
    moved: boolean;
  }>({
    pointerId: null,
    isTouch: false,
    pendingTap: null,
    cellDragMode: null,
    lastCell: null,
    moved: false,
  });
  const hasCompleted = useRef(false);

  const createInitialSnapshot = useCallback<() => StarbattleSnapshot>(() => ({
    grid: createEmptyStarbattleGrid(width, height),
    edgeDots: [],
    vertexDots: [],
    cellLevels: Array.from({ length: height }, () => Array(width).fill(0)),
    edgeDotLevels: {},
    vertexDotLevels: {},
  }), [height, width]);
  const getResetSnapshot = useCallback(() => {
    return (initialSnapshot as StarbattleSnapshot | null) ?? createInitialSnapshot();
  }, [createInitialSnapshot, initialSnapshot]);

  const history = usePuzzleHistory<StarbattleSnapshot>(createInitialSnapshot(), {
    normalizeTrialSnapshot: (trialSnapshot) => ({
      ...trialSnapshot,
      cellLevels: trialSnapshot.cellLevels.map((row) => row.map(() => 0)),
      edgeDotLevels: {},
      vertexDotLevels: {},
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
  const cellLevels = snapshot.cellLevels;
  const edgeDots = useMemo(() => new Set(snapshot.edgeDots), [snapshot.edgeDots]);
  const vertexDots = useMemo(() => new Set(snapshot.vertexDots), [snapshot.vertexDots]);
  const edgeDotLevels = snapshot.edgeDotLevels;
  const vertexDotLevels = snapshot.vertexDotLevels;
  const hasEdited = canUndo || canRedo || trialActive || trialCheckpointCount > 0;

  const cellSize = useMemo(() => {
    return getResponsiveCellSize({
      fixedCellSize,
      viewportWidth,
      width,
    });
  }, [fixedCellSize, viewportWidth, width]);

  const isMobile = viewportWidth < 640;
  const validation = useMemo(
    () => (hasEdited ? validateStarbattle(grid, puzzle) : null),
    [grid, hasEdited, puzzle]
  );
  const invalidCellSet = useMemo(
    () => new Set((validation?.badCells ?? []).map((cell) => `${cell.r},${cell.c}`)),
    [validation]
  );
  const boundaries = useMemo(
    () => getStarbattleBoundarySegments(puzzle.regionIds, width, height),
    [height, puzzle.regionIds, width]
  );
  const hasStarAt = useCallback((row: number, col: number) => {
    if (row < 0 || row >= height || col < 0 || col >= width) return false;
    return grid[row][col] === 1;
  }, [grid, height, width]);
  const isEdgeCoveredByStar = useCallback((key: string) => {
    const edge = parseStarbattleEdgeKey(key);
    if (!edge) return false;
    if (edge.orientation === 'h') {
      return hasStarAt(edge.row - 1, edge.col) || hasStarAt(edge.row, edge.col);
    }
    return hasStarAt(edge.row, edge.col - 1) || hasStarAt(edge.row, edge.col);
  }, [hasStarAt]);
  const isVertexCoveredByStar = useCallback((key: string) => {
    const vertex = parseStarbattleVertexKey(key);
    if (!vertex) return false;
    return (
      hasStarAt(vertex.row - 1, vertex.col - 1) ||
      hasStarAt(vertex.row - 1, vertex.col) ||
      hasStarAt(vertex.row, vertex.col - 1) ||
      hasStarAt(vertex.row, vertex.col)
    );
  }, [hasStarAt]);
  const visibleEdgeDots = useMemo(
    () => [...edgeDots].filter((key) => !isEdgeCoveredByStar(key)),
    [edgeDots, isEdgeCoveredByStar]
  );
  const visibleVertexDots = useMemo(
    () => [...vertexDots].filter((key) => !isVertexCoveredByStar(key)),
    [isVertexCoveredByStar, vertexDots]
  );

  useEffect(() => {
    const updateSize = () => setViewportWidth(window.innerWidth);
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (!validation?.valid || hasCompleted.current) return;
    hasCompleted.current = true;
    onComplete(Math.floor((Date.now() - startTime) / 1000));
  }, [onComplete, startTime, validation]);

  const resetBoard = useCallback(() => {
    reset(getResetSnapshot());
    pointerState.current = {
      pointerId: null,
      isTouch: false,
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

  const updateCellState = useCallback((row: number, col: number, nextState: StarbattleCellState) => {
    applyChange((currentSnapshot) => {
      if (currentSnapshot.grid[row][col] === nextState) return currentSnapshot;
      const nextGrid = currentSnapshot.grid.map((currentRow) => [...currentRow]);
      const nextCellLevels = currentSnapshot.cellLevels.map((currentRow) => [...currentRow]);
      nextGrid[row][col] = nextState;
      nextCellLevels[row][col] = nextState === 0 ? 0 : trialActive ? currentTrialLevel : 0;
      return {
        ...currentSnapshot,
        grid: nextGrid,
        cellLevels: nextCellLevels,
      };
    }, { coalesce: true });
  }, [applyChange, currentTrialLevel, trialActive]);

  const toggleStar = useCallback((row: number, col: number) => {
    applyChange((currentSnapshot) => {
      const nextGrid = currentSnapshot.grid.map((currentRow) => [...currentRow]);
      const nextCellLevels = currentSnapshot.cellLevels.map((currentRow) => [...currentRow]);
      const nextState = currentSnapshot.grid[row][col] === 1 ? 0 : 1;
      nextGrid[row][col] = nextState;
      nextCellLevels[row][col] = nextState === 0 ? 0 : trialActive ? currentTrialLevel : 0;
      return {
        ...currentSnapshot,
        grid: nextGrid,
        cellLevels: nextCellLevels,
      };
    }, { coalesce: true });
  }, [applyChange, currentTrialLevel, trialActive]);

  const cycleMobileCell = useCallback((row: number, col: number) => {
    applyChange((currentSnapshot) => {
      const nextGrid = currentSnapshot.grid.map((currentRow) => [...currentRow]);
      const nextCellLevels = currentSnapshot.cellLevels.map((currentRow) => [...currentRow]);
      const currentState = currentSnapshot.grid[row][col];
      const nextState = currentState === 0 ? 1 : currentState === 1 ? 2 : 0;
      nextGrid[row][col] = nextState;
      nextCellLevels[row][col] = nextState === 0 ? 0 : trialActive ? currentTrialLevel : 0;
      return {
        ...currentSnapshot,
        grid: nextGrid,
        cellLevels: nextCellLevels,
      };
    }, { coalesce: true });
  }, [applyChange, currentTrialLevel, trialActive]);

  const toggleEdgeDot = useCallback((key: string) => {
    applyChange((currentSnapshot) => {
      const nextEdgeDots = new Set(currentSnapshot.edgeDots);
      const nextEdgeDotLevels = { ...currentSnapshot.edgeDotLevels };
      if (nextEdgeDots.has(key)) {
        nextEdgeDots.delete(key);
        delete nextEdgeDotLevels[key];
      } else {
        nextEdgeDots.add(key);
        nextEdgeDotLevels[key] = trialActive ? currentTrialLevel : 0;
      }
      return {
        ...currentSnapshot,
        edgeDots: Array.from(nextEdgeDots).sort(),
        edgeDotLevels: nextEdgeDotLevels,
      };
    });
  }, [applyChange, currentTrialLevel, trialActive]);

  const toggleVertexDot = useCallback((key: string) => {
    applyChange((currentSnapshot) => {
      const nextVertexDots = new Set(currentSnapshot.vertexDots);
      const nextVertexDotLevels = { ...currentSnapshot.vertexDotLevels };
      if (nextVertexDots.has(key)) {
        nextVertexDots.delete(key);
        delete nextVertexDotLevels[key];
      } else {
        nextVertexDots.add(key);
        nextVertexDotLevels[key] = trialActive ? currentTrialLevel : 0;
      }
      return {
        ...currentSnapshot,
        vertexDots: Array.from(nextVertexDots).sort(),
        vertexDotLevels: nextVertexDotLevels,
      };
    });
  }, [applyChange, currentTrialLevel, trialActive]);

  const getRelativePoint = useCallback((clientX: number, clientY: number) => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: clientX - rect.left - BOARD_PADDING,
      y: clientY - rect.top - BOARD_PADDING,
    };
  }, []);

  const applyDragToCell = useCallback((row: number, col: number) => {
    const current = pointerState.current;
    if (!current.cellDragMode) return;

    const targetState = current.cellDragMode === 'mark' ? 2 : 0;
    const sameCell = current.lastCell?.row === row && current.lastCell?.col === col;
    if (sameCell) return;

    if (!current.moved && current.pendingTap && 'row' in current.pendingTap && 'col' in current.pendingTap) {
      updateCellState(current.pendingTap.row, current.pendingTap.col, targetState);
    }

    updateCellState(row, col, targetState);
    current.moved = true;
    current.pendingTap = null;
    current.lastCell = { row, col };
  }, [updateCellState]);

  const finishPointer = useCallback(() => {
    const current = pointerState.current;

    if (current.pendingTap?.kind === 'desktop-left-cell') {
      toggleStar(current.pendingTap.row, current.pendingTap.col);
    } else if (current.pendingTap?.kind === 'desktop-right-cell') {
      const nextState = grid[current.pendingTap.row][current.pendingTap.col] === 2 ? 0 : 2;
      updateCellState(current.pendingTap.row, current.pendingTap.col, nextState);
    } else if (current.pendingTap?.kind === 'mobile-cell') {
      cycleMobileCell(current.pendingTap.row, current.pendingTap.col);
    } else if (current.pendingTap?.kind === 'mobile-edge') {
      toggleEdgeDot(current.pendingTap.key);
    } else if (current.pendingTap?.kind === 'mobile-vertex') {
      toggleVertexDot(current.pendingTap.key);
    }

    pointerState.current = {
      pointerId: null,
      isTouch: false,
      pendingTap: null,
      cellDragMode: null,
      lastCell: null,
      moved: false,
    };
    finishBatch();
  }, [cycleMobileCell, finishBatch, grid, toggleEdgeDot, toggleStar, toggleVertexDot, updateCellState]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const point = getRelativePoint(event.clientX, event.clientY);
    if (!point) return;

    const hitTarget = detectStarbattleHitTarget(point.x, point.y, width, height, cellSize);
    if (!hitTarget) return;

    const button = event.button;
    const isTouchPointer = event.pointerType === 'touch' || (button === 0 && isMobile);

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    if (!isTouchPointer && button === 2) {
      if (hitTarget.kind === 'edge') {
        if (isEdgeCoveredByStar(hitTarget.key)) return;
        toggleEdgeDot(hitTarget.key);
        return;
      }
      if (hitTarget.kind === 'vertex') {
        if (isVertexCoveredByStar(hitTarget.key)) return;
        toggleVertexDot(hitTarget.key);
        return;
      }

      pointerState.current = {
        pointerId: event.pointerId,
        isTouch: false,
        pendingTap: { kind: 'desktop-right-cell', row: hitTarget.row, col: hitTarget.col },
        cellDragMode: grid[hitTarget.row][hitTarget.col] === 2 ? 'clear' : 'mark',
        lastCell: { row: hitTarget.row, col: hitTarget.col },
        moved: false,
      };
      startBatch();
      return;
    }

    if (!isTouchPointer && button !== 0) return;

    if (hitTarget.kind === 'edge') {
      if (isEdgeCoveredByStar(hitTarget.key)) return;
      if (isTouchPointer) {
        pointerState.current = {
          pointerId: event.pointerId,
          isTouch: true,
          pendingTap: { kind: 'mobile-edge', key: hitTarget.key },
          cellDragMode: null,
          lastCell: null,
          moved: false,
        };
        startBatch();
      }
      return;
    }

    if (hitTarget.kind === 'vertex') {
      if (isVertexCoveredByStar(hitTarget.key)) return;
      if (isTouchPointer) {
        pointerState.current = {
          pointerId: event.pointerId,
          isTouch: true,
          pendingTap: { kind: 'mobile-vertex', key: hitTarget.key },
          cellDragMode: null,
          lastCell: null,
          moved: false,
        };
        startBatch();
      }
      return;
    }

    if (!isTouchPointer) {
      toggleStar(hitTarget.row, hitTarget.col);
      return;
    }

    pointerState.current = {
      pointerId: event.pointerId,
      isTouch: isTouchPointer,
      pendingTap: isTouchPointer
        ? { kind: 'mobile-cell', row: hitTarget.row, col: hitTarget.col }
        : null,
      cellDragMode: isTouchPointer
        ? grid[hitTarget.row][hitTarget.col] === 1
          ? 'mark'
          : grid[hitTarget.row][hitTarget.col] === 2
            ? 'clear'
            : null
        : null,
      lastCell: { row: hitTarget.row, col: hitTarget.col },
      moved: false,
    };
    startBatch();
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const current = pointerState.current;
    if (current.pointerId !== event.pointerId || !current.cellDragMode) return;

    const point = getRelativePoint(event.clientX, event.clientY);
    if (!point) return;

    const hitTarget = detectStarbattleHitTarget(point.x, point.y, width, height, cellSize);
    if (!hitTarget || hitTarget.kind !== 'cell') return;

    applyDragToCell(hitTarget.row, hitTarget.col);
  };

  const boardWidthPx = width * cellSize;
  const boardHeightPx = height * cellSize;
  const outerWidth = boardWidthPx + BOARD_PADDING * 2 + BOARD_BORDER * 2;
  const outerHeight = boardHeightPx + BOARD_PADDING * 2 + BOARD_BORDER * 2;
  const starFontSize = Math.max(18, Math.floor(cellSize * 0.54));
  const crossFontSize = getBoardCrossFontSize(cellSize);
  const dotRadius = Math.max(6, Math.floor(cellSize * 0.16));
  const boundaryStroke = Math.max(3, Math.floor(cellSize * 0.08));

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-full flex justify-end">
        <div
          className="rounded-full px-3 py-1 text-sm font-semibold dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          style={{
            border: `1px solid ${woodBoardTheme.accentBorder}`,
            background: woodBoardTheme.accentFill,
            color: woodBoardTheme.accentText,
          }}
        >
          {copy.shared.starbattleQuota(starsPerUnit)}
        </div>
      </div>

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
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointer}
        onPointerLeave={finishPointer}
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
          {grid.flatMap((row, r) =>
            row.map((state, c) => {
              const trialColors = getTrialLevelColors(cellLevels[r][c]);
              const isInvalid = showValidationMessage && invalidCellSet.has(`${r},${c}`);
              const baseStyle = getBoardCellColors(state === 2 ? 'marked' : 'cell');
              const trialStyle = trialColors
                ? state === 1
                  ? { background: trialColors.fill, color: woodBoardTheme.shadedText }
                  : state === 2
                    ? { background: trialColors.softFill, color: trialColors.text }
                    : { background: trialColors.softFill }
                : undefined;

              return (
                <div
                  key={`${r}-${c}`}
                  className="relative flex items-center justify-center dark:text-gray-100"
                  style={{
                    width: `${cellSize}px`,
                    height: `${cellSize}px`,
                    ...(isInvalid ? getInvalidBoardCellColors('soft') : baseStyle),
                    ...getCellDividerStyle(),
                    ...trialStyle,
                  }}
                >
                  {state === 1 ? (
                    <span style={{ fontSize: `${starFontSize}px`, lineHeight: 1 }}>★</span>
                  ) : state === 2 ? (
                    <span style={getCrossMarkStyle(crossFontSize)}>×</span>
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
                key={`h-${segment.row}-${segment.col}`}
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
                key={`v-${segment.row}-${segment.col}`}
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

          {visibleEdgeDots.map((key) => {
            const edge = parseStarbattleEdgeKey(key);
            if (!edge) return null;
            const trialColors = getTrialLevelColors(edgeDotLevels[key] ?? 0);
            const centerX =
              BOARD_PADDING +
              (edge.orientation === 'h' ? edge.col * cellSize + cellSize / 2 : edge.col * cellSize);
            const centerY =
              BOARD_PADDING +
              (edge.orientation === 'h' ? edge.row * cellSize : edge.row * cellSize + cellSize / 2);
            return (
              <circle
                key={key}
                cx={centerX}
                cy={centerY}
                r={dotRadius}
                fill={trialColors?.line ?? woodBoardTheme.border}
              />
            );
          })}

          {visibleVertexDots.map((key) => {
            const vertex = parseStarbattleVertexKey(key);
            if (!vertex) return null;
            const trialColors = getTrialLevelColors(vertexDotLevels[key] ?? 0);
            return (
              <circle
                key={key}
                cx={BOARD_PADDING + vertex.col * cellSize}
                cy={BOARD_PADDING + vertex.row * cellSize}
                r={dotRadius}
                fill={trialColors?.line ?? woodBoardTheme.border}
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

      <button
        type="button"
        onClick={resetBoard}
        className="px-4 py-2 rounded-md border bg-white/80 hover:bg-white text-sm dark:bg-gray-800 dark:hover:bg-gray-700"
      >
        {copy.shared.resetPuzzle}
      </button>

      {/* {showValidationMessage && validation?.message && (
        <div className="text-sm text-muted-foreground dark:text-gray-400 text-center">
          {validation.message}
        </div>
      )} */}
    </div>
  );
}
