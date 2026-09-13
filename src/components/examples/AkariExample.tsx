import { useMemo, useState } from 'react';
import ExampleAnswerReveal from '@/components/ExampleAnswerReveal';
import type { AkariPuzzleData } from '../../puzzles/types';
import AkariBoard from '../../puzzles/Akari/Akari';
import {
  boardClassNames,
  boardLayoutMetrics,
  commonBoardChrome,
  getBoardCellColors,
  getBoardSymbolDiameter,
  getBoardFrameStyle,
  getBoardTextStyle,
  getCellDividerStyle,
} from '../../puzzles/boardTheme';
import {
  createEmptyAkariGrid,
  getAkariIllumination,
  isAkariBlackCell,
} from '../../puzzles/Akari/utils';

interface Props extends Omit<AkariPuzzleData, 'type'> {
  bulbCells: { row: number; col: number }[];
  playableLabel: string;
  answerLabel: string;
}

const CELL_SIZE = boardLayoutMetrics.exampleCellSize;
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
  const bulbDiameter = getBoardSymbolDiameter(CELL_SIZE);
  const clueTextStyle = getBoardTextStyle(CELL_SIZE);

  return (
    <>
      <div className="flex flex-col xl:flex-row gap-10 justify-center">
        <div className="flex flex-col items-center">
          <p className="mb-4 text-center text-base font-medium text-muted-foreground">
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
            validationHighlightMode="example"
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
                {Array.from({ length: height }).flatMap((_, row) =>
                  Array.from({ length: width }).map((__, col) => {
                    const puzzleCell = cells[row][col];
                    const isBlack = isAkariBlackCell(puzzleCell);
                    const isBulb = bulbSet.has(`${row},${col}`);
                    const isLit = illumination.illuminated[row][col];

                    return (
                      <div
                        key={`${row}-${col}`}
                        className={boardClassNames.cellContent}
                        style={{
                          width: `${CELL_SIZE}px`,
                          height: `${CELL_SIZE}px`,
                          ...getBoardCellColors(
                            isBlack ? 'shaded' : isBulb ? 'brightLit' : isLit ? 'lit' : 'cell'
                          ),
                          ...getCellDividerStyle(),
                          ...clueTextStyle,
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
                                  background: getBoardCellColors('shaded').background,
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
          </ExampleAnswerReveal>
        </div>
      </div>
    </>
  );
}
