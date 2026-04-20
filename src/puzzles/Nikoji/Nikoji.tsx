import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePuzzleHistory } from '@/hooks/usePuzzleHistory';
import PuzzleAssistToolbar from '@/components/PuzzleAssistToolbar';
import type { NikojiPuzzleData } from '../types';
import {
  commonBoardChrome,
  getBoardCellColors,
  getBoardFrameStyle,
  getCellDividerStyle,
  getResponsiveCellSize,
  woodBoardTheme,
} from '../boardTheme';
import { getTrialLevelColors } from '../trialStyles';
import { getNikojiEdgeKey, validateNikoji } from './utils';

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

function normalizeNikojiSnapshot(snapshot: unknown): NikojiSnapshot {
  const source = snapshot as Partial<NikojiSnapshot> | null | undefined;
  return {
    deepLines: Array.isArray(source?.deepLines) ? [...source.deepLines] : [],
    thinLines: Array.isArray(source?.thinLines) ? [...source.thinLines] : [],
    deepLineLevels: source?.deepLineLevels && typeof source.deepLineLevels === 'object'
      ? { ...source.deepLineLevels }
      : {},
    thinLineLevels: source?.thinLineLevels && typeof source.thinLineLevels === 'object'
      ? { ...source.thinLineLevels }
      : {},
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
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === 'undefined' ? 1024 : window.innerWidth
  );
  const boardRef = useRef<HTMLDivElement>(null);
  const pointerIdRef = useRef<number | null>(null);
  const pointerUpHandlerRef = useRef<(() => void) | null>(null);
  const dragModeRef = useRef<LineMode | null>(null);
  const lastCellRef = useRef<{ row: number; col: number } | null>(null);
  const lastVertexRef = useRef<{ rowLine: number; colLine: number } | null>(null);
  const operationRef = useRef<'add' | 'delete' | null>(null);
  const hasCompleted = useRef(false);

  const createInitialSnapshot = useCallback<NikojiSnapshot>(() => ({
    deepLines: [],
    thinLines: [],
    deepLineLevels: {},
    thinLineLevels: {},
  }), []);

  const history = usePuzzleHistory<NikojiSnapshot>(
    initialSnapshot ? normalizeNikojiSnapshot(initialSnapshot) : createInitialSnapshot(),
    {
      normalizeTrialSnapshot: (trialSnapshot) => ({
        ...normalizeNikojiSnapshot(trialSnapshot),
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

  const normalizedSnapshot = useMemo(() => normalizeNikojiSnapshot(snapshot), [snapshot]);
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
  }), [fixedCellSize, viewportWidth, width]);

  useEffect(() => {
    const updateSize = () => setViewportWidth(window.innerWidth);
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    reset(initialSnapshot ? normalizeNikojiSnapshot(initialSnapshot) : createInitialSnapshot());
    hasCompleted.current = false;
  }, [createInitialSnapshot, initialSnapshot, puzzle, reset, resetToken]);

  useEffect(() => {
    if (!validation?.valid || hasCompleted.current) return;
    hasCompleted.current = true;
    onComplete(Math.floor((Date.now() - startTime) / 1000));
  }, [onComplete, startTime, validation]);

  const getBoardPosition = useCallback((clientX: number, clientY: number) => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return null;

    const x = clientX - rect.left - BOARD_PADDING;
    const y = clientY - rect.top - BOARD_PADDING;
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
      const nextSnapshot = normalizeNikojiSnapshot(currentSnapshot);
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
  }, [applyChange, currentTrialLevel, deepLines, thinLines, trialActive]);

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
    document.removeEventListener('pointermove', handleDocumentPointerMove);
    if (pointerUpHandlerRef.current) {
      document.removeEventListener('pointerup', pointerUpHandlerRef.current);
    }
  }, [finishBatch, handleDocumentPointerMove]);

  useEffect(() => {
    pointerUpHandlerRef.current = finishPointer;
  }, [finishPointer]);

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

    document.addEventListener('pointermove', handleDocumentPointerMove, { passive: true });
    pointerUpHandlerRef.current = finishPointer;
    document.addEventListener('pointerup', finishPointer, { passive: true });
  };

  const getDeepLineStyle = useCallback((key: string) => {
    const trialColors = getTrialLevelColors(deepLineLevels[key] ?? 0);
    return {
      stroke: trialColors?.line ?? woodBoardTheme.deepLine,
      strokeWidth: 4,
    };
  }, [deepLineLevels]);

  const boardWidth = width * cellSize;
  const boardHeight = height * cellSize;

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={boardRef}
        className="mx-auto select-none"
        style={{
          position: 'relative',
          display: 'inline-block',
          padding: `${BOARD_PADDING}px`,
          touchAction: 'none',
          ...getBoardFrameStyle(),
        }}
        onPointerDown={handlePointerDown}
        onContextMenu={(event) => event.preventDefault()}
      >
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${width}, ${cellSize}px)`,
          }}
        >
          {letters.flatMap((row, r) =>
            row.map((letter, c) => {
              const isInvalid = showValidationMessage && invalidCellSet.has(`${r},${c}`);
              return (
                <div
                  key={`${r}-${c}`}
                  className="flex items-center justify-center font-semibold tabular-nums select-none"
                  style={{
                    width: `${cellSize}px`,
                    height: `${cellSize}px`,
                    ...getBoardCellColors(letter ? 'clue' : 'cell'),
                    ...getCellDividerStyle(),
                    ...(isInvalid ? { background: woodBoardTheme.invalidSoft, color: woodBoardTheme.invalidText } : {}),
                    fontSize: `${Math.max(18, Math.floor(cellSize * 0.54))}px`,
                    lineHeight: 1,
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
                strokeWidth={2}
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

      {showValidationMessage && validation?.message ? (
        <div className="text-sm text-muted-foreground dark:text-gray-400 text-center">
          {validation.message}
        </div>
      ) : null}
    </div>
  );
}
