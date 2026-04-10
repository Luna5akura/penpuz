// src/puzzles/Nurikabe/NurikabeBoard.tsx
import { useState, useEffect, useRef } from 'react';
import { validateNurikabe } from './utils';
import { PuzzleData } from '../types';

interface Props {
  puzzle: PuzzleData;
  startTime: number;
  onComplete: (time: number) => void;
}

type CellState = 0 | 1 | 2;

export default function NurikabeBoard({ puzzle, startTime, onComplete }: Props) {
  const { width, height, clues } = puzzle;
  const [grid, setGrid] = useState<CellState[][]>([]);
  const [cellSize, setCellSize] = useState(52); // 默认桌面尺寸
  const isDragging = useRef(false);
  const dragMode = useRef<'none' | 'add-shade' | 'remove-shade' | 'add-mark' | 'remove-mark'>('none');
  const boardRef = useRef<HTMLDivElement>(null);

  // === 新增：响应式单元格尺寸 ===
  useEffect(() => {
    const updateCellSize = () => {
      const isMobile = window.innerWidth < 640; // Tailwind sm 断点以下视为移动端
      // 可根据实际需要调整数值（移动端建议 36~42px，避免溢出）
      setCellSize(isMobile ? 25 : 52);
    };

    updateCellSize();
    window.addEventListener('resize', updateCellSize);
    return () => window.removeEventListener('resize', updateCellSize);
  }, []);

  useEffect(() => {
    setGrid(Array.from({ length: height }, () => Array(width).fill(0)));
  }, [height, width]);

  const isClue = (r: number, c: number) =>
    clues.some((clue) => clue.row === r && clue.col === c);

  const toggleCell = (r: number, c: number, mode: typeof dragMode.current) => {
    setGrid((prev) => {
      const newGrid = prev.map((row) => [...row]);
      if (mode === 'add-shade') newGrid[r][c] = 1;
      else if (mode === 'remove-shade') newGrid[r][c] = 0;
      else if (mode === 'add-mark') newGrid[r][c] = 2;
      else if (mode === 'remove-mark') newGrid[r][c] = 0;
      return newGrid;
    });
  };

  const handlePointerDown = (r: number, c: number, e: React.PointerEvent<HTMLDivElement>) => {
    const isClueCell = isClue(r, c);
    const isLeftClick = e.button === 0;
    if (isLeftClick && isClueCell) return;
    e.preventDefault();
    e.nativeEvent.stopImmediatePropagation();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    isDragging.current = true;
    const currentState = grid[r][c];
    if (isLeftClick) {
      dragMode.current = currentState === 1 ? 'remove-shade' : 'add-shade';
    } else {
      dragMode.current = currentState === 2 ? 'remove-mark' : 'add-mark';
    }
    toggleCell(r, c, dragMode.current);
  };

  // === 修改：使用动态 cellSize 计算行列 ===
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || dragMode.current === 'none') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const gap = 1; // 与 style.gap 一致
    const col = Math.floor((e.clientX - rect.left) / (cellSize + gap));
    const row = Math.floor((e.clientY - rect.top) / (cellSize + gap));
    if (row >= 0 && row < height && col >= 0 && col < width) {
      toggleCell(row, col, dragMode.current);
    }
  };

  const handlePointerUp = () => {
    isDragging.current = false;
    dragMode.current = 'none';
    const currentGrid: boolean[][] = grid.map((row) =>
      row.map((state) => state === 1)
    );
    const result = validateNurikabe(currentGrid, clues, width, height);
    if (result.valid) {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      onComplete(elapsed);
    }
  };

  return (
    <div
      ref={boardRef}
      className="puzzle-container mx-auto select-none"
      style={{
        display: 'inline-grid',
        gridTemplateColumns: `repeat(${width}, ${cellSize}px)`,
        gap: '1px',
        background: '#d2b48c',
        padding: '3px',
        border: '4px solid #3f2a1e',
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {grid.flatMap((row, r) =>
        row.map((state, c) => {
          // === 必须先声明所有用到的变量（修复 TDZ 错误）===
          const clue = clues.find((cl) => cl.row === r && cl.col === c);
          const isShaded = state === 1;
          const isMarked = state === 2;

          return (
            <div
              key={`${r}-${c}`}
              onPointerDown={(e) => handlePointerDown(r, c, e)}
              style={{
                width: `${cellSize}px`,
                height: `${cellSize}px`,
                fontSize: `${Math.floor(cellSize * 0.56)}px`,
              }}
              className={`flex items-center justify-center font-mono font-bold tracking-tighter leading-none border-0 cursor-pointer touch-none
                ${clue
                  ? isMarked
                    ? 'bg-[#f0e6d2] dark:bg-gray-700 text-[#3f2a1e] dark:text-gray-200'
                    : 'bg-[#f8f1e3] dark:bg-gray-800 text-[#3f2a1e] dark:text-gray-100'
                  : isShaded
                    ? 'bg-[#3f2a1e] text-white'
                    : isMarked
                      ? 'bg-[#f0e6d2] dark:bg-gray-700 text-gray-400'
                      : 'bg-[#f8f1e3] dark:bg-gray-800'}`}
            >
              {clue ? clue.value : isMarked ? '×' : ''}
            </div>
          );
        })
      )}
    </div>
  );
}