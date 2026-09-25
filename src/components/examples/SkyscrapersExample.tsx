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
  cellSize?: number;
}

function SkyscrapersDiagram({
  width,
  height,
  clues,
  values,
  cellSize,
}: {
  width: number;
  height: number;
  clues: SkyscrapersClues;
  values?: number[][];
  cellSize: number;
}) {
  const clueGutter = getBoardOutsideClueGutter(cellSize, 1);
  const { outerWidth, outerHeight } = getBoardFrameDimensions(width, height, cellSize, {
    outsideLeft: clueGutter,
    outsideRight: clueGutter,
    outsideTop: clueGutter,
    outsideBottom: clueGutter,
    borderWidth: commonBoardChrome.border,
    padding: commonBoardChrome.padding,
  });
  const left = commonBoardChrome.padding + clueGutter;
  const top = commonBoardChrome.padding + clueGutter;

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
        style={getBoardGridStyle(left, top, width, cellSize)}
      >
        {Array.from({ length: height }, (_, row) =>
          Array.from({ length: width }, (_, col) => (
            <div
              key={`${row}-${col}`}
              className={boardClassNames.cellContent}
              style={{
                ...getBoardCellStyle(cellSize, 'cell'),
                ...getBoardTextStyle(cellSize),
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
                left: `${left + (col + 0.5) * cellSize}px`,
                top: `${commonBoardChrome.padding + clueGutter / 2}px`,
                ...getBoardClueTextStyle(cellSize),
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
                left: `${left + (col + 0.5) * cellSize}px`,
                top: `${top + height * cellSize + clueGutter / 2}px`,
                ...getBoardClueTextStyle(cellSize),
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
                left: `${commonBoardChrome.padding + clueGutter / 2}px`,
                top: `${top + (row + 0.5) * cellSize}px`,
                ...getBoardClueTextStyle(cellSize),
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
                left: `${left + width * cellSize + clueGutter / 2}px`,
                top: `${top + (row + 0.5) * cellSize}px`,
                ...getBoardClueTextStyle(cellSize),
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
  cellSize = boardLayoutMetrics.exampleCellSize,
}: Props) {
  return <SkyscrapersDiagram width={width} height={height} clues={clues} values={correctGrid} cellSize={cellSize} />;
}
