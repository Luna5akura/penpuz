import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '@/i18n/useI18n';
import type { YajilinPuzzleData } from '../types';
import { usePuzzleHistory } from '../../hooks/usePuzzleHistory';
import PuzzleAssistToolbar from '../../components/PuzzleAssistToolbar';
import { ClueArrow } from './ClueArrow';
import { getClueNumberFontSize, MOBILE_CLUE_REFERENCE_SIZE } from './clueSizing';
import { commonBoardChrome, getBoardCellColors, getBoardCrossFontSize, getCrossMarkStyle, getResponsiveCellSize, woodBoardTheme } from '../boardTheme';
import {
  createEmptyYajilinGrid,
  detectYajilinHitTarget,
  getIncidentYajilinEdgeKeys,
  getYajilinEdgeKey,
  parseYajilinEdgeKey,
  type YajilinCellState,
  validateYajilin,
} from './utils';
import { getTrialLevelColors } from '../trialStyles';

interface Props {
  puzzle: YajilinPuzzleData;
  startTime: number;
  resetToken: number;
  onComplete: (time: number) => void;
  initialSnapshot?: unknown;
  onSnapshotChange?: (snapshot: unknown) => void;
  fixedCellSize?: number;
}

const BOARD_PADDING = commonBoardChrome.padding;
const BOARD_GAP = 1;
const BOARD_BORDER = commonBoardChrome.border;

type PendingTap =
  | { kind: 'desktop-left-cell'; row: number; col: number }
  | { kind: 'desktop-right-cell'; row: number; col: number }
  | { kind: 'mobile-cell'; row: number; col: number }
  | { kind: 'mobile-edge'; key: string }
  | null;

type YajilinSnapshot = {
  grid: YajilinCellState[][];
  loopEdges: string[];
  crossedEdges: string[];
  cellLevels: number[][];
  loopEdgeLevels: Record<string, number>;
  crossedEdgeLevels: Record<string, number>;
};

export default function YajilinBoard({
  puzzle,
  startTime,
  resetToken,
  onComplete,
  initialSnapshot,
  onSnapshotChange,
  fixedCellSize,
}: Props) {
  const { copy } = useI18n();
  const { width, height, clues } = puzzle;
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === 'undefined' ? 1024 : window.innerWidth
  );
  const boardRef = useRef<HTMLDivElement>(null);
  const pointerState = useRef<{
    pointerId: number | null;
    isTouch: boolean;
    startCell: { row: number; col: number } | null;
    lastCell: { row: number; col: number } | null;
    drawMode: 'add' | 'remove' | null;
    cellDragMode: 'shade-to-mark' | null;
    desktopMarkDrag: boolean;
    movedToDraw: boolean;
    pendingTap: PendingTap;
  }>({
    pointerId: null,
    isTouch: false,
    startCell: null,
    lastCell: null,
    drawMode: null,
    cellDragMode: null,
    desktopMarkDrag: false,
    movedToDraw: false,
    pendingTap: null,
  });
  const hasCompleted = useRef(false);
  const createInitialSnapshot = useCallback<YajilinSnapshot>(() => ({
    grid: createEmptyYajilinGrid(width, height),
    loopEdges: [],
    crossedEdges: [],
    cellLevels: Array.from({ length: height }, () => Array(width).fill(0)),
    loopEdgeLevels: {},
    crossedEdgeLevels: {},
  }), [height, width]);
  const getResetSnapshot = useCallback(() => {
    return (initialSnapshot as YajilinSnapshot | null) ?? createInitialSnapshot();
  }, [createInitialSnapshot, initialSnapshot]);
  const history = usePuzzleHistory<YajilinSnapshot>(createInitialSnapshot(), {
    normalizeTrialSnapshot: (trialSnapshot) => ({
      ...trialSnapshot,
      cellLevels: trialSnapshot.cellLevels.map((row) => row.map(() => 0)),
      loopEdgeLevels: {},
      crossedEdgeLevels: {},
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
  const loopEdges = useMemo(() => new Set(snapshot.loopEdges), [snapshot.loopEdges]);
  const crossedEdges = useMemo(() => new Set(snapshot.crossedEdges), [snapshot.crossedEdges]);
  const cellLevels = snapshot.cellLevels;
  const loopEdgeLevels = snapshot.loopEdgeLevels;
  const crossedEdgeLevels = snapshot.crossedEdgeLevels;
  const hasEdited = canUndo || canRedo || trialCheckpointCount > 0 || trialActive;

  const clueMap = useMemo(() => {
    const map = new Map<string, (typeof clues)[number]>();
    clues.forEach((clue, index) => {
      map.set(`${clue.row},${clue.col}`, { ...clue, index });
    });
    return map;
  }, [clues]);

  const isMobile = viewportWidth < 640;
  const cellSize = useMemo(() => {
    return getResponsiveCellSize({
      fixedCellSize,
      viewportWidth,
      width,
      columnGap: BOARD_GAP,
    });
  }, [fixedCellSize, viewportWidth, width]);

  const clueNumberFontSize = useMemo(() => getClueNumberFontSize(cellSize), [cellSize]);
  const verticalClueNumberTop = useMemo(() => {
    if (cellSize >= MOBILE_CLUE_REFERENCE_SIZE) return Math.floor(cellSize * 0.5);
    return Math.max(15, Math.floor(cellSize * 0.5));
  }, [cellSize]);
  const horizontalClueNumberTop = useMemo(() => {
    if (cellSize >= MOBILE_CLUE_REFERENCE_SIZE) return Math.floor(cellSize * 0.52);
    return Math.max(16, Math.floor(cellSize * 0.52));
  }, [cellSize]);

  const validation = useMemo(
    () => (hasEdited ? validateYajilin(grid, loopEdges, clues, width, height) : null),
    [clues, grid, hasEdited, height, loopEdges, width]
  );

  useEffect(() => {
    const updateSize = () => {
      setViewportWidth(window.innerWidth);
    };

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
      startCell: null,
      lastCell: null,
      drawMode: null,
      cellDragMode: null,
      desktopMarkDrag: false,
      movedToDraw: false,
      pendingTap: null,
    };
    hasCompleted.current = false;
  }, [getResetSnapshot, reset]);

  useEffect(() => {
    resetBoard();
  }, [puzzle, resetBoard, resetToken]);

  const isClueCell = useCallback((row: number, col: number) => clueMap.has(`${row},${col}`), [clueMap]);

  const canLoopPassCell = useCallback((row: number, col: number) => {
    return !isClueCell(row, col) && grid[row][col] !== 1;
  }, [grid, isClueCell]);

  const canUseLoopEdge = useCallback((edgeKey: string) => {
    const edge = parseYajilinEdgeKey(edgeKey);
    if (!edge) return false;
    return canLoopPassCell(edge.r1, edge.c1) && canLoopPassCell(edge.r2, edge.c2);
  }, [canLoopPassCell]);

  const removeIncidentLoopEdges = useCallback((loopEdgesSet: Set<string>, row: number, col: number) => {
    const incident = getIncidentYajilinEdgeKeys(row, col, width, height);
    incident.forEach((key) => {
      loopEdgesSet.delete(key);
    });
  }, [height, width]);

  const toggleCellShade = useCallback((row: number, col: number) => {
    if (isClueCell(row, col)) return;
    applyChange((currentSnapshot) => {
      const nextGrid = currentSnapshot.grid.map((currentRow) => [...currentRow]);
      const nextCellLevels = currentSnapshot.cellLevels.map((currentRow) => [...currentRow]);
      const nextLoopEdges = new Set(currentSnapshot.loopEdges);
      const nextLoopEdgeLevels = { ...currentSnapshot.loopEdgeLevels };
      nextGrid[row][col] = currentSnapshot.grid[row][col] === 1 ? 0 : 1;
      nextCellLevels[row][col] = nextGrid[row][col] === 0 ? 0 : trialActive ? currentTrialLevel : 0;
      removeIncidentLoopEdges(nextLoopEdges, row, col);
      getIncidentYajilinEdgeKeys(row, col, width, height).forEach((key) => {
        delete nextLoopEdgeLevels[key];
      });
      return {
        ...currentSnapshot,
        grid: nextGrid,
        loopEdges: Array.from(nextLoopEdges).sort(),
        cellLevels: nextCellLevels,
        loopEdgeLevels: nextLoopEdgeLevels,
      };
    }, { coalesce: true });
  }, [applyChange, currentTrialLevel, isClueCell, removeIncidentLoopEdges, trialActive, width, height]);

  const cycleMobileCell = useCallback((row: number, col: number) => {
    if (isClueCell(row, col)) return;
    applyChange((currentSnapshot) => {
      const nextGrid = currentSnapshot.grid.map((currentRow) => [...currentRow]);
      const nextCellLevels = currentSnapshot.cellLevels.map((currentRow) => [...currentRow]);
      const nextLoopEdges = new Set(currentSnapshot.loopEdges);
      const nextLoopEdgeLevels = { ...currentSnapshot.loopEdgeLevels };
      const currentCell = currentSnapshot.grid[row][col];
      nextGrid[row][col] = currentCell === 0 ? 1 : currentCell === 1 ? 2 : 0;
      nextCellLevels[row][col] = nextGrid[row][col] === 0 ? 0 : trialActive ? currentTrialLevel : 0;
      removeIncidentLoopEdges(nextLoopEdges, row, col);
      getIncidentYajilinEdgeKeys(row, col, width, height).forEach((key) => {
        delete nextLoopEdgeLevels[key];
      });
      return {
        ...currentSnapshot,
        grid: nextGrid,
        loopEdges: Array.from(nextLoopEdges).sort(),
        cellLevels: nextCellLevels,
        loopEdgeLevels: nextLoopEdgeLevels,
      };
    }, { coalesce: true });
  }, [applyChange, currentTrialLevel, isClueCell, removeIncidentLoopEdges, trialActive, width, height]);

  const toggleCellMark = useCallback((row: number, col: number) => {
    if (isClueCell(row, col)) return;
    applyChange((currentSnapshot) => {
      const nextGrid = currentSnapshot.grid.map((currentRow) => [...currentRow]);
      const nextCellLevels = currentSnapshot.cellLevels.map((currentRow) => [...currentRow]);
      const nextLoopEdges = new Set(currentSnapshot.loopEdges);
      const nextLoopEdgeLevels = { ...currentSnapshot.loopEdgeLevels };
      nextGrid[row][col] = currentSnapshot.grid[row][col] === 2 ? 0 : 2;
      nextCellLevels[row][col] = nextGrid[row][col] === 0 ? 0 : trialActive ? currentTrialLevel : 0;
      removeIncidentLoopEdges(nextLoopEdges, row, col);
      getIncidentYajilinEdgeKeys(row, col, width, height).forEach((key) => {
        delete nextLoopEdgeLevels[key];
      });
      return {
        ...currentSnapshot,
        grid: nextGrid,
        loopEdges: Array.from(nextLoopEdges).sort(),
        cellLevels: nextCellLevels,
        loopEdgeLevels: nextLoopEdgeLevels,
      };
    }, { coalesce: true });
  }, [applyChange, currentTrialLevel, isClueCell, removeIncidentLoopEdges, trialActive, width, height]);

  const toggleEdgeCross = useCallback((edgeKey: string) => {
    applyChange((currentSnapshot) => {
      const nextCrossedEdges = new Set(currentSnapshot.crossedEdges);
      const nextLoopEdges = new Set(currentSnapshot.loopEdges);
      const nextCrossedEdgeLevels = { ...currentSnapshot.crossedEdgeLevels };
      const nextLoopEdgeLevels = { ...currentSnapshot.loopEdgeLevels };
      if (nextCrossedEdges.has(edgeKey)) nextCrossedEdges.delete(edgeKey);
      else nextCrossedEdges.add(edgeKey);
      nextLoopEdges.delete(edgeKey);
      if (nextCrossedEdges.has(edgeKey)) nextCrossedEdgeLevels[edgeKey] = trialActive ? currentTrialLevel : 0;
      else delete nextCrossedEdgeLevels[edgeKey];
      delete nextLoopEdgeLevels[edgeKey];
      return {
        ...currentSnapshot,
        crossedEdges: Array.from(nextCrossedEdges).sort(),
        loopEdges: Array.from(nextLoopEdges).sort(),
        crossedEdgeLevels: nextCrossedEdgeLevels,
        loopEdgeLevels: nextLoopEdgeLevels,
      };
    }, { coalesce: true });
  }, [applyChange, currentTrialLevel, trialActive]);

  const toggleLoopEdge = useCallback((edgeKey: string) => {
    if (!canUseLoopEdge(edgeKey)) return;
    applyChange((currentSnapshot) => {
      const nextLoopEdges = new Set(currentSnapshot.loopEdges);
      const nextCrossedEdges = new Set(currentSnapshot.crossedEdges);
      const nextLoopEdgeLevels = { ...currentSnapshot.loopEdgeLevels };
      const nextCrossedEdgeLevels = { ...currentSnapshot.crossedEdgeLevels };
      if (nextLoopEdges.has(edgeKey)) nextLoopEdges.delete(edgeKey);
      else nextLoopEdges.add(edgeKey);
      nextCrossedEdges.delete(edgeKey);
      if (nextLoopEdges.has(edgeKey)) nextLoopEdgeLevels[edgeKey] = trialActive ? currentTrialLevel : 0;
      else delete nextLoopEdgeLevels[edgeKey];
      delete nextCrossedEdgeLevels[edgeKey];
      return {
        ...currentSnapshot,
        loopEdges: Array.from(nextLoopEdges).sort(),
        crossedEdges: Array.from(nextCrossedEdges).sort(),
        loopEdgeLevels: nextLoopEdgeLevels,
        crossedEdgeLevels: nextCrossedEdgeLevels,
      };
    }, { coalesce: true });
  }, [applyChange, canUseLoopEdge, currentTrialLevel, trialActive]);

  const applyLoopSegment = useCallback((from: { row: number; col: number }, to: { row: number; col: number }) => {
    const edgeKey = getYajilinEdgeKey(from.row, from.col, to.row, to.col);
    if (!edgeKey) return;
    if (!canUseLoopEdge(edgeKey)) return;
    const current = pointerState.current;
    if (current.drawMode === null) {
      current.drawMode = loopEdges.has(edgeKey) ? 'remove' : 'add';
    }

    applyChange((currentSnapshot) => {
      const nextLoopEdges = new Set(currentSnapshot.loopEdges);
      const nextCrossedEdges = new Set(currentSnapshot.crossedEdges);
      const nextLoopEdgeLevels = { ...currentSnapshot.loopEdgeLevels };
      const nextCrossedEdgeLevels = { ...currentSnapshot.crossedEdgeLevels };
      if (current.drawMode === 'add') nextLoopEdges.add(edgeKey);
      else nextLoopEdges.delete(edgeKey);
      if (current.drawMode === 'add') nextCrossedEdges.delete(edgeKey);
      if (current.drawMode === 'add') nextLoopEdgeLevels[edgeKey] = trialActive ? currentTrialLevel : 0;
      else delete nextLoopEdgeLevels[edgeKey];
      if (current.drawMode === 'add') delete nextCrossedEdgeLevels[edgeKey];
      return {
        ...currentSnapshot,
        loopEdges: Array.from(nextLoopEdges).sort(),
        crossedEdges: Array.from(nextCrossedEdges).sort(),
        loopEdgeLevels: nextLoopEdgeLevels,
        crossedEdgeLevels: nextCrossedEdgeLevels,
      };
    }, { coalesce: true });

    current.movedToDraw = true;
    current.pendingTap = null;
    current.lastCell = to;
  }, [applyChange, canUseLoopEdge, currentTrialLevel, loopEdges, trialActive]);

  const applyCellMarkDrag = useCallback((row: number, col: number) => {
    if (isClueCell(row, col)) return;
    const current = pointerState.current;
    if (current.drawMode === null) {
      current.drawMode = grid[row][col] === 2 ? 'remove' : 'add';
    }

    const shouldMark = current.drawMode === 'add';
    if ((grid[row][col] === 2) === shouldMark) {
      current.pendingTap = null;
      current.movedToDraw = true;
      current.lastCell = { row, col };
      return;
    }

    applyChange((currentSnapshot) => {
      if (isClueCell(row, col)) return currentSnapshot;
      const nextGrid = currentSnapshot.grid.map((currentRow) => [...currentRow]);
      const nextCellLevels = currentSnapshot.cellLevels.map((currentRow) => [...currentRow]);
      const nextLoopEdges = new Set(currentSnapshot.loopEdges);
      const nextLoopEdgeLevels = { ...currentSnapshot.loopEdgeLevels };
      nextGrid[row][col] = shouldMark ? 2 : 0;
      nextCellLevels[row][col] = shouldMark && trialActive ? currentTrialLevel : 0;
      removeIncidentLoopEdges(nextLoopEdges, row, col);
      getIncidentYajilinEdgeKeys(row, col, width, height).forEach((key) => {
        delete nextLoopEdgeLevels[key];
      });
      return {
        ...currentSnapshot,
        grid: nextGrid,
        loopEdges: Array.from(nextLoopEdges).sort(),
        cellLevels: nextCellLevels,
        loopEdgeLevels: nextLoopEdgeLevels,
      };
    }, { coalesce: true });

    current.pendingTap = null;
    current.movedToDraw = true;
    current.lastCell = { row, col };
  }, [applyChange, currentTrialLevel, grid, height, isClueCell, removeIncidentLoopEdges, trialActive, width]);

  const replaceCellState = useCallback((row: number, col: number, nextState: 0 | 2) => {
    if (isClueCell(row, col)) return;
    applyChange((currentSnapshot) => {
      if (currentSnapshot.grid[row][col] === nextState) return currentSnapshot;
      const nextGrid = currentSnapshot.grid.map((currentRow) => [...currentRow]);
      const nextCellLevels = currentSnapshot.cellLevels.map((currentRow) => [...currentRow]);
      const nextLoopEdges = new Set(currentSnapshot.loopEdges);
      const nextLoopEdgeLevels = { ...currentSnapshot.loopEdgeLevels };
      nextGrid[row][col] = nextState;
      nextCellLevels[row][col] = nextState === 0 ? 0 : trialActive ? currentTrialLevel : 0;
      removeIncidentLoopEdges(nextLoopEdges, row, col);
      getIncidentYajilinEdgeKeys(row, col, width, height).forEach((key) => {
        delete nextLoopEdgeLevels[key];
      });
      return {
        ...currentSnapshot,
        grid: nextGrid,
        loopEdges: Array.from(nextLoopEdges).sort(),
        cellLevels: nextCellLevels,
        loopEdgeLevels: nextLoopEdgeLevels,
      };
    }, { coalesce: true });
  }, [applyChange, currentTrialLevel, height, isClueCell, removeIncidentLoopEdges, trialActive, width]);

  const getRelativePoint = useCallback((clientX: number, clientY: number) => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: clientX - rect.left - BOARD_PADDING,
      y: clientY - rect.top - BOARD_PADDING,
    };
  }, []);

  const getCellFromPoint = useCallback((x: number, y: number) => {
    const step = cellSize + BOARD_GAP;
    const col = Math.floor(x / step);
    const row = Math.floor(y / step);
    if (row < 0 || row >= height || col < 0 || col >= width) return null;
    return { row, col };
  }, [cellSize, height, width]);

  const finishPointer = useCallback(() => {
    const current = pointerState.current;
    if (current.pendingTap?.kind === 'desktop-left-cell') {
      toggleCellShade(current.pendingTap.row, current.pendingTap.col);
    } else if (current.pendingTap?.kind === 'desktop-right-cell') {
      toggleCellMark(current.pendingTap.row, current.pendingTap.col);
    } else if (current.pendingTap?.kind === 'mobile-cell') {
      cycleMobileCell(current.pendingTap.row, current.pendingTap.col);
    } else if (current.pendingTap?.kind === 'mobile-edge') {
      toggleEdgeCross(current.pendingTap.key);
    }

    pointerState.current = {
      pointerId: null,
      isTouch: false,
      startCell: null,
      lastCell: null,
      drawMode: null,
      cellDragMode: null,
      movedToDraw: false,
      pendingTap: null,
    };
    finishBatch();
  }, [cycleMobileCell, finishBatch, toggleCellMark, toggleCellShade, toggleEdgeCross]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const point = getRelativePoint(event.clientX, event.clientY);
    if (!point) return;

    const hitTarget = detectYajilinHitTarget(point.x, point.y, width, height, cellSize, BOARD_GAP);
    const button = event.button;
    const isTouchPointer = event.pointerType === 'touch' || (button === 0 && isMobile);

    if (!hitTarget) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    if (!isTouchPointer && button === 2) {
      if (hitTarget.kind === 'edge') {
        toggleEdgeCross(hitTarget.key);
        return;
      }
      if (hitTarget.kind === 'cell' && !isClueCell(hitTarget.row, hitTarget.col)) {
        const current = pointerState.current;
        current.pointerId = event.pointerId;
        current.isTouch = false;
        current.startCell = { row: hitTarget.row, col: hitTarget.col };
        current.lastCell = { row: hitTarget.row, col: hitTarget.col };
        current.drawMode = null;
        current.cellDragMode = null;
        current.desktopMarkDrag = true;
        current.movedToDraw = false;
        current.pendingTap = { kind: 'desktop-right-cell', row: hitTarget.row, col: hitTarget.col };
        startBatch();
      }
      return;
    }

    if (!isTouchPointer && button !== 0) return;

    const current = pointerState.current;
    current.pointerId = event.pointerId;
    current.isTouch = isTouchPointer;
    current.drawMode = null;
    current.cellDragMode = null;
    current.desktopMarkDrag = false;
    current.movedToDraw = false;
    current.pendingTap = null;
    startBatch();

    if (hitTarget.kind === 'edge') {
      if (isTouchPointer) {
        current.pendingTap = { kind: 'mobile-edge', key: hitTarget.key };
        current.startCell = hitTarget.cells[0];
        current.lastCell = hitTarget.cells[0];
      } else {
        toggleLoopEdge(hitTarget.key);
      }
      return;
    }

    if (isClueCell(hitTarget.row, hitTarget.col)) return;

    current.startCell = { row: hitTarget.row, col: hitTarget.col };
    current.lastCell = { row: hitTarget.row, col: hitTarget.col };
    current.cellDragMode = isTouchPointer
      ? grid[hitTarget.row][hitTarget.col] === 1
        ? 'shade-to-mark'
        : null
      : null;
    current.pendingTap = isTouchPointer
      ? { kind: 'mobile-cell', row: hitTarget.row, col: hitTarget.col }
      : { kind: 'desktop-left-cell', row: hitTarget.row, col: hitTarget.col };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const current = pointerState.current;
    if (current.pointerId !== event.pointerId || !current.startCell) return;

    const point = getRelativePoint(event.clientX, event.clientY);
    if (!point) return;
    const cell = getCellFromPoint(point.x, point.y);
    if (!cell) return;

    if (current.desktopMarkDrag) {
      const sameCell = current.lastCell?.row === cell.row && current.lastCell?.col === cell.col;
      if (sameCell) return;
      applyCellMarkDrag(cell.row, cell.col);
      return;
    }

    if (current.isTouch && current.cellDragMode) {
      if (!current.lastCell || !current.startCell) return;
      const sameCell = current.lastCell.row === cell.row && current.lastCell.col === cell.col;
      if (sameCell) return;
      if (Math.abs(current.lastCell.row - cell.row) + Math.abs(current.lastCell.col - cell.col) !== 1) return;

      const targetState = 2;
      if (!current.movedToDraw) {
        replaceCellState(current.startCell.row, current.startCell.col, targetState);
      }
      replaceCellState(cell.row, cell.col, targetState);
      current.movedToDraw = true;
      current.pendingTap = null;
      current.lastCell = cell;
      return;
    }

    if (isClueCell(cell.row, cell.col) || grid[cell.row][cell.col] === 1) return;

    if (!current.lastCell) {
      current.lastCell = cell;
      return;
    }

    const sameCell = current.lastCell.row === cell.row && current.lastCell.col === cell.col;
    if (sameCell) return;

    if (Math.abs(current.lastCell.row - cell.row) + Math.abs(current.lastCell.col - cell.col) !== 1) return;

    applyLoopSegment(current.lastCell, cell);
  };

  const boardWidthPx = width * cellSize + (width - 1) * BOARD_GAP + BOARD_PADDING * 2;
  const boardHeightPx = height * cellSize + (height - 1) * BOARD_GAP + BOARD_PADDING * 2;
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={boardRef}
        className="relative select-none touch-none"
        style={{
          width: `${boardWidthPx + BOARD_BORDER * 2}px`,
          height: `${boardHeightPx + BOARD_BORDER * 2}px`,
          padding: `${BOARD_PADDING}px`,
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
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${width}, ${cellSize}px)`,
            gap: `${BOARD_GAP}px`,
            background: woodBoardTheme.gridLine,
          }}
        >
          {grid.flatMap((row, r) =>
            row.map((state, c) => {
              const clue = clueMap.get(`${r},${c}`);
              const isShaded = state === 1;
              const isMarked = state === 2;
              const trialColors = getTrialLevelColors(cellLevels[r][c]);
              const cellStyle = !clue && trialColors
                ? isShaded
                  ? { background: trialColors.fill, color: woodBoardTheme.shadedText }
                  : isMarked
                    ? { background: trialColors.softFill, color: trialColors.text }
                    : undefined
                : undefined;
              return (
                <div
                  key={`${r}-${c}`}
                  className="relative flex items-center justify-center font-semibold tabular-nums tracking-tight dark:text-gray-100"
                  style={{
                    width: `${cellSize}px`,
                    height: `${cellSize}px`,
                    paddingTop: clue ? '0px' : '2px',
                    ...getBoardCellColors(clue ? 'clue' : isShaded ? 'shaded' : isMarked ? 'marked' : 'cell'),
                    ...cellStyle,
                  }}
                >
                  {clue ? (
                    <div className="relative w-full h-full">
                      <ClueArrow direction={clue.direction} cellSize={cellSize} />
                      <span
                        className="absolute leading-none font-semibold tabular-nums"
                        style={{
                          left: clue.direction === 'up' || clue.direction === 'down' ? `${Math.floor(cellSize * 0.5)}px` : '50%',
                          top:
                            clue.direction === 'left' || clue.direction === 'right'
                              ? `${horizontalClueNumberTop}px`
                              : `${verticalClueNumberTop}px`,
                          transform: 'translate(-50%, -50%)',
                          fontSize: `${clueNumberFontSize}px`,
                          lineHeight: 1,
                        }}
                      >
                        {clue.value}
                      </span>
                    </div>
                  ) : isMarked ? (
                    <span style={getCrossMarkStyle(getBoardCrossFontSize(cellSize))}>×</span>
                  ) : null}
                </div>
              );
            })
          )}
        </div>

        <svg
          className="absolute top-0 left-0 pointer-events-none"
          width={boardWidthPx}
          height={boardHeightPx}
        >
          {[...loopEdges].map((edgeKey) => {
            const edge = parseYajilinEdgeKey(edgeKey);
            if (!edge) return null;
            const trialColors = getTrialLevelColors(loopEdgeLevels[edgeKey] ?? 0);

            const x1 = BOARD_PADDING + edge.c1 * (cellSize + BOARD_GAP) + cellSize / 2;
            const y1 = BOARD_PADDING + edge.r1 * (cellSize + BOARD_GAP) + cellSize / 2;
            const x2 = BOARD_PADDING + edge.c2 * (cellSize + BOARD_GAP) + cellSize / 2;
            const y2 = BOARD_PADDING + edge.r2 * (cellSize + BOARD_GAP) + cellSize / 2;

            return (
              <line
                key={edgeKey}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={trialColors?.line ?? woodBoardTheme.ink}
                strokeWidth={Math.max(2.5, Math.floor(cellSize * 0.08))}
                strokeLinecap="round"
              />
            );
          })}

          {[...crossedEdges].map((edgeKey) => {
            const edge = parseYajilinEdgeKey(edgeKey);
            if (!edge) return null;
            const trialColors = getTrialLevelColors(crossedEdgeLevels[edgeKey] ?? 0);

            const centerX = BOARD_PADDING + ((edge.c1 + edge.c2) / 2) * (cellSize + BOARD_GAP) + cellSize / 2;
            const centerY = BOARD_PADDING + ((edge.r1 + edge.r2) / 2) * (cellSize + BOARD_GAP) + cellSize / 2;
            const size = Math.max(3, Math.floor(cellSize * 0.07));

            return (
              <g
                key={`cross-${edgeKey}`}
                stroke={trialColors?.text ?? woodBoardTheme.border}
                strokeWidth="1.6"
                strokeLinecap="round"
              >
                <line x1={centerX - size} y1={centerY - size} x2={centerX + size} y2={centerY + size} />
                <line x1={centerX - size} y1={centerY + size} x2={centerX + size} y2={centerY - size} />
              </g>
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

      {/* {validation?.message && (
        <div className="text-sm text-muted-foreground dark:text-gray-400 text-center">
          {validation.message}
        </div>
      )} */}
    </div>
  );
}
