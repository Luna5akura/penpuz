import { useState } from 'react';
import ExampleAnswerReveal from '@/components/ExampleAnswerReveal';
import {
  boardClassNames,
  boardLayoutMetrics,
  commonBoardChrome,
  getBoardCellStyle,
  getBoardFrameDimensions,
  getBoardFrameStyle,
  getBoardGridStyle,
  getBoardOutsideClueGutter,
  getBoardOutsideClueTextStyle,
  getBoardTextStyle,
  woodBoardTheme,
} from '@/puzzles/boardTheme';
import type { MagicSummerPuzzleData } from '@/puzzles/types';
import BoardCellMark from '@/puzzles/shared/BoardCellMark';

interface Props {
  puzzle: MagicSummerPuzzleData;
  correctGrid: (number | null)[][];
  playableLabel: string;
  answerLabel: string;
}

const CELL_SIZE = boardLayoutMetrics.exampleCellSize;
const CLUE_GUTTER = getBoardOutsideClueGutter(CELL_SIZE, 3);

function MagicSummerDiagram({
  puzzle,
  values,
}: {
  puzzle: MagicSummerPuzzleData;
  values?: (number | null)[][];
}) {
  const clues = {
    top: puzzle.columnSums,
    left: puzzle.rowSums,
  };
  const { outerWidth, outerHeight } = getBoardFrameDimensions(
    puzzle.width,
    puzzle.height,
    CELL_SIZE,
    {
      outsideLeft: CLUE_GUTTER,
      outsideTop: CLUE_GUTTER,
      borderWidth: commonBoardChrome.border,
      padding: commonBoardChrome.padding,
    }
  );
  const gridLeft = commonBoardChrome.padding + CLUE_GUTTER;
  const gridTop = commonBoardChrome.padding + CLUE_GUTTER;

  return (
    <div
      className="relative select-none"
      style={{
        width: `${outerWidth}px`,
        height: `${outerHeight}px`,
        ...getBoardFrameStyle(),
      }}
    >
      <div
        className="absolute grid"
        style={getBoardGridStyle(gridLeft, gridTop, puzzle.width, CELL_SIZE)}
      >
        {puzzle.cells.flatMap((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const value = values?.[rowIndex]?.[colIndex] ?? (typeof cell === 'number' ? cell : null);
            const isBlocked = cell === 'block';
            const tone = isBlocked
              ? 'marked'
              : typeof cell === 'number'
                ? 'prefilled'
                : 'cell';

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={boardClassNames.cellContent}
                style={{
                  ...getBoardCellStyle(CELL_SIZE, tone),
                  ...getBoardTextStyle(CELL_SIZE),
                }}
              >
                {isBlocked ? (
                  <BoardCellMark kind="cross" cellSize={CELL_SIZE} />
                ) : value}
              </div>
            );
          })
        )}
      </div>

      <div className="pointer-events-none absolute inset-0">
        {clues.top.map((value, col) => (
          value === null ? null : (
            <span
              key={`top-${col}`}
              className={`absolute -translate-x-1/2 -translate-y-1/2 ${boardClassNames.cellText}`}
              style={{
                left: `${commonBoardChrome.padding + CLUE_GUTTER + (col + 0.5) * CELL_SIZE}px`,
                top: `${commonBoardChrome.padding + CLUE_GUTTER / 2}px`,
                color: woodBoardTheme.border,
                ...getBoardOutsideClueTextStyle(CELL_SIZE, CELL_SIZE, value),
              }}
            >
              {value}
            </span>
          )
        ))}
        {clues.left.map((value, row) => (
          value === null ? null : (
            <span
              key={`left-${row}`}
              className={`absolute -translate-x-1/2 -translate-y-1/2 ${boardClassNames.cellText}`}
              style={{
                left: `${commonBoardChrome.padding + CLUE_GUTTER / 2}px`,
                top: `${commonBoardChrome.padding + CLUE_GUTTER + (row + 0.5) * CELL_SIZE}px`,
                color: woodBoardTheme.border,
                ...getBoardOutsideClueTextStyle(CELL_SIZE, CLUE_GUTTER, value),
              }}
            >
              {value}
            </span>
          )
        ))}
      </div>
    </div>
  );
}

export default function MagicSummerExample({
  puzzle,
  correctGrid,
  playableLabel,
  answerLabel,
}: Props) {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <div className="mb-4 text-center text-base font-medium text-muted-foreground">{playableLabel}</div>
          <div className="flex justify-center overflow-x-auto">
            <MagicSummerDiagram puzzle={puzzle} />
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
            <MagicSummerDiagram puzzle={puzzle} values={correctGrid} />
          </ExampleAnswerReveal>
        </div>
      </div>
    </>
  );
}
