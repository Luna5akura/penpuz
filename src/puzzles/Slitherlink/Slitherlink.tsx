import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import PuzzleAssistToolbar from '@/components/PuzzleAssistToolbar';
import { usePuzzleHistory } from '@/hooks/usePuzzleHistory';
import { safeSetPointerCapture } from '@/lib/pointer';
import { sanitizeNumberRecord, sanitizeStringArray } from '../snapshotGuards';
import { getTrialLevelColors } from '../trialStyles';
import type { SlitherlinkPuzzleData } from '../types';
import {
  commonBoardChrome,
  getBoardFrameStyle,
  getBoardNumberFontSize,
  getLoopCrossSize,
  getLoopCrossStrokeWidth,
  getLoopLineStrokeWidth,
  getResponsiveCellSize,
  woodBoardTheme,
} from '../boardTheme';
import { getCellKey, getGridLineEdgeKey, parseGridLineEdgeKey } from '../gridUtils';
import { validateSlitherlink } from './utils';

interface Props {
  puzzle: SlitherlinkPuzzleData;
  startTime: number;
  resetToken: number;
  onComplete: (time: number) => void;
  initialSnapshot?: unknown;
  onSnapshotChange?: (snapshot: unknown) => void;
  fixedCellSize?: number;
  showValidationMessage?: boolean;
}

interface SlitherlinkSnapshot {
  lineEdges: string[];
  crossedEdges: string[];
  lineLevels: Record<string, number>;
  crossedLevels: Record<string, number>;
  cellMarks: Record<string, SlitherlinkCellMark>;
  cellMarkLevels: Record<string, number>;
}

const BOARD_PADDING = commonBoardChrome.padding;
const BOARD_BORDER = commonBoardChrome.border;

type EdgeDragAction = 'line' | 'cross';
type EdgeDragMode = 'add-line' | 'remove-line' | 'add-cross' | 'remove-cross';
type VertexCoord = { row: number; col: number };
type SlitherlinkCellMark = 'circle' | 'cross';

function sanitizeCellMarkRecord(candidate: unknown): Record<string, SlitherlinkCellMark> {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return {};

  return Object.fromEntries(
    Object.entries(candidate).filter(([, value]) => value === 'circle' || value === 'cross')
  );
}

function normalizeSlitherlinkSnapshot(snapshot: unknown): SlitherlinkSnapshot {
  const source = snapshot as Partial<SlitherlinkSnapshot> | null | undefined;
  return {
    lineEdges: sanitizeStringArray(source?.lineEdges),
    crossedEdges: sanitizeStringArray(source?.crossedEdges),
    lineLevels: sanitizeNumberRecord(source?.lineLevels),
    crossedLevels: sanitizeNumberRecord(source?.crossedLevels),
    cellMarks: sanitizeCellMarkRecord(source?.cellMarks),
    cellMarkLevels: sanitizeNumberRecord(source?.cellMarkLevels),
  };
}

function getEdgeMidpoint(key: string, cellSize: number) {
  const edge = parseGridLineEdgeKey(key);
  if (!edge) return null;

  if (edge.orientation === 'h') {
    return {
      x: BOARD_PADDING + (edge.col + 0.5) * cellSize,
      y: BOARD_PADDING + edge.row * cellSize,
    };
  }

  return {
    x: BOARD_PADDING + edge.col * cellSize,
    y: BOARD_PADDING + (edge.row + 0.5) * cellSize,
  };
}

function getEdgeLinePoints(key: string, cellSize: number) {
  const edge = parseGridLineEdgeKey(key);
  if (!edge) return null;

  if (edge.orientation === 'h') {
    return {
      x1: BOARD_PADDING + edge.col * cellSize,
      y1: BOARD_PADDING + edge.row * cellSize,
      x2: BOARD_PADDING + (edge.col + 1) * cellSize,
      y2: BOARD_PADDING + edge.row * cellSize,
    };
  }

  return {
    x1: BOARD_PADDING + edge.col * cellSize,
    y1: BOARD_PADDING + edge.row * cellSize,
    x2: BOARD_PADDING + edge.col * cellSize,
    y2: BOARD_PADDING + (edge.row + 1) * cellSize,
  };
}

function renderCellCenterMark(
  mark: SlitherlinkCellMark,
  row: number,
  col: number,
  cellSize: number,
  color: string
) {
  const centerX = BOARD_PADDING + (col + 0.5) * cellSize;
  const centerY = BOARD_PADDING + (row + 0.5) * cellSize;
  const radius = Math.max(9, cellSize * 0.3);
  const crossSize = Math.max(9, cellSize * 0.26);
  const strokeWidth = Math.max(2.4, cellSize * 0.065);

  if (mark === 'circle') {
    return (
      <circle
        cx={centerX}
        cy={centerY}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
      />
    );
  }

  return (
    <g stroke={color} strokeWidth={strokeWidth} strokeLinecap="round">
      <line x1={centerX - crossSize} y1={centerY - crossSize} x2={centerX + crossSize} y2={centerY + crossSize} />
      <line x1={centerX - crossSize} y1={centerY + crossSize} x2={centerX + crossSize} y2={centerY - crossSize} />
    </g>
  );
}

function getVertexHitRadius(cellSize: number) {
  return Math.max(14, Math.floor(cellSize * 0.3));
}

function getCellCenterHitRadius(cellSize: number) {
  return Math.max(10, Math.floor(cellSize * 0.28));
}

function getBoardPointerPoint(clientX: number, clientY: number, rect: DOMRect) {
  return {
    x: clientX - rect.left - BOARD_BORDER - BOARD_PADDING,
    y: clientY - rect.top - BOARD_BORDER - BOARD_PADDING,
  };
}

function detectVertexAtPoint(x: number, y: number, width: number, height: number, cellSize: number) {
  const boardWidth = width * cellSize;
  const boardHeight = height * cellSize;
  const threshold = getVertexHitRadius(cellSize);

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

function detectCellCenterAtPoint(x: number, y: number, width: number, height: number, cellSize: number) {
  if (x < 0 || x > width * cellSize || y < 0 || y > height * cellSize) return null;

  const col = Math.floor(x / cellSize);
  const row = Math.floor(y / cellSize);
  if (row < 0 || row >= height || col < 0 || col >= width) return null;

  const centerX = (col + 0.5) * cellSize;
  const centerY = (row + 0.5) * cellSize;
  if (Math.hypot(x - centerX, y - centerY) > getCellCenterHitRadius(cellSize)) return null;

  return { row, col };
}

function detectVertexTarget(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  width: number,
  height: number,
  cellSize: number
) {
  const point = getBoardPointerPoint(clientX, clientY, rect);
  return detectVertexAtPoint(point.x, point.y, width, height, cellSize);
}

function detectCellCenterTarget(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  width: number,
  height: number,
  cellSize: number
) {
  const point = getBoardPointerPoint(clientX, clientY, rect);
  return detectCellCenterAtPoint(point.x, point.y, width, height, cellSize);
}

function detectDraggedVertexTarget(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  width: number,
  height: number,
  cellSize: number,
  lastVertex: VertexCoord
) {
  const point = getBoardPointerPoint(clientX, clientY, rect);
  const directHit = detectVertexAtPoint(point.x, point.y, width, height, cellSize);
  if (directHit) return directHit;

  const lastX = lastVertex.col * cellSize;
  const lastY = lastVertex.row * cellSize;
  const dx = point.x - lastX;
  const dy = point.y - lastY;
  const corridor = Math.max(12, Math.floor(cellSize * 0.26));
  const minAdvance = cellSize * 0.5;

  if (Math.abs(dy) <= corridor && Math.abs(dx) >= minAdvance && Math.abs(dx) >= Math.abs(dy)) {
    const stepCount = Math.max(1, Math.round(Math.abs(dx) / cellSize));
    const col = Math.max(0, Math.min(width, lastVertex.col + Math.sign(dx) * stepCount));
    return { row: lastVertex.row, col };
  }

  if (Math.abs(dx) <= corridor && Math.abs(dy) >= minAdvance && Math.abs(dy) > Math.abs(dx)) {
    const stepCount = Math.max(1, Math.round(Math.abs(dy) / cellSize));
    const row = Math.max(0, Math.min(height, lastVertex.row + Math.sign(dy) * stepCount));
    return { row, col: lastVertex.col };
  }

  return null;
}

function areSameVertex(a: VertexCoord, b: VertexCoord) {
  return a.row === b.row && a.col === b.col;
}

function getDraggedEdgeKeys(from: VertexCoord, to: VertexCoord) {
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

export default function SlitherlinkBoard({
  puzzle,
  startTime,
  resetToken,
  onComplete,
  initialSnapshot,
  onSnapshotChange,
  fixedCellSize,
  showValidationMessage = false,
}: Props) {
  const { width, height, clues } = puzzle;
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === 'undefined' ? 1024 : window.innerWidth
  );
  const boardRef = useRef<HTMLDivElement>(null);
  const pointerState = useRef<{
    pointerId: number | null;
    action: EdgeDragAction | null;
    mode: EdgeDragMode | null;
    lastVertex: VertexCoord | null;
    visitedEdges: Set<string>;
    isTouch: boolean;
  }>({
    pointerId: null,
    action: null,
    mode: null,
    lastVertex: null,
    visitedEdges: new Set(),
    isTouch: false,
  });
  const hasCompleted = useRef(false);

  const createInitialSnapshot = useCallback<() => SlitherlinkSnapshot>(() => ({
    lineEdges: [],
    crossedEdges: [],
    lineLevels: {},
    crossedLevels: {},
    cellMarks: {},
    cellMarkLevels: {},
  }), []);
  const getResetSnapshot = useCallback(() => normalizeSlitherlinkSnapshot(initialSnapshot), [initialSnapshot]);

  const history = usePuzzleHistory<SlitherlinkSnapshot>(createInitialSnapshot(), {
    normalizeTrialSnapshot: (trialSnapshot) => ({
      ...normalizeSlitherlinkSnapshot(trialSnapshot),
      lineLevels: {},
      crossedLevels: {},
      cellMarkLevels: {},
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

  const normalizedSnapshot = useMemo(() => normalizeSlitherlinkSnapshot(snapshot), [snapshot]);
  const lineSet = useMemo(() => new Set(normalizedSnapshot.lineEdges), [normalizedSnapshot.lineEdges]);
  const crossedSet = useMemo(() => new Set(normalizedSnapshot.crossedEdges), [normalizedSnapshot.crossedEdges]);
  const validation = useMemo(
    () => validateSlitherlink(normalizedSnapshot.lineEdges, puzzle),
    [normalizedSnapshot.lineEdges, puzzle]
  );
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
      action: null,
      mode: null,
      lastVertex: null,
      visitedEdges: new Set(),
      isTouch: false,
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

  const getDragMode = useCallback((key: string, action: EdgeDragAction): EdgeDragMode => {
    if (action === 'line') return lineSet.has(key) ? 'remove-line' : 'add-line';
    return crossedSet.has(key) ? 'remove-cross' : 'add-cross';
  }, [crossedSet, lineSet]);

  const applyEdgeDragMode = useCallback((key: string, mode: EdgeDragMode) => {
    applyChange((currentSnapshot) => {
      const current = normalizeSlitherlinkSnapshot(currentSnapshot);
      const nextLineSet = new Set(current.lineEdges);
      const nextCrossedSet = new Set(current.crossedEdges);
      const nextLineLevels = { ...current.lineLevels };
      const nextCrossedLevels = { ...current.crossedLevels };
      const level = trialActive ? currentTrialLevel : 0;

      if (mode === 'add-line') {
        nextLineSet.add(key);
        nextCrossedSet.delete(key);
        nextLineLevels[key] = level;
        delete nextCrossedLevels[key];
      } else if (mode === 'remove-line') {
        nextLineSet.delete(key);
        delete nextLineLevels[key];
      } else if (mode === 'add-cross') {
        nextCrossedSet.add(key);
        nextLineSet.delete(key);
        nextCrossedLevels[key] = level;
        delete nextLineLevels[key];
      } else {
        nextCrossedSet.delete(key);
        delete nextCrossedLevels[key];
      }

      return {
        lineEdges: Array.from(nextLineSet).sort(),
        crossedEdges: Array.from(nextCrossedSet).sort(),
        lineLevels: nextLineLevels,
        crossedLevels: nextCrossedLevels,
        cellMarks: current.cellMarks,
        cellMarkLevels: current.cellMarkLevels,
      };
    }, { coalesce: true });
  }, [applyChange, currentTrialLevel, trialActive]);

  const toggleCellCenterMark = useCallback((row: number, col: number, mark: SlitherlinkCellMark) => {
    applyChange((currentSnapshot) => {
      const current = normalizeSlitherlinkSnapshot(currentSnapshot);
      const key = getCellKey(row, col);
      const nextMarks = { ...current.cellMarks };
      const nextMarkLevels = { ...current.cellMarkLevels };
      const currentMark = nextMarks[key];
      const level = trialActive ? currentTrialLevel : 0;

      if (currentMark === mark) {
        delete nextMarks[key];
        delete nextMarkLevels[key];
      } else {
        nextMarks[key] = mark;
        nextMarkLevels[key] = level;
      }

      return {
        ...current,
        cellMarks: nextMarks,
        cellMarkLevels: nextMarkLevels,
      };
    });
  }, [applyChange, currentTrialLevel, trialActive]);

  const applyEdgeDuringDrag = useCallback((key: string) => {
    const current = pointerState.current;
    if (!current.action) return;

    if (!current.mode) {
      current.mode = getDragMode(key, current.action);
    }

    if (current.visitedEdges.has(key)) return;

    current.visitedEdges.add(key);
    applyEdgeDragMode(key, current.mode);
  }, [applyEdgeDragMode, getDragMode]);

  const handlePointerMoveAt = useCallback((pointerId: number, clientX: number, clientY: number) => {
    const current = pointerState.current;
    if (current.pointerId !== pointerId || !current.action || !current.lastVertex) return;

    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;

    const vertex = detectDraggedVertexTarget(clientX, clientY, rect, width, height, cellSize, current.lastVertex);
    if (!vertex || areSameVertex(vertex, current.lastVertex)) return;

    const edgeKeys = getDraggedEdgeKeys(current.lastVertex, vertex);
    if (edgeKeys.length === 0) return;

    edgeKeys.forEach(applyEdgeDuringDrag);
    current.lastVertex = vertex;
  }, [applyEdgeDuringDrag, cellSize, height, width]);

  const finishPointer = useCallback((pointerId?: number) => {
    const current = pointerState.current;
    if (current.pointerId === null) return;
    if (pointerId !== undefined && current.pointerId !== pointerId) return;

    pointerState.current = {
      pointerId: null,
      action: null,
      mode: null,
      lastVertex: null,
      visitedEdges: new Set(),
      isTouch: false,
    };
    finishBatch();
  }, [finishBatch]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;

    const isTouchPointer =
      event.pointerType === 'touch' || (event.button === 0 && viewportWidth < commonBoardChrome.mobileBreakpoint);
    if (!isTouchPointer && event.button !== 0 && event.button !== 2) return;

    const vertex = detectVertexTarget(event.clientX, event.clientY, rect, width, height, cellSize);
    if (!vertex) {
      const cell = detectCellCenterTarget(event.clientX, event.clientY, rect, width, height, cellSize);
      if (!cell) return;

      event.preventDefault();
      toggleCellCenterMark(cell.row, cell.col, !isTouchPointer && event.button === 2 ? 'cross' : 'circle');
      return;
    }

    event.preventDefault();
    safeSetPointerCapture(boardRef.current ?? event.currentTarget, event.pointerId);
    startBatch();

    const action: EdgeDragAction = !isTouchPointer && event.button === 2 ? 'cross' : 'line';
    pointerState.current = {
      pointerId: event.pointerId,
      action,
      mode: null,
      lastVertex: vertex,
      visitedEdges: new Set(),
      isTouch: isTouchPointer,
    };
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const current = pointerState.current;
    if (current.pointerId === event.pointerId && current.isTouch && event.cancelable) {
      event.preventDefault();
    }
    handlePointerMoveAt(event.pointerId, event.clientX, event.clientY);
  };

  const handlePointerLeave = (event: ReactPointerEvent<HTMLDivElement>) => {
    const current = pointerState.current;
    if (current.pointerId !== event.pointerId || current.isTouch) return;
    const rect = boardRef.current?.getBoundingClientRect();
    if (
      rect &&
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom
    ) {
      return;
    }
    finishPointer(event.pointerId);
  };

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const handleDocumentPointerMove = (event: globalThis.PointerEvent) => {
      const current = pointerState.current;
      if (current.pointerId !== event.pointerId) return;
      if (current.isTouch && event.cancelable) {
        event.preventDefault();
      }
      handlePointerMoveAt(event.pointerId, event.clientX, event.clientY);
    };

    const handleDocumentPointerEnd = (event: globalThis.PointerEvent) => {
      finishPointer(event.pointerId);
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

  const boardWidthPx = width * cellSize;
  const boardHeightPx = height * cellSize;
  const outerWidth = boardWidthPx + BOARD_PADDING * 2 + BOARD_BORDER * 2;
  const outerHeight = boardHeightPx + BOARD_PADDING * 2 + BOARD_BORDER * 2;
  const clueFontSize = getBoardNumberFontSize(cellSize);
  const lineStroke = getLoopLineStrokeWidth(cellSize);
  const crossSize = getLoopCrossSize(cellSize, 0.12, 5);
  const svgWidth = outerWidth - BOARD_BORDER * 2;
  const svgHeight = outerHeight - BOARD_BORDER * 2;

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
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(event) => finishPointer(event.pointerId)}
        onPointerLeave={handlePointerLeave}
        onPointerCancel={(event) => finishPointer(event.pointerId)}
        onContextMenu={(event) => event.preventDefault()}
      >
        <svg className="absolute left-0 top-0" width={svgWidth} height={svgHeight}>
          {Array.from({ length: height }, (_, row) =>
            Array.from({ length: width }, (_, col) => {
              const clue = clues[row][col];
              const cellKey = getCellKey(row, col);
              const cellMark = normalizedSnapshot.cellMarks[cellKey];
              const cellMarkColors = getTrialLevelColors(normalizedSnapshot.cellMarkLevels[cellKey] ?? 0);

              return (
                <g key={`cell-${row}-${col}`}>
                  <rect
                    x={BOARD_PADDING + col * cellSize}
                    y={BOARD_PADDING + row * cellSize}
                    width={cellSize}
                    height={cellSize}
                    fill={woodBoardTheme.cell}
                    stroke={woodBoardTheme.gridLine}
                    strokeWidth={1}
                  />
                  {cellMark
                    ? renderCellCenterMark(cellMark, row, col, cellSize, cellMarkColors?.text ?? woodBoardTheme.border)
                    : null}
                  {clue !== null ? (
                    <text
                      x={BOARD_PADDING + (col + 0.5) * cellSize}
                      y={BOARD_PADDING + (row + 0.5) * cellSize}
                      dominantBaseline="central"
                      textAnchor="middle"
                      fill={woodBoardTheme.border}
                      fontSize={clueFontSize}
                      fontWeight={700}
                    >
                      {clue}
                    </text>
                  ) : null}
                </g>
              );
            })
          )}

          {Array.from({ length: height + 1 }, (_, row) =>
            Array.from({ length: width + 1 }, (_, col) => (
              <circle
                key={`dot-${row}-${col}`}
                cx={BOARD_PADDING + col * cellSize}
                cy={BOARD_PADDING + row * cellSize}
                r={Math.max(2.4, cellSize * 0.055)}
                fill={woodBoardTheme.border}
              />
            ))
          )}

          {Array.from(lineSet).map((key) => {
            const points = getEdgeLinePoints(key, cellSize);
            if (!points) return null;
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

          {Array.from(crossedSet).map((key) => {
            const midpoint = getEdgeMidpoint(key, cellSize);
            if (!midpoint) return null;
            const trialColors = getTrialLevelColors(normalizedSnapshot.crossedLevels[key] ?? 0);
            const color = trialColors?.text ?? woodBoardTheme.border;

            return (
              <g
                key={`cross-${key}`}
                stroke={color}
                strokeWidth={getLoopCrossStrokeWidth()}
                strokeLinecap="round"
              >
                <line x1={midpoint.x - crossSize} y1={midpoint.y - crossSize} x2={midpoint.x + crossSize} y2={midpoint.y + crossSize} />
                <line x1={midpoint.x - crossSize} y1={midpoint.y + crossSize} x2={midpoint.x + crossSize} y2={midpoint.y - crossSize} />
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

      {showValidationMessage && visibleValidation?.message ? (
        <div className="text-center text-sm text-muted-foreground dark:text-gray-400">
          {visibleValidation.message}
        </div>
      ) : null}
    </div>
  );
}
