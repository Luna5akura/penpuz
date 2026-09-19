// src/puzzles/Fillomino/FillominoBoard.tsx
import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { useI18n } from '@/i18n/useI18n';
import type { FillominoPuzzleData } from '../types';
import { getFillominoAutoBoundaryLines, getFillominoEdgeKey, validateFillomino } from './utils';
import { usePuzzleHistory } from '../../hooks/usePuzzleHistory';
import PuzzleAssistToolbar from '../../components/PuzzleAssistToolbar';
import { getKeyboardDigit, isKeyboardInputTarget } from '@/lib/keyboard';
import { useBoardContainerWidth } from '../useBoardContainerWidth';
import { getTrialLevelColors } from '../trialStyles';
import {
  boardClassNames,
  boardOverlayStyle,
  commonBoardChrome,
  getBoardCellStyle,
  getBoardBoundaryStrokeWidth,
  getBoardGridStrokeWidth,
  getBoardNumpadPanelStyle,
  getBoardNumpadButtonStyle,
  getBoardNumpadDismissStyle,
  getBoardNumpadHeaderStyle,
  getBoardNumpadGridStyle,
  getBoardModeButtonStyle,
  getBoardRegionStrokeWidth,
  getBoardThinStrokeWidth,
  getBoardFrameDimensions,
  getBoardFrameStyle,
  getBoardGridStyle,
  getBoardTextStyle,
  getBoardTrialCellStyle,
  getResponsiveCellSize,
  woodBoardTheme,
} from '../boardTheme';
import { safeSetPointerCapture } from '@/lib/pointer';
import { sanitizeMatrix, sanitizeNumberRecord, sanitizeStringArray } from '../snapshotGuards';
import { filterValidInternalBoundaryEdgeKeys } from '../gridUtils';

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
const KEYBOARD_ENTRY_TIMEOUT_MS = 1000;

function normalizeFillominoSnapshot(
  snapshot: unknown,
  fallback: FillominoSnapshot,
  width: number,
  height: number
): FillominoSnapshot {
  const source = snapshot as Partial<FillominoSnapshot> | null | undefined;

  return {
    grid: sanitizeMatrix(source?.grid, fallback.grid, (value, fallbackCell) =>
      value === null || (typeof value === 'number' && Number.isFinite(value)) ? value : fallbackCell
    ),
    thinLines: filterValidInternalBoundaryEdgeKeys(sanitizeStringArray(source?.thinLines), width, height),
    deepLines: filterValidInternalBoundaryEdgeKeys(sanitizeStringArray(source?.deepLines), width, height),
    gridLevels: sanitizeMatrix(source?.gridLevels, fallback.gridLevels, (value, fallbackCell) =>
      typeof value === 'number' && Number.isFinite(value) ? value : fallbackCell
    ),
    thinLineLevels: sanitizeNumberRecord(source?.thinLineLevels),
    deepLineLevels: sanitizeNumberRecord(source?.deepLineLevels),
  };
}

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
  const [containerRef, viewportWidth] = useBoardContainerWidth();
  const cellSize = useMemo(() => getResponsiveCellSize({
    viewportWidth,
    width,
    containerWidth: true,
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
  const keyboardEntryRef = useRef<{ row: number; col: number; text: string; timestamp: number } | null>(null);
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
  const initialSnapshotRef = useRef(initialSnapshot);
  const resetBoardRef = useRef<() => void>(() => {});

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressThreshold = 500;

  const resetTransientUiState = useCallback(() => {
    setShowNumpad(false);
    setNumpadTarget(null);
    setMobileMode('number');
  }, []);

  // ==================== 新增：防止重复完成 ====================
  const hasCompleted = useRef(false);
  const createInitialSnapshot = useCallback<() => FillominoSnapshot>(() => ({
    grid: clues.map((row) => [...row]),
    thinLines: [],
    deepLines: [],
    gridLevels: clues.map((row) => row.map(() => 0)),
    thinLineLevels: {},
    deepLineLevels: {},
  }), [clues]);
  const getResetSnapshot = useCallback(() => {
    return normalizeFillominoSnapshot(initialSnapshotRef.current, createInitialSnapshot(), width, height);
  }, [createInitialSnapshot, height, width]);
  const history = usePuzzleHistory<FillominoSnapshot>(createInitialSnapshot(), {
    normalizeTrialSnapshot: (trialSnapshot) => ({
      ...normalizeFillominoSnapshot(trialSnapshot, createInitialSnapshot(), width, height),
      gridLevels: createInitialSnapshot().gridLevels.map((row) => row.map(() => 0)),
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
  const normalizedSnapshot = useMemo(
    () => normalizeFillominoSnapshot(snapshot, createInitialSnapshot(), width, height),
    [createInitialSnapshot, height, snapshot, width]
  );
  const grid = normalizedSnapshot.grid;
  const thinLines = normalizedSnapshot.thinLines;
  const deepLines = normalizedSnapshot.deepLines;
  const gridLevels = normalizedSnapshot.gridLevels;
  const thinLineLevels = normalizedSnapshot.thinLineLevels;
  const deepLineLevels = normalizedSnapshot.deepLineLevels;
  const thinLineSet = useMemo(() => new Set(thinLines), [thinLines]);
  const deepLineSet = useMemo(() => new Set(deepLines), [deepLines]);

  // ==================== 窗口大小变化时实时调整 ====================
  useLayoutEffect(() => {
    const updateSize = () => {
      setIsTouchDevice(window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 640);
    };

    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [width]);

  useEffect(() => {
    initialSnapshotRef.current = initialSnapshot;
  }, [initialSnapshot]);

  const resetBoard = useCallback(() => {
    reset(getResetSnapshot());
    queueMicrotask(resetTransientUiState);
    hoveredCellRef.current = null;
    keyboardEntryRef.current = null;
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
  }, [getResetSnapshot, reset, resetTransientUiState]);

  useEffect(() => {
    resetBoardRef.current = resetBoard;
  }, [resetBoard]);

  useEffect(() => {
    resetBoardRef.current();
  }, [puzzle, resetToken]);

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
    if (isKeyboardInputTarget(e.target)) return;
    const hovered = hoveredCellRef.current;
    if (!hovered) return;

    const { row, col } = hovered;
    if (clues[row][col] !== null) {
      return;
    }

    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      keyboardEntryRef.current = null;
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

    const num = getKeyboardDigit(e);
    if (num === null) return;

    const now = Date.now();
    const previousEntry = keyboardEntryRef.current;
    const canAppend = previousEntry !== null &&
      previousEntry.row === row &&
      previousEntry.col === col &&
      now - previousEntry.timestamp <= KEYBOARD_ENTRY_TIMEOUT_MS;
    const nextText = canAppend ? `${previousEntry.text}${num}` : String(num);
    const nextNumber = Number(nextText);

    if (nextNumber >= 1 && nextNumber <= 99 && nextText.length <= 2) {
      e.preventDefault();
      keyboardEntryRef.current = { row, col, text: nextText, timestamp: now };
      applyChange((currentSnapshot) => {
        const newGrid = currentSnapshot.grid.map(r => [...r]);
        const newGridLevels = currentSnapshot.gridLevels.map(r => [...r]);
        newGrid[row][col] = nextNumber;
        newGridLevels[row][col] = trialActive ? currentTrialLevel : 0;
        return {
          ...currentSnapshot,
          grid: newGrid,
          gridLevels: newGridLevels,
        };
      });
      return;
    }

    keyboardEntryRef.current = null;
    if (num >= 1 && num <= 9) {
      e.preventDefault();
      keyboardEntryRef.current = { row, col, text: String(num), timestamp: now };
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
    return {
      x: c * cellSize + cellSize / 2,
      y: r * cellSize + cellSize / 2,
    };
  }, [cellSize]);

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
      if (val !== null && val > 99) val = 99;
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
    return {
      row: Math.max(0, Math.min(height - 1, Math.floor(effectiveY / cellSize))),
      col: Math.max(0, Math.min(width - 1, Math.floor(effectiveX / cellSize))),
    };
  }, [cellSize, height, width]);

  const getNearestVertex = useCallback((effectiveX: number, effectiveY: number) => {
    return {
      rowLine: Math.max(0, Math.min(height, Math.round(effectiveY / cellSize))),
      colLine: Math.max(0, Math.min(width, Math.round(effectiveX / cellSize))),
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
      return { stroke: trialColors?.line ?? woodBoardTheme.deepLine, strokeWidth: getBoardRegionStrokeWidth(cellSize) };
    }
    if (autoThinLineSet.has(key)) {
      return { stroke: woodBoardTheme.accentBorder, strokeWidth: getBoardBoundaryStrokeWidth(cellSize) };
    }
    return { stroke: woodBoardTheme.gridLine, strokeWidth: getBoardGridStrokeWidth() };
  }, [autoThinLineSet, cellSize, deepLineLevels, deepLineSet]);

  const alignStrokeCoordinate = useCallback((coordinate: number, strokeWidth: number) => (
    strokeWidth % 2 === 1 ? coordinate + 0.5 : coordinate
  ), []);

  const handleDocumentPointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging.current || pointerIdRef.current === null) return;
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const boardInset = commonBoardChrome.border + BOARD_PADDING;
    const effectiveX = e.clientX - rect.left - boardInset;
    const effectiveY = e.clientY - rect.top - boardInset;
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
  }, [changeNumber, finishBatch, grid]);

  const handlePointerDown = (r: number, c: number, e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) {           // ← 新增
      hoveredCellRef.current = { row: r, col: c };
    }
    keyboardEntryRef.current = null;
    e.preventDefault();
    e.stopPropagation();
    if (e.button === 2) e.preventDefault();
    const board = boardRef.current;
    if (board) {
      safeSetPointerCapture(board, e.pointerId);
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
        const boardInset = commonBoardChrome.border + BOARD_PADDING;
        const mouseX = e.clientX - rect.left - boardInset;
        const mouseY = e.clientY - rect.top - boardInset;
        lastVertexRef.current = getNearestVertex(mouseX, mouseY);
      }
    }
  };

  const handleBoardPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== event.pointerId) return;
    handleDocumentPointerMove(event.nativeEvent);
  };

  const handleBoardPointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== event.pointerId) return;
    handleDocumentPointerUp();
  };

  const { boardWidth, boardHeight, outerWidth, outerHeight } = getBoardFrameDimensions(
    width,
    height,
    cellSize,
    { borderWidth: commonBoardChrome.border, padding: BOARD_PADDING }
  );
  const svgWidth = boardWidth;
  const svgHeight = boardHeight;

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

  return (
    <div ref={containerRef} className="flex w-full min-w-0 max-w-full flex-col items-center gap-3">
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
                style={getBoardModeButtonStyle(mobileMode === mode)}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}

      <div
        ref={boardRef}
        className="relative mx-auto select-none"
        style={{
          width: `${outerWidth}px`,
          height: `${outerHeight}px`,
          touchAction: 'none',
          ...getBoardFrameStyle(commonBoardChrome.border),
        }}
        onPointerMove={handleBoardPointerMove}
        onPointerUp={handleBoardPointerEnd}
        onPointerCancel={handleBoardPointerEnd}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* 单元格网格 */}
        <div
          className="grid"
          style={getBoardGridStyle(BOARD_PADDING, BOARD_PADDING, width, cellSize)}
        >
          {grid.flatMap((row, r) =>
            row.map((value, c) => {
              const isClue = clues[r][c] !== null;
              const trialColors = getTrialLevelColors(gridLevels[r][c]);
              return (
                <div
                  key={`${r}-${c}`}
                  onPointerDown={(e) => handlePointerDown(r, c, e)}
                  onMouseEnter={() => {
                    if (!isClue) {
                      hoveredCellRef.current = { row: r, col: c };
                      keyboardEntryRef.current = null;
                    }
                  }}
                  onMouseLeave={() => {
                    if (!isDragging.current) {
                      hoveredCellRef.current = null;
                    }
                  }}
                  className={`flex items-center justify-center cursor-pointer border-0 relative ${boardClassNames.cellText}`}
                  style={{
                    width: `${cellSize}px`,
                    height: `${cellSize}px`,
                    ...getBoardTextStyle(cellSize),
                    ...getBoardCellStyle(cellSize, isClue ? 'clue' : 'cell'),
                    ...(trialColors && !isClue ? getBoardTrialCellStyle(trialColors, 'soft') : {}),
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
              if (!deepLineSet.has(key) && !autoThinLineSet.has(key)) return null;
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
              if (!deepLineSet.has(key) && !autoThinLineSet.has(key)) return null;
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
                strokeWidth={getBoardThinStrokeWidth(cellSize)}
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
              ...getBoardNumpadPanelStyle(),
              zIndex: 9999,
              touchAction: 'none',
              userSelect: 'none',
            }}
          >
            <div style={getBoardNumpadHeaderStyle()}>
              <button
                onClick={closeNumpad}
                style={getBoardNumpadDismissStyle()}
              >
                ✕
              </button>
            </div>
            <div style={getBoardNumpadGridStyle()}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handleNumpadInput(num)}
                  style={{
                    ...getBoardNumpadButtonStyle(cellSize),
                  }}
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => handleNumpadInput(null)}
                style={{
                  gridColumn: 'span 3',
                  ...getBoardNumpadButtonStyle(cellSize, 'invalid', 20),
                }}
              >
                {copy.shared.delete}
              </button>
            </div>
            <div onClick={closeNumpad} style={boardOverlayStyle} />
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
