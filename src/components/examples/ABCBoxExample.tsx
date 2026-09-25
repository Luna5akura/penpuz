import type { ReactNode } from 'react';
import {
  boardClassNames,
  commonBoardChrome,
  getBoardCellStyle,
  getBoardClueTextStyle,
  getBoardFrameStyle,
  getBoardGridStyle,
  getBoardTextStyle,
} from '@/puzzles/boardTheme';
import type { PuzzleExample } from '@/puzzles/types';
import { useExampleCellSize } from './exampleCellSizeContext';

interface Props {
  example: Extract<PuzzleExample, { puzzleType: 'abc-box' }>;
}

const BOARD_PADDING = commonBoardChrome.padding;
const BOARD_BORDER = commonBoardChrome.border;

/** Official answer diagram shown after the playable example is solved. */
export default function ABCBoxExample({ example }: Props) {
  const CELL_SIZE = useExampleCellSize();
  const { width, height, clues, givens, correctGrid } = example;
  const topRows = Math.max(0, ...clues.top.map((values) => values.length), ...clues.bottom.map((values) => values.length));
  const leftCols = Math.max(0, ...clues.left.map((values) => values.length), ...clues.right.map((values) => values.length));
  const boardWidth = (leftCols + width) * CELL_SIZE;
  const boardHeight = (topRows + height) * CELL_SIZE;
  const frameWidth = boardWidth + BOARD_PADDING * 2 + BOARD_BORDER * 2;
  const frameHeight = boardHeight + BOARD_PADDING * 2 + BOARD_BORDER * 2;
  const gridLeft = BOARD_PADDING + leftCols * CELL_SIZE;
  const gridTop = BOARD_PADDING + topRows * CELL_SIZE;

  const clueSpans: ReactNode[] = [];
  const renderClueSpan = (key: string, x: number, y: number, value: number | string) => (
    <span key={key} className="absolute flex items-center justify-center text-center tabular-nums" style={{ ...getBoardClueTextStyle(CELL_SIZE), left: x, top: y, width: CELL_SIZE, height: CELL_SIZE, display: 'flex', overflow: 'visible' }}>{value}</span>
  );
  clues.top.forEach((values, col) => {
    values.forEach((value, stack) => {
      if (value === null) return;
      clueSpans.push(renderClueSpan(`top-${col}-${stack}`, gridLeft + col * CELL_SIZE, BOARD_PADDING + (topRows - values.length + stack) * CELL_SIZE, value));
    });
  });
  clues.bottom.forEach((values, col) => {
    values.forEach((value, stack) => {
      if (value === null) return;
      clueSpans.push(renderClueSpan(`bottom-${col}-${stack}`, gridLeft + col * CELL_SIZE, gridTop + height * CELL_SIZE + stack * CELL_SIZE, value));
    });
  });
  clues.left.forEach((values, row) => {
    values.forEach((value, stack) => {
      if (value === null) return;
      clueSpans.push(renderClueSpan(`left-${row}-${stack}`, BOARD_PADDING + (leftCols - values.length + stack) * CELL_SIZE, gridTop + row * CELL_SIZE, value));
    });
  });
  clues.right.forEach((values, row) => {
    values.forEach((value, stack) => {
      if (value === null) return;
      clueSpans.push(renderClueSpan(`right-${row}-${stack}`, gridLeft + width * CELL_SIZE + stack * CELL_SIZE, gridTop + row * CELL_SIZE, value));
    });
  });

  return (
    <div className="flex justify-center overflow-x-auto">
      <div
        className="relative select-none"
        style={{ width: `${frameWidth}px`, height: `${frameHeight}px`, ...getBoardFrameStyle(BOARD_BORDER) }}
      >
        <div className="absolute grid" style={getBoardGridStyle(gridLeft, gridTop, width, CELL_SIZE)}>
          {Array.from({ length: height }, (_, row) =>
            Array.from({ length: width }, (_, col) => {
              const given = givens[row][col];
              const value = given ?? correctGrid[row][col] ?? '';
              return (
                <div
                  key={`${row}-${col}`}
                  className={boardClassNames.cellContent}
                  style={{
                    ...getBoardCellStyle(CELL_SIZE, given ? 'prefilled' : 'cell'),
                    ...getBoardTextStyle(CELL_SIZE),
                  }}
                >
                  {value}
                </div>
              );
            })
          )}
        </div>
        {clueSpans}
      </div>
    </div>
  );
}
