import { useMemo, useState } from 'react';
import ExampleAnswerReveal from '@/components/ExampleAnswerReveal';
import type { NeighborDigit, NeighborPuzzleData } from '@/puzzles/types';
import NeighborBoard from '@/puzzles/Neighbor/Neighbor';
import BoardCellOutline from '@/puzzles/shared/BoardCellOutline';
import {
  boardClassNames,
  boardLayoutMetrics,
  commonBoardChrome,
  getBoardCellStyle,
  getBoardFrameDimensions,
  getBoardFrameStyle,
  getBoardGridStyle,
  getBoardTextStyle,
} from '@/puzzles/boardTheme';

interface Props {
  width: number;
  height: number;
  givens: (NeighborDigit | null)[][];
  grayCells: boolean[][];
  correctGrid: NeighborDigit[][];
  playableLabel: string;
  answerLabel: string;
}

const CELL_SIZE = boardLayoutMetrics.exampleCellSize;
const BOARD_PADDING = commonBoardChrome.padding;
const BOARD_BORDER = commonBoardChrome.border;

function AnswerDiagram({
  width,
  height,
  grayCells,
  values,
}: {
  width: number;
  height: number;
  grayCells: boolean[][];
  values: NeighborDigit[][];
}) {
  const { outerWidth, outerHeight } = getBoardFrameDimensions(
    width,
    height,
    CELL_SIZE,
    { borderWidth: BOARD_BORDER, padding: BOARD_PADDING }
  );
  return (
    <div
      className="relative select-none"
      style={{
        width: `${outerWidth}px`,
        height: `${outerHeight}px`,
        ...getBoardFrameStyle(BOARD_BORDER),
        maxWidth: 'none',
      }}
    >
      <div
        className="grid"
        style={getBoardGridStyle(BOARD_PADDING, BOARD_PADDING, width, CELL_SIZE)}
      >
        {Array.from({ length: height }, (_, row) =>
          Array.from({ length: width }, (_, col) => (
            <div
              key={`${row}-${col}`}
              className={boardClassNames.cellContent}
              style={{
                ...getBoardCellStyle(CELL_SIZE, grayCells[row]?.[col] ? 'outlined' : 'cell'),
                ...getBoardTextStyle(CELL_SIZE, 0.68, 18),
              }}
            >
              {grayCells[row]?.[col] ? <BoardCellOutline cellSize={CELL_SIZE} /> : null}
              {values[row]?.[col] ?? null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function NeighborExample({
  width,
  height,
  givens,
  grayCells,
  correctGrid,
  playableLabel,
  answerLabel,
}: Props) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [exampleStartTime] = useState(() => Date.now());
  const puzzle = useMemo<NeighborPuzzleData>(
    () => ({ type: 'neighbor', width, height, givens, grayCells }),
    [grayCells, givens, height, width]
  );

  return (
    <div className="grid min-w-0 gap-6 md:grid-cols-2">
      <div className="min-w-0">
        <p className="mb-4 text-center text-base font-medium text-muted-foreground">{playableLabel}</p>
        <div className="w-full min-w-0 max-w-full overflow-hidden">
          <div className="w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain pb-1">
          <div className="mx-auto w-max min-w-0">
  <NeighborBoard
              puzzle={puzzle}
              startTime={exampleStartTime}
              resetToken={0}
              onComplete={() => setShowAnswer(true)}
              fixedCellSize={CELL_SIZE}
            />
          </div>
        </div>
        </div>
      </div>
      <div className="min-w-0">
        <p className="mb-4 text-center text-base font-medium text-muted-foreground">{answerLabel}</p>
        <ExampleAnswerReveal
          visible={showAnswer}
          onVisibleChange={setShowAnswer}
          ariaLabel={answerLabel}
          className="flex max-w-full justify-start overflow-x-auto overscroll-x-contain pb-1 md:justify-center"
        >
          <AnswerDiagram width={width} height={height} grayCells={grayCells} values={correctGrid} />
        </ExampleAnswerReveal>
      </div>
    </div>
  );
}
