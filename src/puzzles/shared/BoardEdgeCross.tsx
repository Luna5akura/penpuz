import {
  getLoopCrossSize,
  getLoopCrossStrokeWidth,
  woodBoardTheme,
} from '../boardTheme';

interface BoardEdgeCrossProps {
  /** Centre point of the cross in the parent SVG coordinate system. */
  x: number;
  y: number;
  /** Cell size controls the canonical cross length. */
  cellSize: number;
  color?: string;
}

/**
 * Canonical cross used on a cell boundary (Slitherlink style).
 *
 * Keep this separate from BoardCellMark: edge crosses and centre-cell marks
 * have different geometry, even though both are rendered as SVG lines.
 */
export default function BoardEdgeCross({
  x,
  y,
  cellSize,
  color = woodBoardTheme.border,
}: BoardEdgeCrossProps) {
  const size = getLoopCrossSize(cellSize);

  return (
    <g stroke={color} strokeWidth={getLoopCrossStrokeWidth()} strokeLinecap="round">
      <line x1={x - size} y1={y - size} x2={x + size} y2={y + size} />
      <line x1={x - size} y1={y + size} x2={x + size} y2={y - size} />
    </g>
  );
}
