import {
  boardClassNames,
  boardLayoutMetrics,
  commonBoardChrome,
  getBoardCellColors,
  getBoardFrameDimensions,
  getBoardFrameStyle,
  getBoardGridStyle,
  getBoardTextStyle,
  getCellDividerStyle,
} from '@/puzzles/boardTheme';
import type { TapaClue } from '@/puzzles/types';
import TapaClueView from '@/puzzles/Tapa/TapaClue';

interface Props {
  width: number;
  height: number;
  clues: (TapaClue | null)[][];
  correctSolution: (0 | 1)[][];
}

const CELL_SIZE = boardLayoutMetrics.loopExampleCellSize;

/** Official answer diagram shown after the playable example is solved. */
export default function TapaExample({ width, height, clues, correctSolution }: Props) {
  const { outerWidth, outerHeight } = getBoardFrameDimensions(width, height, CELL_SIZE);

  return (
    <div
      className="relative select-none"
      style={{
        width: `${outerWidth}px`,
        height: `${outerHeight}px`,
        ...getBoardFrameStyle(commonBoardChrome.border),
      }}
    >
      <div className="grid" style={getBoardGridStyle(commonBoardChrome.padding, commonBoardChrome.padding, width, CELL_SIZE)}>
        {correctSolution.flatMap((row, rowIndex) =>
          row.map((value, colIndex) => {
            const clue = clues[rowIndex][colIndex];
            const isClue = clue !== null;
            const isShaded = value === 1;

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={boardClassNames.touchCellContent}
                style={{
                  width: `${CELL_SIZE}px`,
                  height: `${CELL_SIZE}px`,
                  ...getBoardTextStyle(CELL_SIZE),
                  ...getBoardCellColors(isClue ? 'clue' : isShaded ? 'playerShaded' : 'cell'),
                  ...getCellDividerStyle(),
                }}
              >
                {isClue ? <TapaClueView clue={clue} cellSize={CELL_SIZE} /> : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
