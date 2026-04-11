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
  const [cellSize, setCellSize] = useState(52);
  const [isMobile, setIsMobile] = useState(false);
  const isDragging = useRef(false);
  const hasDragged = useRef(false);
  const dragMode = useRef<'none' | 'add-shade' | 'remove-shade' | 'add-mark' | 'remove-mark'>('none');
  const startRow = useRef(-1);
  const startCol = useRef(-1);
  const hasCompleted = useRef(false);
  const boardRef = useRef<HTMLDivElement>(null);

  // 响应式尺寸 + 手机端检测
  useEffect(() => {
    const updateSize = () => {
      const mobile = window.innerWidth < 640;
      setIsMobile(mobile);
      setCellSize(mobile ? 25 : 52);
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    setGrid(Array.from({ length: height }, () => Array(width).fill(0)));
    hasCompleted.current = false;
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

  // 手机端点击循环（空白→黑格→打叉→空白）
  const cycleCell = (r: number, c: number) => {
    if (isClue(r, c)) return;
    setGrid((prev) => {
      const newGrid = prev.map((row) => [...row]);
      const current = newGrid[r][c];
      newGrid[r][c] = current === 0 ? 1 : current === 1 ? 2 : 0;
      return newGrid;
    });
  };

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
    const isLeftClick = e.button === 0;

    if (isLeftClick && isClueCell) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }

    e.preventDefault();
    e.nativeEvent.stopImmediatePropagation();

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    isDragging.current = true;
    hasDragged.current = false;
    startRow.current = r;
    startCol.current = c;

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
    const gap = 1;
    const col = Math.floor((e.clientX - rect.left) / (cellSize + gap));
    const row = Math.floor((e.clientY - rect.top) / (cellSize + gap));

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
        touchAction: 'none',
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
              onContextMenu={handleContextMenu}
              style={{
                paddingTop: '4px',
                width: `${cellSize}px`,
                height: `${cellSize}px`,
                fontSize: `${Math.floor(cellSize * 0.8)}px`,
                lineHeight: `${cellSize}px`,
              }}
              className={`flex items-center justify-center font-mono font-bold tracking-tight border-0 cursor-pointer touch-none
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