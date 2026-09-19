import { getBoardCenterMarkMetrics, woodBoardTheme } from '../boardTheme';

export type BoardCellMarkKind = 'circle' | 'cross';

interface BoardCellMarkProps {
  kind: BoardCellMarkKind;
  cellSize: number;
  color?: string;
  /** Optional parent-SVG coordinates. When supplied, render a <g> mark. */
  x?: number;
  y?: number;
}

/**
 * The canonical large mark drawn in the centre of a puzzle cell.
 * Keep circle and cross marks vector-based so every puzzle uses the same
 * stroke, size, cap and clue-colour treatment.
 */
export default function BoardCellMark({
  kind,
  cellSize,
  color = woodBoardTheme.border,
  x,
  y,
}: BoardCellMarkProps) {
  const centerX = x ?? cellSize / 2;
  const centerY = y ?? cellSize / 2;
  const { radius, crossSize, strokeWidth } = getBoardCenterMarkMetrics(cellSize);

  const mark = kind === 'circle' ? (
    <circle
      cx={centerX}
      cy={centerY}
      r={radius}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
    />
  ) : (
    <g stroke={color} strokeWidth={strokeWidth} strokeLinecap="round">
      <line x1={centerX - crossSize} y1={centerY - crossSize} x2={centerX + crossSize} y2={centerY + crossSize} />
      <line x1={centerX - crossSize} y1={centerY + crossSize} x2={centerX + crossSize} y2={centerY - crossSize} />
    </g>
  );

  if (x !== undefined && y !== undefined) return mark;

  return (
    <svg
      className="pointer-events-none absolute inset-0"
      width={cellSize}
      height={cellSize}
      viewBox={`0 0 ${cellSize} ${cellSize}`}
      aria-hidden="true"
      focusable="false"
    >
      {mark}
    </svg>
  );
}
