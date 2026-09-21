import { useCallback, useEffect, useMemo, useRef } from 'react';
import PuzzleAssistToolbar from '@/components/PuzzleAssistToolbar';
import ValidationMessage from '@/components/ValidationMessage';
import { usePuzzleHistory } from '@/hooks/usePuzzleHistory';
import type { WalkwalkPuzzleData } from '../types';
import {
  boardClassNames,
  commonBoardChrome,
  getBoardCellStyle,
  getBoardBoundaryStrokeMetrics,
  getBoardFrameDimensions,
  getBoardFrameStyle,
  getBoardTextStyle,
  getBoardGridStyle,
  getInvalidBoardCellColors,
  getLoopLineStrokeWidth,
  getResponsiveCellSize,
  woodBoardTheme,
} from '../boardTheme';
import BoardEdgeCross from '../shared/BoardEdgeCross';
import { getTrialLevelColors } from '../trialStyles';
import { useBoardContainerWidth } from '../useBoardContainerWidth';
import { safeSetPointerCapture } from '@/lib/pointer';
import { sanitizeNumberRecord, sanitizeStringArray } from '../snapshotGuards';
import { filterValidCellEdgeKeys } from '../gridUtils';
import {
  detectWalkwalkHitTarget,
  getWalkwalkBoundarySegments,
  getWalkwalkEdgeKey,
  parseWalkwalkEdgeKey,
  validateWalkwalk,
} from './utils';

interface Props {
  puzzle: WalkwalkPuzzleData;
  startTime: number;
  resetToken: number;
  onComplete: (time: number) => void;
  initialSnapshot?: unknown;
  onSnapshotChange?: (snapshot: unknown) => void;
  fixedCellSize?: number;
  showValidationMessage?: boolean;
}

type WalkwalkSnapshot = {
  lineEdges: string[];
  crossedEdges: string[];
  lineEdgeLevels: Record<string, number>;
  crossedEdgeLevels: Record<string, number>;
};

const BOARD_PADDING = commonBoardChrome.padding;
const BOARD_BORDER = commonBoardChrome.border;

function normalizeWalkwalkSnapshot(snapshot: unknown, width: number, height: number): WalkwalkSnapshot {
  const source = snapshot as Partial<WalkwalkSnapshot> | null | undefined;
  return {
    lineEdges: filterValidCellEdgeKeys(sanitizeStringArray(source?.lineEdges), width, height),
    crossedEdges: filterValidCellEdgeKeys(sanitizeStringArray(source?.crossedEdges), width, height),
    lineEdgeLevels: sanitizeNumberRecord(source?.lineEdgeLevels),
    crossedEdgeLevels: sanitizeNumberRecord(source?.crossedEdgeLevels),
  };
}

export default function WalkwalkBoard({
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
  const pointerIdRef = useRef<number | null>(null);
  const lastCellRef = useRef<{ row: number; col: number } | null>(null);
  const operationRef = useRef<'add' | 'delete' | null>(null);
  const hasCompleted = useRef(false);

  const createInitialSnapshot = useCallback<() => WalkwalkSnapshot>(() => ({
    lineEdges: [],
    crossedEdges: [],
    lineEdgeLevels: {},
    crossedEdgeLevels: {},
  }), []);

  const history = usePuzzleHistory<WalkwalkSnapshot>(
    initialSnapshot ? normalizeWalkwalkSnapshot(initialSnapshot, width, height) : createInitialSnapshot(),
    {
      normalizeTrialSnapshot: (trialSnapshot) => ({
        ...normalizeWalkwalkSnapshot(trialSnapshot, width, height),
        lineEdgeLevels: {},
        crossedEdgeLevels: {},
      }),
      onSnapshotChange: (nextSnapshot) => onSnapshotChange?.(nextSnapshot),
    }
  );

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
    () => normalizeWalkwalkSnapshot(snapshot, width, height),
    [height, snapshot, width]
  );
  const lineEdges = normalizedSnapshot.lineEdges;
  const crossedEdges = normalizedSnapshot.crossedEdges;
  const lineEdgeLevels = normalizedSnapshot.lineEdgeLevels;
  const lineEdgeSet = useMemo(() => new Set(lineEdges), [lineEdges]);
  const clueMap = useMemo(() => {
    const map = new Map<string, number>();
    clues.forEach((clue) => map.set(`${clue.row},${clue.col}`, clue.value));
    return map;
  }, [clues]);
  const boundaries = useMemo(
    () => getWalkwalkBoundarySegments(regionIds, width, height),
    [height, regionIds, width]
  );
  const hasEdited = canUndo || canRedo || trialActive || trialCheckpointCount > 0;
  const validation = useMemo(
    () => (hasEdited ? validateWalkwalk(lineEdgeSet, puzzle) : null),
    [hasEdited, lineEdgeSet, puzzle]
  );
  const invalidCellSet = useMemo(
    () => new Set((validation?.badCells ?? []).map((cell) => `${cell.r},${cell.c}`)),
    [validation]
  );

  const cellSize = useMemo(() => getResponsiveCellSize({
    fixedCellSize,
    viewportWidth,
    width,
    containerWidth: true,
  }), [fixedCellSize, viewportWidth, width]);
  const clueTextStyle = useMemo(() => getBoardTextStyle(cellSize), [cellSize]);
  const { strokeWidth: boundaryStroke, outlineWidth: boundaryOutlineStroke } = getBoardBoundaryStrokeMetrics(cellSize);
  const loopLineStrokeWidth = useMemo(() => getLoopLineStrokeWidth(cellSize), [cellSize]);

  const initialSnapshotRef = useRef(initialSnapshot);
  useEffect(() => {
    initialSnapshotRef.current = initialSnapshot;
  }, [initialSnapshot]);
  useEffect(() => {
    reset(initialSnapshotRef.current ? normalizeWalkwalkSnapshot(initialSnapshotRef.current, width, height) : createInitialSnapshot());
    hasCompleted.current = false;
    pointerIdRef.current = null;
    lastCellRef.current = null;
    operationRef.current = null;
  }, [createInitialSnapshot, height, puzzle, reset, resetToken, width]);

  useEffect(() => {
    if (!validation?.valid || hasCompleted.current) return;
    hasCompleted.current = true;
    onComplete(Math.floor((Date.now() - startTime) / 1000));
  }, [onComplete, startTime, validation]);

  const getBoardPosition = useCallback((clientX: number, clientY: number) => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const boardInset = BOARD_BORDER + BOARD_PADDING;
    const x = clientX - rect.left - boardInset;
    const y = clientY - rect.top - boardInset;
    if (x < 0 || y < 0 || x > width * cellSize || y > height * cellSize) return null;
    return { x, y };
  }, [cellSize, height, width]);

  const getCellFromPos = useCallback((x: number, y: number) => ({
    row: Math.max(0, Math.min(height - 1, Math.floor(y / cellSize))),
    col: Math.max(0, Math.min(width - 1, Math.floor(x / cellSize))),
  }), [cellSize, height, width]);

  const getCenter = useCallback((row: number, col: number) => ({
    x: col * cellSize + cellSize / 2,
    y: row * cellSize + cellSize / 2,
  }), [cellSize]);

  const toggleCrossEdge = useCallback((key: string) => {
    applyChange((currentSnapshot) => {
      const nextSnapshot = normalizeWalkwalkSnapshot(currentSnapshot, width, height);
      const nextLineEdges = new Set(nextSnapshot.lineEdges);
      const nextCrossedEdges = new Set(nextSnapshot.crossedEdges);
      const nextLineLevels = { ...nextSnapshot.lineEdgeLevels };
      const nextCrossedLevels = { ...nextSnapshot.crossedEdgeLevels };

      if (nextCrossedEdges.has(key)) {
        nextCrossedEdges.delete(key);
        delete nextCrossedLevels[key];
      } else {
        nextCrossedEdges.add(key);
        nextCrossedLevels[key] = trialActive ? currentTrialLevel : 0;
        nextLineEdges.delete(key);
        delete nextLineLevels[key];
      }

      return {
        lineEdges: Array.from(nextLineEdges).sort(),
        crossedEdges: Array.from(nextCrossedEdges).sort(),
        lineEdgeLevels: nextLineLevels,
        crossedEdgeLevels: nextCrossedLevels,
      };
    });
  }, [applyChange, currentTrialLevel, height, trialActive, width]);

  const commitLineEdge = useCallback((key: string) => {
    if (!key) return;

    if (operationRef.current === null) {
      operationRef.current = lineEdgeSet.has(key) ? 'delete' : 'add';
    }

    const op = operationRef.current;
    applyChange((currentSnapshot) => {
      const nextSnapshot = normalizeWalkwalkSnapshot(currentSnapshot, width, height);
      const nextLineEdges = new Set(nextSnapshot.lineEdges);
      const nextCrossedEdges = new Set(nextSnapshot.crossedEdges);
      const nextLineLevels = { ...nextSnapshot.lineEdgeLevels };
      const nextCrossedLevels = { ...nextSnapshot.crossedEdgeLevels };

      if (op === 'add') {
        nextLineEdges.add(key);
        nextLineLevels[key] = trialActive ? currentTrialLevel : 0;
        nextCrossedEdges.delete(key);
        delete nextCrossedLevels[key];
      } else {
        nextLineEdges.delete(key);
        delete nextLineLevels[key];
      }

      return {
        lineEdges: Array.from(nextLineEdges).sort(),
        crossedEdges: Array.from(nextCrossedEdges).sort(),
        lineEdgeLevels: nextLineLevels,
        crossedEdgeLevels: nextCrossedLevels,
      };
    }, { coalesce: true });
  }, [applyChange, currentTrialLevel, height, lineEdgeSet, trialActive, width]);

  const handleDocumentPointerMove = useCallback((event: PointerEvent) => {
    if (pointerIdRef.current !== event.pointerId) return;

    const position = getBoardPosition(event.clientX, event.clientY);
    if (!position) return;

    const currentCell = getCellFromPos(position.x, position.y);
    const lastCell = lastCellRef.current;
    if (!lastCell) {
      lastCellRef.current = currentCell;
      return;
    }

    const edgeKey = getWalkwalkEdgeKey(lastCell.row, lastCell.col, currentCell.row, currentCell.col);
    if (edgeKey) {
      commitLineEdge(edgeKey);
      lastCellRef.current = currentCell;
    }
  }, [commitLineEdge, getBoardPosition, getCellFromPos]);

  const finishPointer = useCallback(() => {
    pointerIdRef.current = null;
    lastCellRef.current = null;
    operationRef.current = null;
    finishBatch();
  }, [finishBatch]);

  const startLineDrag = useCallback((pointerId: number, row: number, col: number) => {
    pointerIdRef.current = pointerId;
    lastCellRef.current = { row, col };
    operationRef.current = null;
    startBatch();
  }, [startBatch]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== null) return;

    const position = getBoardPosition(event.clientX, event.clientY);
    if (!position) return;

    const hitTarget = detectWalkwalkHitTarget(position.x, position.y, width, height, cellSize);
    if (!hitTarget) return;

    const isTouchPointer = event.pointerType === 'touch';
    safeSetPointerCapture(boardRef.current ?? event.currentTarget, event.pointerId);

    if (isTouchPointer) {
      event.preventDefault();
      if (hitTarget.kind === 'edge') {
        toggleCrossEdge(hitTarget.key);
        return;
      }
      startLineDrag(event.pointerId, hitTarget.row, hitTarget.col);
      return;
    }

    if (event.button === 0 && hitTarget.kind === 'cell') {
      event.preventDefault();
      startLineDrag(event.pointerId, hitTarget.row, hitTarget.col);
      return;
    }

    if (event.button === 2 && hitTarget.kind === 'edge') {
      event.preventDefault();
      toggleCrossEdge(hitTarget.key);
    }
  };

  const handleBoardPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== event.pointerId) return;
    handleDocumentPointerMove(event.nativeEvent);
  };

  const handleBoardPointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== event.pointerId) return;
    finishPointer();
  };

  const { boardWidth, boardHeight, outerWidth, outerHeight } = getBoardFrameDimensions(
    width,
    height,
    cellSize,
    { borderWidth: BOARD_BORDER, padding: BOARD_PADDING }
  );

  return (
    <div ref={containerRef} className="flex w-full min-w-0 max-w-full flex-col items-center gap-3">
      <div
        ref={boardRef}
        className="relative mx-auto select-none"
        style={{
          width: `${outerWidth}px`,
          height: `${outerHeight}px`,
          touchAction: 'none',
          ...getBoardFrameStyle(BOARD_BORDER),
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handleBoardPointerMove}
        onPointerUp={handleBoardPointerEnd}
        onPointerCancel={handleBoardPointerEnd}
        onContextMenu={(event) => event.preventDefault()}
      >
        <div className="grid" style={getBoardGridStyle(BOARD_PADDING, BOARD_PADDING, width, cellSize)}>
          {Array.from({ length: height }, (_, row) =>
            Array.from({ length: width }, (_, col) => {
              const clueValue = clueMap.get(`${row},${col}`);
              const isInvalid = showValidationMessage && invalidCellSet.has(`${row},${col}`);
              return (
                <div
                  key={`${row}-${col}`}
                  className={boardClassNames.cellContent}
                  style={{
                    ...getBoardCellStyle(cellSize, 'cell'),
                    ...(isInvalid ? getInvalidBoardCellColors('soft') : {}),
                    ...clueTextStyle,
                    zIndex: 1,
                  }}
                >
                  {clueValue ?? ''}
                </div>
              );
            })
          )}
        </div>

        <svg
          width={boardWidth}
          height={boardHeight}
          style={{
            position: 'absolute',
            top: `${BOARD_PADDING}px`,
            left: `${BOARD_PADDING}px`,
            pointerEvents: 'none',
            overflow: 'visible',
            zIndex: 2,
          }}
        >
          {boundaries.horizontal.map((segment) => {
            const x1 = segment.col * cellSize;
            const y = segment.row * cellSize;
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
              />
            );
          })}

          {boundaries.vertical.map((segment) => {
            const x = segment.col * cellSize;
            const y1 = segment.row * cellSize;
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
              />
            );
          })}

          {boundaries.horizontal.map((segment) => {
            const x1 = segment.col * cellSize;
            const y = segment.row * cellSize;
            const x2 = x1 + cellSize;
            return (
              <line
                key={`h-border-${segment.row}-${segment.col}`}
                x1={x1}
                y1={y}
                x2={x2}
                y2={y}
                stroke={woodBoardTheme.border}
                strokeWidth={boundaryStroke}
              />
            );
          })}

          {boundaries.vertical.map((segment) => {
            const x = segment.col * cellSize;
            const y1 = segment.row * cellSize;
            const y2 = y1 + cellSize;
            return (
              <line
                key={`v-border-${segment.row}-${segment.col}`}
                x1={x}
                y1={y1}
                x2={x}
                y2={y2}
                stroke={woodBoardTheme.border}
                strokeWidth={boundaryStroke}
              />
            );
          })}

          {lineEdges.map((edgeKey) => {
            const edge = parseWalkwalkEdgeKey(edgeKey);
            if (!edge) return null;
            const from = getCenter(edge.r1, edge.c1);
            const to = getCenter(edge.r2, edge.c2);
            const trialColors = getTrialLevelColors(lineEdgeLevels[edgeKey] ?? 0);

            return (
              <line
                key={`line-${edgeKey}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={trialColors?.line ?? woodBoardTheme.ink}
                strokeWidth={loopLineStrokeWidth}
                strokeLinecap="round"
              />
            );
          })}

          {crossedEdges.map((edgeKey) => {
            const edge = parseWalkwalkEdgeKey(edgeKey);
            if (!edge) return null;
            const centerX = (getCenter(edge.r1, edge.c1).x + getCenter(edge.r2, edge.c2).x) / 2;
            const centerY = (getCenter(edge.r1, edge.c1).y + getCenter(edge.r2, edge.c2).y) / 2;
            return (
              <BoardEdgeCross
                key={`cross-${edgeKey}`}
                x={centerX}
                y={centerY}
                cellSize={cellSize}
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
