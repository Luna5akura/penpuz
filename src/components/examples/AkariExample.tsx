import { useMemo, useState } from 'react';
import ExampleAnswerRevealDialog from '@/components/ExampleAnswerRevealDialog';
import type { AkariPuzzleData } from '../../puzzles/types';
import AkariBoard from '../../puzzles/Akari/Akari';
import {
  commonBoardChrome,
  getBoardCellColors,
  getBoardNumberFontSize,
  getCellDividerStyle,
  woodBoardTheme,
} from '../../puzzles/boardTheme';
import {
  createEmptyAkariGrid,
  getAkariIllumination,
  isAkariBlackCell,
} from '../../puzzles/Akari/utils';

interface Props extends AkariPuzzleData {
  bulbCells: { row: number; col: number }[];
  playableLabel: string;
  answerLabel: string;
}

const CELL_SIZE = 42;
const BOARD_PADDING = commonBoardChrome.padding;
const BOARD_BORDER = commonBoardChrome.border;

export default function AkariExample({
  width,
  height,
  cells,
  bulbCells,
  playableLabel,
  answerLabel,
}: Props) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [confirmSpoiler, setConfirmSpoiler] = useState(false);
  const [exampleStartTime] = useState(() => Date.now());

  const examplePuzzle = useMemo<AkariPuzzleData>(
    () => ({ type: 'akari', width, height, cells }),
    [cells, height, width]
  );
  const solvedGrid = useMemo(() => {
    const nextGrid = createEmptyAkariGrid(width, height);
    for (const bulb of bulbCells) {
      nextGrid[bulb.row][bulb.col] = 1;
    }
    return nextGrid;
  }, [bulbCells, height, width]);
  const illumination = useMemo(
    () => getAkariIllumination(solvedGrid, examplePuzzle),
    [examplePuzzle, solvedGrid]
  );
  const bulbSet = useMemo(() => new Set(bulbCells.map((cell) => `${cell.row},${cell.col}`)), [bulbCells]);
  const boardWidth = width * CELL_SIZE;
  const boardHeight = height * CELL_SIZE;
  const outerWidth = boardWidth + BOARD_PADDING * 2 + BOARD_BORDER * 2;
  const outerHeight = boardHeight + BOARD_PADDING * 2 + BOARD_BORDER * 2;
  const bulbDiameter = Math.max(20, Math.floor(CELL_SIZE * 0.8));
  const clueFontSize = getBoardNumberFontSize(CELL_SIZE);

  return (
    <>
      <div className="flex flex-col xl:flex-row gap-10 justify-center">
        <div className="flex flex-col items-center">
          <p className="text-base font-medium text-muted-foreground mb-4 dark:text-gray-400">
            {playableLabel}
          </p>
          <AkariBoard
            key={`akari-example-${width}-${height}`}
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
                {Array.from({ length: height }).flatMap((_, row) =>
                  Array.from({ length: width }).map((__, col) => {
                    const puzzleCell = cells[row][col];
                    const isBlack = isAkariBlackCell(puzzleCell);
                    const isBulb = bulbSet.has(`${row},${col}`);
                    const isLit = illumination.illuminated[row][col];

                    return (
                      <div
                        key={`${row}-${col}`}
                        className="flex items-center justify-center font-semibold tabular-nums"
                        style={{
                          width: `${CELL_SIZE}px`,
                          height: `${CELL_SIZE}px`,
                          ...getBoardCellColors(
                            isBlack ? 'shaded' : isBulb ? 'brightLit' : isLit ? 'lit' : 'cell'
                          ),
                          ...getCellDividerStyle(),
                          fontSize: `${clueFontSize}px`,
                          lineHeight: 1,
                        }}
                      >
                        {typeof puzzleCell === 'number'
                          ? puzzleCell
                          : !isBlack && isBulb
                            ? (
                              <span
                                aria-hidden="true"
                                style={{
                                width: `${bulbDiameter}px`,
                                height: `${bulbDiameter}px`,
                                borderRadius: '9999px',
                                  background: woodBoardTheme.shaded,
                                  display: 'block',
                                }}
                              />
                            )
                            : null}
                      </div>
                    );
                  })
                )}
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
