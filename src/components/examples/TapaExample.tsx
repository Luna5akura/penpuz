import { useMemo, useState, type PointerEvent } from 'react';
import ExampleAnswerRevealDialog from '@/components/ExampleAnswerRevealDialog';
import ExampleAnswerOverlay from '@/components/ExampleAnswerOverlay';
import {
  boardClassNames,
  commonBoardChrome,
  getBoardCellColors,
  getBoardCrossFontSize,
  getBoardFrameStyle,
  getBoardTextStyle,
  getCellDividerStyle,
  getCrossMarkStyle,
} from '@/puzzles/boardTheme';
import type { TapaClue, TapaPuzzleData } from '@/puzzles/types';
import { validateTapa } from '@/puzzles/Tapa/utils';
import TapaClueView from '@/puzzles/Tapa/TapaClue';

interface Props {
  width: number;
  height: number;
  clues: (TapaClue | null)[][];
  correctSolution: (0 | 1)[][];
  playableLabel: string;
  answerLabel: string;
}

type ExampleCellState = 0 | 1 | 2;

const CELL_SIZE = 44;

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
  const [confirmSpoiler, setConfirmSpoiler] = useState(false);
  const puzzle = useMemo<TapaPuzzleData>(
    () => ({ type: 'tapa', width, height, clues }),
    [clues, height, width]
  );
  const validation = useMemo(() => validateTapa(grid, puzzle), [grid, puzzle]);
  const isAnswerVisible = showAnswer || validation.valid;

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
      className="relative inline-grid select-none"
      style={{
        gridTemplateColumns: `repeat(${width}, ${CELL_SIZE}px)`,
        padding: `${commonBoardChrome.padding}px`,
        ...getBoardFrameStyle(),
      }}
      onContextMenu={(event) => event.preventDefault()}
    >
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
                <span style={getCrossMarkStyle(getBoardCrossFontSize(CELL_SIZE))}>×</span>
              ) : null}
            </div>
          );
        })
      )}
    </div>
  );

  const answerStates = correctSolution.map((row) => row.map((value) => (value === 1 ? 1 : 0) as ExampleCellState));

  return (
    <>
      <div className="flex flex-col justify-center gap-10 lg:flex-row">
        <div className="flex flex-col items-center">
          <p className="mb-4 text-base font-medium text-muted-foreground dark:text-gray-400">{playableLabel}</p>
          {renderBoard(grid, true)}
        </div>
        <div className="flex flex-col items-center">
          <p className="mb-4 text-base font-medium text-muted-foreground dark:text-gray-400">{answerLabel}</p>
          <div
            className="relative cursor-pointer"
            onClick={() => {
              if (!isAnswerVisible) setConfirmSpoiler(true);
            }}
          >
            {renderBoard(answerStates, false)}
            {!isAnswerVisible ? <ExampleAnswerOverlay /> : null}
          </div>
        </div>
      </div>

      <ExampleAnswerRevealDialog
        open={confirmSpoiler}
        onCancel={() => setConfirmSpoiler(false)}
        onConfirm={() => {
          setShowAnswer(true);
          setConfirmSpoiler(false);
        }}
      />
    </>
  );
}
