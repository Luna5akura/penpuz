import { useCallback, useEffect, useMemo, useRef, type PointerEvent } from 'react';
import PuzzleAssistToolbar from '@/components/PuzzleAssistToolbar';
import ValidationMessage from '@/components/ValidationMessage';
import { usePuzzleHistory } from '@/hooks/usePuzzleHistory';
import { safeSetPointerCapture } from '@/lib/pointer';
import { sanitizeMatrix, sanitizeNumberRecord, sanitizeStringArray } from '../snapshotGuards';
import { getTrialLevelColors } from '../trialStyles';
import { useBoardContainerWidth } from '../useBoardContainerWidth';
import type { FourWindsWithParksCellValue, FourWindsWithParksDirection, FourWindsWithParksPuzzleData } from '../types';
import {
  boardClassNames,
  commonBoardChrome,
  getBoardCellStyle,
  getBoardClueTextStyle,
  getBoardFrameDimensions,
  getBoardFrameStyle,
  getBoardGridStyle,
  getBoardTextStyle,
  getBoardTrialCellStyle,
  getResponsiveCellSize,
} from '../boardTheme';
import BoardEdgeCross from '../shared/BoardEdgeCross';
import {
  filterValidGridLineEdgeKeys,
  getGridLineEdgeKey,
  isValidGridLineEdgeKey,
  parseGridLineEdgeKey,
} from '../gridUtils';
import FourWindsWithParksMark from './FourWindsWithParksVisuals';
import { validateFourWindsWithParks } from './utils';

interface Props {
  puzzle: FourWindsWithParksPuzzleData;
  startTime: number;
  resetToken: number;
  onComplete: (time: number) => void;
  initialSnapshot?: unknown;
  onSnapshotChange?: (snapshot: unknown) => void;
  fixedCellSize?: number;
  showValidationMessage?: boolean;
}

interface FourWindsWithParksSnapshot {
  grid: FourWindsWithParksCellValue[][];
  levels: number[][];
  crossedEdges: string[];
  crossedEdgeLevels: Record<string, number>;
}

type CellCoord = { row: number; col: number };
type PointerButton = 0 | 2;

interface PointerState {
  pointerId: number | null;
  button: PointerButton | null;
  startCell: CellCoord | null;
  lastCell: CellCoord | null;
  lastArrowTarget: CellCoord | null;
  moved: boolean;
}

const BOARD_PADDING = commonBoardChrome.padding;
const BOARD_BORDER = commonBoardChrome.border;
const FOUR_WINDS_WITH_PARKS_VALUES = new Set([0, 1, 2, 3, 4]);

function emptyGrid(width: number, height: number): FourWindsWithParksCellValue[][] {
  return Array.from({ length: height }, () => Array<FourWindsWithParksCellValue>(width).fill(null));
}

function normalizeFourWindsWithParksSnapshot(snapshot: unknown, width: number, height: number): FourWindsWithParksSnapshot {
  const fallbackGrid = emptyGrid(width, height);
  const source = snapshot as Partial<FourWindsWithParksSnapshot> | null | undefined;
  const grid = sanitizeMatrix(source?.grid, fallbackGrid, (value) => {
    if (value === 'cross') return 'cross';
    // Older snapshots and the puzzle answer format use 0 for the park/circle;
    // migrate that representation to the explicit player-facing circle mark.
    if (value === 'circle' || value === 0) return 'circle';
    return typeof value === 'number' && Number.isInteger(value) && FOUR_WINDS_WITH_PARKS_VALUES.has(value)
      ? value as FourWindsWithParksDirection
      : null;
  });
  const levels = sanitizeMatrix(
    source?.levels,
    Array.from({ length: height }, () => Array(width).fill(0)),
    (value, fallbackCell) => typeof value === 'number' && Number.isFinite(value) ? value : fallbackCell
  );

  return {
    grid,
    levels,
    crossedEdges: filterValidGridLineEdgeKeys(sanitizeStringArray(source?.crossedEdges), width, height),
    crossedEdgeLevels: Object.fromEntries(
      Object.entries(sanitizeNumberRecord(source?.crossedEdgeLevels)).filter(([key]) =>
        isValidGridLineEdgeKey(key, width, height)
      )
    ),
  };
}

function sameCell(a: CellCoord | null, b: CellCoord | null) {
  return a !== null && b !== null && a.row === b.row && a.col === b.col;
}

function getBoardPoint(clientX: number, clientY: number, rect: DOMRect) {
  return {
    x: clientX - rect.left - BOARD_BORDER - BOARD_PADDING,
    y: clientY - rect.top - BOARD_BORDER - BOARD_PADDING,
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

function getCellAtPoint(x: number, y: number, width: number, height: number, cellSize: number): CellCoord | null {
  if (x < 0 || y < 0 || x >= width * cellSize || y >= height * cellSize) return null;
  return { row: Math.floor(y / cellSize), col: Math.floor(x / cellSize) };
}

function getEdgeAtPoint(x: number, y: number, width: number, height: number, cellSize: number) {
  const boardWidth = width * cellSize;
  const boardHeight = height * cellSize;
  // Keep the hit band forgiving on touch devices while leaving most of each
  // cell available for the right-click mark/arrow actions.
  const threshold = Math.max(8, Math.floor(cellSize * 0.18));
  if (x < -threshold || y < -threshold || x > boardWidth + threshold || y > boardHeight + threshold) return null;

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

function getEdgeMidpoint(key: string, cellSize: number) {
  const edge = parseGridLineEdgeKey(key);
  if (!edge) return null;
  return edge.orientation === 'h'
    ? { x: BOARD_PADDING + (edge.col + 0.5) * cellSize, y: BOARD_PADDING + edge.row * cellSize }
    : { x: BOARD_PADDING + edge.col * cellSize, y: BOARD_PADDING + (edge.row + 0.5) * cellSize };
}

function getArrowDirection(from: CellCoord, to: CellCoord): FourWindsWithParksDirection | null {
  if (from.row === to.row) {
    if (to.col > from.col) return 2;
    if (to.col < from.col) return 4;
  }
  if (from.col === to.col) {
    if (to.row > from.row) return 3;
    if (to.row < from.row) return 1;
  }
  return null;
}

function resetPointerState(): PointerState {
  return {
    pointerId: null,
    button: null,
    startCell: null,
    lastCell: null,
    lastArrowTarget: null,
    moved: false,
  };
}

export default function FourWindsWithParksBoard({
  puzzle,
  startTime,
  resetToken,
  onComplete,
  initialSnapshot,
  onSnapshotChange,
  fixedCellSize,
  showValidationMessage = false,
}: Props) {
  const { width, height } = puzzle;
  const [containerRef, viewportWidth] = useBoardContainerWidth();
  const boardRef = useRef<HTMLDivElement>(null);
  const pointerState = useRef<PointerState>(resetPointerState());
  const hasCompleted = useRef(false);
  // The parent persists every snapshot through `onSnapshotChange`. Keep the
  // latest value available for an explicit reset without making the reset
  // effect run again after every ordinary move (which would erase history).
  const initialSnapshotRef = useRef(initialSnapshot);
  useEffect(() => {
    initialSnapshotRef.current = initialSnapshot;
  }, [initialSnapshot]);
  const createInitialSnapshot = useCallback<() => FourWindsWithParksSnapshot>(() => ({
    grid: emptyGrid(width, height),
    levels: Array.from({ length: height }, () => Array(width).fill(0)),
    crossedEdges: [],
    crossedEdgeLevels: {},
  }), [height, width]);
  const getResetSnapshot = useCallback(
    () => {
      const normalized = normalizeFourWindsWithParksSnapshot(initialSnapshotRef.current, width, height);
      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          if (puzzle.clues[row][col] !== null) {
            normalized.grid[row][col] = null;
            normalized.levels[row][col] = 0;
          }
        }
      }
      return normalized;
    }, [height, puzzle.clues, width]
  );

  const history = usePuzzleHistory<FourWindsWithParksSnapshot>(createInitialSnapshot(), {
    normalizeTrialSnapshot: (trialSnapshot) => {
      const normalized = normalizeFourWindsWithParksSnapshot(trialSnapshot, width, height);
      normalized.levels = Array.from({ length: height }, () => Array(width).fill(0));
      normalized.crossedEdgeLevels = {};
      return normalized;
    },
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
    () => normalizeFourWindsWithParksSnapshot(snapshot, width, height),
    [height, snapshot, width]
  );
  const grid = normalizedSnapshot.grid;
  const crossedEdges = useMemo(() => new Set(normalizedSnapshot.crossedEdges), [normalizedSnapshot.crossedEdges]);
  const validation = useMemo(
    () => validateFourWindsWithParks(grid, puzzle),
    [grid, puzzle]
  );
  const cellSize = useMemo(
    () => getResponsiveCellSize({ fixedCellSize, viewportWidth, width, containerWidth: true }),
    [fixedCellSize, viewportWidth, width]
  );
  const { outerWidth, outerHeight } = getBoardFrameDimensions(width, height, cellSize, {
    borderWidth: BOARD_BORDER,
    padding: BOARD_PADDING,
  });
  const gridLeft = BOARD_PADDING;
  const gridTop = BOARD_PADDING;

  const resetBoard = useCallback(() => {
    reset(getResetSnapshot());
    pointerState.current = resetPointerState();
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

  const updateCell = useCallback((row: number, col: number, nextValue: FourWindsWithParksCellValue) => {
    if (puzzle.clues[row]?.[col] !== null) return;
    applyChange((currentSnapshot) => {
      const current = normalizeFourWindsWithParksSnapshot(currentSnapshot, width, height);
      if (current.grid[row][col] === nextValue) return current;
      const nextGrid = current.grid.map((rowValues) => [...rowValues]);
      const nextLevels = current.levels.map((rowValues) => [...rowValues]);
      nextGrid[row][col] = nextValue;
      nextLevels[row][col] = nextValue === null ? 0 : trialActive ? currentTrialLevel : 0;
      return { ...current, grid: nextGrid, levels: nextLevels };
    }, { coalesce: true });
  }, [applyChange, currentTrialLevel, height, puzzle.clues, trialActive, width]);

  const applyCellClick = useCallback((cell: CellCoord, button: PointerButton) => {
    if (puzzle.clues[cell.row]?.[cell.col] !== null) return;
    const currentValue = grid[cell.row]?.[cell.col] ?? null;
    if (button === 0) {
      // Left-click is a circle toggle.  A cross is treated like blank so the
      // two mark buttons can switch between the three click-only states.
      if (typeof currentValue === 'number' && currentValue > 0) return;
      updateCell(cell.row, cell.col, currentValue === 'circle' ? null : 'circle');
      return;
    }
    // Right-click is a cross toggle; arrows are the one exception and are
    // cleared directly as requested.
    if (typeof currentValue === 'number' && currentValue > 0) {
      updateCell(cell.row, cell.col, null);
      return;
    }
    updateCell(cell.row, cell.col, currentValue === 'cross' ? null : 'cross');
  }, [grid, puzzle.clues, updateCell]);

  const placeArrow = useCallback((from: CellCoord, to: CellCoord) => {
    if (puzzle.clues[to.row]?.[to.col] !== null) return;
    const direction = getArrowDirection(from, to);
    if (direction === null) return;
    updateCell(to.row, to.col, direction);
  }, [puzzle.clues, updateCell]);

  const toggleEdgeCross = useCallback((key: string) => {
    if (!isValidGridLineEdgeKey(key, width, height)) return;
    applyChange((currentSnapshot) => {
      const current = normalizeFourWindsWithParksSnapshot(currentSnapshot, width, height);
      const nextCrossedEdges = new Set(current.crossedEdges);
      const nextCrossedEdgeLevels = { ...current.crossedEdgeLevels };
      if (nextCrossedEdges.has(key)) {
        nextCrossedEdges.delete(key);
        delete nextCrossedEdgeLevels[key];
      } else {
        nextCrossedEdges.add(key);
        nextCrossedEdgeLevels[key] = trialActive ? currentTrialLevel : 0;
      }
      return {
        ...current,
        crossedEdges: Array.from(nextCrossedEdges).sort(),
        crossedEdgeLevels: nextCrossedEdgeLevels,
      };
    });
  }, [applyChange, currentTrialLevel, height, trialActive, width]);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 && event.button !== 2) return;
    if (pointerState.current.pointerId !== null) return;
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const point = getBoardPoint(event.clientX, event.clientY, rect);
    const cell = getCellAtPoint(point.x, point.y, width, height, cellSize);
    const edgeKey = getEdgeAtPoint(point.x, point.y, width, height, cellSize);
    if (edgeKey) {
      // Grid-line targets are reserved for the right-button edge mark. Do
      // not let a left click on the line fall through and mark an adjacent
      // cell by accident.
      event.preventDefault();
      if (event.button === 2) toggleEdgeCross(edgeKey);
      return;
    }
    if (!cell) return;
    event.preventDefault();
    safeSetPointerCapture(boardRef.current ?? event.currentTarget, event.pointerId);
    pointerState.current = {
      pointerId: event.pointerId,
      button: event.button,
      startCell: cell,
      lastCell: cell,
      lastArrowTarget: null,
      moved: false,
    };
    startBatch();
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const current = pointerState.current;
    if (current.pointerId !== event.pointerId) return;
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const point = getBoardPoint(event.clientX, event.clientY, rect);
    const cell = getCellAtPoint(point.x, point.y, width, height, cellSize);
    // Leaving the grid cancels a click gesture.  Without this, a tiny drag
    // into the frame padding could be mistaken for a click on the origin cell
    // when the pointer is released outside the board.
    if (!cell) {
      current.moved = true;
      current.lastCell = null;
      return;
    }
    if (!sameCell(current.startCell, cell)) {
      current.moved = true;

      // A drag is recognized as soon as it reaches a different cell on the
      // same row or column. Draw the arrow during the drag instead of waiting
      // for pointerup. Keep the target guard so a stream of pointermove
      // events over one cell does not enqueue duplicate history updates.
      if (
        current.button === 0 &&
        current.startCell &&
        !sameCell(current.startCell, cell) &&
        !sameCell(current.lastArrowTarget, cell) &&
        getArrowDirection(current.startCell, cell) !== null
      ) {
        placeArrow(current.startCell, cell);
        current.lastArrowTarget = cell;
      }
    }
    current.lastCell = cell;
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const current = pointerState.current;
    if (current.pointerId !== event.pointerId) return;
    if (current.startCell && current.button !== null && !current.moved) {
      applyCellClick(current.startCell, current.button);
    }
    pointerState.current = resetPointerState();
    finishBatch();
  };

  const handlePointerCancel = (event: PointerEvent<HTMLDivElement>) => {
    const current = pointerState.current;
    if (current.pointerId !== event.pointerId) return;
    pointerState.current = resetPointerState();
    finishBatch();
  };

  return (
    <div ref={containerRef} className="flex w-full min-w-0 max-w-full flex-col items-center gap-3">
      <div className="w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain pb-1">
        <div className="flex w-full min-w-0 justify-center">
          <div
            ref={boardRef}
            className="relative select-none touch-none"
            style={{ width: `${outerWidth}px`, height: `${outerHeight}px`, ...getBoardFrameStyle(BOARD_BORDER), maxWidth: 'none' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onContextMenu={(event) => event.preventDefault()}
          >
            <div className="absolute grid" style={getBoardGridStyle(gridLeft, gridTop, width, cellSize)}>
              {grid.flatMap((rowValues, row) => rowValues.map((value, col) => {
                const clue = puzzle.clues[row][col];
                const trialColors = getTrialLevelColors(normalizedSnapshot.levels[row][col]);
                const tone = clue !== null ? 'clue' : value === 'cross' ? 'marked' : 'cell';
                return (
                  <div
                    key={`${row},${col}`}
                    className={boardClassNames.cellContent}
                    style={{
                      ...getBoardCellStyle(cellSize, tone),
                      ...(clue === null && value !== null && trialColors ? getBoardTrialCellStyle(trialColors, 'soft') : undefined),
                      ...getBoardTextStyle(cellSize),
                    }}
                  >
                    {clue !== null
                      ? <span className={boardClassNames.cellTextTight} style={getBoardClueTextStyle(cellSize)}>{clue}</span>
                      : value === null
                        ? null
                        : <FourWindsWithParksMark value={value} cellSize={cellSize} />}
                  </div>
                );
              }))}
            </div>
            <svg
              className="pointer-events-none absolute left-0 top-0"
              width={outerWidth - BOARD_BORDER * 2}
              height={outerHeight - BOARD_BORDER * 2}
              aria-hidden="true"
            >
              {Array.from(crossedEdges).map((key) => {
                const midpoint = getEdgeMidpoint(key, cellSize);
                if (!midpoint) return null;
                return (
                  <BoardEdgeCross
                    key={`cross-${key}`}
                    x={midpoint.x}
                    y={midpoint.y}
                    cellSize={cellSize}
                  />
                );
              })}
            </svg>
          </div>
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

      {showValidationMessage ? <ValidationMessage message={validation.message} /> : null}
    </div>
  );
}
