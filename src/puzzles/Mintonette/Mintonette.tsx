import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PuzzleAssistToolbar from '@/components/PuzzleAssistToolbar';
import { usePuzzleHistory } from '@/hooks/usePuzzleHistory';
import type { MintonettePuzzleData } from '../types';
import {
  commonBoardChrome,
  getBoardCellColors,
  getBoardCircleClueDiameter,
  getBoardCircleClueStrokeWidth,
  getBoardFrameStyle,
  getBoardNumberFontSize,
  getCellDividerStyle,
  getResponsiveCellSize,
  woodBoardTheme,
} from '../boardTheme';
import { getTrialLevelColors } from '../trialStyles';
import {
  detectMintonetteHitTarget,
  getMintonetteEdgeKey,
  parseMintonetteEdgeKey,
  validateMintonette,
} from './utils';

interface Props {
  puzzle: MintonettePuzzleData;
  startTime: number;
  resetToken: number;
  onComplete: (time: number) => void;
  initialSnapshot?: unknown;
  onSnapshotChange?: (snapshot: unknown) => void;
  fixedCellSize?: number;
  showValidationMessage?: boolean;
}

type MintonetteSnapshot = {
  lineEdges: string[];
  crossedEdges: string[];
  lineEdgeLevels: Record<string, number>;
  crossedEdgeLevels: Record<string, number>;
};

const BOARD_PADDING = commonBoardChrome.padding;

function normalizeMintonetteSnapshot(snapshot: unknown): MintonetteSnapshot {
  const source = snapshot as Partial<MintonetteSnapshot> | null | undefined;
  return {
    lineEdges: Array.isArray(source?.lineEdges) ? [...source.lineEdges] : [],
    crossedEdges: Array.isArray(source?.crossedEdges) ? [...source.crossedEdges] : [],
    lineEdgeLevels: source?.lineEdgeLevels && typeof source.lineEdgeLevels === 'object'
      ? { ...source.lineEdgeLevels }
      : {},
    crossedEdgeLevels: source?.crossedEdgeLevels && typeof source.crossedEdgeLevels === 'object'
      ? { ...source.crossedEdgeLevels }
      : {},
  };
}

export default function MintonetteBoard({
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
  const pointerIdRef = useRef<number | null>(null);
  const pointerEndHandlerRef = useRef<(() => void) | null>(null);
  const lastCellRef = useRef<{ row: number; col: number } | null>(null);
  const operationRef = useRef<'add' | 'delete' | null>(null);
  const hasCompleted = useRef(false);

  const createInitialSnapshot = useCallback<MintonetteSnapshot>(() => ({
    lineEdges: [],
    crossedEdges: [],
    lineEdgeLevels: {},
    crossedEdgeLevels: {},
  }), []);

  const history = usePuzzleHistory<MintonetteSnapshot>(
    initialSnapshot ? normalizeMintonetteSnapshot(initialSnapshot) : createInitialSnapshot(),
    {
      normalizeTrialSnapshot: (trialSnapshot) => ({
        ...normalizeMintonetteSnapshot(trialSnapshot),
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

  const normalizedSnapshot = useMemo(() => normalizeMintonetteSnapshot(snapshot), [snapshot]);
  const lineEdges = normalizedSnapshot.lineEdges;
  const crossedEdges = normalizedSnapshot.crossedEdges;
  const lineEdgeLevels = normalizedSnapshot.lineEdgeLevels;
  const crossedEdgeLevels = normalizedSnapshot.crossedEdgeLevels;
  const lineEdgeSet = useMemo(() => new Set(lineEdges), [lineEdges]);
  const clueMap = useMemo(() => {
    const map = new Map<string, { value: number | null }>();
    clues.forEach((clue) => map.set(`${clue.row},${clue.col}`, { value: clue.value }));
    return map;
  }, [clues]);
  const hasEdited = canUndo || canRedo || trialActive || trialCheckpointCount > 0;
  const validation = useMemo(
    () => (hasEdited ? validateMintonette(lineEdgeSet, puzzle) : null),
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
  }), [fixedCellSize, viewportWidth, width]);

  const clueNumberFontSize = useMemo(() => getBoardNumberFontSize(cellSize, 0.58, 18), [cellSize]);
  const clueCircleDiameter = useMemo(() => getBoardCircleClueDiameter(cellSize), [cellSize]);
  const clueCircleStrokeWidth = useMemo(() => getBoardCircleClueStrokeWidth(cellSize), [cellSize]);

  useEffect(() => {
    const updateSize = () => setViewportWidth(window.innerWidth);
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    reset(initialSnapshot ? normalizeMintonetteSnapshot(initialSnapshot) : createInitialSnapshot());
    hasCompleted.current = false;
    pointerIdRef.current = null;
    lastCellRef.current = null;
    operationRef.current = null;
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

  const getCenter = useCallback((row: number, col: number) => ({
    x: col * cellSize + cellSize / 2,
    y: row * cellSize + cellSize / 2,
  }), [cellSize]);

  const toggleCrossEdge = useCallback((key: string) => {
    applyChange((currentSnapshot) => {
      const nextSnapshot = normalizeMintonetteSnapshot(currentSnapshot);
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
  }, [applyChange, currentTrialLevel, trialActive]);

  const commitLineEdge = useCallback((key: string) => {
    if (!key) return;

    if (operationRef.current === null) {
      operationRef.current = lineEdgeSet.has(key) ? 'delete' : 'add';
    }

    const op = operationRef.current;
    applyChange((currentSnapshot) => {
      const nextSnapshot = normalizeMintonetteSnapshot(currentSnapshot);
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
  }, [applyChange, currentTrialLevel, lineEdgeSet, trialActive]);

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

    const edgeKey = getMintonetteEdgeKey(lastCell.row, lastCell.col, currentCell.row, currentCell.col);
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
    document.removeEventListener('pointermove', handleDocumentPointerMove);
    if (pointerEndHandlerRef.current) {
      document.removeEventListener('pointerup', pointerEndHandlerRef.current);
      document.removeEventListener('pointercancel', pointerEndHandlerRef.current);
    }
    pointerEndHandlerRef.current = null;
  }, [finishBatch, handleDocumentPointerMove]);

  const startLineDrag = useCallback((pointerId: number, row: number, col: number) => {
    pointerIdRef.current = pointerId;
    lastCellRef.current = { row, col };
    operationRef.current = null;
    startBatch();
    document.addEventListener('pointermove', handleDocumentPointerMove, { passive: true });
    pointerEndHandlerRef.current = finishPointer;
    document.addEventListener('pointerup', finishPointer, { passive: true });
    document.addEventListener('pointercancel', finishPointer, { passive: true });
  }, [finishPointer, handleDocumentPointerMove, startBatch]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== null) return;

    const position = getBoardPosition(event.clientX, event.clientY);
    if (!position) return;

    const hitTarget = detectMintonetteHitTarget(position.x, position.y, width, height, cellSize);
    if (!hitTarget) return;

    const isTouchPointer = event.pointerType === 'touch';

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
          {Array.from({ length: height }, (_, row) =>
            Array.from({ length: width }, (_, col) => {
              const isInvalid = showValidationMessage && invalidCellSet.has(`${row},${col}`);
              return (
                <div
                  key={`${row}-${col}`}
                  className="relative flex items-center justify-center"
                  style={{
                    width: `${cellSize}px`,
                    height: `${cellSize}px`,
                    ...getBoardCellColors('cell'),
                    ...getCellDividerStyle(),
                    ...(isInvalid ? { background: woodBoardTheme.invalidSoft } : {}),
                  }}
                >
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
          {lineEdges.map((edgeKey) => {
            const edge = parseMintonetteEdgeKey(edgeKey);
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
                strokeWidth={Math.max(4, Math.floor(cellSize * 0.11))}
                strokeLinecap="round"
              />
            );
          })}

          {crossedEdges.map((edgeKey) => {
            const edge = parseMintonetteEdgeKey(edgeKey);
            if (!edge) return null;
            const centerX = (getCenter(edge.r1, edge.c1).x + getCenter(edge.r2, edge.c2).x) / 2;
            const centerY = (getCenter(edge.r1, edge.c1).y + getCenter(edge.r2, edge.c2).y) / 2;
            const size = Math.max(4, Math.floor(cellSize * 0.12));
            const trialColors = getTrialLevelColors(crossedEdgeLevels[edgeKey] ?? 0);
            return (
              <g
                key={`cross-${edgeKey}`}
                stroke={trialColors?.text ?? woodBoardTheme.border}
                strokeWidth="1.7"
                strokeLinecap="round"
              >
                <line x1={centerX - size} y1={centerY - size} x2={centerX + size} y2={centerY + size} />
                <line x1={centerX - size} y1={centerY + size} x2={centerX + size} y2={centerY - size} />
              </g>
            );
          })}
        </svg>

        <div
          style={{
            position: 'absolute',
            top: `${BOARD_PADDING}px`,
            left: `${BOARD_PADDING}px`,
            width: `${boardWidth}px`,
            height: `${boardHeight}px`,
            pointerEvents: 'none',
            zIndex: 3,
          }}
        >
          {Array.from({ length: height }, (_, row) =>
            Array.from({ length: width }, (_, col) => {
              const clueInfo = clueMap.get(`${row},${col}`);
              if (!clueInfo) return null;

              return (
                <div
                  key={`clue-${row}-${col}`}
                  className="absolute flex items-center justify-center rounded-full font-semibold tabular-nums"
                  style={{
                    width: `${clueCircleDiameter}px`,
                    height: `${clueCircleDiameter}px`,
                    top: `${row * cellSize + (cellSize - clueCircleDiameter) / 2}px`,
                    left: `${col * cellSize + (cellSize - clueCircleDiameter) / 2}px`,
                    border: `${clueCircleStrokeWidth}px solid ${woodBoardTheme.border}`,
                    color: woodBoardTheme.border,
                    background: getBoardCellColors('cell').background,
                    fontSize: `${clueNumberFontSize}px`,
                    lineHeight: 1,
                  }}
                >
                  {clueInfo.value ?? ''}
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
