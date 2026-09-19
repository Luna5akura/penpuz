// src/puzzles/Nurikabe/NurikabeBoard.tsx
import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useBoardContainerWidth } from '../useBoardContainerWidth';
import { validateNurikabe } from './utils';
import type { NurikabePuzzleData } from '../types';
import { usePuzzleHistory } from '../../hooks/usePuzzleHistory';
import PuzzleAssistToolbar from '../../components/PuzzleAssistToolbar';
import { getTrialLevelColors } from '../trialStyles';
import {
  boardClassNames,
  commonBoardChrome,
  getBoardCellStyle,
  getBoardFrameDimensions,
  getBoardFrameStyle,
  getBoardGridStyle,
  getBoardTextStyle,
  getBoardTrialCellStyle,
  getResponsiveCellSize,
} from '../boardTheme';
import { safeSetPointerCapture } from '@/lib/pointer';
import { sanitizeMatrix } from '../snapshotGuards';
import BoardCellMark from '../shared/BoardCellMark';

interface Props {
  puzzle: NurikabePuzzleData;
  startTime: number;
  resetToken: number;
  onComplete: (time: number) => void;
  initialSnapshot?: unknown;
  onSnapshotChange?: (snapshot: unknown) => void;
}

type CellState = 0 | 1 | 2;
type NurikabeSnapshot = {
  grid: CellState[][];
  levels: number[][];
};

function normalizeNurikabeSnapshot(snapshot: unknown, width: number, height: number): NurikabeSnapshot {
  const fallback = {
    grid: Array.from({ length: height }, () => Array(width).fill(0) as CellState[]),
    levels: Array.from({ length: height }, () => Array(width).fill(0)),
  };
  const source = snapshot as Partial<NurikabeSnapshot> | null | undefined;

  return {
    grid: sanitizeMatrix(source?.grid, fallback.grid, (value) =>
      value === 0 || value === 1 || value === 2 ? value : 0
    ) as CellState[][],
    levels: sanitizeMatrix(source?.levels, fallback.levels, (value, fallbackCell) =>
      typeof value === 'number' && Number.isFinite(value) ? value : fallbackCell
    ),
  };
}

export default function NurikabeBoard({
  puzzle,
  startTime,
  resetToken,
  onComplete,
  initialSnapshot,
  onSnapshotChange,
}: Props) {
  const { width, height, clues } = puzzle;
  const [containerRef, viewportWidth] = useBoardContainerWidth();
  const isDragging = useRef(false);
  const hasDragged = useRef(false);
  const activeMouseButton = useRef<0 | 2 | null>(null);
  const dragMode = useRef<'none' | 'add-shade' | 'remove-shade' | 'add-mark' | 'remove-mark'>('none');
  const startRow = useRef(-1);
  const startCol = useRef(-1);
  const hasCompleted = useRef(false);
  const boardRef = useRef<HTMLDivElement>(null);

  const createInitialSnapshot = useCallback<() => NurikabeSnapshot>(() => ({
    grid: Array.from({ length: height }, () => Array(width).fill(0)),
    levels: Array.from({ length: height }, () => Array(width).fill(0)),
  }), [height, width]);
  const getResetSnapshot = useCallback(() => {
    return normalizeNurikabeSnapshot(initialSnapshot, width, height);
  }, [height, initialSnapshot, width]);

  const history = usePuzzleHistory<NurikabeSnapshot>(createInitialSnapshot(), {
    normalizeTrialSnapshot: (trialSnapshot) => ({
      ...normalizeNurikabeSnapshot(trialSnapshot, width, height),
      levels: Array.from({ length: height }, () => Array(width).fill(0)),
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
  const normalizedSnapshot = useMemo(
    () => normalizeNurikabeSnapshot(snapshot, width, height),
    [height, snapshot, width]
  );
  const grid = normalizedSnapshot.grid;
  const levels = normalizedSnapshot.levels;

  // 响应式尺寸 + 手机端检测
  const isMobile = viewportWidth < commonBoardChrome.mobileBreakpoint;
  const cellSize = useMemo(() => getResponsiveCellSize({
    viewportWidth,
    width,
    containerWidth: true,
  }), [viewportWidth, width]);

  useEffect(() => {
    reset(getResetSnapshot());
    hasCompleted.current = false;
    isDragging.current = false;
    hasDragged.current = false;
    activeMouseButton.current = null;
    dragMode.current = 'none';
    startRow.current = -1;
    startCol.current = -1;
  }, [getResetSnapshot, puzzle, reset, resetToken]);

  const isClue = useCallback((r: number, c: number) =>
    clues.some((clue) => clue.row === r && clue.col === c), [clues]);

  const toggleCell = useCallback((r: number, c: number, mode: typeof dragMode.current) => {
    if (isClue(r, c)) return;

    applyChange((current) => {
      const prev = current.grid;
      const prevLevels = current.levels;
      const newGrid = prev.map((row) => [...row]);
      const newLevels = prevLevels.map((row) => [...row]);
      if (mode === 'add-shade') newGrid[r][c] = 1;
      else if (mode === 'remove-shade') newGrid[r][c] = 0;
      else if (mode === 'add-mark') newGrid[r][c] = 2;
      else if (mode === 'remove-mark') newGrid[r][c] = 0;
      newLevels[r][c] = newGrid[r][c] === 0 ? 0 : trialActive ? currentTrialLevel : 0;
      return { grid: newGrid, levels: newLevels };
    }, { coalesce: true });
  }, [applyChange, currentTrialLevel, isClue, trialActive]);

  // 手机端点击循环（空白→黑格→打叉→空白）
  const cycleCell = useCallback((r: number, c: number) => {
    if (isClue(r, c)) return;
    applyChange((current) => {
      const prev = current.grid;
      const prevLevels = current.levels;
      const newGrid = prev.map((row) => [...row]);
      const newLevels = prevLevels.map((row) => [...row]);
      const currentCell = newGrid[r][c];
      newGrid[r][c] = currentCell === 0 ? 1 : currentCell === 1 ? 2 : 0;
      newLevels[r][c] = newGrid[r][c] === 0 ? 0 : trialActive ? currentTrialLevel : 0;
      return { grid: newGrid, levels: newLevels };
    }, { coalesce: true });
  }, [applyChange, currentTrialLevel, isClue, trialActive]);

  // 完成检查
  useEffect(() => {
    if (hasCompleted.current) return;
    if (!grid.length || grid.length !== height || !grid[0] || grid[0].length !== width) return;

    const currentGrid: boolean[][] = grid.map((row) => row.map((state) => state === 1));
    const result = validateNurikabe(currentGrid, clues, width, height);

    if (result.valid) {
      hasCompleted.current = true;
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      onComplete(elapsed);
    }
  }, [grid, clues, width, height, startTime, onComplete]);

  const handlePointerDown = (r: number, c: number, e: React.PointerEvent<HTMLDivElement>) => {
    const isTouchPointer = e.pointerType === 'touch' || (e.button === 0 && isMobile);
    if (!isTouchPointer && e.button !== 0 && e.button !== 2) return;

    const isClueCell = isClue(r, c);
    if (isClueCell) {
      e.preventDefault();
      e.nativeEvent.stopImmediatePropagation();
      return;
    }

    e.preventDefault();
    e.nativeEvent.stopImmediatePropagation();

    safeSetPointerCapture(boardRef.current ?? e.currentTarget, e.pointerId);

    isDragging.current = true;
    hasDragged.current = false;
    activeMouseButton.current = isTouchPointer ? null : e.button === 2 ? 2 : 0;
    startRow.current = r;
    startCol.current = c;
    startBatch();

    const currentState = grid[r][c];

    if (isTouchPointer) {
      // 手机端：按您最新要求实现拖拽循环
      if (currentState === 0) {
        dragMode.current = 'add-shade';
      } else if (currentState === 1) {
        dragMode.current = 'add-mark';     // 黑格拖动 → 打叉
      } else if (currentState === 2) {
        dragMode.current = 'remove-mark';  // 打叉拖动 → 擦除
      }
    } else {
      // 电脑端：恢复原始左右键逻辑
      if (e.button === 0) {
        dragMode.current = currentState === 1 ? 'remove-shade' : 'add-shade';
      } else {
        dragMode.current = currentState === 2 ? 'remove-mark' : 'add-mark';
        // Apply a desktop right-click immediately. Waiting for pointerup is
        // unreliable because the browser may dispatch the context-menu
        // sequence before the board's release handler. Mark the gesture as
        // handled so pointerup does not toggle the origin a second time.
        toggleCell(r, c, dragMode.current);
        hasDragged.current = true;
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || dragMode.current === 'none') return;

    if (activeMouseButton.current === 0 && (e.buttons & 1) === 0) {
      handlePointerUp();
      return;
    }
    if (activeMouseButton.current === 2 && (e.buttons & 2) === 0) {
      handlePointerUp();
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const boardInset = commonBoardChrome.border + commonBoardChrome.padding;
    const relativeX = e.clientX - rect.left - boardInset;
    const relativeY = e.clientY - rect.top - boardInset;
    const col = Math.floor(relativeX / cellSize);
    const row = Math.floor(relativeY / cellSize);

    if (row >= 0 && row < height && col >= 0 && col < width) {
      if (isClue(row, col)) return;
      hasDragged.current = true;
      toggleCell(row, col, dragMode.current);
    }
  };

  const handlePointerUp = () => {
    if (!isDragging.current) return;

    // 纯点击（未拖动）→ 执行对应操作
    if (!hasDragged.current && startRow.current >= 0 && startCol.current >= 0) {
      if (isMobile) {
        cycleCell(startRow.current, startCol.current);
      } else {
        toggleCell(startRow.current, startCol.current, dragMode.current);
      }
    }

    isDragging.current = false;
    activeMouseButton.current = null;
    dragMode.current = 'none';
    startRow.current = -1;
    startCol.current = -1;
    finishBatch();
  };

  const { outerWidth, outerHeight } = getBoardFrameDimensions(width, height, cellSize);

  return (
    <div ref={containerRef} className="flex w-full min-w-0 max-w-full flex-col items-center gap-3">
      <div
        ref={boardRef}
        className="puzzle-container relative mx-auto select-none"
        style={{
          width: `${outerWidth}px`,
          height: `${outerHeight}px`,
          touchAction: 'none',
          ...getBoardFrameStyle(commonBoardChrome.border),
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onContextMenu={handleContextMenu}
      >
        <div
          className="grid"
          style={getBoardGridStyle(commonBoardChrome.padding, commonBoardChrome.padding, width, cellSize)}
        >
          {grid.flatMap((row, r) =>
            row.map((state, c) => {
            const clue = clues.find((cl) => cl.row === r && cl.col === c);
            const isShaded = state === 1;
            const isMarked = state === 2;
            const trialColors = getTrialLevelColors(levels[r][c]);
            const style = trialColors && (!clue || isMarked)
              ? getBoardTrialCellStyle(trialColors, isShaded ? 'filled' : 'soft')
              : undefined;

            return (
              <div
                key={`${r}-${c}`}
                onPointerDown={(e) => handlePointerDown(r, c, e)}
                style={{
                  ...getBoardCellStyle(cellSize, clue
                    ? 'clue'
                    : isShaded ? 'playerShaded' : isMarked ? 'marked' : 'cell'),
                  ...getBoardTextStyle(cellSize),
                  ...style,
                }}
                className={`relative flex items-center justify-center border-0 cursor-pointer touch-none ${boardClassNames.cellTextTight}`}
              >
                {clue ? clue.value : isMarked ? (
                  <BoardCellMark
                    kind="cross"
                    cellSize={cellSize}
                  />
                ) : ''}
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
    </div>
  );
}
