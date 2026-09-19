import { useCallback, useEffect, useMemo, useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { useI18n } from '@/i18n/useI18n';
import PuzzleAssistToolbar from '@/components/PuzzleAssistToolbar';
import ValidationMessage from '@/components/ValidationMessage';
import { usePuzzleHistory } from '@/hooks/usePuzzleHistory';
import { safeSetPointerCapture } from '@/lib/pointer';
import type { PillsPuzzleData } from '../types';
import type { ShadingCellState } from '../shared/ShadingBoard';
import { filterValidGridLineEdgeKeys, getGridLineEdgeKey } from '../gridUtils';
import { sanitizeMatrix, sanitizeNumberRecord, sanitizeStringArray } from '../snapshotGuards';
import { getTrialLevelColors } from '../trialStyles';
import { useBoardContainerWidth } from '../useBoardContainerWidth';
import {
  boardClassNames,
  commonBoardChrome,
  getBoardCellStyle,
  getBoardEdgeHitThreshold,
  getBoardFrameDimensions,
  getBoardFrameStyle,
  getBoardGridStyle,
  getBoardOutsideClueLayout,
  getBoardOutsideClueTextStyle,
  getBoardPillCapsuleMetrics,
  getBoardTextStyle,
  getBoardVertexHitRadius,
  getLoopLineStrokeWidth,
  getResponsiveCellSize,
  woodBoardTheme,
} from '../boardTheme';
import { getPillComponents, getPillsPipsLayout, validatePills } from './utils';

interface Props {
  puzzle: PillsPuzzleData;
  startTime: number;
  resetToken: number;
  onComplete: (time: number) => void;
  initialSnapshot?: unknown;
  onSnapshotChange?: (snapshot: unknown) => void;
  fixedCellSize?: number;
  showValidationMessage?: boolean;
}

interface PillsSnapshot {
  grid: ShadingCellState[][];
  gridLevels: number[][];
  lineEdges: string[];
  lineLevels: Record<string, number>;
}

type DragMode = 'add-line' | 'remove-line';
type VertexCoord = { row: number; col: number };

const BOARD_PADDING = commonBoardChrome.padding;
const BOARD_BORDER = commonBoardChrome.border;

function normalizePillsSnapshot(snapshot: unknown, width: number, height: number): PillsSnapshot {
  const source = snapshot as Partial<PillsSnapshot> | null | undefined;
  const fallback = {
    grid: Array.from({ length: height }, () => Array(width).fill(0) as ShadingCellState[]),
    levels: Array.from({ length: height }, () => Array(width).fill(0)),
  };
  return {
    grid: sanitizeMatrix(source?.grid, fallback.grid, (value) =>
      value === 1 ? 1 : 0
    ) as ShadingCellState[][],
    gridLevels: sanitizeMatrix(source?.gridLevels, fallback.levels, (value, fallbackCell) =>
      typeof value === 'number' && Number.isFinite(value) ? value : fallbackCell
    ),
    lineEdges: filterValidGridLineEdgeKeys(sanitizeStringArray(source?.lineEdges), width, height),
    lineLevels: sanitizeNumberRecord(source?.lineLevels),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function distanceToRange(value: number, start: number, end: number) {
  if (value < start) return start - value;
  if (value > end) return value - end;
  return 0;
}

function detectVertexAtPoint(x: number, y: number, width: number, height: number, cellSize: number): VertexCoord | null {
  const boardWidth = width * cellSize;
  const boardHeight = height * cellSize;
  const threshold = getBoardVertexHitRadius(cellSize);

  if (x < -threshold || x > boardWidth + threshold || y < -threshold || y > boardHeight + threshold) {
    return null;
  }

  const col = Math.round(x / cellSize);
  const row = Math.round(y / cellSize);
  if (row < 0 || row > height || col < 0 || col > width) return null;

  const vertexX = col * cellSize;
  const vertexY = row * cellSize;
  if (Math.hypot(x - vertexX, y - vertexY) > threshold) return null;

  return { row, col };
}

function detectEdgeAtPoint(x: number, y: number, width: number, height: number, cellSize: number): string | null {
  const boardWidth = width * cellSize;
  const boardHeight = height * cellSize;
  const threshold = getBoardEdgeHitThreshold(cellSize);

  if (x < -threshold || x > boardWidth + threshold || y < -threshold || y > boardHeight + threshold) {
    return null;
  }

  const candidates: Array<{ distance: number; key: string }> = [];
  const horizontalRow = Math.round(y / cellSize);
  if (horizontalRow >= 0 && horizontalRow <= height) {
    const horizontalCol = clamp(Math.floor(x / cellSize), 0, width - 1);
    const segmentStart = horizontalCol * cellSize;
    candidates.push({
      distance: Math.hypot(y - horizontalRow * cellSize, distanceToRange(x, segmentStart, segmentStart + cellSize)),
      key: getGridLineEdgeKey('h', horizontalRow, horizontalCol),
    });
  }

  const verticalCol = Math.round(x / cellSize);
  if (verticalCol >= 0 && verticalCol <= width) {
    const verticalRow = clamp(Math.floor(y / cellSize), 0, height - 1);
    const segmentStart = verticalRow * cellSize;
    candidates.push({
      distance: Math.hypot(x - verticalCol * cellSize, distanceToRange(y, segmentStart, segmentStart + cellSize)),
      key: getGridLineEdgeKey('v', verticalRow, verticalCol),
    });
  }

  const best = candidates.sort((left, right) => left.distance - right.distance)[0];
  return best && best.distance <= threshold ? best.key : null;
}

function getSnappedVertexForEdge(key: string, x: number, y: number, cellSize: number): VertexCoord | null {
  const match = key.match(/^([hv])-(\d+)-(\d+)$/);
  if (!match) return null;
  const [, orientation, rowText, colText] = match;
  const row = Number(rowText);
  const col = Number(colText);

  if (orientation === 'h') {
    const leftX = col * cellSize;
    const rightX = (col + 1) * cellSize;
    const leftDistance = Math.hypot(x - leftX, y - row * cellSize);
    const rightDistance = Math.hypot(x - rightX, y - row * cellSize);
    return leftDistance <= rightDistance ? { row, col } : { row, col: col + 1 };
  }

  const topY = row * cellSize;
  const bottomY = (row + 1) * cellSize;
  const topDistance = Math.hypot(x - col * cellSize, y - topY);
  const bottomDistance = Math.hypot(x - col * cellSize, y - bottomY);
  return topDistance <= bottomDistance ? { row, col } : { row: row + 1, col };
}

function detectDraggedVertexTarget(
  x: number,
  y: number,
  width: number,
  height: number,
  cellSize: number,
  lastVertex: VertexCoord
): VertexCoord | null {
  const directHit = detectVertexAtPoint(x, y, width, height, cellSize);
  if (directHit) return directHit;

  const lastX = lastVertex.col * cellSize;
  const lastY = lastVertex.row * cellSize;
  const dx = x - lastX;
  const dy = y - lastY;
  const corridor = Math.max(12, Math.floor(cellSize * 0.26));
  const minAdvance = cellSize * 0.5;

  if (Math.abs(dy) <= corridor && Math.abs(dx) >= minAdvance && Math.abs(dx) >= Math.abs(dy)) {
    const stepCount = Math.max(1, Math.round(Math.abs(dx) / cellSize));
    const col = clamp(lastVertex.col + Math.sign(dx) * stepCount, 0, width);
    return { row: lastVertex.row, col };
  }

  if (Math.abs(dx) <= corridor && Math.abs(dy) >= minAdvance && Math.abs(dy) > Math.abs(dx)) {
    const stepCount = Math.max(1, Math.round(Math.abs(dy) / cellSize));
    const row = clamp(lastVertex.row + Math.sign(dy) * stepCount, 0, height);
    return { row, col: lastVertex.col };
  }

  return null;
}

function areSameVertex(a: VertexCoord, b: VertexCoord) {
  return a.row === b.row && a.col === b.col;
}

function getDraggedEdgeKeys(from: VertexCoord, to: VertexCoord): string[] {
  if (areSameVertex(from, to)) return [];

  if (from.row === to.row) {
    const step = from.col <= to.col ? 1 : -1;
    const keys: string[] = [];
    for (let col = from.col + step; step > 0 ? col <= to.col : col >= to.col; col += step) {
      keys.push(getGridLineEdgeKey('h', from.row, step > 0 ? col - 1 : col));
    }
    return keys;
  }

  if (from.col === to.col) {
    const step = from.row <= to.row ? 1 : -1;
    const keys: string[] = [];
    for (let row = from.row + step; step > 0 ? row <= to.row : row >= to.row; row += step) {
      keys.push(getGridLineEdgeKey('v', step > 0 ? row - 1 : row, from.col));
    }
    return keys;
  }

  return [];
}

function detectCellAtPoint(x: number, y: number, width: number, height: number, cellSize: number): { row: number; col: number } | null {
  if (x < 0 || x >= width * cellSize || y < 0 || y >= height * cellSize) return null;
  return { row: Math.floor(y / cellSize), col: Math.floor(x / cellSize) };
}

export default function PillsBoard({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange, fixedCellSize, showValidationMessage = false }: Props) {
  const { width, height } = puzzle;
  const { locale } = useI18n();
  const [containerRef, viewportWidth] = useBoardContainerWidth();
  const boardRef = useRef<HTMLDivElement>(null);
  const pointerState = useRef<{
    pointerId: number | null;
    mode: DragMode | null;
    cellMode: 'add-cell' | 'remove-cell' | null;
    lastVertex: VertexCoord | null;
    visitedKeys: Set<string>;
    visitedCells: Set<string>;
  }>({ pointerId: null, mode: null, cellMode: null, lastVertex: null, visitedKeys: new Set(), visitedCells: new Set() });
  const hasCompleted = useRef(false);

  const createInitialSnapshot = useCallback<() => PillsSnapshot>(() => ({
    grid: Array.from({ length: height }, () => Array(width).fill(0)),
    gridLevels: Array.from({ length: height }, () => Array(width).fill(0)),
    lineEdges: [],
    lineLevels: {},
  }), [height, width]);
  const getResetSnapshot = useCallback(
    () => normalizePillsSnapshot(initialSnapshot, width, height),
    [height, initialSnapshot, width]
  );

  const history = usePuzzleHistory<PillsSnapshot>(createInitialSnapshot(), {
    normalizeTrialSnapshot: (trialSnapshot) => ({
      ...normalizePillsSnapshot(trialSnapshot, width, height),
      gridLevels: Array.from({ length: height }, () => Array(width).fill(0)),
      lineLevels: {},
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
    () => normalizePillsSnapshot(snapshot, width, height),
    [height, snapshot, width]
  );
  const lineSet = useMemo(() => new Set(normalizedSnapshot.lineEdges), [normalizedSnapshot.lineEdges]);
  const validation = useMemo(
    () => validatePills(normalizedSnapshot.grid, normalizedSnapshot.lineEdges, puzzle),
    [normalizedSnapshot.grid, normalizedSnapshot.lineEdges, puzzle]
  );
  // Battleship-style capsule rendering: marked cells connect in any
  // direction (unless separated by unmarked cells or a drawn separator),
  // and each component is drawn as a rounded capsule bar.
  const capsuleSegments = useMemo(
    () => getPillComponents(normalizedSnapshot.grid, normalizedSnapshot.lineEdges, width, height),
    [height, normalizedSnapshot.grid, normalizedSnapshot.lineEdges, width]
  );
  const visibleValidation = showValidationMessage ? validation : null;
  const cellSize = useMemo(
    () => getResponsiveCellSize({ fixedCellSize, viewportWidth, width, containerWidth: true }),
    [fixedCellSize, viewportWidth, width]
  );

  const resetBoard = useCallback(() => {
    reset(getResetSnapshot());
    pointerState.current = { pointerId: null, mode: null, cellMode: null, lastVertex: null, visitedKeys: new Set(), visitedCells: new Set() };
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

  const outsideClueLayout = useMemo(
    () => getBoardOutsideClueLayout(cellSize, { top: puzzle.topClues, left: puzzle.leftClues }),
    [cellSize, puzzle.leftClues, puzzle.topClues]
  );
  const gridLeft = BOARD_PADDING + outsideClueLayout.left;
  const gridTop = BOARD_PADDING + outsideClueLayout.top;
  const { outerWidth, outerHeight } = getBoardFrameDimensions(width, height, cellSize, {
    borderWidth: BOARD_BORDER,
    padding: BOARD_PADDING,
    outsideTop: outsideClueLayout.top,
    outsideLeft: outsideClueLayout.left,
  });
  const lineStroke = getLoopLineStrokeWidth(cellSize);

  const getBoardPointerPoint = useCallback((clientX: number, clientY: number, rect: DOMRect) => ({
    x: clientX - rect.left - BOARD_BORDER - gridLeft,
    y: clientY - rect.top - BOARD_BORDER - gridTop,
  }), [gridLeft, gridTop]);

  const toggleCell = useCallback((row: number, col: number, forceMode?: 'add-cell' | 'remove-cell') => {
    applyChange((currentSnapshot) => {
      const current = normalizePillsSnapshot(currentSnapshot, width, height);
      const mode = forceMode ?? (current.grid[row]?.[col] === 1 ? 'remove-cell' : 'add-cell');
      if (mode === 'remove-cell' && current.grid[row]?.[col] !== 1) return current;
      if (mode === 'add-cell' && current.grid[row]?.[col] === 1) return current;

      const nextGrid = current.grid.map((rowValues) => [...rowValues]);
      const nextLevels = current.gridLevels.map((rowValues) => [...rowValues]);
      const level = trialActive ? currentTrialLevel : 0;
      nextGrid[row][col] = mode === 'add-cell' ? 1 : 0;
      nextLevels[row][col] = mode === 'add-cell' ? level : 0;
      return { ...current, grid: nextGrid, gridLevels: nextLevels };
    });
  }, [applyChange, currentTrialLevel, height, trialActive, width]);

  const applyEdgeMode = useCallback((key: string, mode: DragMode) => {
    applyChange((currentSnapshot) => {
      const current = normalizePillsSnapshot(currentSnapshot, width, height);
      const nextSet = new Set(current.lineEdges);
      const nextLevels = { ...current.lineLevels };
      const level = trialActive ? currentTrialLevel : 0;
      if (mode === 'add-line') {
        nextSet.add(key);
        nextLevels[key] = level;
      } else {
        nextSet.delete(key);
        delete nextLevels[key];
      }
      return { ...current, lineEdges: Array.from(nextSet).sort(), lineLevels: nextLevels };
    }, { coalesce: true });
  }, [applyChange, currentTrialLevel, height, trialActive, width]);

  const applyEdgeDuringDrag = useCallback((key: string) => {
    const current = pointerState.current;
    if (!current.lastVertex) return;
    if (!current.mode) {
      current.mode = lineSet.has(key) ? 'remove-line' : 'add-line';
    }
    if (current.visitedKeys.has(key)) return;
    current.visitedKeys.add(key);
    applyEdgeMode(key, current.mode);
  }, [applyEdgeMode, lineSet]);

  const handlePointerMoveAt = useCallback((pointerId: number, clientX: number, clientY: number) => {
    const current = pointerState.current;
    if (current.pointerId !== pointerId) return;

    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;

    const point = getBoardPointerPoint(clientX, clientY, rect);

    // Cell shading drag (Battleship-style placement).
    if (current.cellMode) {
      const cell = detectCellAtPoint(point.x, point.y, width, height, cellSize);
      if (!cell) return;
      const key = `${cell.row},${cell.col}`;
      if (current.visitedCells.has(key)) return;
      current.visitedCells.add(key);
      toggleCell(cell.row, cell.col, current.cellMode);
      return;
    }

    if (!current.lastVertex) return;
    const vertex = detectDraggedVertexTarget(point.x, point.y, width, height, cellSize, current.lastVertex);
    if (!vertex || areSameVertex(vertex, current.lastVertex)) return;

    const edgeKeys = getDraggedEdgeKeys(current.lastVertex, vertex);
    if (edgeKeys.length === 0) return;

    edgeKeys.forEach(applyEdgeDuringDrag);
    current.lastVertex = vertex;
  }, [applyEdgeDuringDrag, cellSize, getBoardPointerPoint, height, toggleCell, width]);

  const finishPointer = useCallback(() => {
    if (pointerState.current.pointerId === null) return;
    pointerState.current = { pointerId: null, mode: null, cellMode: null, lastVertex: null, visitedKeys: new Set(), visitedCells: new Set() };
    finishBatch();
  }, [finishBatch]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (event.button !== 0) return;

    const point = getBoardPointerPoint(event.clientX, event.clientY, rect);

    // 1. Vertex: start a separator-line drag (Slitherlink style).
    let vertex = detectVertexAtPoint(point.x, point.y, width, height, cellSize);
    let initialMode: DragMode | null = null;
    let visited: Set<string> = new Set();

    if (!vertex) {
      // 2. Grid line: snap to the nearest endpoint and toggle the segment.
      const edgeKey = detectEdgeAtPoint(point.x, point.y, width, height, cellSize);
      if (edgeKey) {
        const snapped = getSnappedVertexForEdge(edgeKey, point.x, point.y, cellSize);
        if (snapped) {
          vertex = snapped;
          initialMode = lineSet.has(edgeKey) ? 'remove-line' : 'add-line';
          visited = new Set([edgeKey]);
          applyEdgeMode(edgeKey, initialMode);
        }
      }
    }

    if (vertex) {
      event.preventDefault();
      safeSetPointerCapture(boardRef.current ?? event.currentTarget, event.pointerId);
      startBatch();
      pointerState.current = {
        pointerId: event.pointerId,
        mode: initialMode,
        cellMode: null,
        lastVertex: vertex,
        visitedKeys: visited,
        visitedCells: new Set(),
      };
      return;
    }

    // 3. Cell: shade/unshade individual pill cells (Battleship-style).
    const cell = detectCellAtPoint(point.x, point.y, width, height, cellSize);
    if (!cell) return;
    event.preventDefault();
    safeSetPointerCapture(boardRef.current ?? event.currentTarget, event.pointerId);
    startBatch();
    const cellMode = normalizedSnapshot.grid[cell.row]?.[cell.col] === 1 ? 'remove-cell' : 'add-cell';
    pointerState.current = {
      pointerId: event.pointerId,
      mode: null,
      cellMode,
      lastVertex: null,
      visitedKeys: new Set(),
      visitedCells: new Set([`${cell.row},${cell.col}`]),
    };
    toggleCell(cell.row, cell.col, cellMode);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    handlePointerMoveAt(event.pointerId, event.clientX, event.clientY);
  };

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const handleDocumentPointerMove = (event: globalThis.PointerEvent) => {
      handlePointerMoveAt(event.pointerId, event.clientX, event.clientY);
    };
    const handleDocumentPointerEnd = (event: globalThis.PointerEvent) => {
      if (pointerState.current.pointerId === event.pointerId) finishPointer();
    };
    document.addEventListener('pointermove', handleDocumentPointerMove, { passive: false });
    document.addEventListener('pointerup', handleDocumentPointerEnd);
    document.addEventListener('pointercancel', handleDocumentPointerEnd);
    return () => {
      document.removeEventListener('pointermove', handleDocumentPointerMove);
      document.removeEventListener('pointerup', handleDocumentPointerEnd);
      document.removeEventListener('pointercancel', handleDocumentPointerEnd);
    };
  }, [finishPointer, handlePointerMoveAt]);

  const renderPips = (row: number, col: number): ReactNode => {
    const count = puzzle.dots[row]?.[col] ?? 0;
    if (count <= 0) return null;
    const { radius, positions } = getPillsPipsLayout(count, cellSize);
    return (
      <span
        className="absolute left-0 top-0 flex h-full w-full items-center justify-center"
        style={{ transform: count > 1 ? 'rotate(18deg)' : undefined }}
      >
        {positions.map((position, index) => (
          <span
            key={index}
            className="absolute block rounded-full"
            style={{
              width: `${radius * 2}px`,
              height: `${radius * 2}px`,
              left: `calc(${(position.x * 100).toFixed(2)}% - ${radius}px)`,
              top: `calc(${(position.y * 100).toFixed(2)}% - ${radius}px)`,
              background: woodBoardTheme.ink,
            }}
          />
        ))}
      </span>
    );
  };

  const renderPillPiece = (value: number) => (
    <div key={value} className="flex items-center">
      <div
        className="relative flex items-center justify-center rounded-full"
        style={{
          width: `${cellSize * 3}px`,
          height: `${cellSize}px`,
          background: woodBoardTheme.cell,
          border: `${getLoopLineStrokeWidth(cellSize)}px solid ${woodBoardTheme.ink}`,
          boxSizing: 'border-box',
        }}
      >
        <span className={`tabular-nums ${boardClassNames.cellText}`} style={{ ...getBoardTextStyle(cellSize, 0.55, 12), color: woodBoardTheme.ink }}>
          {value}
        </span>
      </div>
    </div>
  );

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
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={() => finishPointer()}
        onPointerCancel={() => finishPointer()}
        onContextMenu={(event) => event.preventDefault()}
      >
        <div className="absolute grid" style={getBoardGridStyle(gridLeft, gridTop, width, cellSize)}>
          {Array.from({ length: height }, (_, row) =>
            Array.from({ length: width }, (_, col) => (
              <div key={`${row}-${col}`} className={boardClassNames.cellContent} style={{ ...getBoardCellStyle(cellSize, 'cell'), ...getBoardTextStyle(cellSize) }}>
                {renderPips(row, col)}
              </div>
            ))
          )}
        </div>

        <div className="pointer-events-none absolute inset-0">
          {puzzle.topClues.map((value, col) => value === null ? null : (
            <span
              key={`top-${col}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 text-center tabular-nums"
              style={{
                left: `${gridLeft + (col + 0.5) * cellSize}px`,
                top: `${BOARD_PADDING + outsideClueLayout.top / 2}px`,
                ...getBoardOutsideClueTextStyle(cellSize, cellSize, value),
              }}
            >
              {value}
            </span>
          ))}
          {puzzle.leftClues.map((value, row) => value === null ? null : (
            <span
              key={`left-${row}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 text-center tabular-nums"
              style={{
                left: `${BOARD_PADDING + outsideClueLayout.left / 2}px`,
                top: `${gridTop + (row + 0.5) * cellSize}px`,
                ...getBoardOutsideClueTextStyle(cellSize, outsideClueLayout.clueSize, value),
              }}
            >
              {value}
            </span>
          ))}
        </div>

        <svg className="pointer-events-none absolute left-0 top-0" width={outerWidth - BOARD_BORDER * 2} height={outerHeight - BOARD_BORDER * 2}>
          {capsuleSegments.map((component, index) => {
            const first = component.cells[0];
            const trialColors = getTrialLevelColors(normalizedSnapshot.gridLevels[first.row]?.[first.col] ?? 0);
            const stroke = trialColors?.line ?? woodBoardTheme.ink;
            const { inset, radius } = getBoardPillCapsuleMetrics(cellSize);

            if (component.orientation === 'h') {
              const minCol = Math.min(...component.cells.map((cell) => cell.col));
              return (
                <rect
                  key={`capsule-${index}`}
                  x={gridLeft + minCol * cellSize + inset}
                  y={gridTop + first.row * cellSize + inset}
                  width={cellSize * component.cells.length - inset * 2}
                  height={cellSize - inset * 2}
                  rx={radius}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={lineStroke}
                />
              );
            }
            if (component.orientation === 'v') {
              const minRow = Math.min(...component.cells.map((cell) => cell.row));
              return (
                <rect
                  key={`capsule-${index}`}
                  x={gridLeft + first.col * cellSize + inset}
                  y={gridTop + minRow * cellSize + inset}
                  width={cellSize - inset * 2}
                  height={cellSize * component.cells.length - inset * 2}
                  rx={radius}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={lineStroke}
                />
              );
            }
            // Bent/invalid shapes: render each cell as a circle.
            return component.cells.map((cell) => (
              <circle
                key={`capsule-${index}-${cell.row}-${cell.col}`}
                cx={gridLeft + (cell.col + 0.5) * cellSize}
                cy={gridTop + (cell.row + 0.5) * cellSize}
                r={radius}
                fill="none"
                stroke={stroke}
                strokeWidth={lineStroke}
              />
            ));
          })}
          {Array.from(lineSet).map((key) => {
            const match = key.match(/^([hv])-(\d+)-(\d+)$/);
            if (!match) return null;
            const [, orientation, rowText, colText] = match;
            const row = Number(rowText);
            const col = Number(colText);
            const points = orientation === 'h'
              ? {
                  x1: gridLeft + col * cellSize,
                  y1: gridTop + row * cellSize,
                  x2: gridLeft + (col + 1) * cellSize,
                  y2: gridTop + row * cellSize,
                }
              : {
                  x1: gridLeft + col * cellSize,
                  y1: gridTop + row * cellSize,
                  x2: gridLeft + col * cellSize,
                  y2: gridTop + (row + 1) * cellSize,
                };
            const trialColors = getTrialLevelColors(normalizedSnapshot.lineLevels[key] ?? 0);
            return (
              <line
                key={`line-${key}`}
                x1={points.x1}
                y1={points.y1}
                x2={points.x2}
                y2={points.y2}
                stroke={trialColors?.line ?? woodBoardTheme.ink}
                strokeWidth={lineStroke}
                strokeLinecap="round"
              />
            );
          })}
        </svg>
      </div>

      <div className="flex w-full max-w-full flex-col items-center gap-2">
        <div className="text-xs font-semibold text-muted-foreground">
          {locale === 'zh-CN' ? '药丸' : 'Pills'}
        </div>
        <div
          className="flex max-w-full flex-wrap items-center justify-center gap-x-4 gap-y-3 px-2"
          style={{ width: `${outerWidth}px` }}
        >
          {puzzle.pillValues.map((value) => renderPillPiece(value))}
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

      {showValidationMessage ? <ValidationMessage message={visibleValidation?.message} /> : null}
    </div>
  );
}
