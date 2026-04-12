// src/components/examples/FillominoExample.tsx

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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

  const cellSize = 44;
  const gap = 1;

  const deepLinesKey = useMemo(() => Array.from(deepLines).sort().join(','), [deepLines]);

  // 实时验证 + 高亮数字不符的格子
  useEffect(() => {
    if (grid.length === 0) return;
    const result = validateFillomino(grid, width, height, deepLines);
    setInvalidCells(result.invalidCells || []);
    if (result.valid) {
      setShowAnswer(true);
    }
  }, [grid, deepLinesKey, width, height]);

  const getCenter = useCallback((r: number, c: number) => ({
    x: c * (cellSize + gap) + cellSize / 2,
    y: r * (cellSize + gap) + cellSize / 2,
  }), []);

  const getEdgeKey = useCallback((r1: number, c1: number, r2: number, c2: number): string | null => {
    if (r1 === r2 && Math.abs(c1 - c2) === 1) return `h-${r1}-${Math.min(c1, c2)}`;
    if (c1 === c2 && Math.abs(r1 - r2) === 1) return `v-${Math.min(r1, r2)}-${c1}`;
    return null;
  }, []);

  const getCellFromPos = useCallback((effectiveX: number, effectiveY: number) => ({
    row: Math.max(0, Math.min(height - 1, Math.floor(effectiveY / (cellSize + gap)))),
    col: Math.max(0, Math.min(width - 1, Math.floor(effectiveX / (cellSize + gap)))),
  }), [height, width]);

  const getNearestVertex = useCallback((effectiveX: number, effectiveY: number) => ({
    rowLine: Math.max(0, Math.min(height, Math.round(effectiveY / (cellSize + gap)))),
    colLine: Math.max(0, Math.min(width, Math.round(effectiveX / (cellSize + gap)))),
  }), [height, width]);

  const handleBoundaryEdit = useCallback((type: 'thin' | 'deep', key: string) => {
    if (boundaryOperationRef.current === null) {
      const currentSet = type === 'thin' ? thinLines : deepLines;
      boundaryOperationRef.current = currentSet.has(key) ? 'delete' : 'add';
    }
    const op = boundaryOperationRef.current!;
    if (type === 'thin') {
      setThinLines(prev => { const next = new Set(prev); op === 'add' ? next.add(key) : next.delete(key); return next; });
    } else {
      setDeepLines(prev => { const next = new Set(prev); op === 'add' ? next.add(key) : next.delete(key); return next; });
    }
    hasEditedBoundary.current = true;
  }, [thinLines, deepLines]);

  const copyValueDrag = useCallback((r: number, c: number) => {
    if (cluesGrid[r][c] !== null) return;
    const startValue = grid[startRow.current][startCol.current];
    if (startValue === null) return;
    setGrid(prev => { const newGrid = prev.map(row => [...row]); newGrid[r][c] = startValue; return newGrid; });
  }, [grid, cluesGrid]);

  const clearCellDrag = useCallback((r: number, c: number) => {
    if (cluesGrid[r][c] !== null) return;
    setGrid(prev => { const newGrid = prev.map(row => [...row]); newGrid[r][c] = null; return newGrid; });
  }, [cluesGrid]);

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

  const handlePointerDown = (r: number, c: number, e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.button === 2) e.preventDefault();

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
      const offsetX = e.clientX - e.currentTarget.getBoundingClientRect().left;
      const offsetY = e.clientY - e.currentTarget.getBoundingClientRect().top;
      const threshold = 12;
      const nearCorner = (offsetX <= threshold && offsetY <= threshold) ||
                         (offsetX >= cellSize - threshold && offsetY <= threshold) ||
                         (offsetX <= threshold && offsetY >= cellSize - threshold) ||
                         (offsetX >= cellSize - threshold && offsetY >= cellSize - threshold);
      if (nearCorner) mode = 'deepLine';
      else if (grid[r][c] === null) mode = 'clear';
    }
    dragType.current = mode;

    if (mode === 'deepLine') {
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      lastVertexRef.current = getNearestVertex(mouseX, mouseY);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const effectiveX = e.clientX - rect.left;
    const effectiveY = e.clientY - rect.top;
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
          if (edgeRow >= 0 && edgeRow < height && minCol >= 0 && minCol < width)
            edgeKey = `v-${edgeRow}-${minCol}`;
        } else if (dc === 0 && Math.abs(dr) === 1) {
          const minRow = Math.min(last.rowLine, currentVertex.rowLine);
          const edgeCol = last.colLine - 1;
          if (minRow >= 0 && minRow < height && edgeCol >= 0 && edgeCol < width)
            edgeKey = `h-${minRow}-${edgeCol}`;
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
  };

  const handlePointerUp = () => {
    if (!isDragging.current) return;
    const isSameCell = lastRowRef.current === startRow.current && lastColRef.current === startCol.current;
    if (isSameCell && !hasEditedBoundary.current) {
      const increment = dragIsLeft.current ? 1 : -1;
      changeNumber(startRow.current, startCol.current, increment);
    }
    isDragging.current = false;
    startRow.current = -1;
    startCol.current = -1;
    lastRowRef.current = -1;
    lastColRef.current = -1;
    lastVertexRef.current = { rowLine: -1, colLine: -1 };
    hasEditedBoundary.current = false;
    boundaryOperationRef.current = null;
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

  const hasDeepEdge = (r: number, c: number, dir: 'right' | 'bottom') => {
    if (dir === 'right' && c + 1 < width) return deepLines.has(`h-${r}-${c}`);
    if (dir === 'bottom' && r + 1 < height) return deepLines.has(`v-${r}-${c}`);
    return false;
  };

  const isInvalidCell = (r: number, c: number) =>
    invalidCells.some(cell => cell.r === r && cell.c === c);

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-8 justify-center">
        {/* 可游玩例题 */}
        <div className="flex flex-col items-center">
          <p className="text-base font-medium text-muted-foreground mb-4 dark:text-gray-400">
            {playableLabel}
          </p>
          <div
            className="inline-grid gap-[1px] bg-[#d2b48c] dark:bg-gray-800 p-3 border-4 border-[#3f2a1e] dark:border-gray-700 select-none"
            style={{ gridTemplateColumns: `repeat(${width}, ${cellSize}px)` }}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            {grid.flatMap((row, r) =>
              row.map((value, c) => {
                const differentRight = hasDifferentNeighbor(r, c, 'right');
                const differentBottom = hasDifferentNeighbor(r, c, 'bottom');
                const deepRight = hasDeepEdge(r, c, 'right');
                const deepBottom = hasDeepEdge(r, c, 'bottom');
                const rightStyle = deepRight ? '4px solid #374151' : differentRight ? '3px solid #9ca3af' : '1px solid #e5e7eb';
                const bottomStyle = deepBottom ? '4px solid #374151' : differentBottom ? '3px solid #9ca3af' : '1px solid #e5e7eb';

                return (
                  <div
                    key={`${r}-${c}`}
                    onPointerDown={(e) => handlePointerDown(r, c, e)}
                    className={`flex items-center justify-center font-mono font-bold text-3xl cursor-pointer border-0 relative
                      ${cluesGrid[r][c] !== null ? 'bg-[#f0e6d2] text-[#3f2a1e]' : 'bg-white hover:bg-gray-100 active:bg-gray-200'}
                      ${isInvalidCell(r, c) ? 'text-red-600' : ''}`}
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
        </div>

        {/* 正确答案（带剧透保护 + 自动解锁） */}
        <div className="flex flex-col items-center">
          <p className="text-base font-medium text-muted-foreground mb-4 dark:text-gray-400">
            {answerLabel}
          </p>
          {!showAnswer ? (
            <div
              onClick={() => setConfirmSpoiler(true)}
              className="inline-grid gap-[1px] bg-[#d2b48c] dark:bg-gray-800 p-3 border-4 border-[#3f2a1e] dark:border-gray-700 cursor-pointer hover:opacity-90 relative"
              style={{ gridTemplateColumns: `repeat(${width}, ${cellSize}px)` }}
            >
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 dark:bg-black/80 rounded-lg">
                <div className="text-white text-6xl">👁️‍🗨️</div>
              </div>
              {correctGrid.flatMap((row, r) =>
                row.map((_, c) => <div key={`${r}-${c}`} className="w-[44px] h-[44px] bg-[#f8f1e3] dark:bg-gray-800" />)
              )}
            </div>
          ) : (
            <div
              className="inline-grid gap-[1px] bg-[#d2b48c] dark:bg-gray-800 p-3 border-4 border-[#3f2a1e] dark:border-gray-700"
              style={{ gridTemplateColumns: `repeat(${width}, ${cellSize}px)` }}
            >
              {correctGrid.flatMap((row, r) =>
                row.map((val, c) => (
                  <div
                    key={`${r}-${c}`}
                    className="flex items-center justify-center font-mono font-bold text-3xl bg-[#f8f1e3]"
                    style={{ width: `${cellSize}px`, height: `${cellSize}px` }}
                  >
                    {val ?? ''}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* 确认弹窗（手动备用） */}
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