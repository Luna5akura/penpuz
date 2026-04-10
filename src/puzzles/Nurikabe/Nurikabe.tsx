// src/puzzles/Nurikabe/NurikabeBoard.tsx
import { useState, useEffect, useRef } from 'react';
import { validateNurikabe } from './utils';
import { PuzzleData, NurikabeClue } from '../types';

interface Props {
  puzzle: PuzzleData;
  onComplete: (time: number) => void;
}

type CellState = 0 | 1 | 2; // 0=空白, 1=涂黑, 2=标记×（非黑）

export default function NurikabeBoard({ puzzle, onComplete }: Props) {
  const { width, height, clues } = puzzle;
  const [grid, setGrid] = useState<CellState[][]>([]);
  const [startTime] = useState(Date.now());
  const isDragging = useRef(false);
  const dragMode = useRef<'none' | 'add-shade' | 'remove-shade' | 'add-mark' | 'remove-mark'>('none');
  const boardRef = useRef<HTMLDivElement>(null);

  // 捕获阶段拦截右键（防插件）
  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const preventContextMenu = (e: MouseEvent) => {
      if (e.button === 2) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    };
    board.addEventListener('contextmenu', preventContextMenu, { capture: true });
    return () => board.removeEventListener('contextmenu', preventContextMenu, { capture: true });
  }, []);

  useEffect(() => {
    setGrid(Array.from({ length: height }, () => Array(width).fill(0)));
  }, [height, width]);

  const isClue = (r: number, c: number) =>
    clues.some((clue) => clue.row === r && clue.col === c);

  const toggleCell = (r: number, c: number, mode: typeof dragMode.current) => {
    if (isClue(r, c)) return;
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
    if (isClue(r, c)) return;
    e.preventDefault();
    e.nativeEvent.stopImmediatePropagation();

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);   // 关键修复：捕获指针事件

    isDragging.current = true;
    const currentState = grid[r][c];
    const isLeftClick = e.button === 0;

    if (isLeftClick) {
      dragMode.current = currentState === 1 ? 'remove-shade' : 'add-shade';
    } else {
      dragMode.current = currentState === 2 ? 'remove-mark' : 'add-mark';
    }

    toggleCell(r, c, dragMode.current);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || dragMode.current === 'none') return;

    // 通过鼠标坐标计算当前单元格（容器级事件）
    const rect = e.currentTarget.getBoundingClientRect();
    const col = Math.floor((e.clientX - rect.left) / 53);   // 52px 单元格 + 1px gap
    const row = Math.floor((e.clientY - rect.top) / 53);
    if (row >= 0 && row < height && col >= 0 && col < width) {
      toggleCell(row, col, dragMode.current);
    }
  };

  const handlePointerUp = () => {
    isDragging.current = false;
    dragMode.current = 'none';

    const currentGrid = grid.map((row) => row.map((state) => state === 1));
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
        gridTemplateColumns: `repeat(${width}, 52px)`,
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
          const clue = clues.find((cl) => cl.row === r && cl.col === c);
          const isShaded = state === 1;
          const isMarked = state === 2;
          return (
            <div
              key={`${r}-${c}`}
              onPointerDown={(e) => handlePointerDown(r, c, e)}
              className={`w-[52px] h-[52px] flex items-center justify-center text-xl font-bold cursor-pointer transition-all border-0 touch-none
                ${clue ? 'bg-[#f8f1e3] text-[#3f2a1e]' : isShaded ? 'bg-[#3f2a1e] text-white' : isMarked ? 'bg-[#f0e6d2] text-gray-400' : 'bg-[#f8f1e3]'}`}
            >
              {clue ? clue.value : isMarked ? '×' : ''}
            </div>
          );
        })
      )}
    </div>
  );
}