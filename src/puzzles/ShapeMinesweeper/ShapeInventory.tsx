import type { ShapeMinesweeperShape } from '../types';
import { boardClassNames, boardLayoutMetrics, getBoardInventoryCellStyle, getBoardTextStyle } from '../boardTheme';

export default function ShapeInventory({
  shapes,
  cellSize = boardLayoutMetrics.inventoryCellSize,
}: {
  shapes: ShapeMinesweeperShape[];
  cellSize?: number;
}) {
  return (
    <div className="flex max-w-full flex-wrap items-center justify-center gap-4">
      {shapes.map((shape, index) => (
        <div key={`${shape.label}-${index}`} className="flex items-center gap-2" aria-label={shape.label}>
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
                  ...getBoardInventoryCellStyle(occupied),
                }}
              />
            )))}
          </div>
          <span className={boardClassNames.cellText} style={getBoardTextStyle(cellSize, 0.7, 12)}>{shape.label}</span>
        </div>
      ))}
    </div>
  );
}
