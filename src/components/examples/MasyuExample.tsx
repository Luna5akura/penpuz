import {
  boardClassNames,
  boardLayoutMetrics,
  commonBoardChrome,
  getBoardCellStyle,
  getBoardFrameDimensions,
  getBoardFrameStyle,
  getBoardGridStyle,
  getLoopLineStrokeWidth,
  woodBoardTheme,
} from '@/puzzles/boardTheme';
import { parseMasyuEdgeKey } from '@/puzzles/Masyu/utils';
import type { MasyuCell } from '@/puzzles/types';

interface Props {
  width: number;
  height: number;
  cells: MasyuCell[][];
  solutionEdges: string[];
}

const CELL_SIZE = boardLayoutMetrics.exampleCellSize;

/** Official answer diagram shown after the playable example is solved. */
export default function MasyuExample({ width, height, cells, solutionEdges }: Props) {
  const { outerWidth, outerHeight, boardWidth, boardHeight } = getBoardFrameDimensions(
    width,
    height,
    CELL_SIZE,
    { borderWidth: commonBoardChrome.border, padding: commonBoardChrome.padding }
  );
  const loopStroke = getLoopLineStrokeWidth(CELL_SIZE);

  const getCenter = (row: number, col: number) => ({
    x: col * CELL_SIZE + CELL_SIZE / 2,
    y: row * CELL_SIZE + CELL_SIZE / 2,
  });

  return (
    <div
      className="relative select-none"
      style={{
        width: `${outerWidth}px`,
        height: `${outerHeight}px`,
        ...getBoardFrameStyle(),
      }}
    >
      <div className="absolute grid" style={getBoardGridStyle(commonBoardChrome.padding, commonBoardChrome.padding, width, CELL_SIZE)}>
        {cells.flatMap((rowValues, row) =>
          rowValues.map((value, col) => (
            <div
              key={`${row}-${col}`}
              className={boardClassNames.cellContent}
              style={{ ...getBoardCellStyle(CELL_SIZE, 'cell') }}
            >
              {value !== 0 ? (
                <div
                  className="rounded-full"
                  style={{
                    width: '62%',
                    height: '62%',
                    background: value === 1 ? 'transparent' : woodBoardTheme.border,
                    border: `2px solid ${woodBoardTheme.border}`,
                    boxSizing: 'border-box',
                  }}
                />
              ) : null}
            </div>
          ))
        )}
      </div>

      <svg
        width={boardWidth}
        height={boardHeight}
        style={{
          position: 'absolute',
          top: `${commonBoardChrome.padding}px`,
          left: `${commonBoardChrome.padding}px`,
          pointerEvents: 'none',
          overflow: 'visible',
          zIndex: 2,
        }}
      >
        {solutionEdges.map((edgeKey) => {
          const edge = parseMasyuEdgeKey(edgeKey);
          if (!edge) return null;
          const from = getCenter(edge.r1, edge.c1);
          const to = getCenter(edge.r2, edge.c2);
          return (
            <line
              key={edgeKey}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={woodBoardTheme.ink}
              strokeWidth={loopStroke}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
    </div>
  );
}
