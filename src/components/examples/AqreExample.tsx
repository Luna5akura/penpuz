import { useMemo, useState } from 'react';
import ExampleAnswerRevealDialog from '@/components/ExampleAnswerRevealDialog';
import type { AqrePuzzleData } from '../../puzzles/types';
import AqreBoard from '../../puzzles/Aqre/Aqre';
import {
  commonBoardChrome,
  getBoardCellColors,
  getBoardNumberFontSize,
  getCellDividerStyle,
  getOutlinedBorderStrokeWidth,
  woodBoardTheme,
} from '../../puzzles/boardTheme';
import { getAqreBoundarySegments } from '../../puzzles/Aqre/utils';

interface Props extends AqrePuzzleData {
  correctSolution: (0 | 1)[][];
  playableLabel: string;
  answerLabel: string;
}

const CELL_SIZE = 42;
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
  const [confirmSpoiler, setConfirmSpoiler] = useState(false);
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
  const boundaryStroke = 3;
  const boundaryOutlineStroke = getOutlinedBorderStrokeWidth(boundaryStroke);

  return (
    <>
      <div className="flex flex-col xl:flex-row gap-10 justify-center">
        <div className="flex flex-col items-center">
          <p className="text-base font-medium text-muted-foreground mb-4 dark:text-gray-400">
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
          <p className="text-base font-medium text-muted-foreground mb-4 dark:text-gray-400">
            {answerLabel}
          </p>
          {!showAnswer ? (
            <div
              onClick={() => setConfirmSpoiler(true)}
              className="relative cursor-pointer hover:opacity-90"
            >
              <div
                className="dark:border-gray-700 dark:bg-gray-800"
                style={{
                  width: `${outerWidth}px`,
                  height: `${outerHeight}px`,
                  border: `${BOARD_BORDER}px solid ${woodBoardTheme.border}`,
                  background: woodBoardTheme.frame,
                  padding: `${BOARD_PADDING}px`,
                  boxSizing: 'border-box',
                }}
              >
                <div
                  className="grid"
                  style={{ gridTemplateColumns: `repeat(${width}, ${CELL_SIZE}px)` }}
                >
                  {Array.from({ length: width * height }, (_, index) => (
                    <div
                      key={index}
                      className="dark:bg-gray-800"
                      style={{
                        width: `${CELL_SIZE}px`,
                        height: `${CELL_SIZE}px`,
                        background: woodBoardTheme.cell,
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
                background: woodBoardTheme.frame,
                border: `${BOARD_BORDER}px solid ${woodBoardTheme.border}`,
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
                        className="flex items-center justify-center font-semibold tabular-nums"
                        style={{
                          width: `${CELL_SIZE}px`,
                          height: `${CELL_SIZE}px`,
                          ...getBoardCellColors(isBlack ? 'playerShaded' : 'cell'),
                          ...getCellDividerStyle(),
                          fontSize: `${getBoardNumberFontSize(CELL_SIZE)}px`,
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
                    <g key={`h-${segment.row}-${segment.col}`}>
                      <line
                        x1={x1}
                        y1={y}
                        x2={x2}
                        y2={y}
                        stroke={woodBoardTheme.cell}
                        strokeWidth={boundaryOutlineStroke}
                        strokeLinecap="butt"
                      />
                      <line
                        x1={x1}
                        y1={y}
                        x2={x2}
                        y2={y}
                        stroke={woodBoardTheme.border}
                        strokeWidth={boundaryStroke}
                        strokeLinecap="square"
                      />
                    </g>
                  );
                })}

                {boundaries.vertical.map((segment) => {
                  const x = BOARD_PADDING + segment.col * CELL_SIZE;
                  const y1 = BOARD_PADDING + segment.row * CELL_SIZE;
                  const y2 = y1 + CELL_SIZE;
                  return (
                    <g key={`v-${segment.row}-${segment.col}`}>
                      <line
                        x1={x}
                        y1={y1}
                        x2={x}
                        y2={y2}
                        stroke={woodBoardTheme.cell}
                        strokeWidth={boundaryOutlineStroke}
                        strokeLinecap="butt"
                      />
                      <line
                        x1={x}
                        y1={y1}
                        x2={x}
                        y2={y2}
                        stroke={woodBoardTheme.border}
                        strokeWidth={boundaryStroke}
                        strokeLinecap="square"
                      />
                    </g>
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
