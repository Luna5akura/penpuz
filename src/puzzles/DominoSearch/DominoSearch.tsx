import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import PuzzleAssistToolbar from '@/components/PuzzleAssistToolbar';
import { usePuzzleHistory } from '@/hooks/usePuzzleHistory';
import { safeSetPointerCapture } from '@/lib/pointer';
import { sanitizeNumberRecord, sanitizeStringArray } from '../snapshotGuards';
import { getTrialLevelColors } from '../trialStyles';
import type { DominoSearchPuzzleData } from '../types';
import {
  commonBoardChrome,
  getBoardCellColors,
  getBoardFrameStyle,
  getBoardNumberFontSize,
  getCellDividerStyle,
  getLoopCrossSize,
  getLoopCrossStrokeWidth,
  getResponsiveCellSize,
  getRoomBoundaryStrokeWidth,
  woodBoardTheme,
} from '../boardTheme';
import { areOrthogonallyAdjacent, getCellKey, parseSolutionEdgeKey } from '../gridUtils';
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

function normalizeDominoSearchSnapshot(snapshot: unknown): DominoSearchSnapshot {
  const source = snapshot as Partial<DominoSearchSnapshot> | null | undefined;
  return {
    edges: sanitizeStringArray(source?.edges),
    crossedEdges: sanitizeStringArray(source?.crossedEdges),
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
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === 'undefined' ? 1024 : window.innerWidth
  );
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const hasCompleted = useRef(false);

  const createInitialSnapshot = useCallback<() => DominoSearchSnapshot>(() => ({
    edges: [],
    crossedEdges: [],
    levels: {},
  }), []);
  const getResetSnapshot = useCallback(() => normalizeDominoSearchSnapshot(initialSnapshot), [initialSnapshot]);

  const history = usePuzzleHistory<DominoSearchSnapshot>(createInitialSnapshot(), {
    normalizeTrialSnapshot: (trialSnapshot) => ({
      ...normalizeDominoSearchSnapshot(trialSnapshot),
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

  const normalizedSnapshot = useMemo(() => normalizeDominoSearchSnapshot(snapshot), [snapshot]);
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
      const current = normalizeDominoSearchSnapshot(currentSnapshot);
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
  }, [applyChange, currentTrialLevel, trialActive]);

  const toggleCrossedEdge = useCallback((edgeKey: string) => {
    applyChange((currentSnapshot) => {
      const current = normalizeDominoSearchSnapshot(currentSnapshot);
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
  }, [applyChange, currentTrialLevel, trialActive]);

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

  const boardWidthPx = width * cellSize;
  const boardHeightPx = height * cellSize;
  const outerWidth = boardWidthPx + BOARD_PADDING * 2 + BOARD_BORDER * 2;
  const outerHeight = boardHeightPx + BOARD_PADDING * 2 + BOARD_BORDER * 2;
  const numberFontSize = getBoardNumberFontSize(cellSize);
  const dominoBorderStroke = getRoomBoundaryStrokeWidth();
  const crossSize = getLoopCrossSize(cellSize, 0.12, 5);
  const crossStroke = getLoopCrossStrokeWidth();

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
        onPointerDown={handleBoardPointerDown}
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
          {numbers.flatMap((rowNumbers, row) =>
            rowNumbers.map((value, col) => {
              const key = getCellKey(row, col);
              const isBlocked = value === null;
              const isSelected = selectedCell?.row === row && selectedCell?.col === col;
              const baseStyle = getBoardCellColors(isBlocked ? 'shaded' : 'cell');

              return (
                <div
                  key={key}
                  className="relative flex items-center justify-center touch-none font-semibold tabular-nums"
                  style={{
                    width: `${cellSize}px`,
                    height: `${cellSize}px`,
                    ...baseStyle,
                    ...getCellDividerStyle(),
                    color: isBlocked ? woodBoardTheme.shadedText : woodBoardTheme.border,
                    cursor: isBlocked ? 'default' : 'pointer',
                    fontSize: `${numberFontSize}px`,
                    lineHeight: 1,
                    outline: isSelected && !isBlocked ? `3px solid ${woodBoardTheme.accentBorder}` : undefined,
                    outlineOffset: isSelected && !isBlocked ? '-4px' : undefined,
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
                {...rect}
                fill="none"
                stroke={trialColors?.line ?? woodBoardTheme.ink}
                strokeWidth={dominoBorderStroke}
                strokeLinejoin="miter"
              />
            );
          })}
          {Array.from(crossedEdgeSet).map((edgeKey) => {
            const points = getEdgeLinePoints(edgeKey, cellSize);
            if (!points) return null;
            const trialColors = getTrialLevelColors(normalizedSnapshot.levels[edgeKey] ?? 0);
            const x = (points.x1 + points.x2) / 2;
            const y = (points.y1 + points.y2) / 2;

            return (
              <g
                key={`cross-${edgeKey}`}
                stroke={trialColors?.text ?? woodBoardTheme.border}
                strokeWidth={crossStroke}
                strokeLinecap="round"
              >
                <line x1={x - crossSize} y1={y - crossSize} x2={x + crossSize} y2={y + crossSize} />
                <line x1={x - crossSize} y1={y + crossSize} x2={x + crossSize} y2={y - crossSize} />
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex max-w-full flex-wrap justify-center gap-1.5 text-sm">
        {dominoListItems.map(({ left, right, index, used }) => (
          <span
            key={`${left}-${right}-${index}`}
            className="border px-2 py-1 font-medium tabular-nums dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            style={{
              borderColor: used ? woodBoardTheme.border : woodBoardTheme.accentBorder,
              background: used ? woodBoardTheme.shaded : woodBoardTheme.panel,
              color: used ? woodBoardTheme.shadedText : woodBoardTheme.accentText,
            }}
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

      {showValidationMessage && visibleValidation?.message ? (
        <div className="text-center text-sm text-muted-foreground dark:text-gray-400">
          {visibleValidation.message}
        </div>
      ) : null}
    </div>
  );
}
