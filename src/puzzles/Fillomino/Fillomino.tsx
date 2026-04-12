// src/puzzles/Fillomino/FillominoBoard.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import type { FillominoPuzzleData } from '../types';
import { validateFillomino } from './utils';

interface Props {
  puzzle: FillominoPuzzleData;
  startTime: number;
  onComplete: (time: number) => void;
}

export default function FillominoBoard({ puzzle, startTime, onComplete }: Props) {
  const { width, height, clues } = puzzle;
  const [grid, setGrid] = useState<(number | null)[][]>(clues.map(row => [...row]));
  const [cellSize, setCellSize] = useState(52);
  const [thinLines, setThinLines] = useState<Set<string>>(new Set());
  const [deepLines, setDeepLines] = useState<Set<string>>(new Set());

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
  const gap = 1;

  // 响应式尺寸
  useEffect(() => {
    const updateSize = () => {
      const mobile = window.innerWidth < 640;
      setCellSize(mobile ? 36 : 52);
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const validate = () => {
    const result = validateFillomino(grid, width, height, deepLines);  // ← 新增 deepLines
    if (result.valid) {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      onComplete(elapsed);
    }
  };

  useEffect(() => { validate(); }, [grid]);

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

  const getCenter = useCallback((r: number, c: number) => {
    const step = cellSize + gap;
    return {
      x: c * step + cellSize / 2,
      y: r * step + cellSize / 2,
    };
  }, [cellSize]);

  const getEdgeKey = useCallback((r1: number, c1: number, r2: number, c2: number): string | null => {
    if (r1 === r2 && Math.abs(c1 - c2) === 1) return `h-${r1}-${Math.min(c1, c2)}`;
    if (c1 === c2 && Math.abs(r1 - r2) === 1) return `v-${Math.min(r1, r2)}-${c1}`;
    return null;
  }, []);

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

  const handleDocumentPointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging.current || pointerIdRef.current === null) return;

    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;

    const padding = 3;
    const effectiveX = e.clientX - rect.left - padding;
    const effectiveY = e.clientY - rect.top - padding;

    const currentCell = getCellFromPos(effectiveX, effectiveY);

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
          if (edgeRow >= 0 && edgeRow < height && minCol >= 0 && minCol < width) {
            edgeKey = `v-${edgeRow}-${minCol}`;
          }
        } else if (dc === 0 && Math.abs(dr) === 1) {
          const minRow = Math.min(last.rowLine, currentVertex.rowLine);
          const edgeCol = last.colLine - 1;
          if (minRow >= 0 && minRow < height && edgeCol >= 0 && edgeCol < width) {
            edgeKey = `h-${minRow}-${edgeCol}`;
          }
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

    // 仅 copy 模式下进行数字复制
    if (dragType.current === 'copy' &&
        (currentCell.row !== startRow.current || currentCell.col !== startCol.current)) {
      copyValueDrag(currentCell.row, currentCell.col);
    }
  }, [getCellFromPos, getNearestVertex, getEdgeKey, handleBoundaryEdit, copyValueDrag, clearCellDrag, height, width]);

  const handleDocumentPointerUp = useCallback((e: PointerEvent) => {
    if (!isDragging.current) return;

    const isSameCell = lastRowRef.current === startRow.current &&
                       lastColRef.current === startCol.current &&
                       startRow.current >= 0 && startCol.current >= 0;

    if (isSameCell && !hasEditedBoundary.current) {
      // 清空模式下，单击同一格仍执行普通点击操作（+1 / -1）
      const increment = dragIsLeft.current ? 1 : -1;
      changeNumber(startRow.current, startCol.current, increment);
    }

    // 清理状态
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
  }, [handleDocumentPointerMove, changeNumber]);

  const handlePointerDown = (r: number, c: number, e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.button === 2) e.preventDefault();

    const board = boardRef.current;
    if (board) {
      board.setPointerCapture(e.pointerId);
      pointerIdRef.current = e.pointerId;
    }

    // 重置所有状态
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
        mode = 'clear';   // ← 新增：从空白格开始拖动 → 清空模式
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

  const hasDifferentNeighbor = (r: number, c: number, dir: 'right' | 'bottom') => {
    if (dir === 'right' && c + 1 < width) {
      const v1 = grid[r][c];
      const v2 = grid[r][c + 1];
      return v1 !== v2 && v1 !== null && v2 !== null;
    }
    if (dir === 'bottom' && r + 1 < height) {
      const v1 = grid[r][c];
      const v2 = grid[r + 1][c];
      return v1 !== v2 && v1 !== null && v2 !== null;
    }
    return false;
  };

  const hasDeepEdge = (r: number, c: number, dir: 'right' | 'bottom'): boolean => {
    if (dir === 'right' && c + 1 < width) return deepLines.has(`h-${r}-${c}`);
    if (dir === 'bottom' && r + 1 < height) return deepLines.has(`v-${r}-${c}`);
    return false;
  };

  const svgWidth = width * (cellSize + gap) - gap;
  const svgHeight = height * (cellSize + gap) - gap;

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
            const differentRight = hasDifferentNeighbor(r, c, 'right');
            const differentBottom = hasDifferentNeighbor(r, c, 'bottom');
            const deepRight = hasDeepEdge(r, c, 'right');
            const deepBottom = hasDeepEdge(r, c, 'bottom');

            const rightStyle = deepRight
              ? '4px solid #374151'
              : differentRight
                ? '3px solid #9ca3af'
                : '1px solid #e5e7eb';
            const bottomStyle = deepBottom
              ? '4px solid #374151'
              : differentBottom
                ? '3px solid #9ca3af'
                : '1px solid #e5e7eb';

            return (
              <div
                key={`${r}-${c}`}
                onPointerDown={(e) => handlePointerDown(r, c, e)}
                className={`flex items-center justify-center font-mono font-bold text-3xl cursor-pointer border-0 relative
                  ${isPreFilled ? 'bg-[#f0e6d2] text-[#3f2a1e]' : 'bg-white hover:bg-gray-100 active:bg-gray-200'}`}
                style={{
                  width: `${cellSize}px`,
                  height: `${cellSize}px`,
                  borderRight: rightStyle,
                  borderBottom: bottomStyle,
                }}
              >
                {value ?? ''}
              </div>
            );
          })
        )}
      </div>

      {/* SVG 细灰中心线层 */}
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
          return (
            <line
              key={key}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#6b7280"
              strokeWidth="2"
              strokeLinecap="round"
            />
          );
        })}
      </svg>
    </div>
  );
}