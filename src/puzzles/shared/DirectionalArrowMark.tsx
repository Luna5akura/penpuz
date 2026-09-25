import { boardTypography, getDirectionalClueArrowStrokeWidth, woodBoardTheme } from '../boardTheme';

const DIRECTION_ROTATIONS: Record<1 | 2 | 3 | 4, number> = {
  1: 0,
  2: 90,
  3: 180,
  4: 270,
};

export type DirectionalArrowVariant = 'full' | 'shaft' | 'head';

/**
 * The canonical four-direction arrow drawn in the centre of a puzzle cell
 * (tail at the bottom, head at the top, rotated for E/S/W).  Shared by
 * Four Winds and Four Winds with Parks so both types render identical
 * arrows in the board, examples, notes and replays.
 *
 * `shaft` draws only the straight line passing through the cell and `head`
 * draws the arrow whose tail reaches the cell edge, so a run of
 * same-direction cells renders as one continuous line with a single
 * arrowhead in its final cell.  `runLength` marks the starting cell of an
 * arrow longer than one cell with the arrow's length.
 */
export default function DirectionalArrowMark({
  direction,
  cellSize,
  variant = 'full',
  runLength,
}: {
  direction: 1 | 2 | 3 | 4;
  cellSize: number;
  variant?: DirectionalArrowVariant;
  runLength?: number;
}) {
  const center = cellSize / 2;
  const inset = cellSize * 0.17;
  const headBase = cellSize * 0.43;
  const headHalf = Math.max(3, cellSize * 0.16);
  const strokeWidth = getDirectionalClueArrowStrokeWidth(cellSize);
  const arrowHead = `${center},${inset} ${center - headHalf},${headBase} ${center + headHalf},${headBase}`;

  const shaftOnly = variant === 'shaft';
  const tailY = variant === 'head' ? cellSize : cellSize - inset;

  return (
    <>
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
            y1={shaftOnly ? 0 : tailY}
            x2={center}
            y2={shaftOnly ? cellSize : headBase}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap={variant === 'full' ? 'round' : 'butt'}
          />
          {!shaftOnly ? <polygon points={arrowHead} fill="currentColor" /> : null}
        </g>
      </svg>
      {runLength !== undefined && runLength > 1
        ? <ArrowRunLengthBadge length={runLength} cellSize={cellSize} />
        : null}
    </>
  );
}

/** Small centred badge on the arrow shaft showing the run length. */
function ArrowRunLengthBadge({ length, cellSize }: { length: number; cellSize: number }) {
  const center = cellSize / 2;
  const radius = Math.max(9, cellSize * 0.26);
  const fontSize = Math.max(11, Math.round(cellSize * 0.3));
  return (
    <svg
      className="pointer-events-none absolute inset-0"
      width={cellSize}
      height={cellSize}
      viewBox={`0 0 ${cellSize} ${cellSize}`}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx={center} cy={center} r={radius} fill={woodBoardTheme.cell} />
      <text
        x={center}
        y={center}
        textAnchor="middle"
        dominantBaseline="central"
        fill="currentColor"
        fontSize={fontSize}
        fontWeight={boardTypography.textWeight}
      >
        {length}
      </text>
    </svg>
  );
}
