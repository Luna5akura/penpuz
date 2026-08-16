import { useState } from 'react';
import ExampleAnswerRevealDialog from '@/components/ExampleAnswerRevealDialog';
import ExampleAnswerOverlay from '@/components/ExampleAnswerOverlay';
import {
  boardClassNames,
  commonBoardChrome,
  getBoardCellColors,
  getBoardFrameStyle,
  getBoardTextStyle,
  getCellDividerStyle,
  getCrossMarkStyle,
  woodBoardTheme,
} from '@/puzzles/boardTheme';
import type { MagicSummerPuzzleData } from '@/puzzles/types';

interface Props {
  puzzle: MagicSummerPuzzleData;
  correctGrid: (number | null)[][];
  playableLabel: string;
  answerLabel: string;
}

const CELL_SIZE = 42;
const CLUE_GUTTER = 34;

function MagicSummerDiagram({
  puzzle,
  values,
}: {
  puzzle: MagicSummerPuzzleData;
  values?: (number | null)[][];
}) {
  const clues = puzzle.clues ?? {
    top: puzzle.columnSums,
    bottom: Array<number | null>(puzzle.width).fill(null),
    left: puzzle.rowSums,
    right: Array<number | null>(puzzle.height).fill(null),
  };
  const boardWidth = puzzle.width * CELL_SIZE + CLUE_GUTTER * 2;
  const boardHeight = puzzle.height * CELL_SIZE + CLUE_GUTTER * 2;

  return (
    <div
      className="relative select-none"
      style={{
        width: `${boardWidth + commonBoardChrome.padding * 2 + commonBoardChrome.border * 2}px`,
        height: `${boardHeight + commonBoardChrome.padding * 2 + commonBoardChrome.border * 2}px`,
        ...getBoardFrameStyle(),
      }}
    >
      <div
        className="absolute grid"
        style={{
          left: `${commonBoardChrome.padding + CLUE_GUTTER}px`,
          top: `${commonBoardChrome.padding + CLUE_GUTTER}px`,
          gridTemplateColumns: `repeat(${puzzle.width}, ${CELL_SIZE}px)`,
        }}
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
                  width: `${CELL_SIZE}px`,
                  height: `${CELL_SIZE}px`,
                  ...getBoardCellColors(tone),
                  ...getBoardTextStyle(CELL_SIZE),
                  ...getCellDividerStyle(),
                }}
              >
                {isBlocked ? (
                  <span style={getCrossMarkStyle(Math.max(18, Math.floor(CELL_SIZE * 0.52)), woodBoardTheme.markedText)}>
                    ×
                  </span>
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
                ...getBoardTextStyle(CELL_SIZE, 0.48, 14),
              }}
            >
              {value}
            </span>
          )
        ))}
        {clues.bottom.map((value, col) => (
          value === null ? null : (
            <span
              key={`bottom-${col}`}
              className={`absolute -translate-x-1/2 -translate-y-1/2 ${boardClassNames.cellText}`}
              style={{
                left: `${commonBoardChrome.padding + CLUE_GUTTER + (col + 0.5) * CELL_SIZE}px`,
                top: `${commonBoardChrome.padding + CLUE_GUTTER + puzzle.height * CELL_SIZE + CLUE_GUTTER / 2}px`,
                color: woodBoardTheme.border,
                ...getBoardTextStyle(CELL_SIZE, 0.48, 14),
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
                ...getBoardTextStyle(CELL_SIZE, 0.48, 14),
              }}
            >
              {value}
            </span>
          )
        ))}
        {clues.right.map((value, row) => (
          value === null ? null : (
            <span
              key={`right-${row}`}
              className={`absolute -translate-x-1/2 -translate-y-1/2 ${boardClassNames.cellText}`}
              style={{
                left: `${commonBoardChrome.padding + CLUE_GUTTER + puzzle.width * CELL_SIZE + CLUE_GUTTER / 2}px`,
                top: `${commonBoardChrome.padding + CLUE_GUTTER + (row + 0.5) * CELL_SIZE}px`,
                color: woodBoardTheme.border,
                ...getBoardTextStyle(CELL_SIZE, 0.48, 14),
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
  const [confirmSpoiler, setConfirmSpoiler] = useState(false);

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <div className="mb-2 text-center text-sm font-medium text-muted-foreground">{playableLabel}</div>
          <div className="flex justify-center overflow-x-auto">
            <MagicSummerDiagram puzzle={puzzle} />
          </div>
        </div>
        <div>
          <div className="mb-2 text-center text-sm font-medium text-muted-foreground">{answerLabel}</div>
          <div
            className="relative flex justify-center overflow-x-auto"
            onClick={() => {
              if (!showAnswer) setConfirmSpoiler(true);
            }}
          >
            <MagicSummerDiagram puzzle={puzzle} values={correctGrid} />
            {!showAnswer ? <ExampleAnswerOverlay /> : null}
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
