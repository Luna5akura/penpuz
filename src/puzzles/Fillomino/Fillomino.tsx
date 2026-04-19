// src/puzzles/Fillomino/FillominoBoard.tsx
import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { useI18n } from '@/i18n/useI18n';
import type { FillominoPuzzleData } from '../types';
import { getFillominoAutoBoundaryLines, getFillominoEdgeKey, validateFillomino } from './utils';
import { usePuzzleHistory } from '../../hooks/usePuzzleHistory';
import PuzzleAssistToolbar from '../../components/PuzzleAssistToolbar';
import { getTrialLevelColors } from '../trialStyles';
import { commonBoardChrome, getBoardCellColors, getBoardNumberFontSize, getResponsiveCellSize, woodBoardTheme } from '../boardTheme';

interface Props {
  puzzle: FillominoPuzzleData;
  startTime: number;
  resetToken: number;
  onComplete: (time: number) => void;
  initialSnapshot?: unknown;
  onSnapshotChange?: (snapshot: unknown) => void;
}

type DragType = 'copy' | 'clear' | 'thinLine' | 'deepLine' | 'tapNumber';
type MobileMode = 'number' | 'boundary' | 'mark';
type FillominoSnapshot = {
  grid: (number | null)[][];
  thinLines: string[];
  deepLines: string[];
  gridLevels: number[][];
  thinLineLevels: Record<string, number>;
  deepLineLevels: Record<string, number>;
};

const BOARD_PADDING = commonBoardChrome.padding;

export default function FillominoBoard({
  puzzle,
  startTime,
  resetToken,
  onComplete,
  initialSnapshot,
  onSnapshotChange,
}: Props) {
  const { copy } = useI18n();
  const { width, height, clues } = puzzle;

  // ==================== 响应式尺寸 ====================
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === 'undefined' ? 1024 : window.innerWidth
  );
  const cellSize = useMemo(() => getResponsiveCellSize({
    viewportWidth,
    width,
  }), [viewportWidth, width]);

  const [isTouchDevice, setIsTouchDevice] = useState(() =>
    typeof window !== 'undefined' &&
    (window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 640)
  );
  const [mobileMode, setMobileMode] = useState<MobileMode>('number');

  // ==================== 长按数字面板相关状态 ====================
  const [showNumpad, setShowNumpad] = useState(false);
  const [numpadTarget, setNumpadTarget] = useState<{ row: number; col: number } | null>(null);

  const hoveredCellRef = useRef<{ row: number; col: number } | null>(null);
  const isDragging = useRef(false);
  const startRow = useRef(-1);
  const startCol = useRef(-1);
  const lastRowRef = useRef(-1);
  const lastColRef = useRef(-1);
  const lastVertexRef = useRef<{ rowLine: number; colLine: number }>({ rowLine: -1, colLine: -1 });
  const dragIsLeft = useRef(true);
  const dragType = useRef<DragType>('copy');
  const pointerIdRef = useRef<number | null>(null);
  const hasEditedBoundary = useRef(false);
  const boundaryOperationRef = useRef<'add' | 'delete' | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const suppressTapRef = useRef(false);

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressThreshold = 500;

  const gap = 0;

  // ==================== 新增：防止重复完成 ====================
  const hasCompleted = useRef(false);
  const createInitialSnapshot = useCallback<FillominoSnapshot>(() => ({
    grid: clues.map((row) => [...row]),
    thinLines: [],
    deepLines: [],
    gridLevels: clues.map((row) => row.map(() => 0)),
    thinLineLevels: {},
    deepLineLevels: {},
  }), [clues]);
  const getResetSnapshot = useCallback(() => {
    return (initialSnapshot as FillominoSnapshot | null) ?? createInitialSnapshot();
  }, [createInitialSnapshot, initialSnapshot]);
  const history = usePuzzleHistory<FillominoSnapshot>(createInitialSnapshot(), {
    normalizeTrialSnapshot: (trialSnapshot) => ({
      ...trialSnapshot,
      gridLevels: trialSnapshot.gridLevels.map((row) => row.map(() => 0)),
      thinLineLevels: {},
      deepLineLevels: {},
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
  const thinLines = snapshot.thinLines;
  const deepLines = snapshot.deepLines;
  const gridLevels = snapshot.gridLevels;
  const thinLineLevels = snapshot.thinLineLevels;
  const deepLineLevels = snapshot.deepLineLevels;
  const thinLineSet = useMemo(() => new Set(thinLines), [thinLines]);
  const deepLineSet = useMemo(() => new Set(deepLines), [deepLines]);

  // ==================== 窗口大小变化时实时调整 ====================
  useLayoutEffect(() => {
    const updateSize = () => {
      setViewportWidth(window.innerWidth);
      setIsTouchDevice(window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 640);
    };

    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [width]);

  useEffect(() => {
    reset(getResetSnapshot());
    setShowNumpad(false);
    setNumpadTarget(null);
    setMobileMode('number');
    hoveredCellRef.current = null;
    isDragging.current = false;
    startRow.current = -1;
    startCol.current = -1;
    lastRowRef.current = -1;
    lastColRef.current = -1;
    lastVertexRef.current = { rowLine: -1, colLine: -1 };
    dragType.current = 'copy';
    pointerIdRef.current = null;
    hasEditedBoundary.current = false;
    boundaryOperationRef.current = null;
    suppressTapRef.current = false;
    hasCompleted.current = false;
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, [getResetSnapshot, puzzle, reset, resetToken]);

  // ==================== 关键修复：带完成守卫的验证逻辑 ====================
  const validate = useCallback(() => {
    if (hasCompleted.current) return;                    // 防止重复触发
    if (!startTime || startTime <= 0) return;            // 防止 startTime 为 null 或无效

    const result = validateFillomino(grid, width, height, deepLineSet);
    if (result.valid) {
      hasCompleted.current = true;
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      onComplete(elapsed);
    }
  }, [deepLineSet, grid, width, height, startTime, onComplete]);

  useEffect(() => {
    validate();
  }, [validate]);

  // ==================== 键盘输入（带详细调试日志） ====================
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const hovered = hoveredCellRef.current;
    if (!hovered) return;

    const { row, col } = hovered;
    if (clues[row][col] !== null) {
      return;
    }

    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      applyChange((currentSnapshot) => {
        const newGrid = currentSnapshot.grid.map(r => [...r]);
        const newGridLevels = currentSnapshot.gridLevels.map(r => [...r]);
        newGrid[row][col] = null;
        newGridLevels[row][col] = 0;
        return {
          ...currentSnapshot,
          grid: newGrid,
          gridLevels: newGridLevels,
        };
      });
      return;
    }

    // 新增：同时支持主键盘和小键盘数字键
    let num: number | null = null;
    if (e.key >= '1' && e.key <= '9') {
      num = parseInt(e.key);
    } else if (e.key.startsWith('Numpad') && e.key.length === 7) {
      const n = parseInt(e.key.slice(6));
      if (n >= 1 && n <= 9) num = n;
    }

    if (num !== null) {
      e.preventDefault();
      applyChange((currentSnapshot) => {
        const newGrid = currentSnapshot.grid.map(r => [...r]);
        const newGridLevels = currentSnapshot.gridLevels.map(r => [...r]);
        newGrid[row][col] = num;
        newGridLevels[row][col] = trialActive ? currentTrialLevel : 0;
        return {
          ...currentSnapshot,
          grid: newGrid,
          gridLevels: newGridLevels,
        };
      });
    }
  }, [applyChange, clues, currentTrialLevel, trialActive]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // ==================== getCenter（用于 thinLines 中心连线） ====================
  const getCenter = useCallback((r: number, c: number) => {
    const step = cellSize + gap;
    return {
      x: c * step + cellSize / 2,
      y: r * step + cellSize / 2,
    };
  }, [cellSize, gap]);

  // ==================== getEdgeKey ====================
  // ==================== 自动灰色边界线 ====================
  const autoThinLines = useMemo(
    () => getFillominoAutoBoundaryLines(grid, width, height),
    [grid, height, width]
  );
  const autoThinLineSet = useMemo(() => new Set(autoThinLines), [autoThinLines]);

  const setCellValue = useCallback((r: number, c: number, value: number | null) => {
    if (clues[r][c] !== null) return;
    applyChange((currentSnapshot) => {
      const newGrid = currentSnapshot.grid.map(row => [...row]);
      const newGridLevels = currentSnapshot.gridLevels.map(row => [...row]);
      newGrid[r][c] = value;
      newGridLevels[r][c] = value === null ? 0 : trialActive ? currentTrialLevel : 0;
      return {
        ...currentSnapshot,
        grid: newGrid,
        gridLevels: newGridLevels,
      };
    }, { coalesce: true });
  }, [applyChange, clues, currentTrialLevel, trialActive]);

  const changeNumber = useCallback((r: number, c: number, increment: number) => {
    if (clues[r][c] !== null) return;
    applyChange((currentSnapshot) => {
      const newGrid = currentSnapshot.grid.map(row => [...row]);
      const newGridLevels = currentSnapshot.gridLevels.map(row => [...row]);
      let val = newGrid[r][c];
      if (val === null) val = increment > 0 ? 1 : 9;
      else val += increment;
      if (val < 1) val = null;
      if (val > 99) val = 99;
      newGrid[r][c] = val;
      newGridLevels[r][c] = val === null ? 0 : trialActive ? currentTrialLevel : 0;
      return {
        ...currentSnapshot,
        grid: newGrid,
        gridLevels: newGridLevels,
      };
    }, { coalesce: true });
  }, [applyChange, clues, currentTrialLevel, trialActive]);

  const copyValueDrag = useCallback((r: number, c: number) => {
    if (clues[r][c] !== null) return;
    const startValue = grid[startRow.current][startCol.current];
    if (startValue === null) return;
    applyChange((currentSnapshot) => {
      const newGrid = currentSnapshot.grid.map(row => [...row]);
      const newGridLevels = currentSnapshot.gridLevels.map(row => [...row]);
      newGrid[r][c] = startValue;
      newGridLevels[r][c] = trialActive ? currentTrialLevel : 0;
      return {
        ...currentSnapshot,
        grid: newGrid,
        gridLevels: newGridLevels,
      };
    }, { coalesce: true });
  }, [applyChange, clues, currentTrialLevel, grid, trialActive]);

  const clearCellDrag = useCallback((r: number, c: number) => {
    setCellValue(r, c, null);
  }, [setCellValue]);

  const getCellFromPos = useCallback((effectiveX: number, effectiveY: number) => {
    const step = cellSize + gap;
    return {
      row: Math.max(0, Math.min(height - 1, Math.floor(effectiveY / step))),
      col: Math.max(0, Math.min(width - 1, Math.floor(effectiveX / step))),
    };
  }, [cellSize, height, width]);

  const getNearestVertex = useCallback((effectiveX: number, effectiveY: number) => {
    const step = cellSize + gap;
    return {
      rowLine: Math.max(0, Math.min(height, Math.round(effectiveY / step))),
      colLine: Math.max(0, Math.min(width, Math.round(effectiveX / step))),
    };
  }, [cellSize, height, width]);

  const handleBoundaryEdit = useCallback((type: 'thin' | 'deep', key: string) => {
    if (boundaryOperationRef.current === null) {
      const currentSet = type === 'thin' ? thinLineSet : deepLineSet;
      boundaryOperationRef.current = currentSet.has(key) ? 'delete' : 'add';
    }
    const op = boundaryOperationRef.current!;
    applyChange((currentSnapshot) => {
      const nextThinLines = new Set(currentSnapshot.thinLines);
      const nextDeepLines = new Set(currentSnapshot.deepLines);
      const nextThinLineLevels = { ...currentSnapshot.thinLineLevels };
      const nextDeepLineLevels = { ...currentSnapshot.deepLineLevels };
      const targetSet = type === 'thin' ? nextThinLines : nextDeepLines;
      const targetLevels = type === 'thin' ? nextThinLineLevels : nextDeepLineLevels;
      if (op === 'add') targetSet.add(key);
      else targetSet.delete(key);
      if (op === 'add') targetLevels[key] = trialActive ? currentTrialLevel : 0;
      else delete targetLevels[key];

      return {
        ...currentSnapshot,
        thinLines: Array.from(nextThinLines).sort(),
        deepLines: Array.from(nextDeepLines).sort(),
        thinLineLevels: nextThinLineLevels,
        deepLineLevels: nextDeepLineLevels,
      };
    }, { coalesce: true });
    hasEditedBoundary.current = true;
  }, [applyChange, currentTrialLevel, deepLineSet, thinLineSet, trialActive]);

  const getLineStyle = useCallback((key: string): { stroke: string; strokeWidth: number } => {
    if (deepLineSet.has(key)) {
      const trialColors = getTrialLevelColors(deepLineLevels[key] ?? 0);
      return { stroke: trialColors?.line ?? woodBoardTheme.deepLine, strokeWidth: 4 };
    }
    if (autoThinLineSet.has(key)) {
      return { stroke: woodBoardTheme.accentBorder, strokeWidth: 3 };
    }
    return { stroke: woodBoardTheme.gridLine, strokeWidth: 1 };
  }, [autoThinLineSet, deepLineLevels, deepLineSet]);

  const alignStrokeCoordinate = useCallback((coordinate: number, strokeWidth: number) => (
    strokeWidth % 2 === 1 ? coordinate + 0.5 : coordinate
  ), []);

  const handleDocumentPointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging.current || pointerIdRef.current === null) return;
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const padding = BOARD_PADDING;
    const effectiveX = e.clientX - rect.left - padding;
    const effectiveY = e.clientY - rect.top - padding;
    const currentCell = getCellFromPos(effectiveX, effectiveY);

    if (longPressTimerRef.current) {
      if (currentCell.row !== startRow.current || currentCell.col !== startCol.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }

    if (dragType.current === 'deepLine') {
      const currentVertex = getNearestVertex(effectiveX, effectiveY);
      const last = lastVertexRef.current;
      if (last.rowLine !== -1 && last.colLine !== -1) {
        const dr = last.rowLine - currentVertex.rowLine;
        const dc = last.colLine - currentVertex.colLine;
        let edgeKey = '';
        if (dr === 0 && Math.abs(dc) === 1) {
          const minCol = Math.min(last.colLine, currentVertex.colLine);
          const edgeRow = last.rowLine - 1;
          if (edgeRow >= 0 && edgeRow < height && minCol >= 0 && minCol < width) edgeKey = `v-${edgeRow}-${minCol}`;
        } else if (dc === 0 && Math.abs(dr) === 1) {
          const minRow = Math.min(last.rowLine, currentVertex.rowLine);
          const edgeCol = last.colLine - 1;
          if (minRow >= 0 && minRow < height && edgeCol >= 0 && edgeCol < width) edgeKey = `h-${minRow}-${edgeCol}`;
        }
        if (edgeKey) handleBoundaryEdit('deep', edgeKey);
      }
      lastVertexRef.current = currentVertex;
    } else if (dragType.current === 'thinLine') {
      const lastR = lastRowRef.current;
      const lastC = lastColRef.current;
      const dr = Math.abs(lastR - currentCell.row);
      const dc = Math.abs(lastC - currentCell.col);
      if (lastR !== -1 && lastC !== -1 && dr + dc === 1) {
        const edgeKey = getFillominoEdgeKey(lastR, lastC, currentCell.row, currentCell.col);
        if (edgeKey) handleBoundaryEdit('thin', edgeKey);
      }
    } else if (dragType.current === 'clear') {
      clearCellDrag(currentCell.row, currentCell.col);
    }
    lastRowRef.current = currentCell.row;
    lastColRef.current = currentCell.col;
    if (dragType.current === 'copy' &&
        (currentCell.row !== startRow.current || currentCell.col !== startCol.current)) {
      copyValueDrag(currentCell.row, currentCell.col);
    }
  }, [getCellFromPos, getNearestVertex, handleBoundaryEdit, copyValueDrag, clearCellDrag, height, width]);

  const handleDocumentPointerUp = useCallback(function onDocumentPointerUp() {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (!isDragging.current) return;
    const isSameCell = lastRowRef.current === startRow.current &&
                       lastColRef.current === startCol.current &&
                       startRow.current >= 0 && startCol.current >= 0;

    if (isSameCell && !hasEditedBoundary.current && !suppressTapRef.current) {
      if (dragType.current === 'tapNumber') {
        changeNumber(startRow.current, startCol.current, 1);
      } else if (dragIsLeft.current) {
        changeNumber(startRow.current, startCol.current, 1);
      } else if (grid[startRow.current][startCol.current] !== null) {
        changeNumber(startRow.current, startCol.current, -1);
      }
    }

    isDragging.current = false;
    startRow.current = -1;
    startCol.current = -1;
    lastRowRef.current = -1;
    lastColRef.current = -1;
    lastVertexRef.current = { rowLine: -1, colLine: -1 };
    pointerIdRef.current = null;
    hasEditedBoundary.current = false;
    boundaryOperationRef.current = null;
    suppressTapRef.current = false;
    finishBatch();
    document.removeEventListener('pointermove', handleDocumentPointerMove);
    document.removeEventListener('pointerup', onDocumentPointerUp);
  }, [changeNumber, finishBatch, grid, handleDocumentPointerMove]);

  const handlePointerDown = (r: number, c: number, e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) {           // ← 新增
      hoveredCellRef.current = { row: r, col: c };
    }
    e.preventDefault();
    e.stopPropagation();
    if (e.button === 2) e.preventDefault();
    const board = boardRef.current;
    if (board) {
      board.setPointerCapture(e.pointerId);
      pointerIdRef.current = e.pointerId;
    }
    isDragging.current = true;
    startBatch();
    startRow.current = r;
    startCol.current = c;
    lastRowRef.current = r;
    lastColRef.current = c;
    lastVertexRef.current = { rowLine: -1, colLine: -1 };
    dragIsLeft.current = e.button === 0;
    hasEditedBoundary.current = false;
    boundaryOperationRef.current = null;
    suppressTapRef.current = false;

    const isTouchPointer = e.pointerType === 'touch';
    let mode: DragType = 'copy';

    if (isTouchPointer) {
      dragIsLeft.current = true;

      if (mobileMode === 'boundary') {
        mode = 'deepLine';
      } else if (mobileMode === 'mark') {
        mode = 'thinLine';
      } else if (clues[r][c] !== null) {
        mode = 'copy';
      } else if (grid[r][c] === null) {
        mode = 'clear';
        longPressTimerRef.current = setTimeout(() => {
          suppressTapRef.current = true;
          setNumpadTarget({ row: r, col: c });
          setShowNumpad(true);
        }, longPressThreshold);
      } else {
        mode = 'tapNumber';
        longPressTimerRef.current = setTimeout(() => {
          suppressTapRef.current = true;
          setNumpadTarget({ row: r, col: c });
          setShowNumpad(true);
        }, longPressThreshold);
      }
    } else if (e.button === 2) {
      mode = 'thinLine';
    } else if (e.button === 0) {
      const target = e.currentTarget as HTMLElement;
      const cellRect = target.getBoundingClientRect();
      const offsetX = e.clientX - cellRect.left;
      const offsetY = e.clientY - cellRect.top;
      const threshold = 12;
      const nearCorner =
        (offsetX <= threshold && offsetY <= threshold) ||
        (offsetX >= cellSize - threshold && offsetY <= threshold) ||
        (offsetX <= threshold && offsetY >= cellSize - threshold) ||
        (offsetX >= cellSize - threshold && offsetY >= cellSize - threshold);
      if (nearCorner) {
        mode = 'deepLine';
      } else if (grid[r][c] === null) {
        mode = 'clear';
      }
    }
    dragType.current = mode;
    if (mode === 'deepLine') {
      const rect = boardRef.current?.getBoundingClientRect();
      if (rect) {
        const padding = BOARD_PADDING;
        const mouseX = e.clientX - rect.left - padding;
        const mouseY = e.clientY - rect.top - padding;
        lastVertexRef.current = getNearestVertex(mouseX, mouseY);
      }
    }
    document.addEventListener('pointermove', handleDocumentPointerMove, { passive: true });
    document.addEventListener('pointerup', handleDocumentPointerUp, { passive: true });
  };

  const svgWidth = width * cellSize;
  const svgHeight = height * cellSize;

  // 辅助函数（长按数字面板）
  const closeNumpad = () => {
    setShowNumpad(false);
    setNumpadTarget(null);
  };

  const handleNumpadInput = (num: number | null) => {
    if (numpadTarget) {
      const { row, col } = numpadTarget;
      if (clues[row][col] !== null) {
        closeNumpad();
        return;
      }
      setCellValue(row, col, num);
    }
    closeNumpad();
  };

  const mobileModeHint =
    mobileMode === 'number'
      ? copy.shared.touchModeHints.number
      : mobileMode === 'boundary'
        ? copy.shared.touchModeHints.boundary
        : copy.shared.touchModeHints.mark;

  return (
    <div className="flex flex-col items-center gap-3">
      {isTouchDevice && (
        <>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {([
              ['number', copy.shared.touchModes.number],
              ['boundary', copy.shared.touchModes.boundary],
              ['mark', copy.shared.touchModes.mark],
            ] as const).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setMobileMode(mode)}
                className="rounded-md border px-3 py-1.5 text-sm font-medium transition-colors"
                style={{
                  borderColor: woodBoardTheme.border,
                  background: mobileMode === mode ? woodBoardTheme.shaded : woodBoardTheme.cell,
                  color: mobileMode === mode ? woodBoardTheme.shadedText : woodBoardTheme.border,
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-center text-xs dark:text-gray-300" style={{ color: woodBoardTheme.border }}>
            {mobileModeHint}
          </p>
        </>
      )}

      <div
        ref={boardRef}
        className="mx-auto select-none"
        style={{
          position: 'relative',
          display: 'inline-block',
          background: woodBoardTheme.frame,
          padding: `${BOARD_PADDING}px`,
          border: `${commonBoardChrome.border}px solid ${woodBoardTheme.border}`,
          touchAction: 'none',
          boxSizing: 'border-box',
          maxWidth: '100%',
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
      {/* 单元格网格 */}
        <div
          style={{
            display: 'inline-grid',
            gridTemplateColumns: `repeat(${width}, ${cellSize}px)`,
            gap: `${gap}px`,
          }}
        >
          {grid.flatMap((row, r) =>
            row.map((value, c) => {
              const isPreFilled = clues[r][c] !== null;
              const trialColors = getTrialLevelColors(gridLevels[r][c]);
              return (
                <div
                  key={`${r}-${c}`}
                  onPointerDown={(e) => handlePointerDown(r, c, e)}
                  onMouseEnter={() => {
                    if (!isPreFilled) {
                      hoveredCellRef.current = { row: r, col: c };
                    }
                  }}
                  onMouseLeave={() => {
                    if (!isDragging.current) {
                      hoveredCellRef.current = null;
                    }
                  }}
                  className="flex items-center justify-center font-semibold tabular-nums cursor-pointer border-0 relative"
                  style={{
                    width: `${cellSize}px`,
                    height: `${cellSize}px`,
                    fontSize: `${getBoardNumberFontSize(cellSize)}px`,
                    lineHeight: `${cellSize}px`,
                    ...getBoardCellColors(isPreFilled ? 'prefilled' : 'cell'),
                    ...(trialColors && !isPreFilled
                      ? {
                          background: trialColors.softFill,
                          color: trialColors.text,
                        }
                      : {}),
                  }}
                >
                  {value ?? ''}
                </div>
              );
            })
          )}
        </div>

        {/* SVG 边界线层 */}
        <svg
          width={svgWidth}
          height={svgHeight}
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
          {Array.from({ length: height }, (_, r) =>
            Array.from({ length: width - 1 }, (_, c) => {
              const key = `h-${r}-${c}`;
              const { stroke, strokeWidth } = getLineStyle(key);
              const x = alignStrokeCoordinate((c + 1) * cellSize, strokeWidth);
              const y1 = r * cellSize;
              const y2 = (r + 1) * cellSize;
              return (
                <line
                  key={`edge-v-${r}-${c}`}
                  x1={x} y1={y1} x2={x} y2={y2}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  strokeLinecap="butt"
                />
              );
            })
          )}
          {Array.from({ length: height - 1 }, (_, r) =>
            Array.from({ length: width }, (_, c) => {
              const key = `v-${r}-${c}`;
              const { stroke, strokeWidth } = getLineStyle(key);
              const y = alignStrokeCoordinate((r + 1) * cellSize, strokeWidth);
              const x1 = c * cellSize;
              const x2 = (c + 1) * cellSize;
              return (
                <line
                  key={`edge-h-${r}-${c}`}
                  x1={x1} y1={y} x2={x2} y2={y}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  strokeLinecap="butt"
                />
              );
            })
          )}

          {Array.from(thinLines).map((key) => {
            const [type, rStr, cStr] = key.split('-');
            const r = parseInt(rStr);
            const c = parseInt(cStr);
            let x1 = 0;
            let y1 = 0;
            let x2 = 0;
            let y2 = 0;
            if (type === 'h') {
              const { x: cx1, y: cy } = getCenter(r, c);
              const { x: cx2 } = getCenter(r, c + 1);
              x1 = cx1;
              y1 = cy;
              x2 = cx2;
              y2 = cy;
            } else if (type === 'v') {
              const { x: cx, y: cy1 } = getCenter(r, c);
              const { y: cy2 } = getCenter(r + 1, c);
              x1 = cx;
              y1 = cy1;
              x2 = cx;
              y2 = cy2;
            }
            return (
              <line
                key={`thin-${key}`}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={getTrialLevelColors(thinLineLevels[key] ?? 0)?.line ?? woodBoardTheme.thinLine}
                strokeWidth="2"
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        {/* 长按数字输入面板 */}
        {showNumpad && numpadTarget && (
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: '#fff',
              border: `3px solid ${woodBoardTheme.border}`,
              borderRadius: '12px',
              padding: '12px',
              boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.2)',
              zIndex: 9999,
              touchAction: 'none',
              userSelect: 'none',
              maxWidth: '340px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
              <button
                onClick={closeNumpad}
                style={{
                  width: '32px',
                  height: '32px',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: woodBoardTheme.border,
                  background: 'transparent',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  borderRadius: '50%',
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 52px)', gap: '8px' }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handleNumpadInput(num)}
                  style={{
                    width: '52px',
                    height: '52px',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    ...getBoardCellColors('prefilled'),
                    border: `2px solid ${woodBoardTheme.border}`,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => handleNumpadInput(null)}
                style={{
                  gridColumn: 'span 3',
                  height: '52px',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  background: '#fee2e2',
                  border: `2px solid ${woodBoardTheme.border}`,
                  borderRadius: '8px',
                  color: '#b91c1c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                {copy.shared.delete}
              </button>
            </div>
            <div onClick={closeNumpad} style={{ position: 'fixed', inset: 0, background: 'transparent', zIndex: -1 }} />
          </div>
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
