// src/components/examples/FillominoExample.tsx
import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { validateFillomino } from '../../puzzles/Fillomino/utils';

interface Props {
  width: number;
  height: number;
  cluesGrid: (number | null)[][];
  correctGrid: (number | null)[][];
  playableLabel: string;
  answerLabel: string;
}

export default function FillominoExample({
  width,
  height,
  cluesGrid,
  correctGrid,
  playableLabel,
  answerLabel,
}: Props) {
  const [grid, setGrid] = useState<(number | null)[][]>(cluesGrid.map(row => [...row]));
  const [thinLines, setThinLines] = useState<Set<string>>(new Set());
  const [deepLines, setDeepLines] = useState<Set<string>>(new Set());
  const [showAnswer, setShowAnswer] = useState(false);
  const [confirmSpoiler, setConfirmSpoiler] = useState(false);
  const [invalidCells, setInvalidCells] = useState<{ r: number; c: number }[]>([]);

  const [cellSize, setCellSize] = useState(() => {
    const safeMargin = 150;
    const maxAvailableWidth = window.innerWidth - safeMargin;
    const theoreticalCellSize = Math.floor((maxAvailableWidth - 6) / width);
    return Math.max(32, Math.min(60, theoreticalCellSize));
  });

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
  const dragType = useRef<'copy' | 'clear' | 'thinLine' | 'deepLine'>('copy');
  const pointerIdRef = useRef<number | null>(null);
  const hasEditedBoundary = useRef(false);
  const boundaryOperationRef = useRef<'add' | 'delete' | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressThreshold = 500;

  const gap = 0;

  // 自适应尺寸
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

  // 实时验证
  useEffect(() => {
    if (grid.length === 0) return;
    const result = validateFillomino(grid, width, height, deepLines);
    setInvalidCells(result.invalidCells || []);
    if (result.valid) setShowAnswer(true);
  }, [grid, deepLines, width, height]);

  // 键盘输入
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const hovered = hoveredCellRef.current;
    if (!hovered) return;
    const { row, col } = hovered;
    if (cluesGrid[row][col] !== null) return;

    let num: number | null = null;
    if (e.key >= '1' && e.key <= '9') num = parseInt(e.key);
    else if (e.key.startsWith('Numpad') && e.key.length === 7) {
      const n = parseInt(e.key.slice(6));
      if (n >= 1 && n <= 9) num = n;
    }
    if (num !== null) {
      e.preventDefault();
      setGrid(prev => {
        const newGrid = prev.map(r => [...r]);
        newGrid[row][col] = num;
        return newGrid;
      });
    }
  }, [cluesGrid]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const getCenter = useCallback((r: number, c: number) => {
    const step = cellSize + gap;
    return { x: c * step + cellSize / 2, y: r * step + cellSize / 2 };
  }, [cellSize, gap]);

  const getEdgeKey = useCallback((r1: number, c1: number, r2: number, c2: number): string | null => {
    if (r1 === r2 && Math.abs(c1 - c2) === 1) return `h-${r1}-${Math.min(c1, c2)}`;
    if (c1 === c2 && Math.abs(r1 - r2) === 1) return `v-${Math.min(r1, r2)}-${c1}`;
    return null;
  }, []);

  const autoThinLines = useMemo(() => {
    const keys = new Set<string>();
    const visited = Array.from({ length: height }, () => Array(width).fill(false));
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]] as const;
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        const val = grid[r][c];
        if (val === null || visited[r][c] || val === 0) continue;
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
              visited[nr][nc] = true;
              stack.push({ r: nr, c: nc });
            }
          }
        }
        if (component.length === val) {
          for (const cell of component) {
            for (const [dr, dc] of directions) {
              const nr = cell.r + dr;
              const nc = cell.c + dc;
              if (nr >= 0 && nr < height && nc >= 0 && nc < width && grid[nr][nc] !== val) {
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

  const autoThinLinesAnswer = useMemo(() => {
    const keys = new Set<string>();
    const visited = Array.from({ length: height }, () => Array(width).fill(false));
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]] as const;
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        const val = correctGrid[r][c];
        if (val === null || visited[r][c] || val === 0) continue;
        const component: { r: number; c: number }[] = [];
        const stack = [{ r, c }];
        visited[r][c] = true;
        while (stack.length > 0) {
          const cell = stack.pop()!;
          component.push(cell);
          for (const [dr, dc] of directions) {
            const nr = cell.r + dr;
            const nc = cell.c + dc;
            if (nr >= 0 && nr < height && nc >= 0 && nc < width && !visited[nr][nc] && correctGrid[nr][nc] === val) {
              visited[nr][nc] = true;
              stack.push({ r: nr, c: nc });
            }
          }
        }
        if (component.length === val) {
          for (const cell of component) {
            for (const [dr, dc] of directions) {
              const nr = cell.r + dr;
              const nc = cell.c + dc;
              if (nr >= 0 && nr < height && nc >= 0 && nc < width && correctGrid[nr][nc] !== val) {
                const edgeKey = getEdgeKey(cell.r, cell.c, nr, nc);
                if (edgeKey) keys.add(edgeKey);
              }
            }
          }
        }
      }
    }
    return keys;
  }, [correctGrid, height, width, getEdgeKey]);

  // ==================== 关键修复：getLineStyle ====================
  const getLineStyle = useCallback((key: string, isAnswer = false): { stroke: string; strokeWidth: number } => {
    // 优先级：deepLines（手动绘制） → autoThinLines（自动灰线） → 默认细线
    if (!isAnswer && deepLines.has(key)) {
      return { stroke: '#374151', strokeWidth: 4 };
    }
    const currentAuto = isAnswer ? autoThinLinesAnswer : autoThinLines;
    if (currentAuto.has(key)) {
      return { stroke: '#6b7280', strokeWidth: 2 };
    }
    return { stroke: '#e5e7eb', strokeWidth: 1 };
  }, [deepLines, autoThinLines, autoThinLinesAnswer]);

  const changeNumber = useCallback((r: number, c: number, increment: number) => {
    if (cluesGrid[r][c] !== null) return;
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
  }, [cluesGrid]);

  const copyValueDrag = useCallback((r: number, c: number) => {
    if (cluesGrid[r][c] !== null) return;
    const startValue = grid[startRow.current][startCol.current];
    if (startValue === null) return;
    setGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      newGrid[r][c] = startValue;
      return newGrid;
    });
  }, [grid, cluesGrid]);

  const clearCellDrag = useCallback((r: number, c: number) => {
    if (cluesGrid[r][c] !== null) return;
    setGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      newGrid[r][c] = null;
      return newGrid;
    });
  }, [cluesGrid]);

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
    if (dragType.current === 'copy' && (currentCell.row !== startRow.current || currentCell.col !== startCol.current)) {
      copyValueDrag(currentCell.row, currentCell.col);
    }
  }, [getCellFromPos, getNearestVertex, getEdgeKey, handleBoundaryEdit, copyValueDrag, clearCellDrag, height, width]);

  const handleDocumentPointerUp = useCallback((e: PointerEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (!isDragging.current) return;

    const isSameCell = lastRowRef.current === startRow.current && lastColRef.current === startCol.current && startRow.current >= 0 && startCol.current >= 0;
    if (isSameCell && !hasEditedBoundary.current) {
      if (dragIsLeft.current) changeNumber(startRow.current, startCol.current, 1);
      else if (grid[startRow.current][startCol.current] !== null) changeNumber(startRow.current, startCol.current, -1);
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

  const handleNumpadInput = useCallback((num: number | null) => {
    if (!numpadTarget) return;
    const { row, col } = numpadTarget;
    if (cluesGrid[row][col] !== null) return;
    setGrid(prev => {
      const newGrid = prev.map(r => [...r]);
      newGrid[row][col] = num;
      return newGrid;
    });
    setShowNumpad(false);
    setNumpadTarget(null);
  }, [numpadTarget, cluesGrid]);

  const closeNumpad = useCallback(() => {
    setShowNumpad(false);
    setNumpadTarget(null);
  }, []);

  const handlePointerDown = (r: number, c: number, e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.button === 2) e.preventDefault();

    const board = boardRef.current;
    if (board) {
      board.setPointerCapture(e.pointerId);
      pointerIdRef.current = e.pointerId;
    }

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (e.pointerType === 'touch' && cluesGrid[r][c] === null) {
      longPressTimerRef.current = setTimeout(() => {
        if (longPressTimerRef.current === null) return;
        isDragging.current = false;
        setNumpadTarget({ row: r, col: c });
        setShowNumpad(true);
      }, longPressThreshold);
    }

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

      const threshold = Math.max(8, Math.floor(cellSize * 0.23));
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
    <>
      <div className="flex flex-col lg:flex-row gap-8 justify-center">
        {/* 可游玩例题 */}
        <div className="flex flex-col items-center">
          <p className="text-base font-medium text-muted-foreground mb-4 dark:text-gray-400">
            {playableLabel}
          </p>
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
            <div
              style={{
                display: 'inline-grid',
                gridTemplateColumns: `repeat(${width}, ${cellSize}px)`,
                gap: `${gap}px`,
              }}
            >
              {grid.flatMap((row, r) =>
                row.map((value, c) => {
                  const isPreFilled = cluesGrid[r][c] !== null;
                  return (
                    <div
                      key={`${r}-${c}`}
                      onPointerDown={(e) => handlePointerDown(r, c, e)}
                      onMouseEnter={() => {
                        if (!isPreFilled) hoveredCellRef.current = { row: r, col: c };
                      }}
                      onMouseLeave={() => {
                        if (!isDragging.current) hoveredCellRef.current = null;
                      }}
                      className={`flex items-center justify-center font-mono font-bold cursor-pointer border-0 relative
                        ${isPreFilled ? 'bg-[#f0e6d2] text-[#3f2a1e]' : 'bg-white hover:bg-gray-100 active:bg-gray-200'}
                        ${invalidCells.some(cell => cell.r === r && cell.c === c) ? 'text-red-600' : ''}`}
                      style={{
                        width: `${cellSize}px`,
                        height: `${cellSize}px`,
                        fontSize: `${Math.floor(cellSize * 0.8)}px`,
                        lineHeight: `${cellSize}px`,
                      }}
                    >
                      {value ?? ''}
                    </div>
                  );
                })
              )}
            </div>

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
              {Array.from({ length: height }, (_, r) =>
                Array.from({ length: width - 1 }, (_, c) => {
                  const key = `h-${r}-${c}`;
                  const { stroke, strokeWidth } = getLineStyle(key);
                  const x = (c + 1) * cellSize;
                  const y1 = r * cellSize;
                  const y2 = (r + 1) * cellSize;
                  return <line key={`edge-v-${r}-${c}`} x1={x} y1={y1} x2={x} y2={y2} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="butt" />;
                })
              )}
              {Array.from({ length: height - 1 }, (_, r) =>
                Array.from({ length: width }, (_, c) => {
                  const key = `v-${r}-${c}`;
                  const { stroke, strokeWidth } = getLineStyle(key);
                  const y = (r + 1) * cellSize;
                  const x1 = c * cellSize;
                  const x2 = (c + 1) * cellSize;
                  return <line key={`edge-h-${r}-${c}`} x1={x1} y1={y} x2={x2} y2={y} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="butt" />;
                })
              )}
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
                return <line key={`thin-${key}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#6b7280" strokeWidth="2" strokeLinecap="round" />;
              })}
            </svg>

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
                  <button onClick={closeNumpad} style={{ width: '32px', height: '32px', fontSize: '24px', fontWeight: 'bold', color: '#3f2a1e', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: '50%' }}>✕</button>
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
        </div>

        {/* 正确答案题板 */}
        <div className="flex flex-col items-center">
          <p className="text-base font-medium text-muted-foreground mb-4 dark:text-gray-400">
            {answerLabel}
          </p>
          {!showAnswer ? (
            <div
              onClick={() => setConfirmSpoiler(true)}
              className="mx-auto select-none cursor-pointer hover:opacity-90"
              style={{
                position: 'relative',
                display: 'inline-block',
                background: '#d2b48c',
                padding: '3px',
                border: '4px solid #3f2a1e',
              }}
            >
              <div
                style={{
                  display: 'inline-grid',
                  gridTemplateColumns: `repeat(${width}, ${cellSize}px)`,
                  gap: `${gap}px`,
                }}
              >
                {correctGrid.flatMap((row, r) =>
                  row.map((_, c) => (
                    <div
                      key={`${r}-${c}`}
                      className="flex items-center justify-center font-mono font-bold bg-[#f8f1e3]"
                      style={{
                        width: `${cellSize}px`,
                        height: `${cellSize}px`,
                      }}
                    />
                  ))
                )}
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 dark:bg-black/80 rounded-lg pointer-events-none">
                <div className="text-white text-6xl">👁️‍🗨️</div>
              </div>
            </div>
          ) : (
            <div
              className="mx-auto select-none"
              style={{
                position: 'relative',
                display: 'inline-block',
                background: '#d2b48c',
                padding: '3px',
                border: '4px solid #3f2a1e',
              }}
            >
              <div
                style={{
                  display: 'inline-grid',
                  gridTemplateColumns: `repeat(${width}, ${cellSize}px)`,
                  gap: `${gap}px`,
                }}
              >
                {correctGrid.flatMap((row, r) =>
                  row.map((val, c) => (
                    <div
                      key={`${r}-${c}`}
                      className="flex items-center justify-center font-mono font-bold bg-[#f8f1e3]"
                      style={{
                        width: `${cellSize}px`,
                        height: `${cellSize}px`,
                        fontSize: `${Math.floor(cellSize * 0.8)}px`,
                        lineHeight: `${cellSize}px`,
                      }}
                    >
                      {val ?? ''}
                    </div>
                  ))
                )}
              </div>

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
                {Array.from({ length: height }, (_, r) =>
                  Array.from({ length: width - 1 }, (_, c) => {
                    const key = `h-${r}-${c}`;
                    const { stroke, strokeWidth } = getLineStyle(key, true);
                    const x = (c + 1) * cellSize;
                    const y1 = r * cellSize;
                    const y2 = (r + 1) * cellSize;
                    return <line key={`edge-v-${r}-${c}`} x1={x} y1={y1} x2={x} y2={y2} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="butt" />;
                  })
                )}
                {Array.from({ length: height - 1 }, (_, r) =>
                  Array.from({ length: width }, (_, c) => {
                    const key = `v-${r}-${c}`;
                    const { stroke, strokeWidth } = getLineStyle(key, true);
                    const y = (r + 1) * cellSize;
                    const x1 = c * cellSize;
                    const x2 = (c + 1) * cellSize;
                    return <line key={`edge-h-${r}-${c}`} x1={x1} y1={y} x2={x2} y2={y} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="butt" />;
                  })
                )}
              </svg>
            </div>
          )}
        </div>
      </div>

      {confirmSpoiler && !showAnswer && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <Card className="max-w-sm w-full mx-4 dark:bg-gray-900">
            <CardContent className="p-6 text-center">
              <p className="text-lg mb-6 dark:text-gray-200">你确定要查看答案吗？<br />(完成左边的题目可以自动解锁)</p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setConfirmSpoiler(false)}>取消</Button>
                <Button className="flex-1" onClick={() => { setShowAnswer(true); setConfirmSpoiler(false); }}>确定查看</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}