import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useI18n } from '@/i18n/useI18n';
import type { StarbattlePuzzleData } from '../types';
import { usePuzzleHistory } from '../../hooks/usePuzzleHistory';
import { useBoardContainerWidth } from '../useBoardContainerWidth';
import PuzzleAssistToolbar from '../../components/PuzzleAssistToolbar';
import ValidationMessage from '@/components/ValidationMessage';
import { getTrialLevelColors } from '../trialStyles';
import {
  commonBoardChrome,
  getBoardCellStyle,
  getBoardBoundaryStrokeMetrics,
  getBoardBadgeStyle,
  getBoardDotRadius,
  getBoardFrameStyle,
  getBoardFrameDimensions,
  getBoardGridStyle,
  getBoardTrialCellStyle,
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
import { safeSetPointerCapture } from '@/lib/pointer';
import { sanitizeMatrix, sanitizeNumberRecord, sanitizeStringArray } from '../snapshotGuards';
import { filterValidGridLineEdgeKeys, filterValidGridVertexKeys } from '../gridUtils';
import BoardCellMark from '../shared/BoardCellMark';
import StarMark from '../shared/StarMark';

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
  /** 星格被右键“打叉”时只改填充色，星形保留：记录这些格子。 */
  starMarkedCells: string[];
};

const BOARD_PADDING = commonBoardChrome.padding;
const BOARD_BORDER = commonBoardChrome.border;

function normalizeStarbattleSnapshot(snapshot: unknown, width: number, height: number): StarbattleSnapshot {
  const fallback = {
    grid: createEmptyStarbattleGrid(width, height),
    edgeDots: [],
    vertexDots: [],
    cellLevels: Array.from({ length: height }, () => Array(width).fill(0)),
    edgeDotLevels: {},
    vertexDotLevels: {},
    starMarkedCells: [],
  };
  const source = snapshot as Partial<StarbattleSnapshot> | null | undefined;

  return {
    grid: sanitizeMatrix(source?.grid, fallback.grid, (value) =>
      value === 0 || value === 1 || value === 2 ? value : 0
    ) as StarbattleCellState[][],
    edgeDots: filterValidGridLineEdgeKeys(sanitizeStringArray(source?.edgeDots), width, height),
    vertexDots: filterValidGridVertexKeys(sanitizeStringArray(source?.vertexDots), width, height),
    cellLevels: sanitizeMatrix(source?.cellLevels, fallback.cellLevels, (value, fallbackCell) =>
      typeof value === 'number' && Number.isFinite(value) ? value : fallbackCell
    ),
    edgeDotLevels: sanitizeNumberRecord(source?.edgeDotLevels),
    vertexDotLevels: sanitizeNumberRecord(source?.vertexDotLevels),
    starMarkedCells: sanitizeStringArray(source?.starMarkedCells).filter((key) => {
      const match = key.match(/^(\d+)-(\d+)$/);
      if (!match) return false;
      const row = Number(match[1]);
      const col = Number(match[2]);
      return row >= 0 && row < height && col >= 0 && col < width;
    }),
  };
}

/**
 * 交叉点圆形标记的自动位移：
 * 当顶点周围四格中「相邻的两格」都打了叉时，标记自动移到剩下两格
 * （它们必然也相邻）共享边的中点，提示那两格是仅剩的候选位置。
 */
function getStarbattleVertexDotPosition(
  vertexRow: number,
  vertexCol: number,
  grid: StarbattleCellState[][],
  width: number,
  height: number
): { x: number; y: number } {
  const inBounds = (r: number, c: number) => r >= 0 && r < height && c >= 0 && c < width;
  // 周围四格：左上 (vr-1,vc-1)、右上 (vr-1,vc)、左下 (vr,vc-1)、右下 (vr,vc)
  const tl = inBounds(vertexRow - 1, vertexCol - 1) ? grid[vertexRow - 1][vertexCol - 1] : null;
  const tr = inBounds(vertexRow - 1, vertexCol) ? grid[vertexRow - 1][vertexCol] : null;
  const bl = inBounds(vertexRow, vertexCol - 1) ? grid[vertexRow][vertexCol - 1] : null;
  const br = inBounds(vertexRow, vertexCol) ? grid[vertexRow][vertexCol] : null;
  if (tl === null || tr === null || bl === null || br === null) {
    // 边界顶点保持原位
    return { x: vertexCol, y: vertexRow };
  }

  const crossed = (value: StarbattleCellState | null) => value === 2;
  if (crossed(tl) && crossed(tr) && !crossed(bl) && !crossed(br)) {
    return { x: vertexCol, y: vertexRow + 0.5 };
  }
  if (crossed(bl) && crossed(br) && !crossed(tl) && !crossed(tr)) {
    return { x: vertexCol, y: vertexRow - 0.5 };
  }
  if (crossed(tl) && crossed(bl) && !crossed(tr) && !crossed(br)) {
    return { x: vertexCol + 0.5, y: vertexRow };
  }
  if (crossed(tr) && crossed(br) && !crossed(tl) && !crossed(bl)) {
    return { x: vertexCol - 0.5, y: vertexRow };
  }
  return { x: vertexCol, y: vertexRow };
}

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
  const [containerRef, viewportWidth] = useBoardContainerWidth();
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
    starMarkedCells: [],
  }), [height, width]);
  const initialSnapshotRef = useRef(initialSnapshot);
  useEffect(() => {
    initialSnapshotRef.current = initialSnapshot;
  }, [initialSnapshot]);
  const getResetSnapshot = useCallback(() => {
    return normalizeStarbattleSnapshot(initialSnapshotRef.current, width, height);
  }, [height, width]);

  const history = usePuzzleHistory<StarbattleSnapshot>(createInitialSnapshot(), {
    normalizeTrialSnapshot: (trialSnapshot) => ({
      ...normalizeStarbattleSnapshot(trialSnapshot, width, height),
      cellLevels: Array.from({ length: height }, () => Array(width).fill(0)),
      edgeDotLevels: {},
      vertexDotLevels: {},
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
    () => normalizeStarbattleSnapshot(snapshot, width, height),
    [height, snapshot, width]
  );
  const grid = normalizedSnapshot.grid;
  const cellLevels = normalizedSnapshot.cellLevels;
  const edgeDots = useMemo(() => new Set(normalizedSnapshot.edgeDots), [normalizedSnapshot.edgeDots]);
  const vertexDots = useMemo(() => new Set(normalizedSnapshot.vertexDots), [normalizedSnapshot.vertexDots]);
  const edgeDotLevels = normalizedSnapshot.edgeDotLevels;
  const vertexDotLevels = normalizedSnapshot.vertexDotLevels;
  const starMarkedCellSet = useMemo(() => new Set(normalizedSnapshot.starMarkedCells), [normalizedSnapshot.starMarkedCells]);
  const hasEdited = canUndo || canRedo || trialActive || trialCheckpointCount > 0;

  // ==================== 解题辅助：不能放星的格子提示 ====================
  // 条件一：某行/列/区已放满星星，其余格不能再放；
  // 条件二：与已放星星相邻（八邻域，含对角）的格子不能再放。
  const starImpossibleCells = useMemo(() => {
    const impossible = new Set<string>();
    const key = (r: number, c: number) => `${r}-${c}`;

    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        if (grid[r][c] !== 1) continue;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr;
            const nc = c + dc;
            if (nr < 0 || nr >= height || nc < 0 || nc >= width) continue;
            impossible.add(key(nr, nc));
          }
        }
      }
    }

    const rowCounts = Array(height).fill(0);
    const colCounts = Array(width).fill(0);
    const regionCounts = new Map<number, number>();
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        if (grid[r][c] !== 1) continue;
        rowCounts[r] += 1;
        colCounts[c] += 1;
        const regionId = puzzle.regionIds[r][c];
        regionCounts.set(regionId, (regionCounts.get(regionId) ?? 0) + 1);
      }
    }

    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        if (grid[r][c] === 1) continue;
        const regionId = puzzle.regionIds[r][c];
        if (
          rowCounts[r] >= starsPerUnit ||
          colCounts[c] >= starsPerUnit ||
          (regionCounts.get(regionId) ?? 0) >= starsPerUnit
        ) {
          impossible.add(key(r, c));
        }
      }
    }

    return impossible;
  }, [grid, height, puzzle.regionIds, starsPerUnit, width]);


  const cellSize = useMemo(() => {
    return getResponsiveCellSize({
      fixedCellSize,
      viewportWidth,
      width,
      containerWidth: true,
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

  const toggleStarMarkedCell = useCallback((key: string) => {
    applyChange((currentSnapshot) => {
      const nextStarMarked = new Set(currentSnapshot.starMarkedCells);
      if (nextStarMarked.has(key)) {
        nextStarMarked.delete(key);
      } else {
        nextStarMarked.add(key);
      }
      return {
        ...currentSnapshot,
        starMarkedCells: Array.from(nextStarMarked).sort(),
      };
    }, { coalesce: true });
  }, [applyChange]);

  const applyRightDragToCell = useCallback((row: number, col: number, mode: 'mark' | 'clear') => {
    const key = `${row}-${col}`;
    const state = grid[row][col];
    if (state === 1) {
      // 星格：只改填充色，星形保留。
      if (mode === 'mark') {
        if (!starMarkedCellSet.has(key)) toggleStarMarkedCell(key);
      } else if (starMarkedCellSet.has(key)) {
        toggleStarMarkedCell(key);
      }
      return;
    }
    if (mode === 'mark') {
      if (state === 0) updateCellState(row, col, 2);
    } else if (state === 2) {
      updateCellState(row, col, 0);
    }
  }, [grid, starMarkedCellSet, toggleStarMarkedCell, updateCellState]);

  const getRelativePoint = useCallback((clientX: number, clientY: number) => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: clientX - rect.left - BOARD_BORDER - BOARD_PADDING,
      y: clientY - rect.top - BOARD_BORDER - BOARD_PADDING,
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
    safeSetPointerCapture(boardRef.current ?? event.currentTarget, event.pointerId);

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

      const nextRightDragMode = grid[hitTarget.row][hitTarget.col] === 2 ? 'clear' : 'mark';
      // 右键按下即生效；星格只改填充色，空格画叉，叉格清除。
      applyRightDragToCell(hitTarget.row, hitTarget.col, nextRightDragMode);
      pointerState.current = {
        pointerId: event.pointerId,
        isTouch: false,
        pendingTap: null,
        cellDragMode: nextRightDragMode,
        lastCell: { row: hitTarget.row, col: hitTarget.col },
        moved: true,
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

    if (!current.isTouch) {
      applyRightDragToCell(hitTarget.row, hitTarget.col, current.cellDragMode === 'mark' ? 'mark' : 'clear');
    } else {
      applyDragToCell(hitTarget.row, hitTarget.col);
    }
  };

  const { outerWidth, outerHeight } = getBoardFrameDimensions(
    width,
    height,
    cellSize,
    { borderWidth: BOARD_BORDER, padding: BOARD_PADDING }
  );
  const dotRadius = getBoardDotRadius(cellSize, 0.16, 6);
  const { strokeWidth: boundaryStroke, outlineWidth: boundaryOutlineStroke } = getBoardBoundaryStrokeMetrics(cellSize);

  return (
    <div ref={containerRef} className="flex w-full min-w-0 max-w-full flex-col items-center gap-3">
      <div className="w-full flex justify-end">
        <div
          className="flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          style={{
            ...getBoardBadgeStyle(),
          }}
        >
          <StarMark cellSize={cellSize} size={17} />
          {copy.shared.starbattleQuota(starsPerUnit)}
        </div>
      </div>

      <div
        ref={boardRef}
        className="relative select-none touch-none"
        style={{
          width: `${outerWidth}px`,
          height: `${outerHeight}px`,
          ...getBoardFrameStyle(BOARD_BORDER),
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointer}
        onPointerLeave={finishPointer}
        onPointerCancel={finishPointer}
        onContextMenu={(event) => event.preventDefault()}
      >
        <div
          className="absolute grid"
          style={getBoardGridStyle(BOARD_PADDING, BOARD_PADDING, width, cellSize)}
        >
          {grid.flatMap((row, r) =>
            row.map((state, c) => {
              const trialColors = getTrialLevelColors(cellLevels[r][c]);
              const isInvalid = showValidationMessage && invalidCellSet.has(`${r},${c}`);
              const isMarked = state === 2;
              const isHinted = state === 0 && starImpossibleCells.has(`${r}-${c}`);
              const isStarMarked = state === 1 && starMarkedCellSet.has(`${r}-${c}`);
              // 自动提示格、星格被右键标记时，都与右键打叉格共用同一填充色。
              const baseTone = isMarked || isHinted || isStarMarked ? 'marked' as const : 'cell' as const;
              const trialStyle = trialColors
                ? getBoardTrialCellStyle(trialColors, state === 1 ? 'filled' : 'soft')
                : undefined;

              return (
                <div
                  key={`${r}-${c}`}
                  className="relative flex items-center justify-center dark:text-gray-100"
                  style={{
                    ...getBoardCellStyle(cellSize, baseTone),
                    ...(isInvalid ? getInvalidBoardCellColors(isMarked ? 'marked' : 'soft') : undefined),
                    ...trialStyle,
                  }}
                >
                  {state === 1 ? (
                    <StarMark cellSize={cellSize} />
                  ) : state === 2 ? (
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
                stroke={woodBoardTheme.deepLine}
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
                stroke={woodBoardTheme.deepLine}
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
                fill={trialColors?.line ?? woodBoardTheme.deepLine}
              />
            );
          })}

          {visibleVertexDots.map((key) => {
            const vertex = parseStarbattleVertexKey(key);
            if (!vertex) return null;
            const trialColors = getTrialLevelColors(vertexDotLevels[key] ?? 0);
            const position = getStarbattleVertexDotPosition(vertex.row, vertex.col, grid, width, height);
            return (
              <circle
                key={key}
                cx={BOARD_PADDING + position.x * cellSize}
                cy={BOARD_PADDING + position.y * cellSize}
                r={dotRadius}
                fill={trialColors?.line ?? woodBoardTheme.deepLine}
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
