// src/components/examples/NurikabeExample.tsx
import { useState, useEffect, useMemo, useRef } from 'react';
import ExampleAnswerRevealDialog from '@/components/ExampleAnswerRevealDialog';
import { validateNurikabe, getNurikabeViolations, type NurikabeViolations } from '../../puzzles/Nurikabe/utils';
import {
  commonBoardChrome,
  getBoardCellColors,
  getBoardCrossFontSize,
  getBoardFrameStyle,
  getBoardNumberFontSize,
  getCellDividerStyle,
  getCrossMarkStyle,
  getInvalidBoardCellColors,
  woodBoardTheme,
} from '../../puzzles/boardTheme';
import type { NurikabeClue } from '../../puzzles/types';

interface Props {
  width: number;
  height: number;
  clues: NurikabeClue[];
  correctSolution: (0 | 1)[][];
  playableLabel: string;
  answerLabel: string;
}

export default function NurikabeExample({ width, height, clues, correctSolution, playableLabel, answerLabel }: Props) {
  const [exampleGrid, setExampleGrid] = useState<(0 | 1 | 2)[][]>(() =>
    Array.from({ length: height }, () => Array(width).fill(0))
  );
  const [showAnswer, setShowAnswer] = useState(false);
  const [confirmSpoiler, setConfirmSpoiler] = useState(false);
  const isMobile = useRef(false);
  const isDragging = useRef(false);
  const hasDragged = useRef(false);
  const dragMode = useRef<'none' | 'add-shade' | 'remove-shade' | 'add-mark' | 'remove-mark'>('none');
  const startRow = useRef(-1);
  const startCol = useRef(-1);

  useEffect(() => {
    const update = () => { isMobile.current = window.innerWidth < 640; };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const boolGrid = useMemo(
    () => exampleGrid.map(row => row.map(s => s === 1)),
    [exampleGrid]
  );
  const violations = useMemo<NurikabeViolations>(
    () => getNurikabeViolations(boolGrid, clues, width, height),
    [boolGrid, clues, width, height]
  );
  const isAnswerVisible = showAnswer || validateNurikabe(boolGrid, clues, width, height).valid;

  const isClue = (r: number, c: number) => clues.some(cl => cl.row === r && cl.col === c);

  const toggleCell = (r: number, c: number, mode: typeof dragMode.current) => {
    setExampleGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      if (mode === 'add-shade') newGrid[r][c] = 1;
      else if (mode === 'remove-shade') newGrid[r][c] = 0;
      else if (mode === 'add-mark') newGrid[r][c] = 2;
      else if (mode === 'remove-mark') newGrid[r][c] = 0;
      return newGrid;
    });
  };

  const cycleCell = (r: number, c: number) => {
    if (isClue(r, c)) return;
    setExampleGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      const cur = newGrid[r][c];
      newGrid[r][c] = cur === 0 ? 1 : cur === 1 ? 2 : 0;
      return newGrid;
    });
  };

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
    const currentState = exampleGrid[r][c];
    if (isMobile.current) {
      if (currentState === 0) dragMode.current = 'add-shade';
      else if (currentState === 1) dragMode.current = 'add-mark';
      else if (currentState === 2) dragMode.current = 'remove-mark';
    } else {
      if (isLeftClick) {
        dragMode.current = currentState === 1 ? 'remove-shade' : 'add-shade';
      } else {
        dragMode.current = currentState === 2 ? 'remove-mark' : 'add-mark';
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || dragMode.current === 'none') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeX = e.clientX - rect.left - commonBoardChrome.padding;
    const relativeY = e.clientY - rect.top - commonBoardChrome.padding;
    const col = Math.floor(relativeX / 45);
    const row = Math.floor(relativeY / 45);
    if (row >= 0 && row < height && col >= 0 && col < width) {
      if (dragMode.current.includes('shade') && isClue(row, col)) return;
      hasDragged.current = true;
      toggleCell(row, col, dragMode.current);
    }
  };

  const handlePointerUp = () => {
    if (!isDragging.current) return;
    if (!hasDragged.current && startRow.current >= 0 && startCol.current >= 0) {
      if (isMobile.current) {
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

  const getClueValue = (r: number, c: number) => {
    const clue = clues.find(cl => cl.row === r && cl.col === c);
    return clue ? clue.value : '';
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-10 justify-center">
        {/* 可游玩例题 */}
        <div className="flex flex-col items-center">
          <p className="text-base font-medium text-muted-foreground mb-4 dark:text-gray-400">
            {playableLabel}
          </p>
          <div
            className="inline-grid dark:bg-gray-800 select-none"
            style={{
              gridTemplateColumns: `repeat(${width}, 44px)`,
              padding: `${commonBoardChrome.padding}px`,
              ...getBoardFrameStyle(),
            }}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            {exampleGrid.flatMap((row, r) =>
              row.map((state, c) => {
                const isShaded = state === 1;
                const isMarked = state === 2;
                const isBad2x2 = violations.bad2x2Cells.some(cell =>
                  (cell.r === r && cell.c === c) || (cell.r === r - 1 && cell.c === c) ||
                  (cell.r === r && cell.c === c - 1) || (cell.r === r - 1 && cell.c === c - 1)
                );
                const clueIndex = clues.findIndex(cl => cl.row === r && cl.col === c);
                const isBadClue = clueIndex >= 0 && violations.badClueIndices.includes(clueIndex);
                return (
                  <div
                    key={`${r}-${c}`}
                    onPointerDown={(e) => handlePointerDown(r, c, e)}
                    onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    style={{
                      width: '44px',
                      height: '44px',
                      fontSize: `${getBoardNumberFontSize(44)}px`,
                      lineHeight: 1,
                      ...(isBad2x2
                        ? getInvalidBoardCellColors('dark')
                        : isClue(r, c)
                          ? {
                              ...getBoardCellColors('clue'),
                              background: woodBoardTheme.marked,
                            }
                          : getBoardCellColors(isShaded ? 'playerShaded' : isMarked ? 'marked' : 'cell')),
                      ...getCellDividerStyle(),
                    }}
                    className="flex items-center justify-center font-semibold tabular-nums tracking-tight border-0 cursor-pointer"
                  >
                    {isClue(r, c) ? (
                      <span className={isBadClue ? 'text-red-600 dark:text-red-400' : ''}>
                        {getClueValue(r, c)}
                      </span>
                    ) : isMarked ? <span style={getCrossMarkStyle(getBoardCrossFontSize(44))}>{'×'}</span> : ''}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 正确答案 */}
        <div className="flex flex-col items-center">
          <p className="text-base font-medium text-muted-foreground mb-4 dark:text-gray-400">
            {answerLabel}
          </p>
          {!isAnswerVisible ? (
            <div
              onClick={() => setConfirmSpoiler(true)}
            className="inline-grid dark:bg-gray-800 cursor-pointer hover:opacity-90 relative"
            style={{
              gridTemplateColumns: `repeat(${width}, 44px)`,
              padding: `${commonBoardChrome.padding}px`,
              ...getBoardFrameStyle(),
            }}
            >
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 dark:bg-black/80 rounded-lg">
                <div className="text-white text-6xl">👁️‍🗨️</div>
              </div>
              {correctSolution.flatMap((row, r) =>
                row.map((_, c) => (
                  <div
                    key={`${r}-${c}`}
                    className="w-[44px] h-[44px] dark:bg-gray-800"
                    style={{ background: woodBoardTheme.cell, ...getCellDividerStyle() }}
                  />
                ))
              )}
            </div>
          ) : (
            <div
              className="inline-grid dark:bg-gray-800"
              style={{
                gridTemplateColumns: `repeat(${width}, 44px)`,
                padding: `${commonBoardChrome.padding}px`,
                ...getBoardFrameStyle(),
              }}
            >
              {correctSolution.flatMap((row, r) =>
                row.map((isBlack, c) => (
                  <div
                    key={`${r}-${c}`}
                    className="flex items-center justify-center font-semibold tabular-nums tracking-tight border-0"
                    style={{
                      width: '44px',
                      height: '44px',
                      fontSize: `${getBoardNumberFontSize(44)}px`,
                      lineHeight: 1,
                      background: isBlack ? woodBoardTheme.shaded : woodBoardTheme.cell,
                      color: isBlack ? woodBoardTheme.shadedText : woodBoardTheme.border,
                      ...getCellDividerStyle(),
                    }}
                  >
                    {getClueValue(r, c)}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <ExampleAnswerRevealDialog
        open={confirmSpoiler && !isAnswerVisible}
        onCancel={() => setConfirmSpoiler(false)}
        onConfirm={() => {
          setShowAnswer(true);
          setConfirmSpoiler(false);
        }}
      />
    </>
  );
}
