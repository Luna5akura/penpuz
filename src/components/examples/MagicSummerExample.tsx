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
  woodBoardTheme,
} from '@/puzzles/boardTheme';
import type { MagicSummerCell } from '@/puzzles/types';
import BoardCellMark from '@/puzzles/shared/BoardCellMark';
import { useExampleCellSize } from './exampleCellSizeContext';

interface Props {
  width: number;
  height: number;
  cells: MagicSummerCell[][];
  rowSums: (number | null)[];
  columnSums: (number | null)[];
  correctGrid: (number | null)[][];
}

const CLUE_GUTTER = getBoardOutsideClueGutter(CELL_SIZE, 3);

function MagicSummerDiagram({
  width,
  height,
  cells,
  rowSums,
  columnSums,
  values,
}: {
  width: number;
  height: number;
  cells: MagicSummerCell[][];
  rowSums: (number | null)[];
  columnSums: (number | null)[];
  values?: (number | null)[][];
}) {
  const CELL_SIZE = useExampleCellSize();
  const clues = {
    top: columnSums,
    left: rowSums,
  };
  const { outerWidth, outerHeight } = getBoardFrameDimensions(
    width,
    height,
    CELL_SIZE,
    {
      outsideLeft: CLUE_GUTTER,
      outsideTop: CLUE_GUTTER,
      borderWidth: commonBoardChrome.border,
      padding: commonBoardChrome.padding,
    }
  );
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
      <div
        className="absolute grid"
        style={getBoardGridStyle(gridLeft, gridTop, width, CELL_SIZE)}
      >
        {cells.flatMap((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const value = values?.[rowIndex]?.[colIndex] ?? (typeof cell === 'number' ? cell : null);
            const isBlocked = cell === 'block';
            const tone = isBlocked
              ? 'marked'
              : typeof cell === 'number'
                ? 'prefilled'
                : 'cell';

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={boardClassNames.cellContent}
                style={{
                  ...getBoardCellStyle(CELL_SIZE, tone),
                  ...getBoardTextStyle(CELL_SIZE),
                }}
              >
                {isBlocked ? (
                  <BoardCellMark kind="cross" cellSize={CELL_SIZE} color={woodBoardTheme.darkCellText} />
                ) : value}
              </div>
            );
          })
        )}
      </div>

      <div className="pointer-events-none absolute inset-0">
        {clues.top.map((value, col) => (
          value === null ? null : (
            <span
              key={`top-${col}`}
              className={`absolute -translate-x-1/2 -translate-y-1/2 ${boardClassNames.cellText}`}
              style={{
                left: `${commonBoardChrome.padding + CLUE_GUTTER + (col + 0.5) * CELL_SIZE}px`,
                top: `${commonBoardChrome.padding + CLUE_GUTTER / 2}px`,
                color: woodBoardTheme.border,
                ...getBoardOutsideClueTextStyle(CELL_SIZE, CELL_SIZE, value),
              }}
            >
              {value}
            </span>
          )
        ))}
        {clues.left.map((value, row) => (
          value === null ? null : (
            <span
              key={`left-${row}`}
              className={`absolute -translate-x-1/2 -translate-y-1/2 ${boardClassNames.cellText}`}
              style={{
                left: `${commonBoardChrome.padding + CLUE_GUTTER / 2}px`,
                top: `${commonBoardChrome.padding + CLUE_GUTTER + (row + 0.5) * CELL_SIZE}px`,
                color: woodBoardTheme.border,
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

export default function MagicSummerExample({
  width,
  height,
  cells,
  rowSums,
  columnSums,
  correctGrid,
}: Props) {
  return <MagicSummerDiagram width={width} height={height} cells={cells} rowSums={rowSums} columnSums={columnSums} values={correctGrid} />;
}
