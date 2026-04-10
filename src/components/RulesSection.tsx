// src/components/RulesSection.tsx
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { validateNurikabe, getNurikabeViolations, type NurikabeViolations } from '../puzzles/Nurikabe/utils';
import { PuzzleData } from '../puzzles/types';

export default function RulesSection() {
  const examplePuzzle: PuzzleData = {
    type: 'nurikabe',
    width: 5,
    height: 5,
    clues: [
      { row: 0, col: 3, value: 3 },
      { row: 1, col: 0, value: 2 },
      { row: 3, col: 1, value: '?' },
      { row: 3, col: 4, value: 1 },
    ],
  };

  const [exampleGrid, setExampleGrid] = useState<(0 | 1 | 2)[][]>([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [confirmSpoiler, setConfirmSpoiler] = useState(false);
  const [violations, setViolations] = useState<NurikabeViolations>({
    violatedRules: [],
    bad2x2Cells: [],
    badClueIndices: [],
  });

  const isDragging = useRef(false);
  const dragMode = useRef<'none' | 'add-shade' | 'remove-shade' | 'add-mark' | 'remove-mark'>('none');
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setExampleGrid(Array.from({ length: 5 }, () => Array(5).fill(0)));
  }, []);

  useEffect(() => {
    if (exampleGrid.length === 0) return;
    const boolGrid: boolean[][] = exampleGrid.map(row => row.map(s => s === 1));
    const v = getNurikabeViolations(boolGrid, examplePuzzle.clues, 5, 5);
    setViolations(v);

    const result = validateNurikabe(boolGrid, examplePuzzle.clues, 5, 5);
    if (result.valid) setShowAnswer(true);
  }, [exampleGrid]);

  const isClue = (r: number, c: number) =>
    examplePuzzle.clues.some(cl => cl.row === r && cl.col === c);

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
    const currentState = exampleGrid[r][c];

    if (isLeftClick) {
      dragMode.current = currentState === 1 ? 'remove-shade' : 'add-shade';
    } else {
      dragMode.current = currentState === 2 ? 'remove-mark' : 'add-mark';
    }
    toggleCell(r, c, dragMode.current);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || dragMode.current === 'none') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeX = e.clientX - rect.left - 12;
    const relativeY = e.clientY - rect.top - 12;
    const col = Math.floor(relativeX / 45);
    const row = Math.floor(relativeY / 45);

    if (row >= 0 && row < 5 && col >= 0 && col < 5) {
      if (dragMode.current.startsWith('add-shade') || dragMode.current.startsWith('remove-shade')) {
        if (isClue(row, col)) return;
      }
      toggleCell(row, col, dragMode.current);
    }
  };

  const handlePointerUp = () => {
    isDragging.current = false;
    dragMode.current = 'none';
  };

  const correctSolution = [
    [1, 1, 1, 0, 0],
    [0, 0, 1, 1, 0],
    [1, 1, 0, 1, 1],
    [1, 0, 0, 1, 0],
    [1, 1, 1, 1, 1],
  ];

  return (
    <Card className="max-w-4xl mx-auto mt-12 dark:bg-gray-900 dark:border-gray-800">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-[#3f2a1e] dark:text-gray-100 text-center">游戏规则</CardTitle>
      </CardHeader>
      <CardContent className="prose text-[#3f2a1e] dark:text-gray-200 leading-relaxed px-8">
        <div className="space-y-6 mb-12">
          <div className="flex gap-4 items-start">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#3f2a1e] dark:bg-gray-700 text-white flex items-center justify-center font-bold text-lg">1</span>
            <p className="text-lg pt-1">涂黑一些空格，使得所有涂黑的格子连通成一个整体，且没有全部涂黑的2×2结构。</p>
          </div>
          <div className="flex gap-4 items-start">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#3f2a1e] dark:bg-gray-700 text-white flex items-center justify-center font-bold text-lg">2</span>
            <p className="text-lg pt-1">每一组连通的留白格必须恰好包含一个数字。</p>
          </div>
          <div className="flex gap-4 items-start">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#3f2a1e] dark:bg-gray-700 text-white flex items-center justify-center font-bold text-lg">3</span>
            <p className="text-lg pt-1">数字表示其所在的留白的连通组格数。</p>
          </div>
        </div>

        <div className="mt-10">
          <h3 className="text-2xl font-semibold mb-8 text-center text-[#3f2a1e] dark:text-gray-100">例题（5×5）</h3>

          <div className="flex flex-col lg:flex-row gap-10 justify-center">
            <div className="flex flex-col items-center">
              <p className="text-base font-medium text-muted-foreground mb-4 dark:text-gray-400">可游玩例题（点击或拖动练习）</p>
              <div
                ref={boardRef}
                className="inline-grid gap-[1px] bg-[#d2b48c] dark:bg-gray-800 p-3 border-4 border-[#3f2a1e] dark:border-gray-700 select-none"
                style={{ gridTemplateColumns: 'repeat(5, 44px)' }}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
              >
                {exampleGrid.flatMap((row, r) =>
                  row.map((state, c) => {
                    const clue = examplePuzzle.clues.find(cl => cl.row === r && cl.col === c);
                    const isShaded = state === 1;
                    const isMarked = state === 2;
                    const isBad2x2 = violations.bad2x2Cells.some(cell => 
                      (cell.r === r && cell.c === c) ||
                      (cell.r === r-1 && cell.c === c) ||
                      (cell.r === r && cell.c === c-1) ||
                      (cell.r === r-1 && cell.c === c-1)
                    );
                    const clueIndex = examplePuzzle.clues.findIndex(cl => cl.row === r && cl.col === c);
                    const isBadClue = clueIndex >= 0 && violations.badClueIndices.includes(clueIndex);

                    return (
                      <div
                        key={`${r}-${c}`}
                        onPointerDown={(e) => handlePointerDown(r, c, e)}
                        style={{
                          paddingTop: '4px',                    // ← 与主棋盘同步
                          width: '44px',
                          height: '44px',
                          fontSize: '35px',                     // ← 对应 44 * 0.8 的效果
                          lineHeight: '44px',                   // ← 关键垂直居中修正
                        }}
                        className={`flex items-center justify-center font-mono font-bold tracking-tight border-0 cursor-pointer
                          ${isBad2x2 ? 'bg-red-500 text-white' :
                            clue ? (isMarked ? 'bg-[#f0e6d2] dark:bg-gray-700 text-[#3f2a1e] dark:text-gray-200' : 'bg-[#f8f1e3] dark:bg-gray-800 text-[#3f2a1e] dark:text-gray-100') :
                            isShaded ? 'bg-[#3f2a1e] text-white' :
                            isMarked ? 'bg-[#f0e6d2] dark:bg-gray-700 text-gray-400' : 'bg-[#f8f1e3] dark:bg-gray-800'}`}
                      >
                        {clue ? (
                          <span className={isBadClue ? 'text-red-600 dark:text-red-400' : ''}>
                            {clue.value}
                          </span>
                        ) : isMarked ? '×' : ''}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex flex-col items-center">
              <p className="text-base font-medium text-muted-foreground mb-4 dark:text-gray-400">正确答案</p>
              {!showAnswer ? (
                <div
                  onClick={() => setConfirmSpoiler(true)}
                  className="inline-grid gap-[1px] bg-[#d2b48c] dark:bg-gray-800 p-3 border-4 border-[#3f2a1e] dark:border-gray-700 cursor-pointer hover:opacity-90 relative"
                  style={{ gridTemplateColumns: 'repeat(5, 44px)' }}
                >
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70 dark:bg-black/80 rounded-lg">
                    <div className="text-white text-6xl">👁️‍🗨️</div>
                  </div>
                  {correctSolution.flatMap((row, r) =>
                    row.map((_, c) => <div key={`${r}-${c}`} className="w-[44px] h-[44px] bg-[#f8f1e3] dark:bg-gray-800" />)
                  )}
                </div>
              ) : (
                <div
                  className="inline-grid gap-[1px] bg-[#d2b48c] dark:bg-gray-800 p-3 border-4 border-[#3f2a1e] dark:border-gray-700"
                  style={{ gridTemplateColumns: 'repeat(5, 44px)' }}
                >
                  {correctSolution.flatMap((row, r) =>
                    row.map((isBlack, c) => (
                      <div
                        key={`${r}-${c}`}
                        className={`flex items-center justify-center font-mono font-bold tracking-tight border-0
                          ${isBlack ? 'bg-[#3f2a1e] text-white' : 'bg-[#f8f1e3] dark:bg-gray-800 text-[#3f2a1e] dark:text-gray-100'}`}
                        style={{
                          paddingTop: '4px',
                          width: '44px',
                          height: '44px',
                          fontSize: '35px',
                          lineHeight: '44px',
                        }}
                      >
                        {(r === 1 && c === 0) ? '2' : (r === 0 && c === 3) ? '3' : (r === 3 && c === 1) ? '?' : (r === 3 && c === 4) ? '1' : ''}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
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
      </CardContent>
    </Card>
  );
}