import type { ShapeMinesweeperShape } from '../types';
import { boardLayoutMetrics, getBoardInventoryCellStyle } from '../boardTheme';

/**
 * The shape bank shown below the Shape Minesweeper board.  Shapes already
 * drawn on the board render in gray so the remaining pieces are visible at
 * a glance; shape letters are intentionally omitted.
 */
export default function ShapeInventory({
  shapes,
  cellSize = boardLayoutMetrics.inventoryCellSize,
  placedLabels,
}: {
  shapes: ShapeMinesweeperShape[];
  cellSize?: number;
  placedLabels?: ReadonlySet<string>;
}) {
  return (
    <div className="flex w-full min-w-0 max-w-full flex-wrap items-center justify-center gap-4">
      {shapes.map((shape, index) => {
        const placed = placedLabels?.has(shape.label) === true;
        return (
          <div
            key={`${shape.label}-${index}`}
            className="flex min-w-0 max-w-full items-center gap-2"
            aria-label={placed ? `shape ${shape.label} used` : `shape ${shape.label}`}
          >
            <div
              className="grid shrink-0"
              style={{
                gridTemplateColumns: `repeat(${shape.cells[0]?.length ?? 0}, ${cellSize}px)`,
                width: `${(shape.cells[0]?.length ?? 0) * cellSize}px`,
                height: `${shape.cells.length * cellSize}px`,
              }}
            >
              {shape.cells.flatMap((row, rowIndex) => row.map((occupied, colIndex) => (
                <span
                  key={`${rowIndex}-${colIndex}`}
                  style={{
                    width: `${cellSize}px`,
                    height: `${cellSize}px`,
                    ...getBoardInventoryCellStyle(occupied, placed),
                  }}
                />
              )))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
