import {
  boardClassNames,
  boardLayoutMetrics,
  commonBoardChrome,
  getBoardCellStyle,
  getBoardClueTextStyle,
  getBoardFrameDimensions,
  getBoardFrameStyle,
  getBoardGridStyle,
  getBoardOutsideClueGutter,
  getBoardTextStyle,
} from '@/puzzles/boardTheme';
import type { SkyscrapersClues } from '@/puzzles/types';

interface Props {
  width: number;
  height: number;
  clues: SkyscrapersClues;
  correctGrid: number[][];
}

const CELL_SIZE = boardLayoutMetrics.exampleCellSize;
const CLUE_GUTTER = getBoardOutsideClueGutter(CELL_SIZE, 1);

function SkyscrapersDiagram({
  width,
  height,
  clues,
  values,
}: {
  width: number;
  height: number;
  clues: SkyscrapersClues;
  values?: number[][];
}) {
  const { outerWidth, outerHeight } = getBoardFrameDimensions(width, height, CELL_SIZE, {
    outsideLeft: CLUE_GUTTER,
    outsideRight: CLUE_GUTTER,
    outsideTop: CLUE_GUTTER,
    outsideBottom: CLUE_GUTTER,
    borderWidth: commonBoardChrome.border,
    padding: commonBoardChrome.padding,
  });
  const left = commonBoardChrome.padding + CLUE_GUTTER;
  const top = commonBoardChrome.padding + CLUE_GUTTER;

  return (
    <div
      className="relative select-none"
      style={{
        width: `${outerWidth}px`,
        height: `${outerHeight}px`,
        ...getBoardFrameStyle(),
        maxWidth: 'none',
      }}
    >
      <div
        className="absolute grid"
        style={getBoardGridStyle(left, top, width, CELL_SIZE)}
      >
        {Array.from({ length: height }, (_, row) =>
          Array.from({ length: width }, (_, col) => (
            <div
              key={`${row}-${col}`}
              className={boardClassNames.cellContent}
              style={{
                ...getBoardCellStyle(CELL_SIZE, 'cell'),
                ...getBoardTextStyle(CELL_SIZE),
              }}
            >
              {values?.[row]?.[col] ?? null}
            </div>
          ))
        )}
      </div>

      <div className="pointer-events-none absolute inset-0">
        {clues.top.map((value, col) => (
          value === null ? null : (
            <span
              key={`top-${col}`}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${left + (col + 0.5) * CELL_SIZE}px`,
                top: `${commonBoardChrome.padding + CLUE_GUTTER / 2}px`,
                ...getBoardClueTextStyle(CELL_SIZE),
              }}
            >
              {value}
            </span>
          )
        ))}
        {clues.bottom.map((value, col) => (
          value === null ? null : (
            <span
              key={`bottom-${col}`}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${left + (col + 0.5) * CELL_SIZE}px`,
                top: `${top + height * CELL_SIZE + CLUE_GUTTER / 2}px`,
                ...getBoardClueTextStyle(CELL_SIZE),
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
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${commonBoardChrome.padding + CLUE_GUTTER / 2}px`,
                top: `${top + (row + 0.5) * CELL_SIZE}px`,
                ...getBoardClueTextStyle(CELL_SIZE),
              }}
            >
              {value}
            </span>
          )
        ))}
        {clues.right.map((value, row) => (
          value === null ? null : (
            <span
              key={`right-${row}`}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${left + width * CELL_SIZE + CLUE_GUTTER / 2}px`,
                top: `${top + (row + 0.5) * CELL_SIZE}px`,
                ...getBoardClueTextStyle(CELL_SIZE),
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

export default function SkyscrapersExample({
  width,
  height,
  clues,
  correctGrid,
}: Props) {
  return <SkyscrapersDiagram width={width} height={height} clues={clues} values={correctGrid} />;
}
