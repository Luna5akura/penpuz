import { useExampleCellSize } from './exampleCellSizeContext';
import {
  boardClassNames,
  commonBoardChrome,
  getBoardCellColors,
  getBoardFrameDimensions,
  getBoardFrameStyle,
  getBoardGridStyle,
  getBoardTextStyle,
  getCellDividerStyle,
  woodBoardTheme,
} from '@/puzzles/boardTheme';
import type { KropkiDot } from '@/puzzles/types';

interface Props {
  width: number;
  height: number;
  givens: (number | null)[][];
  verticalDots: (KropkiDot | null)[][];
  horizontalDots: (KropkiDot | null)[][];
  correctSolution: number[][];
}

function ExampleDot({ dot, cellSize }: { dot: KropkiDot | null; cellSize: number }) {
  if (dot === null) return null;
  const radius = Math.max(3, cellSize * 0.09);
  const center = cellSize / 2;
  const strokeWidth = Math.max(1, radius * 0.28);
  if (dot === 'black') {
    return <circle cx={center} cy={center} r={radius} fill={woodBoardTheme.border} />;
  }
  const cross = radius * 0.55;
  return (
    <>
      <circle cx={center} cy={center} r={radius} fill="#fffdf9" stroke={woodBoardTheme.border} strokeWidth={strokeWidth} />
      {dot === 'either' ? (
        <g stroke={woodBoardTheme.border} strokeWidth={strokeWidth} strokeLinecap="round">
          <line x1={center - cross} y1={center - cross} x2={center + cross} y2={center + cross} />
          <line x1={center - cross} y1={center + cross} x2={center + cross} y2={center - cross} />
        </g>
      ) : null}
    </>
  );
}

/** Static Kropki example diagram: givens, dots and the full answer. */
export default function KropkiExample({ width, height, givens, verticalDots, horizontalDots, correctSolution }: Props) {
  const CELL_SIZE = useExampleCellSize();
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
            const given = givens[rowIndex][colIndex];
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={boardClassNames.touchCellContent}
                style={{
                  width: `${CELL_SIZE}px`,
                  height: `${CELL_SIZE}px`,
                  ...getBoardTextStyle(CELL_SIZE),
                  ...getBoardCellColors(given !== null ? 'clue' : 'cell'),
                  ...getCellDividerStyle(),
                }}
              >
                <span className={boardClassNames.cellText} style={getBoardTextStyle(CELL_SIZE, 0.66, 20)}>
                  {value}
                </span>
              </div>
            );
          })
        )}
      </div>
      <svg
        className="pointer-events-none absolute"
        style={{ left: commonBoardChrome.padding, top: commonBoardChrome.padding }}
        width={width * CELL_SIZE}
        height={height * CELL_SIZE}
        viewBox={`0 0 ${width * CELL_SIZE} ${height * CELL_SIZE}`}
        aria-hidden="true"
      >
        {verticalDots.flatMap((row, rowIndex) =>
          row.map((dot, colIndex) =>
            dot === null ? null : (
              <svg
                key={`v-${rowIndex}-${colIndex}`}
                x={(colIndex + 1) * CELL_SIZE - CELL_SIZE / 2}
                y={(rowIndex + 0.5) * CELL_SIZE - CELL_SIZE / 2}
                width={CELL_SIZE}
                height={CELL_SIZE}
                viewBox={`0 0 ${CELL_SIZE} ${CELL_SIZE}`}
              >
                <ExampleDot dot={dot} cellSize={CELL_SIZE} />
              </svg>
            )
          )
        )}
        {horizontalDots.flatMap((row, rowIndex) =>
          row.map((dot, colIndex) =>
            dot === null ? null : (
              <svg
                key={`h-${rowIndex}-${colIndex}`}
                x={(colIndex + 0.5) * CELL_SIZE - CELL_SIZE / 2}
                y={(rowIndex + 1) * CELL_SIZE - CELL_SIZE / 2}
                width={CELL_SIZE}
                height={CELL_SIZE}
                viewBox={`0 0 ${CELL_SIZE} ${CELL_SIZE}`}
              >
                <ExampleDot dot={dot} cellSize={CELL_SIZE} />
              </svg>
            )
          )
        )}
      </svg>
    </div>
  );
}
