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
import type { KakuroCell } from '@/puzzles/types';
import KakuroClue from '@/puzzles/Kakuro/KakuroClue';

interface Props {
  width: number;
  height: number;
  cells: KakuroCell[][];
  topClues: (number | null)[];
  leftClues: (number | null)[];
  correctGrid: (number | null)[][];
  playableLabel: string;
  answerLabel: string;
}

const CELL_SIZE = boardLayoutMetrics.exampleCellSize;
const BOARD_PADDING = commonBoardChrome.padding;
const BOARD_BORDER = commonBoardChrome.border;

function KakuroDiagram({
  width,
  height,
  cells,
  values,
}: Omit<Props, 'playableLabel' | 'answerLabel' | 'correctGrid'> & { values?: (number | null)[][] }) {
  const gridLeft = BOARD_PADDING;
  const gridTop = BOARD_PADDING;
  const boardWidth = width * CELL_SIZE;
  const boardHeight = height * CELL_SIZE;
  const outerWidth = boardWidth + BOARD_PADDING * 2 + BOARD_BORDER * 2;
  const outerHeight = boardHeight + BOARD_PADDING * 2 + BOARD_BORDER * 2;

  return (
    <div
      className="relative select-none"
      style={{
        width: `${outerWidth}px`,
        height: `${outerHeight}px`,
        ...getBoardFrameStyle(BOARD_BORDER),
      }}
    >
      <div
        className="absolute grid"
        style={{
          left: `${gridLeft}px`,
          top: `${gridTop}px`,
          gridTemplateColumns: `repeat(${width}, ${CELL_SIZE}px)`,
        }}
      >
        {Array.from({ length: height }, (_, row) =>
          Array.from({ length: width }, (_, col) => {
            const clue = cells[row][col];
            const value = values?.[row]?.[col] ?? null;
            return (
              <div
                key={`${row}-${col}`}
                className={boardClassNames.cellContent}
                style={{
                  width: `${CELL_SIZE}px`,
                  height: `${CELL_SIZE}px`,
                  ...getBoardCellColors(clue ? 'shaded' : 'cell'),
                  ...getCellDividerStyle(),
                  ...getBoardTextStyle(CELL_SIZE),
                }}
              >
                {clue ? <KakuroClue right={clue.right} down={clue.down} cellSize={CELL_SIZE} /> : value}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}

export default function KakuroExample({
  width,
  height,
  cells,
  topClues,
  leftClues,
  correctGrid,
  playableLabel,
  answerLabel,
}: Props) {
  const [showAnswer, setShowAnswer] = useState(false);
  const diagramProps = { width, height, cells, topClues, leftClues };

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <div className="mb-4 text-center text-base font-medium text-muted-foreground">{playableLabel}</div>
          <div className="flex justify-center overflow-x-auto">
            <KakuroDiagram {...diagramProps} />
          </div>
        </div>
        <div>
          <div className="mb-4 text-center text-base font-medium text-muted-foreground">{answerLabel}</div>
          <ExampleAnswerReveal
            visible={showAnswer}
            onVisibleChange={setShowAnswer}
            ariaLabel={answerLabel}
            className="flex justify-center overflow-x-auto"
          >
            <KakuroDiagram {...diagramProps} values={correctGrid} />
          </ExampleAnswerReveal>
        </div>
      </div>
    </>
  );
}
