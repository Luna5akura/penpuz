import { createContext, useContext } from 'react';
import { boardLayoutMetrics, getResponsiveCellSize } from '@/puzzles/boardTheme';
import { useBoardContainerWidth } from '@/puzzles/useBoardContainerWidth';

/**
 * Shared responsive cell-size plumbing for example boards: the playable
 * example measures its column and provides one size that both the playable
 * board and the masked answer diagram render with.
 */

export const ExampleCellSizeContext = createContext<number>(boardLayoutMetrics.exampleCellSize);

/**
 * The example cell size for the current board.  Reads the value provided by
 * PlayableExample; outside one it falls back to the rule-diagram size.
 */
export function useExampleCellSize() {
  return useContext(ExampleCellSizeContext);
}

/** Measure the available column width and derive the responsive example cell size. */
export function useResponsiveExampleCellSize(
  width: number,
  outsideClueSides = 0,
  maxCellSize: number = boardLayoutMetrics.exampleCellSize
) {
  const [containerRef, containerWidth] = useBoardContainerWidth();
  const cellSize = getResponsiveCellSize({
    viewportWidth: containerWidth,
    width,
    outsideClueSides,
    maxCellSize,
    containerWidth: true,
  });
  return { containerRef, cellSize };
}
