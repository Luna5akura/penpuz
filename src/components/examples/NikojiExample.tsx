import { useMemo, useState } from 'react';
import ExampleAnswerReveal from '@/components/ExampleAnswerReveal';
import type { NikojiPuzzleData } from '../../puzzles/types';
import NikojiBoard from '../../puzzles/Nikoji/Nikoji';
import {
  boardClassNames,
  boardLayoutMetrics,
  commonBoardChrome,
  getBoardCellColors,
  getBoardFrameDimensions,
  getBoardRegionStrokeWidth,
  getBoardFrameStyle,
  getBoardGridStyle,
  getBoardTextStyle,
  getCellDividerStyle,
  woodBoardTheme,
} from '../../puzzles/boardTheme';
import { getNikojiBoundarySegments } from '../../puzzles/Nikoji/utils';

interface Props extends Omit<NikojiPuzzleData, 'type'> {
  solutionRegionIds: number[][];
  playableLabel: string;
  answerLabel: string;
}

const CELL_SIZE = boardLayoutMetrics.exampleCellSize;
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
  const [exampleStartTime] = useState(() => Date.now());

  const examplePuzzle = useMemo<NikojiPuzzleData>(
    () => ({ type: 'nikoji', width, height, letters }),
    [height, letters, width]
  );
  const boundaries = useMemo(
    () => getNikojiBoundarySegments(solutionRegionIds, width, height),
    [height, solutionRegionIds, width]
  );
  const { outerWidth, outerHeight } = getBoardFrameDimensions(
    width,
    height,
    CELL_SIZE,
    { borderWidth: commonBoardChrome.border, padding: BOARD_PADDING }
  );

  return (
    <>
      <div className="flex flex-col xl:flex-row gap-10 justify-center">
        <div className="flex flex-col items-center">
          <p className="mb-4 text-center text-base font-medium text-muted-foreground">
            {playableLabel}
          </p>
          <div className="w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain pb-1">
          <div className="mx-auto w-max min-w-0">
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
        </div>
        </div>

        <div className="flex flex-col items-center">
          <p className="mb-4 text-center text-base font-medium text-muted-foreground">
            {answerLabel}
          </p>
          <ExampleAnswerReveal
            visible={showAnswer}
            onVisibleChange={setShowAnswer}
            ariaLabel={answerLabel}
            className="flex justify-center overflow-x-auto"
          >
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
                style={getBoardGridStyle(BOARD_PADDING, BOARD_PADDING, width, CELL_SIZE)}
              >
                {letters.flatMap((row, r) =>
                  row.map((letter, c) => (
                    <div
                      key={`${r}-${c}`}
                      className={boardClassNames.cellContent}
                      style={{
                        width: `${CELL_SIZE}px`,
                        height: `${CELL_SIZE}px`,
                        ...getBoardCellColors(letter ? 'clue' : 'cell'),
                        ...getCellDividerStyle(),
                        ...getBoardTextStyle(CELL_SIZE, 0.54, 18),
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
                      strokeWidth={getBoardRegionStrokeWidth(CELL_SIZE)}
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
                      strokeWidth={getBoardRegionStrokeWidth(CELL_SIZE)}
                      strokeLinecap="butt"
                    />
                  );
                })}
              </svg>
            </div>
          </ExampleAnswerReveal>
        </div>
      </div>
    </>
  );
}
