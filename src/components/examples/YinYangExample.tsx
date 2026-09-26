import { useExampleCellSize } from './exampleCellSizeContext';
import {
  boardClassNames,
  commonBoardChrome,
  getBoardCellColors,
  getBoardCenterMarkMetrics,
  getBoardFrameDimensions,
  getBoardFrameStyle,
  getBoardGridStyle,
  getBoardTextStyle,
  getCellDividerStyle,
  woodBoardTheme,
} from '@/puzzles/boardTheme';

interface Props {
  width: number;
  height: number;
  givens: (0 | 1 | null)[][];
  correctSolution: (0 | 1)[][];
}

/** Static Yin-Yang example diagram: givens plus the full answer circles. */
export default function YinYangExample({ width, height, givens, correctSolution }: Props) {
  const CELL_SIZE = useExampleCellSize();
  const { outerWidth, outerHeight } = getBoardFrameDimensions(width, height, CELL_SIZE);
  const { radius } = getBoardCenterMarkMetrics(CELL_SIZE);
  const center = CELL_SIZE / 2;

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
            const isGiven = given !== null;
            const isBlack = value === 1;

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={boardClassNames.touchCellContent}
                style={{
                  width: `${CELL_SIZE}px`,
                  height: `${CELL_SIZE}px`,
                  ...getBoardTextStyle(CELL_SIZE),
                  ...getBoardCellColors(isGiven ? 'clue' : 'cell'),
                  ...getCellDividerStyle(),
                }}
              >
                <svg
                  className="pointer-events-none absolute inset-0"
                  width={CELL_SIZE}
                  height={CELL_SIZE}
                  viewBox={`0 0 ${CELL_SIZE} ${CELL_SIZE}`}
                  aria-hidden="true"
                >
                  <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill={isBlack ? woodBoardTheme.border : 'none'}
                    stroke={woodBoardTheme.border}
                    strokeWidth={isBlack ? 0 : Math.max(1.5, radius * 0.18)}
                  />
                </svg>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
