// src/puzzles/Fillomino/FillominoBoard.tsx
<<<<<<< HEAD
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
=======
import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
>>>>>>> main
import type { FillominoPuzzleData } from '../types';
import { validateFillomino } from './utils';

interface Props {
  puzzle: FillominoPuzzleData;
  startTime: number;
  onComplete: (time: number) => void;
}

export default function FillominoBoard({ puzzle, startTime, onComplete }: Props) {
  const { width, height, clues } = puzzle;

  // ==================== 响应式尺寸 ====================
  const [cellSize, setCellSize] = useState(() => {
    const safeMargin = 40;
    const maxAvailableWidth = window.innerWidth - safeMargin;
    const theoreticalCellSize = Math.floor((maxAvailableWidth - 6) / width);
    return Math.max(32, Math.min(60, theoreticalCellSize));
  });

  const [grid, setGrid] = useState<(number | null)[][]>(clues.map(row => [...row]));
  const [thinLines, setThinLines] = useState<Set<string>>(new Set());
  const [deepLines, setDeepLines] = useState<Set<string>>(new Set());
<<<<<<< HEAD
=======

  // ==================== 长按数字面板相关状态 ====================
  const [showNumpad, setShowNumpad] = useState(false);
  const [numpadTarget, setNumpadTarget] = useState<{ row: number; col: number } | null>(null);

>>>>>>> main
  const hoveredCellRef = useRef<{ row: number; col: number } | null>(null);
  const isDragging = useRef(false);
  const startRow = useRef(-1);
  const startCol = useRef(-1);
  const lastRowRef = useRef(-1);
  const lastColRef = useRef(-1);
  const lastVertexRef = useRef<{ rowLine: number; colLine: number }>({ rowLine: -1, colLine: -1 });
  const dragIsLeft = useRef(true);
  const dragType = useRef<'copy' | 'clear' | 'thinLine' | 'deepLine'>('copy');
  const pointerIdRef = useRef<number | null>(null);
  const hasEditedBoundary = useRef(false);
  const boundaryOperationRef = useRef<'add' | 'delete' | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
<<<<<<< HEAD
  const gap = 0;
=======
>>>>>>> main

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressThreshold = 500;

  const gap = 0;

  // ==================== 窗口大小变化时实时调整 ====================
  useLayoutEffect(() => {
    const updateSize = () => {
      const safeMargin = 40;
      const maxAvailableWidth = window.innerWidth - safeMargin;
      const theoreticalCellSize = Math.floor((maxAvailableWidth - 6) / width);
      const newCellSize = Math.max(32, Math.min(60, theoreticalCellSize));
      setCellSize(newCellSize);
    };

    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [width]);

  const validate = () => {
    const result = validateFillomino(grid, width, height, deepLines);
    if (result.valid) {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      onComplete(elapsed);
    }
  };
  useEffect(() => { validate(); }, [grid, deepLines, width, height, startTime, onComplete]);

<<<<<<< HEAD
  // ==================== 键盘输入（带详细调试日志） ====================
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const hovered = hoveredCellRef.current;
    console.log('[DEBUG] KeyDown event fired, hovered cell:', hovered ? `${hovered.row},${hovered.col}` : 'null', '| pressed key:', e.key);

    if (!hovered) return;

    const { row, col } = hovered;
    if (clues[row][col] !== null) {
      console.log('[DEBUG] Pre-filled cell, ignore keyboard');
      return;
    }

    // 新增：同时支持主键盘和小键盘数字键
=======
  useEffect(() => { validate(); }, [grid, deepLines, width, height, startTime, onComplete]);

  // ==================== 键盘输入 ====================
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const hovered = hoveredCellRef.current;
    if (!hovered) return;

    const { row, col } = hovered;
    if (clues[row][col] !== null) return;

>>>>>>> main
    let num: number | null = null;
    if (e.key >= '1' && e.key <= '9') {
      num = parseInt(e.key);
    } else if (e.key.startsWith('Numpad') && e.key.length === 7) {
      const n = parseInt(e.key.slice(6));
      if (n >= 1 && n <= 9) num = n;
    }

    if (num !== null) {
      e.preventDefault();
<<<<<<< HEAD
      console.log(`[DEBUG] Setting number ${num} at row=${row}, col=${col} (key: ${e.key})`);
=======
>>>>>>> main
      setGrid(prev => {
        const newGrid = prev.map(r => [...r]);
        newGrid[row][col] = num;
        return newGrid;
      });
<<<<<<< HEAD
    } else {
      console.log(`[DEBUG] Ignored key: ${e.key} (not a digit 1-9)`);
=======
>>>>>>> main
    }
  }, [clues]);

  useEffect(() => {
<<<<<<< HEAD
    console.log('[DEBUG] Keyboard listener attached to document');
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      console.log('[DEBUG] Keyboard listener removed');
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
=======
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // ==================== 工具函数 ====================
  const getCenter = useCallback((r: number, c: number) => {
    const step = cellSize + gap;
    return { x: c * step + cellSize / 2, y: r * step + cellSize / 2 };
  }, [cellSize, gap]);

>>>>>>> main
  const getEdgeKey = useCallback((r1: number, c1: number, r2: number, c2: number): string | null => {
    if (r1 === r2 && Math.abs(c1 - c2) === 1) return `h-${r1}-${Math.min(c1, c2)}`;
    if (c1 === c2 && Math.abs(r1 - r2) === 1) return `v-${Math.min(r1, r2)}-${c1}`;
    return null;
  }, []);

<<<<<<< HEAD
  // ==================== 自动灰色边界线 ====================
=======
>>>>>>> main
  const autoThinLines = useMemo(() => {
    const keys = new Set<string>();
    const visited = Array.from({ length: height }, () => Array(width).fill(false));
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]] as const;
<<<<<<< HEAD

=======
>>>>>>> main
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        const val = grid[r][c];
        if (val === null || visited[r][c] || val === 0) continue;
<<<<<<< HEAD

        const component: { r: number; c: number }[] = [];
        const stack = [{ r, c }];
        visited[r][c] = true;

        while (stack.length > 0) {
          const cell = stack.pop()!;
          component.push(cell);

          for (const [dr, dc] of directions) {
            const nr = cell.r + dr;
            const nc = cell.c + dc;
            if (
              nr >= 0 && nr < height &&
              nc >= 0 && nc < width &&
              !visited[nr][nc] &&
              grid[nr][nc] === val
            ) {
=======
        const component: { r: number; c: number }[] = [];
        const stack = [{ r, c }];
        visited[r][c] = true;
        while (stack.length > 0) {
          const cell = stack.pop()!;
          component.push(cell);
          for (const [dr, dc] of directions) {
            const nr = cell.r + dr;
            const nc = cell.c + dc;
            if (nr >= 0 && nr < height && nc >= 0 && nc < width && !visited[nr][nc] && grid[nr][nc] === val) {
>>>>>>> main
              visited[nr][nc] = true;
              stack.push({ r: nr, c: nc });
            }
          }
        }
<<<<<<< HEAD

=======
>>>>>>> main
        if (component.length === val) {
          for (const cell of component) {
            for (const [dr, dc] of directions) {
              const nr = cell.r + dr;
              const nc = cell.c + dc;
<<<<<<< HEAD
              if (
                nr >= 0 && nr < height &&
                nc >= 0 && nc < width &&
                grid[nr][nc] !== val
              ) {
=======
              if (nr >= 0 && nr < height && nc >= 0 && nc < width && grid[nr][nc] !== val) {
>>>>>>> main
                const edgeKey = getEdgeKey(cell.r, cell.c, nr, nc);
                if (edgeKey) keys.add(edgeKey);
              }
            }
          }
        }
      }
    }
    return keys;
  }, [grid, height, width, getEdgeKey]);

  const changeNumber = useCallback((r: number, c: number, increment: number) => {
    if (clues[r][c] !== null) return;
    setGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      let val = newGrid[r][c];
      if (val === null) val = increment > 0 ? 1 : 9;
      else val += increment;
      if (val < 1) val = null;
      if (val > 99) val = 99;
      newGrid[r][c] = val;
      return newGrid;
    });
  }, [clues]);

  const copyValueDrag = useCallback((r: number, c: number) => {
    if (clues[r][c] !== null) return;
    const startValue = grid[startRow.current][startCol.current];
    if (startValue === null) return;
    setGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      newGrid[r][c] = startValue;
      return newGrid;
    });
  }, [grid, clues]);

  const clearCellDrag = useCallback((r: number, c: number) => {
    if (clues[r][c] !== null) return;
    setGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      newGrid[r][c] = null;
      return newGrid;
    });
  }, [clues]);

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
      const currentSet = type === 'thin' ? thinLines : deepLines;
      boundaryOperationRef.current = currentSet.has(key) ? 'delete' : 'add';
    }
    const op = boundaryOperationRef.current!;
    if (type === 'thin') {
      setThinLines(prev => {
        const next = new Set(prev);
        op === 'add' ? next.add(key) : next.delete(key);
        return next;
      });
    } else {
      setDeepLines(prev => {
        const next = new Set(prev);
        op === 'add' ? next.add(key) : next.delete(key);
        return next;
      });
    }
    hasEditedBoundary.current = true;
  }, [thinLines, deepLines]);

  const getLineStyle = useCallback((key: string): { stroke: string; strokeWidth: number } => {
<<<<<<< HEAD
    if (deepLines.has(key)) {
      return { stroke: '#374151', strokeWidth: 4 };
    }
    if (autoThinLines.has(key)) {
      return { stroke: '#6b7280', strokeWidth: 2 };
    }

=======
    if (deepLines.has(key)) return { stroke: '#374151', strokeWidth: 4 };
    if (autoThinLines.has(key)) return { stroke: '#6b7280', strokeWidth: 2 };
>>>>>>> main
    const [type, rStr, cStr] = key.split('-');
    const r = parseInt(rStr);
    const c = parseInt(cStr);
    let hasDiff = false;
    if (type === 'h' && c + 1 < width) {
      const v1 = grid[r][c];
      const v2 = grid[r][c + 1];
      hasDiff = v1 !== v2 && v1 !== null && v2 !== null;
    } else if (type === 'v' && r + 1 < height) {
      const v1 = grid[r][c];
      const v2 = grid[r + 1][c];
      hasDiff = v1 !== v2 && v1 !== null && v2 !== null;
    }
<<<<<<< HEAD
    if (hasDiff) {
      return { stroke: '#6b7280', strokeWidth: 2 };
    }
=======
    if (hasDiff) return { stroke: '#6b7280', strokeWidth: 2 };
>>>>>>> main
    return { stroke: '#e5e7eb', strokeWidth: 1 };
  }, [deepLines, autoThinLines, grid, width, height]);

  const handleDocumentPointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging.current || pointerIdRef.current === null) return;
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const padding = 3;
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
        const edgeKey = getEdgeKey(lastR, lastC, currentCell.row, currentCell.col);
        if (edgeKey) handleBoundaryEdit('thin', edgeKey);
      }
    } else if (dragType.current === 'clear') {
      clearCellDrag(currentCell.row, currentCell.col);
    }
    lastRowRef.current = currentCell.row;
    lastColRef.current = currentCell.col;
<<<<<<< HEAD
    if (dragType.current === 'copy' &&
        (currentCell.row !== startRow.current || currentCell.col !== startCol.current)) {
=======
    if (dragType.current === 'copy' && (currentCell.row !== startRow.current || currentCell.col !== startCol.current)) {
>>>>>>> main
      copyValueDrag(currentCell.row, currentCell.col);
    }
  }, [getCellFromPos, getNearestVertex, getEdgeKey, handleBoundaryEdit, copyValueDrag, clearCellDrag, height, width]);

  const handleDocumentPointerUp = useCallback((e: PointerEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (!isDragging.current) return;
<<<<<<< HEAD
    const isSameCell = lastRowRef.current === startRow.current &&
                       lastColRef.current === startCol.current &&
                       startRow.current >= 0 && startCol.current >= 0;

=======

    const isSameCell = lastRowRef.current === startRow.current && lastColRef.current === startCol.current && startRow.current >= 0 && startCol.current >= 0;
>>>>>>> main
    if (isSameCell && !hasEditedBoundary.current) {
      if (dragIsLeft.current) {
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
    document.removeEventListener('pointermove', handleDocumentPointerMove);
    document.removeEventListener('pointerup', handleDocumentPointerUp);
  }, [handleDocumentPointerMove, changeNumber, grid]);
<<<<<<< HEAD
=======

  const handleNumpadInput = useCallback((num: number | null) => {
    if (!numpadTarget) return;
    const { row, col } = numpadTarget;
    if (clues[row][col] !== null) return;

    setGrid(prev => {
      const newGrid = prev.map(r => [...r]);
      newGrid[row][col] = num;
      return newGrid;
    });

    setShowNumpad(false);
    setNumpadTarget(null);
  }, [numpadTarget, clues]);

  const closeNumpad = useCallback(() => {
    setShowNumpad(false);
    setNumpadTarget(null);
  }, []);
>>>>>>> main

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
<<<<<<< HEAD
=======

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (e.pointerType === 'touch' && clues[r][c] === null) {
      longPressTimerRef.current = setTimeout(() => {
        if (longPressTimerRef.current === null) return;
        isDragging.current = false;
        setNumpadTarget({ row: r, col: c });
        setShowNumpad(true);
      }, longPressThreshold);
    }

>>>>>>> main
    isDragging.current = true;
    startRow.current = r;
    startCol.current = c;
    lastRowRef.current = r;
    lastColRef.current = c;
    lastVertexRef.current = { rowLine: -1, colLine: -1 };
    dragIsLeft.current = e.button === 0;
    hasEditedBoundary.current = false;
    boundaryOperationRef.current = null;
    let mode: 'copy' | 'clear' | 'thinLine' | 'deepLine' = 'copy';
    if (e.button === 2) {
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
        const padding = 3;
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

  return (
    <div
      ref={boardRef}
      className="mx-auto select-none"
      style={{
        position: 'relative',
        display: 'inline-block',
        background: '#d2b48c',
        padding: '3px',
        border: '4px solid #3f2a1e',
        touchAction: 'none',
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
            return (
              <div
                key={`${r}-${c}`}
                onPointerDown={(e) => handlePointerDown(r, c, e)}
                onMouseEnter={() => {
<<<<<<< HEAD
                  if (!isPreFilled) {
                    hoveredCellRef.current = { row: r, col: c };
                    console.log(`[DEBUG] Hover enter editable cell: row=${r}, col=${c}`);
                  }
                }}
                onMouseLeave={() => {
                  if (!isDragging.current) {           // ← 新增这行判断
                      hoveredCellRef.current = null;
                      console.log(`[DEBUG] Hover leave cell: row=${r}, col=${c}`);
                    }
                }}
                className={`flex items-center justify-center font-mono font-bold text-3xl cursor-pointer border-0 relative
=======
                  if (!isPreFilled) hoveredCellRef.current = { row: r, col: c };
                }}
                onMouseLeave={() => {
                  if (!isDragging.current) hoveredCellRef.current = null;
                }}
                className={`flex items-center justify-center font-mono font-bold cursor-pointer border-0 relative
>>>>>>> main
                  ${isPreFilled ? 'bg-[#f0e6d2] text-[#3f2a1e]' : 'bg-white hover:bg-gray-100 active:bg-gray-200'}`}
                style={{
                  width: `${cellSize}px`,
                  height: `${cellSize}px`,
<<<<<<< HEAD
=======
                  fontSize: `${Math.floor(cellSize * 0.7)}px`,
                  lineHeight: `${cellSize}px`,
>>>>>>> main
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
          top: '3px',
          left: '3px',
          pointerEvents: 'none',
          overflow: 'visible',
          zIndex: 10,
        }}
      >
<<<<<<< HEAD
        {/* 1. 边界线体系（deep + 自动灰线 + 数字不同） */}
=======
>>>>>>> main
        {Array.from({ length: height }, (_, r) =>
          Array.from({ length: width - 1 }, (_, c) => {
            const key = `h-${r}-${c}`;
            const { stroke, strokeWidth } = getLineStyle(key);
            const x = (c + 1) * cellSize;
            const y1 = r * cellSize;
            const y2 = (r + 1) * cellSize;
<<<<<<< HEAD
            return (
              <line
                key={`edge-v-${r}-${c}`}
                x1={x} y1={y1} x2={x} y2={y2}
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeLinecap="butt"
              />
            );
=======
            return <line key={`edge-v-${r}-${c}`} x1={x} y1={y1} x2={x} y2={y2} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="butt" />;
>>>>>>> main
          })
        )}
        {Array.from({ length: height - 1 }, (_, r) =>
          Array.from({ length: width }, (_, c) => {
            const key = `v-${r}-${c}`;
            const { stroke, strokeWidth } = getLineStyle(key);
            const y = (r + 1) * cellSize;
            const x1 = c * cellSize;
            const x2 = (c + 1) * cellSize;
<<<<<<< HEAD
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

        {/* 2. 中心连线体系（thinLines，右键专用） */}
=======
            return <line key={`edge-h-${r}-${c}`} x1={x1} y1={y} x2={x2} y2={y} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="butt" />;
          })
        )}
>>>>>>> main
        {Array.from(thinLines).map((key) => {
          const [type, rStr, cStr] = key.split('-');
          const r = parseInt(rStr);
          const c = parseInt(cStr);
          let x1 = 0, y1 = 0, x2 = 0, y2 = 0;
          if (type === 'h') {
            const { x: cx1, y: cy } = getCenter(r, c);
            const { x: cx2 } = getCenter(r, c + 1);
            x1 = cx1; y1 = cy; x2 = cx2; y2 = cy;
          } else if (type === 'v') {
            const { x: cx, y: cy1 } = getCenter(r, c);
            const { y: cy2 } = getCenter(r + 1, c);
            x1 = cx; y1 = cy1; x2 = cx; y2 = cy2;
          }
<<<<<<< HEAD
          return (
            <line
              key={`thin-${key}`}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#6b7280"
              strokeWidth="2"
              strokeLinecap="round"
            />
          );
=======
          return <line key={`thin-${key}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#6b7280" strokeWidth="2" strokeLinecap="round" />;
>>>>>>> main
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
            border: '3px solid #3f2a1e',
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
                color: '#3f2a1e',
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
                  background: '#f0e6d2',
                  border: '2px solid #3f2a1e',
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
                border: '2px solid #3f2a1e',
                borderRadius: '8px',
                color: '#b91c1c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              删除
            </button>
          </div>
          <div onClick={closeNumpad} style={{ position: 'fixed', inset: 0, background: 'transparent', zIndex: -1 }} />
        </div>
      )}
    </div>
  );
}