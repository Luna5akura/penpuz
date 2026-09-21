import { getDirectionalClueArrowStrokeWidth } from '../boardTheme';

const DIRECTION_ROTATIONS: Record<1 | 2 | 3 | 4, number> = {
  1: 0,
  2: 90,
  3: 180,
  4: 270,
};

/**
 * The canonical four-direction arrow drawn in the centre of a puzzle cell
 * (tail at the bottom, head at the top, rotated for E/S/W).  Shared by
 * Four Winds and Four Winds with Parks so both types render identical
 * arrows in the board, examples, notes and replays.
 */
export default function DirectionalArrowMark({
  direction,
  cellSize,
}: {
  direction: 1 | 2 | 3 | 4;
  cellSize: number;
}) {
  const center = cellSize / 2;
  const inset = cellSize * 0.17;
  const headBase = cellSize * 0.43;
  const headHalf = Math.max(3, cellSize * 0.16);
  const strokeWidth = getDirectionalClueArrowStrokeWidth(cellSize);
  const arrowHead = `${center},${inset} ${center - headHalf},${headBase} ${center + headHalf},${headBase}`;

  return (
    <svg
      className="pointer-events-none absolute inset-0"
      width={cellSize}
      height={cellSize}
      viewBox={`0 0 ${cellSize} ${cellSize}`}
      aria-hidden="true"
      focusable="false"
    >
      <g transform={`rotate(${DIRECTION_ROTATIONS[direction]} ${center} ${center})`}>
        <line
          x1={center}
          y1={cellSize - inset}
          x2={center}
          y2={headBase}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <polygon points={arrowHead} fill="currentColor" />
      </g>
    </svg>
  );
}
