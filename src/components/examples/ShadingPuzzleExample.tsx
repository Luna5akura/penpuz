import { useState } from 'react';
import ExampleAnswerReveal from '@/components/ExampleAnswerReveal';
import {
  boardClassNames,
  boardLayoutMetrics,
  commonBoardChrome,
  getBoardCellColors,
  getBoardFrameStyle,
  getBoardTextStyle,
  getCellDividerStyle,
} from '@/puzzles/boardTheme';
import ShapeInventory from '@/puzzles/ShapeMinesweeper/ShapeInventory';
import type { CavePuzzleData, ShapeMinesweeperPuzzleData } from '@/puzzles/types';

interface Props {
  puzzle: CavePuzzleData | ShapeMinesweeperPuzzleData;
  correctSolution: (0 | 1)[][];
  playableLabel: string;
  answerLabel: string;
}

const CELL_SIZE = boardLayoutMetrics.exampleCellSize;

function Diagram({
  puzzle,
  solution,
}: {
  puzzle: Props['puzzle'];
  solution?: (0 | 1)[][];
}) {
  const outerWidth = puzzle.width * CELL_SIZE + commonBoardChrome.padding * 2 + commonBoardChrome.border * 2;
  const outerHeight = puzzle.height * CELL_SIZE + commonBoardChrome.padding * 2 + commonBoardChrome.border * 2;

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain pb-1">
      <div className="flex w-max min-w-full justify-center">
        <div
          className="relative select-none"
          style={{
            width: `${outerWidth}px`,
            height: `${outerHeight}px`,
            ...getBoardFrameStyle(commonBoardChrome.border),
          }}
        >
          <div
            className="absolute grid"
            style={{
              left: `${commonBoardChrome.padding}px`,
              top: `${commonBoardChrome.padding}px`,
              gridTemplateColumns: `repeat(${puzzle.width}, ${CELL_SIZE}px)`,
            }}
          >
            {Array.from({ length: puzzle.height }, (_, row) =>
              Array.from({ length: puzzle.width }, (_, col) => {
                const clue = puzzle.clues[row][col];
                const shaded = solution?.[row]?.[col] === 1;
                return (
                  <div
                    key={`${row}-${col}`}
                    className={boardClassNames.cellContent}
                    style={{
                      width: `${CELL_SIZE}px`,
                      height: `${CELL_SIZE}px`,
                      ...getBoardCellColors(shaded ? 'playerShaded' : clue === null ? 'cell' : 'clue'),
                      ...getCellDividerStyle(),
                      ...getBoardTextStyle(CELL_SIZE),
                    }}
                  >
                    {clue}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExamplePanel({
  puzzle,
  solution,
}: {
  puzzle: Props['puzzle'];
  solution?: (0 | 1)[][];
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-3">
      <Diagram puzzle={puzzle} solution={solution} />
      {puzzle.type === 'shape-minesweeper' ? (
        <ShapeInventory shapes={puzzle.shapes} cellSize={boardLayoutMetrics.compactInventoryCellSize} />
      ) : null}
    </div>
  );
}

export default function ShadingPuzzleExample({
  puzzle,
  correctSolution,
  playableLabel,
  answerLabel,
}: Props) {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="min-w-0">
        <div className="mb-4 text-center text-base font-medium text-muted-foreground">{playableLabel}</div>
        <ExamplePanel puzzle={puzzle} />
      </div>
      <div className="min-w-0">
        <div className="mb-4 text-center text-base font-medium text-muted-foreground">{answerLabel}</div>
        <ExampleAnswerReveal
          visible={showAnswer}
          onVisibleChange={setShowAnswer}
          ariaLabel={answerLabel}
          className="block w-full min-w-0 max-w-full"
        >
          <ExamplePanel puzzle={puzzle} solution={correctSolution} />
        </ExampleAnswerReveal>
      </div>
    </div>
  );
}
