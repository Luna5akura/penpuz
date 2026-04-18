// src/puzzles/Nurikabe/NurikabeBoard.tsx
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { validateNurikabe } from './utils';
import { PuzzleData } from '../types';
import { usePuzzleHistory } from '../../hooks/usePuzzleHistory';
import PuzzleAssistToolbar from '../../components/PuzzleAssistToolbar';
import { getTrialLevelColors } from '../trialStyles';
import {
  commonBoardChrome,
  getBoardCellColors,
  getBoardCrossFontSize,
  getBoardNumberFontSize,
  getCellDividerStyle,
  getCrossMarkStyle,
  getResponsiveCellSize,
  woodBoardTheme,
} from '../boardTheme';

interface Props {
  puzzle: PuzzleData;
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

export default function NurikabeBoard({
  puzzle,
  startTime,
  resetToken,
  onComplete,
  initialSnapshot,
  onSnapshotChange,
}: Props) {
  const { width, height, clues } = puzzle;
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === 'undefined' ? 1024 : window.innerWidth
  );
  const isDragging = useRef(false);
  const hasDragged = useRef(false);
  const dragMode = useRef<'none' | 'add-shade' | 'remove-shade' | 'add-mark' | 'remove-mark'>('none');
  const startRow = useRef(-1);
  const startCol = useRef(-1);
  const hasCompleted = useRef(false);
  const boardRef = useRef<HTMLDivElement>(null);

  const createInitialSnapshot = useCallback<NurikabeSnapshot>(() => ({
    grid: Array.from({ length: height }, () => Array(width).fill(0)),
    levels: Array.from({ length: height }, () => Array(width).fill(0)),
  }), [height, width]);
  const getResetSnapshot = useCallback(() => {
    return (initialSnapshot as NurikabeSnapshot | null) ?? createInitialSnapshot();
  }, [createInitialSnapshot, initialSnapshot]);

  const history = usePuzzleHistory<NurikabeSnapshot>(createInitialSnapshot(), {
    normalizeTrialSnapshot: (trialSnapshot) => ({
      ...trialSnapshot,
      levels: trialSnapshot.levels.map((row) => row.map(() => 0)),
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
  const grid = snapshot.grid;
  const levels = snapshot.levels;

  // 响应式尺寸 + 手机端检测
  const isMobile = viewportWidth < commonBoardChrome.mobileBreakpoint;
  const cellSize = useMemo(() => getResponsiveCellSize({
    viewportWidth,
    width,
  }), [viewportWidth, width]);

  useEffect(() => {
    const updateSize = () => setViewportWidth(window.innerWidth);
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    reset(getResetSnapshot());
    hasCompleted.current = false;
    isDragging.current = false;
    hasDragged.current = false;
    dragMode.current = 'none';
    startRow.current = -1;
    startCol.current = -1;
  }, [getResetSnapshot, puzzle, reset, resetToken]);

  const isClue = useCallback((r: number, c: number) =>
    clues.some((clue) => clue.row === r && clue.col === c), [clues]);

  const toggleCell = useCallback((r: number, c: number, mode: typeof dragMode.current) => {
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
  }, [applyChange, currentTrialLevel, trialActive]);

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
    const isClueCell = isClue(r, c);
    if (isClueCell) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    const isLeftClick = e.button === 0;

    e.preventDefault();
    e.nativeEvent.stopImmediatePropagation();

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    isDragging.current = true;
    hasDragged.current = false;
    startRow.current = r;
    startCol.current = c;
    startBatch();

    const currentState = grid[r][c];

    if (isMobile) {
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
      if (isLeftClick) {
        dragMode.current = currentState === 1 ? 'remove-shade' : 'add-shade';
      } else {
        dragMode.current = currentState === 2 ? 'remove-mark' : 'add-mark';
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || dragMode.current === 'none') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const relativeX = e.clientX - rect.left - commonBoardChrome.padding;
    const relativeY = e.clientY - rect.top - commonBoardChrome.padding;
    const col = Math.floor(relativeX / cellSize);
    const row = Math.floor(relativeY / cellSize);

    if (row >= 0 && row < height && col >= 0 && col < width) {
      if (isClue(row, col) && dragMode.current.includes('shade')) return;
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
    dragMode.current = 'none';
    startRow.current = -1;
    startCol.current = -1;
    finishBatch();
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={boardRef}
        className="puzzle-container mx-auto select-none"
        style={{
          display: 'inline-grid',
          gridTemplateColumns: `repeat(${width}, ${cellSize}px)`,
          background: woodBoardTheme.frame,
          padding: `${commonBoardChrome.padding}px`,
          border: `${commonBoardChrome.border}px solid ${woodBoardTheme.border}`,
          touchAction: 'none',
          maxWidth: '100%',
          boxSizing: 'border-box',
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {grid.flatMap((row, r) =>
          row.map((state, c) => {
            const clue = clues.find((cl) => cl.row === r && cl.col === c);
            const isShaded = state === 1;
            const isMarked = state === 2;
            const trialColors = getTrialLevelColors(levels[r][c]);
            const style = trialColors && !clue
              ? isShaded
                ? { background: trialColors.fill, color: '#ffffff' }
                : isMarked
                  ? { background: trialColors.softFill, color: trialColors.text }
                  : undefined
              : trialColors && clue && isMarked
                ? { background: trialColors.softFill, color: trialColors.text }
                : undefined;

            return (
              <div
                key={`${r}-${c}`}
                onPointerDown={(e) => handlePointerDown(r, c, e)}
                onContextMenu={handleContextMenu}
                style={{
                  width: `${cellSize}px`,
                  height: `${cellSize}px`,
                  fontSize: `${getBoardNumberFontSize(cellSize)}px`,
                  lineHeight: 1,
                  ...(clue
                    ? getBoardCellColors(isMarked ? 'marked' : 'clue')
                    : getBoardCellColors(isShaded ? 'shaded' : isMarked ? 'marked' : 'cell')),
                  ...getCellDividerStyle(),
                  ...style,
                }}
                className="flex items-center justify-center font-semibold tabular-nums tracking-tight border-0 cursor-pointer touch-none"
              >
                {clue ? clue.value : isMarked ? <span style={getCrossMarkStyle(getBoardCrossFontSize(cellSize))}>×</span> : ''}
              </div>
            );
            })
        )}
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
