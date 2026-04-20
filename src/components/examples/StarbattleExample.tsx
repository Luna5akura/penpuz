import { useMemo, useState } from 'react';
import ExampleAnswerRevealDialog from '@/components/ExampleAnswerRevealDialog';
import ExampleAnswerOverlay from '@/components/ExampleAnswerOverlay';
import { useI18n } from '@/i18n/useI18n';
import type { StarbattlePuzzleData } from '../../puzzles/types';
import StarbattleBoard from '../../puzzles/Starbattle/Starbattle';
import {
  commonBoardChrome,
  getBoardCellColors,
  getBoardFrameStyle,
  getCellDividerStyle,
  getOutlinedBorderStrokeWidth,
  woodBoardTheme,
} from '../../puzzles/boardTheme';
import { getStarbattleBoundarySegments } from '../../puzzles/Starbattle/utils';

interface Props extends StarbattlePuzzleData {
  starCells: { row: number; col: number }[];
  playableLabel: string;
  answerLabel: string;
}

const CELL_SIZE = 42;
const BOARD_PADDING = commonBoardChrome.padding;
const BOARD_BORDER = commonBoardChrome.border;

export default function StarbattleExample({
  width,
  height,
  starsPerUnit,
  regionIds,
  starCells,
  playableLabel,
  answerLabel,
}: Props) {
  const { copy } = useI18n();
  const [showAnswer, setShowAnswer] = useState(false);
  const [confirmSpoiler, setConfirmSpoiler] = useState(false);
  const [exampleStartTime] = useState(() => Date.now());

  const examplePuzzle = useMemo<StarbattlePuzzleData>(
    () => ({ type: 'starbattle', width, height, starsPerUnit, regionIds }),
    [height, regionIds, starsPerUnit, width]
  );
  const starSet = useMemo(() => new Set(starCells.map((cell) => `${cell.row},${cell.col}`)), [starCells]);
  const boundaries = useMemo(
    () => getStarbattleBoundarySegments(regionIds, width, height),
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
          <StarbattleBoard
            key={`starbattle-example-${width}-${height}`}
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
                      className="dark:bg-gray-800"
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
              <ExampleAnswerOverlay />
            </div>
          ) : (
            <div className="flex flex-col items-end gap-3">
              <div
                className="rounded-full px-3 py-1 text-sm font-semibold dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                style={{
                  border: `1px solid ${woodBoardTheme.accentBorder}`,
                  background: woodBoardTheme.accentFill,
                  color: woodBoardTheme.accentText,
                }}
              >
                {copy.shared.starbattleQuota(starsPerUnit)}
              </div>
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
                  {Array.from({ length: height }).flatMap((_, row) =>
                    Array.from({ length: width }).map((__, col) => (
                      <div
                        key={`${row}-${col}`}
                        className="flex items-center justify-center dark:bg-gray-800 dark:text-gray-100"
                        style={{
                          width: `${CELL_SIZE}px`,
                          height: `${CELL_SIZE}px`,
                          ...getBoardCellColors('cell'),
                          ...getCellDividerStyle(),
                        }}
                      >
                        {starSet.has(`${row},${col}`) ? (
                          <span style={{ fontSize: `${Math.floor(CELL_SIZE * 0.55)}px`, lineHeight: 1 }}>★</span>
                        ) : null}
                      </div>
                    ))
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
