import type { ReactNode } from 'react';
import {
  boardClassNames,
  commonBoardChrome,
  getBoardCellStyle,
  getBoardFrameDimensions,
  getBoardFrameStyle,
  getBoardGridStyle,
  getBoardTextStyle,
} from '@/puzzles/boardTheme';
import { ExampleCellSizeContext } from './exampleCellSizeContext';

/**
 * Shared style library for example boards.
 *
 * Every example (playable board and masked answer diagram) renders through
 * these primitives so a future puzzle type cannot reintroduce a fixed-size
 * overflow: the cell size is capped at the rule-diagram size on desktop and
 * shrinks with the available column width on narrow screens.
 */

/** Provide the responsive example cell size to every nested example board. */
export function ExampleCellSizeProvider({ cellSize, children }: { cellSize: number; children: ReactNode }) {
  return <ExampleCellSizeContext.Provider value={cellSize}>{children}</ExampleCellSizeContext.Provider>;
}

/** Shared wood-chrome frame for example boards, sized by the given cell size. */
export function ExampleBoardFrame({
  width,
  height,
  cellSize,
  outside,
  children,
}: {
  width: number;
  height: number;
  cellSize: number;
  outside?: { left?: number; right?: number; top?: number; bottom?: number };
  children: ReactNode;
}) {
  const { outerWidth, outerHeight } = getBoardFrameDimensions(width, height, cellSize, {
    outsideLeft: outside?.left ?? 0,
    outsideRight: outside?.right ?? 0,
    outsideTop: outside?.top ?? 0,
    outsideBottom: outside?.bottom ?? 0,
    borderWidth: commonBoardChrome.border,
    padding: commonBoardChrome.padding,
  });
  return (
    <div
      className="relative select-none"
      style={{
        width: `${outerWidth}px`,
        height: `${outerHeight}px`,
        ...getBoardFrameStyle(commonBoardChrome.border),
        maxWidth: 'none',
      }}
    >
      {children}
    </div>
  );
}

/** Shared example cell grid; renders plain `cell`-tone cells with themed text. */
export function ExampleCellGrid({
  width,
  height,
  cellSize,
  left = commonBoardChrome.padding,
  top = commonBoardChrome.padding,
  children,
}: {
  width: number;
  height: number;
  cellSize: number;
  left?: number;
  top?: number;
  children: (row: number, col: number) => ReactNode;
}) {
  return (
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
            {children(row, col)}
          </div>
        ))
      )}
    </div>
  );
}
