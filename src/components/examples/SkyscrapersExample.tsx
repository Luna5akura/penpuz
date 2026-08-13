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
  woodBoardTheme,
} from '@/puzzles/boardTheme';
import type { SkyscrapersClues } from '@/puzzles/types';

interface Props {
  width: number;
  height: number;
  clues: SkyscrapersClues;
  correctGrid: number[][];
  playableLabel: string;
  answerLabel: string;
}

const CELL_SIZE = 42;
const CLUE_GUTTER = 34;

function SkyscrapersDiagram({
  width,
  height,
  clues,
  values,
}: {
  width: number;
  height: number;
  clues: SkyscrapersClues;
  values?: number[][];
}) {
  const boardWidth = width * CELL_SIZE + CLUE_GUTTER * 2;
  const boardHeight = height * CELL_SIZE + CLUE_GUTTER * 2;
  const left = commonBoardChrome.padding + CLUE_GUTTER;
  const top = commonBoardChrome.padding + CLUE_GUTTER;

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
          left: `${left}px`,
          top: `${top}px`,
          gridTemplateColumns: `repeat(${width}, ${CELL_SIZE}px)`,
        }}
      >
        {Array.from({ length: height }, (_, row) =>
          Array.from({ length: width }, (_, col) => (
            <div
              key={`${row}-${col}`}
              className={boardClassNames.cellContent}
              style={{
                width: `${CELL_SIZE}px`,
                height: `${CELL_SIZE}px`,
                ...getBoardCellColors('cell'),
                ...getBoardTextStyle(CELL_SIZE),
                ...getCellDividerStyle(),
              }}
            >
              {values?.[row]?.[col] ?? null}
            </div>
          ))
        )}
      </div>

      <div className="pointer-events-none absolute inset-0">
        {clues.top.map((value, col) => (
          value === null ? null : (
            <span
              key={`top-${col}`}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${left + (col + 0.5) * CELL_SIZE}px`,
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
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${left + (col + 0.5) * CELL_SIZE}px`,
                top: `${top + height * CELL_SIZE + CLUE_GUTTER / 2}px`,
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
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${commonBoardChrome.padding + CLUE_GUTTER / 2}px`,
                top: `${top + (row + 0.5) * CELL_SIZE}px`,
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
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${left + width * CELL_SIZE + CLUE_GUTTER / 2}px`,
                top: `${top + (row + 0.5) * CELL_SIZE}px`,
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

export default function SkyscrapersExample({
  width,
  height,
  clues,
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
            <SkyscrapersDiagram width={width} height={height} clues={clues} />
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
            <SkyscrapersDiagram width={width} height={height} clues={clues} values={correctGrid} />
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
