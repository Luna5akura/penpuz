import { useMemo } from 'react';
import {
  boardClassNames,
  boardLayoutMetrics,
  commonBoardChrome,
  getBoardBoundaryStrokeWidth,
  getBoardCellStyle,
  getBoardFrameDimensions,
  getBoardFrameStyle,
  getBoardGridStyle,
  getBoardTextStyle,
  woodBoardTheme,
} from '@/puzzles/boardTheme';
import { getFillominoAutoBoundaryLines } from '@/puzzles/Fillomino/utils';

interface Props {
  width: number;
  height: number;
  cluesGrid: (number | null)[][];
  correctGrid: (number | null)[][];
}

const CELL_SIZE = boardLayoutMetrics.exampleCellSize;
const BOARD_PADDING = commonBoardChrome.padding;
const BOARD_BORDER = commonBoardChrome.border;

const alignStrokeCoordinate = (coordinate: number, strokeWidth: number) => (
  strokeWidth % 2 === 1 ? coordinate + 0.5 : coordinate
);

/** Official answer diagram shown after the playable example is solved. */
export default function FillominoExample({ width, height, cluesGrid, correctGrid }: Props) {
  const autoThinLines = useMemo(
    () => getFillominoAutoBoundaryLines(correctGrid, width, height),
    [correctGrid, height, width]
  );
  const { boardWidth, boardHeight, outerWidth, outerHeight } = getBoardFrameDimensions(
    width,
    height,
    CELL_SIZE,
    { borderWidth: BOARD_BORDER, padding: BOARD_PADDING }
  );
  const boundaryStrokeWidth = getBoardBoundaryStrokeWidth(CELL_SIZE);

  return (
    <div
      className="mx-auto select-none"
      style={{
        position: 'relative',
        width: `${outerWidth}px`,
        height: `${outerHeight}px`,
        ...getBoardFrameStyle(BOARD_BORDER),
      }}
    >
      <div
        className="grid"
        style={getBoardGridStyle(BOARD_PADDING, BOARD_PADDING, width, CELL_SIZE)}
      >
        {correctGrid.flatMap((row, r) =>
          row.map((val, c) => {
            const clue = cluesGrid[r][c];
            return (
              <div
                key={`${r}-${c}`}
                className={`flex items-center justify-center ${boardClassNames.cellText}`}
                style={{
                  ...getBoardCellStyle(CELL_SIZE, clue !== null ? 'clue' : 'cell'),
                  ...getBoardTextStyle(CELL_SIZE),
                }}
              >
                {val ?? clue ?? ''}
              </div>
            );
          })
        )}
      </div>

      <svg
        width={boardWidth}
        height={boardHeight}
        style={{
          position: 'absolute',
          top: `${BOARD_PADDING}px`,
          left: `${BOARD_PADDING}px`,
          pointerEvents: 'none',
          overflow: 'visible',
          zIndex: 10,
        }}
        shapeRendering="crispEdges"
      >
        {Array.from({ length: height }, (_, r) =>
          Array.from({ length: width - 1 }, (_, c) => {
            const key = `h-${r}-${c}`;
            if (!autoThinLines.has(key)) return null;
            const x = alignStrokeCoordinate((c + 1) * CELL_SIZE, boundaryStrokeWidth);
            return (
              <line
                key={`edge-v-${r}-${c}`}
                x1={x}
                y1={r * CELL_SIZE}
                x2={x}
                y2={(r + 1) * CELL_SIZE}
                stroke={woodBoardTheme.accentBorder}
                strokeWidth={boundaryStrokeWidth}
                strokeLinecap="butt"
              />
            );
          })
        )}
        {Array.from({ length: height - 1 }, (_, r) =>
          Array.from({ length: width }, (_, c) => {
            const key = `v-${r}-${c}`;
            if (!autoThinLines.has(key)) return null;
            const y = alignStrokeCoordinate((r + 1) * CELL_SIZE, boundaryStrokeWidth);
            return (
              <line
                key={`edge-h-${r}-${c}`}
                x1={c * CELL_SIZE}
                y1={y}
                x2={(c + 1) * CELL_SIZE}
                y2={y}
                stroke={woodBoardTheme.accentBorder}
                strokeWidth={boundaryStrokeWidth}
                strokeLinecap="butt"
              />
            );
          })
        )}
      </svg>
    </div>
  );
}
