import { useExampleCellSize } from './exampleCellSizeContext';
import {
  boardClassNames,
  commonBoardChrome,
  getBoardCellStyle,
  getBoardFrameDimensions,
  getBoardFrameStyle,
  getBoardGridStyle,
  getBoardOutsideClueGutter,
  getBoardOutsideClueTextStyle,
  getBoardTextStyle,
} from '@/puzzles/boardTheme';

interface Props {
  width: number;
  height: number;
  rowClues: (number | null)[];
  colClues: (number | null)[];
  correctGrid: (0 | 1)[][];
}

const CLUE_GUTTER = getBoardOutsideClueGutter(CELL_SIZE, 2);

/** Official answer diagram shown after the playable example is solved. */
export default function PlaceByProductExample({ width, height, rowClues, colClues, correctGrid }: Props) {
  const CELL_SIZE = useExampleCellSize();
  const { outerWidth, outerHeight } = getBoardFrameDimensions(width, height, CELL_SIZE, {
    outsideLeft: CLUE_GUTTER,
    outsideTop: CLUE_GUTTER,
    borderWidth: commonBoardChrome.border,
    padding: commonBoardChrome.padding,
  });
  const gridLeft = commonBoardChrome.padding + CLUE_GUTTER;
  const gridTop = commonBoardChrome.padding + CLUE_GUTTER;

  return (
    <div
      className="relative select-none"
      style={{
        width: `${outerWidth}px`,
        height: `${outerHeight}px`,
        ...getBoardFrameStyle(),
      }}
    >
      <div className="absolute grid" style={getBoardGridStyle(gridLeft, gridTop, width, CELL_SIZE)}>
        {correctGrid.flatMap((row, rowIndex) =>
          row.map((value, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`flex items-center justify-center ${boardClassNames.cellText}`}
              style={{
                ...getBoardCellStyle(CELL_SIZE, value === 1 ? 'shaded' : 'cell'),
                ...getBoardTextStyle(CELL_SIZE),
              }}
            />
          ))
        )}
      </div>

      <div className="pointer-events-none absolute inset-0">
        {colClues.map((value, col) => (
          value === null ? null : (
            <span
              key={`top-${col}`}
              className={`absolute -translate-x-1/2 -translate-y-1/2 ${boardClassNames.cellText}`}
              style={{
                left: `${commonBoardChrome.padding + CLUE_GUTTER + (col + 0.5) * CELL_SIZE}px`,
                top: `${commonBoardChrome.padding + CLUE_GUTTER / 2}px`,
                ...getBoardOutsideClueTextStyle(CELL_SIZE, CELL_SIZE, value),
              }}
            >
              {value}
            </span>
          )
        ))}
        {rowClues.map((value, row) => (
          value === null ? null : (
            <span
              key={`left-${row}`}
              className={`absolute -translate-x-1/2 -translate-y-1/2 ${boardClassNames.cellText}`}
              style={{
                left: `${commonBoardChrome.padding + CLUE_GUTTER / 2}px`,
                top: `${commonBoardChrome.padding + CLUE_GUTTER + (row + 0.5) * CELL_SIZE}px`,
                ...getBoardOutsideClueTextStyle(CELL_SIZE, CLUE_GUTTER, value),
              }}
            >
              {value}
            </span>
          )
        ))}
      </div>
    </div>
  );
}
