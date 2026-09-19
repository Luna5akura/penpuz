import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useBoardContainerWidth } from '../useBoardContainerWidth';
import { usePuzzleHistory } from '@/hooks/usePuzzleHistory';
import PuzzleAssistToolbar from '@/components/PuzzleAssistToolbar';
import ValidationMessage from '@/components/ValidationMessage';
import type { NikojiPuzzleData } from '../types';
import {
  boardClassNames,
  commonBoardChrome,
  getBoardCellStyle,
  getInvalidBoardCellColors,
  getBoardRegionStrokeWidth,
  getBoardThinStrokeWidth,
  getBoardFrameDimensions,
  getBoardFrameStyle,
  getBoardGridStyle,
  getBoardTextStyle,
  getResponsiveCellSize,
  woodBoardTheme,
} from '../boardTheme';
import { safeSetPointerCapture } from '@/lib/pointer';
import { getTrialLevelColors } from '../trialStyles';
import { getNikojiEdgeKey, validateNikoji } from './utils';
import { sanitizeNumberRecord, sanitizeStringArray } from '../snapshotGuards';
import { filterValidInternalBoundaryEdgeKeys } from '../gridUtils';

type LineMode = 'deepLine' | 'thinLine';

type NikojiSnapshot = {
  deepLines: string[];
  thinLines: string[];
  deepLineLevels: Record<string, number>;
  thinLineLevels: Record<string, number>;
};

interface Props {
  puzzle: NikojiPuzzleData;
  startTime: number;
  resetToken: number;
  onComplete: (time: number) => void;
  initialSnapshot?: unknown;
  onSnapshotChange?: (snapshot: unknown) => void;
  fixedCellSize?: number;
  showValidationMessage?: boolean;
}

const BOARD_PADDING = commonBoardChrome.padding;
const BOARD_BORDER = commonBoardChrome.border;

function normalizeNikojiSnapshot(snapshot: unknown, width: number, height: number): NikojiSnapshot {
  const source = snapshot as Partial<NikojiSnapshot> | null | undefined;
  return {
    deepLines: filterValidInternalBoundaryEdgeKeys(sanitizeStringArray(source?.deepLines), width, height),
    thinLines: filterValidInternalBoundaryEdgeKeys(sanitizeStringArray(source?.thinLines), width, height),
    deepLineLevels: sanitizeNumberRecord(source?.deepLineLevels),
    thinLineLevels: sanitizeNumberRecord(source?.thinLineLevels),
  };
}

export default function NikojiBoard({
  puzzle,
  startTime,
  resetToken,
  onComplete,
  initialSnapshot,
  onSnapshotChange,
  fixedCellSize,
  showValidationMessage = false,
}: Props) {
  const { width, height, letters } = puzzle;
  const [containerRef, viewportWidth] = useBoardContainerWidth();
  const boardRef = useRef<HTMLDivElement>(null);
  const pointerIdRef = useRef<number | null>(null);
  const dragModeRef = useRef<LineMode | null>(null);
  const lastCellRef = useRef<{ row: number; col: number } | null>(null);
  const lastVertexRef = useRef<{ rowLine: number; colLine: number } | null>(null);
  const operationRef = useRef<'add' | 'delete' | null>(null);
  const hasCompleted = useRef(false);

  const createInitialSnapshot = useCallback<() => NikojiSnapshot>(() => ({
    deepLines: [],
    thinLines: [],
    deepLineLevels: {},
    thinLineLevels: {},
  }), []);

  const history = usePuzzleHistory<NikojiSnapshot>(
    initialSnapshot ? normalizeNikojiSnapshot(initialSnapshot, width, height) : createInitialSnapshot(),
    {
      normalizeTrialSnapshot: (trialSnapshot) => ({
        ...normalizeNikojiSnapshot(trialSnapshot, width, height),
        deepLineLevels: {},
        thinLineLevels: {},
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
    () => normalizeNikojiSnapshot(snapshot, width, height),
    [height, snapshot, width]
  );
  const deepLines = normalizedSnapshot.deepLines;
  const thinLines = normalizedSnapshot.thinLines;
  const deepLineLevels = normalizedSnapshot.deepLineLevels;
  const thinLineLevels = normalizedSnapshot.thinLineLevels;
  const deepLineSet = useMemo(() => new Set(deepLines), [deepLines]);
  const hasEdited = canUndo || canRedo || trialActive || trialCheckpointCount > 0;
  const validation = useMemo(
    () => (hasEdited ? validateNikoji(deepLineSet, puzzle) : null),
    [deepLineSet, hasEdited, puzzle]
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

  useEffect(() => {
    reset(initialSnapshot ? normalizeNikojiSnapshot(initialSnapshot, width, height) : createInitialSnapshot());
    hasCompleted.current = false;
  }, [createInitialSnapshot, height, initialSnapshot, puzzle, reset, resetToken, width]);

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

  const getNearestVertex = useCallback((x: number, y: number) => ({
    rowLine: Math.max(0, Math.min(height, Math.round(y / cellSize))),
    colLine: Math.max(0, Math.min(width, Math.round(x / cellSize))),
  }), [cellSize, height, width]);

  const getCenter = useCallback((row: number, col: number) => ({
    x: col * cellSize + cellSize / 2,
    y: row * cellSize + cellSize / 2,
  }), [cellSize]);

  const commitEdge = useCallback((type: LineMode, key: string) => {
    if (!key) return;

    if (operationRef.current === null) {
      const currentSet = type === 'deepLine' ? new Set(deepLines) : new Set(thinLines);
      operationRef.current = currentSet.has(key) ? 'delete' : 'add';
    }

    const op = operationRef.current;
    applyChange((currentSnapshot) => {
      const nextSnapshot = normalizeNikojiSnapshot(currentSnapshot, width, height);
      const targetSet = type === 'deepLine'
        ? new Set(nextSnapshot.deepLines)
        : new Set(nextSnapshot.thinLines);
      const targetLevels = type === 'deepLine'
        ? { ...nextSnapshot.deepLineLevels }
        : { ...nextSnapshot.thinLineLevels };

      if (op === 'add') {
        targetSet.add(key);
        targetLevels[key] = trialActive ? currentTrialLevel : 0;
      } else {
        targetSet.delete(key);
        delete targetLevels[key];
      }

      if (type === 'deepLine') {
        nextSnapshot.deepLines = Array.from(targetSet).sort();
        nextSnapshot.deepLineLevels = targetLevels;
      } else {
        nextSnapshot.thinLines = Array.from(targetSet).sort();
        nextSnapshot.thinLineLevels = targetLevels;
      }

      return nextSnapshot;
    }, { coalesce: true });
  }, [applyChange, currentTrialLevel, deepLines, height, thinLines, trialActive, width]);

  const handleDocumentPointerMove = useCallback((event: PointerEvent) => {
    if (pointerIdRef.current !== event.pointerId || !dragModeRef.current) return;

    const position = getBoardPosition(event.clientX, event.clientY);
    if (!position) return;

    if (dragModeRef.current === 'deepLine') {
      const currentVertex = getNearestVertex(position.x, position.y);
      const lastVertex = lastVertexRef.current;
      if (lastVertex) {
        const dr = lastVertex.rowLine - currentVertex.rowLine;
        const dc = lastVertex.colLine - currentVertex.colLine;
        let edgeKey = '';

        if (dr === 0 && Math.abs(dc) === 1) {
          const minCol = Math.min(lastVertex.colLine, currentVertex.colLine);
          const edgeRow = lastVertex.rowLine - 1;
          if (edgeRow >= 0 && edgeRow < height && minCol >= 0 && minCol < width) {
            edgeKey = `v-${edgeRow}-${minCol}`;
          }
        } else if (dc === 0 && Math.abs(dr) === 1) {
          const minRow = Math.min(lastVertex.rowLine, currentVertex.rowLine);
          const edgeCol = lastVertex.colLine - 1;
          if (minRow >= 0 && minRow < height && edgeCol >= 0 && edgeCol < width) {
            edgeKey = `h-${minRow}-${edgeCol}`;
          }
        }

        if (edgeKey) commitEdge('deepLine', edgeKey);
      }

      lastVertexRef.current = currentVertex;
      return;
    }

    const currentCell = getCellFromPos(position.x, position.y);
    const lastCell = lastCellRef.current;
    if (lastCell) {
      const edgeKey = getNikojiEdgeKey(lastCell.row, lastCell.col, currentCell.row, currentCell.col);
      if (edgeKey) {
        commitEdge('thinLine', edgeKey);
      }
    }
    lastCellRef.current = currentCell;
  }, [commitEdge, getBoardPosition, getCellFromPos, getNearestVertex, height, width]);

  const finishPointer = useCallback(() => {
    pointerIdRef.current = null;
    dragModeRef.current = null;
    lastCellRef.current = null;
    lastVertexRef.current = null;
    operationRef.current = null;
    finishBatch();
  }, [finishBatch]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== null) return;

    const position = getBoardPosition(event.clientX, event.clientY);
    if (!position) return;

    const isTouchPointer = event.pointerType === 'touch';
    let mode: LineMode | null = null;

    if (isTouchPointer) {
      const nearestVertex = getNearestVertex(position.x, position.y);
      const nearestCell = getCellFromPos(position.x, position.y);
      const center = getCenter(nearestCell.row, nearestCell.col);
      const vertexDistance = Math.hypot(
        position.x - nearestVertex.colLine * cellSize,
        position.y - nearestVertex.rowLine * cellSize
      );
      const centerDistance = Math.hypot(position.x - center.x, position.y - center.y);
      mode = vertexDistance <= centerDistance ? 'deepLine' : 'thinLine';
    } else if (event.button === 0) {
      mode = 'deepLine';
    } else if (event.button === 2) {
      mode = 'thinLine';
    }

    if (!mode) return;

    event.preventDefault();
    safeSetPointerCapture(boardRef.current ?? event.currentTarget, event.pointerId);
    pointerIdRef.current = event.pointerId;
    dragModeRef.current = mode;
    operationRef.current = null;
    startBatch();

    if (mode === 'deepLine') {
      lastVertexRef.current = getNearestVertex(position.x, position.y);
      lastCellRef.current = null;
    } else {
      lastCellRef.current = getCellFromPos(position.x, position.y);
      lastVertexRef.current = null;
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

  const getDeepLineStyle = useCallback((key: string) => {
    const trialColors = getTrialLevelColors(deepLineLevels[key] ?? 0);
    return {
      stroke: trialColors?.line ?? woodBoardTheme.deepLine,
      strokeWidth: getBoardRegionStrokeWidth(cellSize),
    };
  }, [cellSize, deepLineLevels]);

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
        <div
          className="grid"
          style={getBoardGridStyle(BOARD_PADDING, BOARD_PADDING, width, cellSize)}
        >
          {letters.flatMap((row, r) =>
            row.map((letter, c) => {
              const isInvalid = showValidationMessage && invalidCellSet.has(`${r},${c}`);
              return (
                <div
                  key={`${r}-${c}`}
                  className={`flex items-center justify-center select-none ${boardClassNames.cellText}`}
                  style={{
                    ...getBoardCellStyle(cellSize, letter ? 'clue' : 'cell'),
                    ...(isInvalid ? getInvalidBoardCellColors('soft') : {}),
                    ...getBoardTextStyle(cellSize, 0.54, 18),
                  }}
                >
                  {letter ?? ''}
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
            zIndex: 10,
          }}
          shapeRendering="crispEdges"
        >
          {Array.from({ length: height }, (_, row) =>
            Array.from({ length: width - 1 }, (_, col) => {
              const key = `h-${row}-${col}`;
              if (!deepLineSet.has(key)) return null;
              const { stroke, strokeWidth } = getDeepLineStyle(key);
              const x = col * cellSize + cellSize;
              return (
                <line
                  key={`deep-v-${row}-${col}`}
                  x1={x}
                  y1={row * cellSize}
                  x2={x}
                  y2={(row + 1) * cellSize}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  strokeLinecap="butt"
                />
              );
            })
          )}
          {Array.from({ length: height - 1 }, (_, row) =>
            Array.from({ length: width }, (_, col) => {
              const key = `v-${row}-${col}`;
              if (!deepLineSet.has(key)) return null;
              const { stroke, strokeWidth } = getDeepLineStyle(key);
              const y = row * cellSize + cellSize;
              return (
                <line
                  key={`deep-h-${row}-${col}`}
                  x1={col * cellSize}
                  y1={y}
                  x2={(col + 1) * cellSize}
                  y2={y}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  strokeLinecap="butt"
                />
              );
            })
          )}

          {thinLines.map((key) => {
            const [type, rStr, cStr] = key.split('-');
            const row = Number(rStr);
            const col = Number(cStr);
            let x1 = 0;
            let y1 = 0;
            let x2 = 0;
            let y2 = 0;

            if (type === 'h') {
              const from = getCenter(row, col);
              const to = getCenter(row, col + 1);
              x1 = from.x;
              y1 = from.y;
              x2 = to.x;
              y2 = to.y;
            } else {
              const from = getCenter(row, col);
              const to = getCenter(row + 1, col);
              x1 = from.x;
              y1 = from.y;
              x2 = to.x;
              y2 = to.y;
            }

            return (
              <line
                key={`thin-${key}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={getTrialLevelColors(thinLineLevels[key] ?? 0)?.line ?? woodBoardTheme.thinLine}
                strokeWidth={getBoardThinStrokeWidth(cellSize)}
                strokeLinecap="round"
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
