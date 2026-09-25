import {
  boardClassNames,
  commonBoardChrome,
  getBoardCellStyle,
  getBoardFrameDimensions,
  getBoardFrameStyle,
  getBoardGridStyle,
  getBoardTextStyle,
} from '@/puzzles/boardTheme';
import type { KakuroCell } from '@/puzzles/types';
import KakuroClue from '@/puzzles/Kakuro/KakuroClue';
import { useExampleCellSize } from './exampleCellSizeContext';

interface Props {
  width: number;
  height: number;
  cells: KakuroCell[][];
  correctGrid: (number | null)[][];
  cellSize?: number;
}

const BOARD_PADDING = commonBoardChrome.padding;
const BOARD_BORDER = commonBoardChrome.border;

/** Official answer diagram shown after the playable example is solved. */
export default function KakuroExample({ width, height, cells, correctGrid, cellSize: cellSizeProp }: Props) {
  const contextCellSize = useExampleCellSize();
  const cellSize = cellSizeProp ?? contextCellSize;
  const { outerWidth, outerHeight } = getBoardFrameDimensions(
    width,
    height,
    cellSize,
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
        style={getBoardGridStyle(BOARD_PADDING, BOARD_PADDING, width, cellSize)}
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
                  ...getBoardCellStyle(cellSize, clue ? 'shaded' : 'cell'),
                  ...getBoardTextStyle(cellSize),
                }}
              >
                {clue ? <KakuroClue right={clue.right} down={clue.down} cellSize={cellSize} /> : value}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
