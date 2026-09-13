import { getBoardCellOutlineStyle } from '../boardTheme';

/**
 * The visual marker for a gray/outlined cell.
 *
 * Keep this as a small shared component instead of allowing each puzzle to
 * choose its own inset, stroke, or shadow.  It is deliberately pointer-free
 * so it can be placed over both editable and read-only cells.
 */
export default function BoardCellOutline({ cellSize }: { cellSize: number }) {
  return <span aria-hidden="true" style={getBoardCellOutlineStyle(cellSize)} />;
}

export { BoardCellOutline };
