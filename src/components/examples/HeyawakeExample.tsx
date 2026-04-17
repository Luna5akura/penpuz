import { useMemo, useState } from 'react';
import ExampleAnswerRevealDialog from '@/components/ExampleAnswerRevealDialog';
import type { HeyawakePuzzleData } from '../../puzzles/types';
import HeyawakeBoard from '../../puzzles/Heyawake/Heyawake';
import { getHeyawakeBoundarySegments } from '../../puzzles/Heyawake/utils';

interface Props extends HeyawakePuzzleData {
  correctSolution: (0 | 1)[][];
  playableLabel: string;
  answerLabel: string;
}

const CELL_SIZE = 42;
const BOARD_PADDING = 10;
const BOARD_BORDER = 4;

export default function HeyawakeExample({
  width,
  height,
  regionIds,
  clues,
  correctSolution,
  playableLabel,
  answerLabel,
}: Props) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [confirmSpoiler, setConfirmSpoiler] = useState(false);
  const [exampleStartTime] = useState(() => Date.now());

  const examplePuzzle = useMemo<HeyawakePuzzleData>(
    () => ({ type: 'heyawake', width, height, regionIds, clues }),
    [clues, height, regionIds, width]
  );
  const clueMap = useMemo(
    () => new Map(clues.map((clue) => [`${clue.row},${clue.col}`, clue.value])),
    [clues]
  );
  const boundaries = useMemo(
    () => getHeyawakeBoundarySegments(regionIds, width, height),
    [height, regionIds, width]
  );
  const boardWidth = width * CELL_SIZE;
  const boardHeight = height * CELL_SIZE;
  const outerWidth = boardWidth + BOARD_PADDING * 2 + BOARD_BORDER * 2;
  const outerHeight = boardHeight + BOARD_PADDING * 2 + BOARD_BORDER * 2;

  return (
    <>
      <div className="flex flex-col xl:flex-row gap-10 justify-center">
        <div className="flex flex-col items-center">
          <p className="text-base font-medium text-muted-foreground mb-4 dark:text-gray-400">
            {playableLabel}
          </p>
          <HeyawakeBoard
            key={`heyawake-example-${width}-${height}`}
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
                className="border-4 border-[#3f2a1e] bg-[#d2b48c] p-[10px] dark:border-gray-700 dark:bg-gray-800"
                style={{ width: `${outerWidth}px`, height: `${outerHeight}px` }}
              >
                <div
                  className="grid"
                  style={{ gridTemplateColumns: `repeat(${width}, ${CELL_SIZE}px)` }}
                >
                  {Array.from({ length: width * height }, (_, index) => (
                    <div
                      key={index}
                      className="bg-[#f8f1e3] dark:bg-gray-800"
                      style={{
                        width: `${CELL_SIZE}px`,
                        height: `${CELL_SIZE}px`,
                        boxShadow: 'inset 0 0 0 1px rgba(93, 64, 39, 0.28)',
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
                background: '#d2b48c',
                border: `${BOARD_BORDER}px solid #3f2a1e`,
                boxSizing: 'border-box',
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
                {correctSolution.flatMap((row, rowIndex) =>
                  row.map((isBlack, colIndex) => {
                    const clueValue = clueMap.get(`${rowIndex},${colIndex}`);
                    return (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className="flex items-center justify-center font-semibold"
                        style={{
                          width: `${CELL_SIZE}px`,
                          height: `${CELL_SIZE}px`,
                          background: isBlack ? '#3f2a1e' : '#f8f1e3',
                          color: isBlack ? '#ffffff' : '#3f2a1e',
                          boxShadow: 'inset 0 0 0 1px rgba(93, 64, 39, 0.28)',
                          fontSize: `${Math.max(18, Math.floor(CELL_SIZE * 0.56))}px`,
                          lineHeight: 1,
                        }}
                      >
                        {clueValue ?? ''}
                      </div>
                    );
                  })
                )}
              </div>

              <svg
                className="absolute top-0 left-0 pointer-events-none"
                width={outerWidth - BOARD_BORDER * 2}
                height={outerHeight - BOARD_BORDER * 2}
              >
                {boundaries.horizontal.map((segment) => {
                  const x1 = BOARD_PADDING + segment.col * CELL_SIZE;
                  const y = BOARD_PADDING + segment.row * CELL_SIZE;
                  const x2 = x1 + CELL_SIZE;
                  return (
                    <line
                      key={`h-${segment.row}-${segment.col}`}
                      x1={x1}
                      y1={y}
                      x2={x2}
                      y2={y}
                      stroke="#3f2a1e"
                      strokeWidth="3"
                      strokeLinecap="square"
                    />
                  );
                })}

                {boundaries.vertical.map((segment) => {
                  const x = BOARD_PADDING + segment.col * CELL_SIZE;
                  const y1 = BOARD_PADDING + segment.row * CELL_SIZE;
                  const y2 = y1 + CELL_SIZE;
                  return (
                    <line
                      key={`v-${segment.row}-${segment.col}`}
                      x1={x}
                      y1={y1}
                      x2={x}
                      y2={y2}
                      stroke="#3f2a1e"
                      strokeWidth="3"
                      strokeLinecap="square"
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
