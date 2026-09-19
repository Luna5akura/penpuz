import { useState, type PointerEvent } from 'react';
import ExampleAnswerReveal from '@/components/ExampleAnswerReveal';
import {
  boardClassNames,
  boardLayoutMetrics,
  commonBoardChrome,
  getBoardCellColors,
  getBoardFrameDimensions,
  getBoardFrameStyle,
  getBoardGridStyle,
  getBoardTextStyle,
  getCellDividerStyle,
} from '@/puzzles/boardTheme';
import type { TapaClue } from '@/puzzles/types';
import TapaClueView from '@/puzzles/Tapa/TapaClue';
import BoardCellMark from '@/puzzles/shared/BoardCellMark';

interface Props {
  width: number;
  height: number;
  clues: (TapaClue | null)[][];
  correctSolution: (0 | 1)[][];
  playableLabel: string;
  answerLabel: string;
}

type ExampleCellState = 0 | 1 | 2;

const CELL_SIZE = boardLayoutMetrics.loopExampleCellSize;

export default function TapaExample({
  width,
  height,
  clues,
  correctSolution,
  playableLabel,
  answerLabel,
}: Props) {
  const [grid, setGrid] = useState<ExampleCellState[][]>(() =>
    Array.from({ length: height }, () => Array(width).fill(0) as ExampleCellState[])
  );
  const [showAnswer, setShowAnswer] = useState(false);
  const { outerWidth, outerHeight } = getBoardFrameDimensions(width, height, CELL_SIZE);
  const handlePointerDown = (row: number, col: number, event: PointerEvent<HTMLDivElement>) => {
    if (clues[row][col]) return;
    event.preventDefault();
    event.stopPropagation();

    setGrid((currentGrid) => {
      const nextGrid = currentGrid.map((currentRow) => [...currentRow]);
      if (event.button === 2) {
        nextGrid[row][col] = nextGrid[row][col] === 2 ? 0 : 2;
      } else {
        nextGrid[row][col] = nextGrid[row][col] === 1 ? 0 : 1;
      }
      return nextGrid;
    });
  };

  const renderBoard = (states: ExampleCellState[][], interactive: boolean) => (
    <div
      className="relative select-none"
      style={{
        width: `${outerWidth}px`,
        height: `${outerHeight}px`,
        ...getBoardFrameStyle(commonBoardChrome.border),
      }}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className="grid" style={getBoardGridStyle(commonBoardChrome.padding, commonBoardChrome.padding, width, CELL_SIZE)}>
        {states.flatMap((row, rowIndex) =>
          row.map((state, colIndex) => {
          const clue = clues[rowIndex][colIndex];
          const isClue = clue !== null;
          const isShaded = state === 1;
          const isMarked = state === 2;

          return (
            <div
              key={`${rowIndex}-${colIndex}`}
              onPointerDown={interactive ? (event) => handlePointerDown(rowIndex, colIndex, event) : undefined}
              className={`${boardClassNames.touchCellContent} ${interactive ? 'cursor-pointer' : ''}`}
              style={{
                width: `${CELL_SIZE}px`,
                height: `${CELL_SIZE}px`,
                ...getBoardTextStyle(CELL_SIZE),
                ...getBoardCellColors(isClue ? 'clue' : isShaded ? 'playerShaded' : isMarked ? 'marked' : 'cell'),
                ...getCellDividerStyle(),
              }}
            >
              {isClue ? (
                <TapaClueView clue={clue} cellSize={CELL_SIZE} />
              ) : isMarked ? (
                <BoardCellMark kind="cross" cellSize={CELL_SIZE} />
              ) : null}
            </div>
          );
          })
        )}
      </div>
    </div>
  );

  const answerStates = correctSolution.map((row) => row.map((value) => (value === 1 ? 1 : 0) as ExampleCellState));

  return (
    <>
      <div className="flex flex-col justify-center gap-10 lg:flex-row">
        <div className="flex flex-col items-center">
          <p className="mb-4 text-center text-base font-medium text-muted-foreground">{playableLabel}</p>
          {renderBoard(grid, true)}
        </div>
        <div className="flex flex-col items-center">
          <p className="mb-4 text-center text-base font-medium text-muted-foreground">{answerLabel}</p>
          <ExampleAnswerReveal
            visible={showAnswer}
            onVisibleChange={setShowAnswer}
            ariaLabel={answerLabel}
            className="relative"
          >
            {renderBoard(answerStates, false)}
          </ExampleAnswerReveal>
        </div>
      </div>
    </>
  );
}
