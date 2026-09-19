import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import PuzzleAssistToolbar from '@/components/PuzzleAssistToolbar';
import ValidationMessage from '@/components/ValidationMessage';
import { usePuzzleHistory } from '@/hooks/usePuzzleHistory';
import { safeSetPointerCapture } from '@/lib/pointer';
import { sanitizeNumberRecord, sanitizeStringArray } from '../snapshotGuards';
import { getTrialLevelColors } from '../trialStyles';
import { useBoardContainerWidth } from '../useBoardContainerWidth';
import type { DominoSearchPuzzleData } from '../types';
import {
  boardClassNames,
  commonBoardChrome,
  getBoardCellStyle,
  getBoardDominoBadgeStyle,
  getBoardFrameStyle,
  getBoardFrameDimensions,
  getBoardGridStyle,
  getBoardGridOutlineRect,
  getBoardTextStyle,
  getResponsiveCellSize,
  woodBoardTheme,
} from '../boardTheme';
import BoardEdgeCross from '../shared/BoardEdgeCross';
import {
  areOrthogonallyAdjacent,
  filterValidCellEdgeKeys,
  getCellKey,
  parseSolutionEdgeKey,
} from '../gridUtils';
import {
  countPlacedDominoPairs,
  detectDominoSearchBoundaryHitTarget,
  getDominoPairKey,
  normalizeDominoEdge,
  validateDominoSearch,
} from './utils';

interface Props {
  puzzle: DominoSearchPuzzleData;
  startTime: number;
  resetToken: number;
  onComplete: (time: number) => void;
  initialSnapshot?: unknown;
  onSnapshotChange?: (snapshot: unknown) => void;
  fixedCellSize?: number;
  showValidationMessage?: boolean;
}

interface DominoSearchSnapshot {
  edges: string[];
  crossedEdges: string[];
  levels: Record<string, number>;
}

const BOARD_PADDING = commonBoardChrome.padding;
const BOARD_BORDER = commonBoardChrome.border;

function normalizeDominoSearchSnapshot(snapshot: unknown, width: number, height: number): DominoSearchSnapshot {
  const source = snapshot as Partial<DominoSearchSnapshot> | null | undefined;
  return {
    edges: filterValidCellEdgeKeys(sanitizeStringArray(source?.edges), width, height),
    crossedEdges: filterValidCellEdgeKeys(sanitizeStringArray(source?.crossedEdges), width, height),
    levels: sanitizeNumberRecord(source?.levels),
  };
}

function getEdgeLinePoints(edgeKey: string, cellSize: number) {
  const edge = parseSolutionEdgeKey(edgeKey);
  if (!edge) return null;

  return {
    x1: BOARD_PADDING + (edge.c1 + 0.5) * cellSize,
    y1: BOARD_PADDING + (edge.r1 + 0.5) * cellSize,
    x2: BOARD_PADDING + (edge.c2 + 0.5) * cellSize,
    y2: BOARD_PADDING + (edge.r2 + 0.5) * cellSize,
  };
}

function getDominoOutlineRect(edgeKey: string, cellSize: number) {
  const edge = parseSolutionEdgeKey(edgeKey);
  if (!edge) return null;

  const horizontal = edge.r1 === edge.r2 && Math.abs(edge.c1 - edge.c2) === 1;
  const vertical = edge.c1 === edge.c2 && Math.abs(edge.r1 - edge.r2) === 1;
  if (!horizontal && !vertical) return null;

  const row = Math.min(edge.r1, edge.r2);
  const col = Math.min(edge.c1, edge.c2);

  return {
    x: BOARD_PADDING + col * cellSize,
    y: BOARD_PADDING + row * cellSize,
    width: (horizontal ? 2 : 1) * cellSize,
    height: (vertical ? 2 : 1) * cellSize,
  };
}

export default function DominoSearchBoard({
  puzzle,
  startTime,
  resetToken,
  onComplete,
  initialSnapshot,
  onSnapshotChange,
  fixedCellSize,
  showValidationMessage = false,
}: Props) {
  const { width, height, numbers, dominoes } = puzzle;
  const [containerRef, viewportWidth] = useBoardContainerWidth();
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const hasCompleted = useRef(false);

  const createInitialSnapshot = useCallback<() => DominoSearchSnapshot>(() => ({
    edges: [],
    crossedEdges: [],
    levels: {},
  }), []);
  const getResetSnapshot = useCallback(
    () => normalizeDominoSearchSnapshot(initialSnapshot, width, height),
    [height, initialSnapshot, width]
  );

  const history = usePuzzleHistory<DominoSearchSnapshot>(createInitialSnapshot(), {
    normalizeTrialSnapshot: (trialSnapshot) => ({
      ...normalizeDominoSearchSnapshot(trialSnapshot, width, height),
      levels: {},
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
  } = history;

  const normalizedSnapshot = useMemo(
    () => normalizeDominoSearchSnapshot(snapshot, width, height),
    [height, snapshot, width]
  );
  const edgeSet = useMemo(() => new Set(normalizedSnapshot.edges), [normalizedSnapshot.edges]);
  const crossedEdgeSet = useMemo(() => new Set(normalizedSnapshot.crossedEdges), [normalizedSnapshot.crossedEdges]);
  const placedDominoCounts = useMemo(
    () => countPlacedDominoPairs(normalizedSnapshot.edges, numbers),
    [normalizedSnapshot.edges, numbers]
  );
  const dominoListItems = useMemo(() => {
    const seenCounts = new Map<string, number>();

    return dominoes.map(([left, right], index) => {
      const key = getDominoPairKey(left, right);
      const seenCount = seenCounts.get(key) ?? 0;
      seenCounts.set(key, seenCount + 1);

      return {
        left,
        right,
        index,
        used: (placedDominoCounts.get(key) ?? 0) > seenCount,
      };
    });
  }, [dominoes, placedDominoCounts]);
  const validation = useMemo(
    () => validateDominoSearch(normalizedSnapshot.edges, puzzle),
    [normalizedSnapshot.edges, puzzle]
  );
  const visibleValidation = showValidationMessage ? validation : null;
  const cellSize = useMemo(
    () => getResponsiveCellSize({ fixedCellSize, viewportWidth, width, containerWidth: true }),
    [fixedCellSize, viewportWidth, width]
  );

  const resetBoard = useCallback(() => {
    reset(getResetSnapshot());
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

  const toggleDomino = useCallback((a: { row: number; col: number }, b: { row: number; col: number }) => {
    const edgeKey = normalizeDominoEdge(a, b);

    applyChange((currentSnapshot) => {
      const current = normalizeDominoSearchSnapshot(currentSnapshot, width, height);
      const nextEdges = new Set(current.edges);
      const nextCrossedEdges = new Set(current.crossedEdges);
      const nextLevels = { ...current.levels };

      const touchesSelectedCells = (candidateKey: string) => {
        const edge = parseSolutionEdgeKey(candidateKey);
        if (!edge) return false;
        const cells = [
          getCellKey(edge.r1, edge.c1),
          getCellKey(edge.r2, edge.c2),
        ];
        return cells.includes(getCellKey(a.row, a.col)) || cells.includes(getCellKey(b.row, b.col));
      };

      if (nextEdges.has(edgeKey)) {
        nextEdges.delete(edgeKey);
        delete nextLevels[edgeKey];
      } else {
        Array.from(nextEdges)
          .filter(touchesSelectedCells)
          .forEach((candidateKey) => {
            nextEdges.delete(candidateKey);
            delete nextLevels[candidateKey];
          });
        nextCrossedEdges.delete(edgeKey);
        delete nextLevels[edgeKey];
        nextEdges.add(edgeKey);
        nextLevels[edgeKey] = trialActive ? currentTrialLevel : 0;
      }

      return {
        edges: Array.from(nextEdges).sort(),
        crossedEdges: Array.from(nextCrossedEdges).sort(),
        levels: nextLevels,
      };
    });
  }, [applyChange, currentTrialLevel, height, trialActive, width]);

  const toggleCrossedEdge = useCallback((edgeKey: string) => {
    applyChange((currentSnapshot) => {
      const current = normalizeDominoSearchSnapshot(currentSnapshot, width, height);
      const nextEdges = new Set(current.edges);
      const nextCrossedEdges = new Set(current.crossedEdges);
      const nextLevels = { ...current.levels };

      if (nextCrossedEdges.has(edgeKey)) {
        nextCrossedEdges.delete(edgeKey);
        delete nextLevels[edgeKey];
      } else {
        nextCrossedEdges.add(edgeKey);
        nextLevels[edgeKey] = trialActive ? currentTrialLevel : 0;
        nextEdges.delete(edgeKey);
      }

      return {
        edges: Array.from(nextEdges).sort(),
        crossedEdges: Array.from(nextCrossedEdges).sort(),
        levels: nextLevels,
      };
    });
  }, [applyChange, currentTrialLevel, height, trialActive, width]);

  const getBoardPosition = useCallback((clientX: number, clientY: number) => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return null;

    const x = clientX - rect.left - BOARD_BORDER - BOARD_PADDING;
    const y = clientY - rect.top - BOARD_BORDER - BOARD_PADDING;
    if (x < 0 || y < 0 || x > width * cellSize || y > height * cellSize) return null;

    return { x, y };
  }, [cellSize, height, width]);

  const getCellFromPosition = useCallback((x: number, y: number) => ({
    row: Math.max(0, Math.min(height - 1, Math.floor(y / cellSize))),
    col: Math.max(0, Math.min(width - 1, Math.floor(x / cellSize))),
  }), [cellSize, height, width]);

  const handleBoardPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const position = getBoardPosition(event.clientX, event.clientY);
    if (!position) return;

    event.preventDefault();
    safeSetPointerCapture(boardRef.current ?? event.currentTarget, event.pointerId);

    const isTouchPointer = event.pointerType === 'touch';

    if (!isTouchPointer && event.button === 2) {
      const hitTarget = detectDominoSearchBoundaryHitTarget(position.x, position.y, width, height, cellSize);
      if (hitTarget && hitTarget.cells.every((cell) => numbers[cell.row]?.[cell.col] !== null)) {
        toggleCrossedEdge(hitTarget.key);
      }
      setSelectedCell(null);
      return;
    }

    if (!isTouchPointer && event.button !== 0) return;

    const current = getCellFromPosition(position.x, position.y);
    const { row, col } = current;
    if (numbers[row][col] === null) {
      setSelectedCell(null);
      return;
    }

    if (!selectedCell) {
      setSelectedCell(current);
      return;
    }

    if (selectedCell.row === row && selectedCell.col === col) {
      setSelectedCell(null);
      return;
    }

    if (areOrthogonallyAdjacent(selectedCell, current)) {
      toggleDomino(selectedCell, current);
      setSelectedCell(null);
      return;
    }

    setSelectedCell(current);
  };

  const { outerWidth, outerHeight } = getBoardFrameDimensions(
    width,
    height,
    cellSize,
    { borderWidth: BOARD_BORDER, padding: BOARD_PADDING }
  );

  return (
    <div ref={containerRef} className="flex w-full min-w-0 flex-col items-center gap-3">
      <div
        ref={boardRef}
        className="relative select-none touch-none"
        style={{
          width: `${outerWidth}px`,
          height: `${outerHeight}px`,
          ...getBoardFrameStyle(BOARD_BORDER),
        }}
        onPointerDown={handleBoardPointerDown}
        onContextMenu={(event) => event.preventDefault()}
      >
        <div
          className="absolute grid"
          style={getBoardGridStyle(BOARD_PADDING, BOARD_PADDING, width, cellSize)}
        >
          {numbers.flatMap((rowNumbers, row) =>
            rowNumbers.map((value, col) => {
              const key = getCellKey(row, col);
              const isBlocked = value === null;
              const isSelected = selectedCell?.row === row && selectedCell?.col === col;
              return (
                <div
                  key={key}
                  className={boardClassNames.touchCellContent}
                  style={{
                    ...getBoardCellStyle(cellSize, isBlocked ? 'shaded' : 'cell', {
                      cursor: isBlocked ? 'default' : 'pointer',
                      selected: isSelected && !isBlocked,
                    }),
                    ...getBoardTextStyle(cellSize),
                  }}
                >
                  {value}
                </div>
              );
            })
          )}
        </div>

        <svg
          className="pointer-events-none absolute left-0 top-0"
          width={outerWidth - BOARD_BORDER * 2}
          height={outerHeight - BOARD_BORDER * 2}
        >
          {Array.from(edgeSet).map((edgeKey) => {
            const rect = getDominoOutlineRect(edgeKey, cellSize);
            if (!rect) return null;
            const trialColors = getTrialLevelColors(normalizedSnapshot.levels[edgeKey] ?? 0);

            return (
              <rect
                key={`edge-${edgeKey}`}
                {...getBoardGridOutlineRect(
                  rect.x,
                  rect.y,
                  rect.width,
                  rect.height,
                  trialColors?.line ?? woodBoardTheme.border
                )}
              />
            );
          })}
          {Array.from(crossedEdgeSet).map((edgeKey) => {
            const points = getEdgeLinePoints(edgeKey, cellSize);
            if (!points) return null;
            const x = (points.x1 + points.x2) / 2;
            const y = (points.y1 + points.y2) / 2;

            return (
              <BoardEdgeCross
                key={`cross-${edgeKey}`}
                x={x}
                y={y}
                cellSize={cellSize}
              />
            );
          })}
        </svg>
      </div>

      <div className="flex w-full min-w-0 max-w-full self-stretch flex-wrap justify-center gap-1.5 overflow-hidden text-sm">
        {dominoListItems.map(({ left, right, index, used }) => (
          <span
            key={`${left}-${right}-${index}`}
            className="shrink-0 whitespace-nowrap border px-2 py-1 font-medium tabular-nums"
            style={getBoardDominoBadgeStyle(used)}
          >
            {left}-{right}
          </span>
        ))}
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
