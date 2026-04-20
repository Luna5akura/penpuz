import { useMemo, useState } from 'react';
import ExampleAnswerRevealDialog from '@/components/ExampleAnswerRevealDialog';
import type { NikojiPuzzleData } from '../../puzzles/types';
import NikojiBoard from '../../puzzles/Nikoji/Nikoji';
import {
  commonBoardChrome,
  getBoardCellColors,
  getBoardFrameStyle,
  getCellDividerStyle,
  woodBoardTheme,
} from '../../puzzles/boardTheme';
import { getNikojiBoundarySegments } from '../../puzzles/Nikoji/utils';

interface Props extends NikojiPuzzleData {
  solutionRegionIds: number[][];
  playableLabel: string;
  answerLabel: string;
}

const CELL_SIZE = 42;
const BOARD_PADDING = commonBoardChrome.padding;

export default function NikojiExample({
  width,
  height,
  letters,
  solutionRegionIds,
  playableLabel,
  answerLabel,
}: Props) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [confirmSpoiler, setConfirmSpoiler] = useState(false);
  const [exampleStartTime] = useState(() => Date.now());

  const examplePuzzle = useMemo<NikojiPuzzleData>(
    () => ({ type: 'nikoji', width, height, letters }),
    [height, letters, width]
  );
  const boundaries = useMemo(
    () => getNikojiBoundarySegments(solutionRegionIds, width, height),
    [height, solutionRegionIds, width]
  );
  const boardWidth = width * CELL_SIZE;
  const boardHeight = height * CELL_SIZE;
  const outerWidth = boardWidth + BOARD_PADDING * 2 + commonBoardChrome.border * 2;
  const outerHeight = boardHeight + BOARD_PADDING * 2 + commonBoardChrome.border * 2;

  return (
    <>
      <div className="flex flex-col xl:flex-row gap-10 justify-center">
        <div className="flex flex-col items-center">
          <p className="text-base font-medium text-muted-foreground mb-4 dark:text-gray-400">
            {playableLabel}
          </p>
          <NikojiBoard
            key={`nikoji-example-${width}-${height}`}
            puzzle={examplePuzzle}
            startTime={exampleStartTime}
            resetToken={0}
            onComplete={() => setShowAnswer(true)}
            fixedCellSize={CELL_SIZE}
            showValidationMessage
          />
        </div>

        <div className="flex flex-col items-center">
          <p className="text-base font-medium text-muted-foreground mb-4 dark:text-gray-400">
            {answerLabel}
          </p>
          {!showAnswer ? (
            <div
              onClick={() => setConfirmSpoiler(true)}
              className="relative cursor-pointer hover:opacity-90"
            >
              <div
                style={{
                  width: `${outerWidth}px`,
                  height: `${outerHeight}px`,
                  padding: `${BOARD_PADDING}px`,
                  ...getBoardFrameStyle(),
                }}
              >
                <div className="grid" style={{ gridTemplateColumns: `repeat(${width}, ${CELL_SIZE}px)` }}>
                  {Array.from({ length: width * height }, (_, index) => (
                    <div
                      key={index}
                      style={{
                        width: `${CELL_SIZE}px`,
                        height: `${CELL_SIZE}px`,
                        ...getBoardCellColors('cell'),
                        ...getCellDividerStyle(),
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 dark:bg-black/80">
                <div className="text-white text-6xl">👁️‍🗨️</div>
              </div>
            </div>
          ) : (
            <div
              className="relative"
              style={{
                width: `${outerWidth}px`,
                height: `${outerHeight}px`,
                ...getBoardFrameStyle(),
              }}
            >
              <div
                className="absolute grid"
                style={{
                  left: `${BOARD_PADDING}px`,
                  top: `${BOARD_PADDING}px`,
                  gridTemplateColumns: `repeat(${width}, ${CELL_SIZE}px)`,
                }}
              >
                {letters.flatMap((row, r) =>
                  row.map((letter, c) => (
                    <div
                      key={`${r}-${c}`}
                      className="flex items-center justify-center font-semibold tabular-nums"
                      style={{
                        width: `${CELL_SIZE}px`,
                        height: `${CELL_SIZE}px`,
                        ...getBoardCellColors(letter ? 'clue' : 'cell'),
                        ...getCellDividerStyle(),
                        fontSize: `${Math.max(18, Math.floor(CELL_SIZE * 0.54))}px`,
                        lineHeight: 1,
                      }}
                    >
                      {letter ?? ''}
                    </div>
                  ))
                )}
              </div>

              <svg
                className="absolute top-0 left-0 pointer-events-none"
                width={outerWidth - commonBoardChrome.border * 2}
                height={outerHeight - commonBoardChrome.border * 2}
              >
                {boundaries.horizontal.map((segment) => {
                  const y = BOARD_PADDING + (segment.row + 1) * CELL_SIZE;
                  const x1 = BOARD_PADDING + segment.col * CELL_SIZE;
                  const x2 = x1 + CELL_SIZE;
                  return (
                    <line
                      key={`h-${segment.row}-${segment.col}`}
                      x1={x1}
                      y1={y}
                      x2={x2}
                      y2={y}
                      stroke={woodBoardTheme.deepLine}
                      strokeWidth={4}
                      strokeLinecap="butt"
                    />
                  );
                })}

                {boundaries.vertical.map((segment) => {
                  const x = BOARD_PADDING + (segment.col + 1) * CELL_SIZE;
                  const y1 = BOARD_PADDING + segment.row * CELL_SIZE;
                  const y2 = y1 + CELL_SIZE;
                  return (
                    <line
                      key={`v-${segment.row}-${segment.col}`}
                      x1={x}
                      y1={y1}
                      x2={x}
                      y2={y2}
                      stroke={woodBoardTheme.deepLine}
                      strokeWidth={4}
                      strokeLinecap="butt"
                    />
                  );
                })}
              </svg>
            </div>
          )}
        </div>
      </div>

      <ExampleAnswerRevealDialog
        open={confirmSpoiler && !showAnswer}
        onCancel={() => setConfirmSpoiler(false)}
        onConfirm={() => {
          setShowAnswer(true);
          setConfirmSpoiler(false);
        }}
      />
    </>
  );
}
