import { useMemo, useState } from 'react';
import ExampleAnswerReveal from '@/components/ExampleAnswerReveal';
import type { AqrePuzzleData } from '../../puzzles/types';
import AqreBoard from '../../puzzles/Aqre/Aqre';
import {
  boardClassNames,
  boardLayoutMetrics,
  commonBoardChrome,
  getBoardCellColors,
  getBoardBoundaryStrokeMetrics,
  getBoardFrameStyle,
  getBoardTextStyle,
  getCellDividerStyle,
  woodBoardTheme,
} from '../../puzzles/boardTheme';
import { getAqreBoundarySegments } from '../../puzzles/Aqre/utils';

interface Props extends Omit<AqrePuzzleData, 'type'> {
  correctSolution: (0 | 1)[][];
  playableLabel: string;
  answerLabel: string;
}

const CELL_SIZE = boardLayoutMetrics.exampleCellSize;
const BOARD_PADDING = commonBoardChrome.padding;
const BOARD_BORDER = commonBoardChrome.border;

export default function AqreExample({
  width,
  height,
  regionIds,
  clues,
  correctSolution,
  playableLabel,
  answerLabel,
}: Props) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [exampleStartTime] = useState(() => Date.now());

  const examplePuzzle = useMemo<AqrePuzzleData>(
    () => ({ type: 'aqre', width, height, regionIds, clues }),
    [clues, height, regionIds, width]
  );
  const clueMap = useMemo(
    () => new Map(clues.map((clue) => [`${clue.row},${clue.col}`, clue.value])),
    [clues]
  );
  const boundaries = useMemo(
    () => getAqreBoundarySegments(regionIds, width, height),
    [height, regionIds, width]
  );
  const boardWidth = width * CELL_SIZE;
  const boardHeight = height * CELL_SIZE;
  const outerWidth = boardWidth + BOARD_PADDING * 2 + BOARD_BORDER * 2;
  const outerHeight = boardHeight + BOARD_PADDING * 2 + BOARD_BORDER * 2;
  const { strokeWidth: boundaryStroke, outlineWidth: boundaryOutlineStroke } = getBoardBoundaryStrokeMetrics(CELL_SIZE);

  return (
    <>
      <div className="flex flex-col xl:flex-row gap-10 justify-center">
        <div className="flex flex-col items-center">
          <p className="mb-4 text-center text-base font-medium text-muted-foreground">
            {playableLabel}
          </p>
          <AqreBoard
            key={`aqre-example-${width}-${height}`}
            puzzle={examplePuzzle}
            startTime={exampleStartTime}
            resetToken={0}
            onComplete={() => setShowAnswer(true)}
            fixedCellSize={CELL_SIZE}
            showValidationMessage
          />
        </div>

        <div className="flex flex-col items-center">
          <p className="mb-4 text-center text-base font-medium text-muted-foreground">
            {answerLabel}
          </p>
          <ExampleAnswerReveal
            visible={showAnswer}
            onVisibleChange={setShowAnswer}
            ariaLabel={answerLabel}
            className="relative"
          >
            {!showAnswer ? (
              <div
                style={{
                  width: `${outerWidth}px`,
                  height: `${outerHeight}px`,
                  padding: `${BOARD_PADDING}px`,
                  ...getBoardFrameStyle(BOARD_BORDER),
                }}
              >
                <div
                  className="grid"
                  style={{ gridTemplateColumns: `repeat(${width}, ${CELL_SIZE}px)` }}
                >
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
          ) : (
            <div
              className="relative"
              style={{
                width: `${outerWidth}px`,
                height: `${outerHeight}px`,
                ...getBoardFrameStyle(BOARD_BORDER),
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
                        className={boardClassNames.cellContent}
                        style={{
                          width: `${CELL_SIZE}px`,
                          height: `${CELL_SIZE}px`,
                          ...getBoardCellColors(isBlack ? 'playerShaded' : 'cell'),
                          ...getCellDividerStyle(),
                          ...getBoardTextStyle(CELL_SIZE),
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
                      key={`h-outline-${segment.row}-${segment.col}`}
                      x1={x1}
                      y1={y}
                      x2={x2}
                      y2={y}
                      stroke={woodBoardTheme.cell}
                      strokeWidth={boundaryOutlineStroke}
                      strokeLinecap="butt"
                    />
                  );
                })}

                {boundaries.vertical.map((segment) => {
                  const x = BOARD_PADDING + segment.col * CELL_SIZE;
                  const y1 = BOARD_PADDING + segment.row * CELL_SIZE;
                  const y2 = y1 + CELL_SIZE;
                  return (
                    <line
                      key={`v-outline-${segment.row}-${segment.col}`}
                      x1={x}
                      y1={y1}
                      x2={x}
                      y2={y2}
                      stroke={woodBoardTheme.cell}
                      strokeWidth={boundaryOutlineStroke}
                      strokeLinecap="butt"
                    />
                  );
                })}

                {boundaries.horizontal.map((segment) => {
                  const x1 = BOARD_PADDING + segment.col * CELL_SIZE;
                  const y = BOARD_PADDING + segment.row * CELL_SIZE;
                  const x2 = x1 + CELL_SIZE;
                  return (
                    <line
                      key={`h-stroke-${segment.row}-${segment.col}`}
                      x1={x1}
                      y1={y}
                      x2={x2}
                      y2={y}
                      stroke={woodBoardTheme.border}
                      strokeWidth={boundaryStroke}
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
                      key={`v-stroke-${segment.row}-${segment.col}`}
                      x1={x}
                      y1={y1}
                      x2={x}
                      y2={y2}
                      stroke={woodBoardTheme.border}
                      strokeWidth={boundaryStroke}
                      strokeLinecap="square"
                    />
                  );
                })}
              </svg>
            </div>
          )}
          </ExampleAnswerReveal>
        </div>
      </div>
    </>
  );
}
