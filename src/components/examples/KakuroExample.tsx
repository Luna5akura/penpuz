import {
  boardClassNames,
  boardLayoutMetrics,
  commonBoardChrome,
  getBoardCellStyle,
  getBoardFrameDimensions,
  getBoardFrameStyle,
  getBoardGridStyle,
  getBoardTextStyle,
} from '@/puzzles/boardTheme';
import type { KakuroCell } from '@/puzzles/types';
import KakuroClue from '@/puzzles/Kakuro/KakuroClue';

interface Props {
  width: number;
  height: number;
  cells: KakuroCell[][];
  correctGrid: (number | null)[][];
}

const CELL_SIZE = boardLayoutMetrics.exampleCellSize;
const BOARD_PADDING = commonBoardChrome.padding;
const BOARD_BORDER = commonBoardChrome.border;

/** Official answer diagram shown after the playable example is solved. */
export default function KakuroExample({ width, height, cells, correctGrid }: Props) {
  const { outerWidth, outerHeight } = getBoardFrameDimensions(
    width,
    height,
    CELL_SIZE,
    { borderWidth: BOARD_BORDER, padding: BOARD_PADDING }
  );

  return (
    <div
      className="relative select-none"
      style={{
        width: `${outerWidth}px`,
        height: `${outerHeight}px`,
        ...getBoardFrameStyle(BOARD_BORDER),
      }}
    >
      <div
        className="absolute grid"
        style={getBoardGridStyle(BOARD_PADDING, BOARD_PADDING, width, CELL_SIZE)}
      >
        {Array.from({ length: height }, (_, row) =>
          Array.from({ length: width }, (_, col) => {
            const clue = cells[row][col];
            const value = correctGrid[row][col];
            return (
              <div
                key={`${row}-${col}`}
                className={boardClassNames.cellContent}
                style={{
                  ...getBoardCellStyle(CELL_SIZE, clue ? 'shaded' : 'cell'),
                  ...getBoardTextStyle(CELL_SIZE),
                }}
              >
                {clue ? <KakuroClue right={clue.right} down={clue.down} cellSize={CELL_SIZE} /> : value}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
