import BoardCellMark from '../shared/BoardCellMark';
import DirectionalArrowMark, { type DirectionalArrowVariant } from '../shared/DirectionalArrowMark';
import { boardTypography, woodBoardTheme } from '../boardTheme';
import type { FourWindsDirection } from '../types';

export type FourWindsMarkValue = FourWindsDirection | 'cross';

/**
 * A centred arrow (or auxiliary cross) shared by the playable board,
 * examples and replays.  `variant` controls how a cell of a same-direction
 * arrow run renders: `shaft` is the bare line through the cell and `head`
 * is the final cell carrying the arrowhead.  `runLength` marks the starting
 * cell of an arrow longer than one cell with the arrow's length.
 */
export default function FourWindsMark({
  value,
  cellSize,
  variant = 'full',
  runLength,
}: {
  value: FourWindsMarkValue;
  cellSize: number;
  variant?: DirectionalArrowVariant;
  runLength?: number;
}) {
  if (value === 'cross') {
    return <BoardCellMark kind="cross" cellSize={cellSize} />;
  }

  return (
    <>
      <DirectionalArrowMark direction={value} cellSize={cellSize} variant={variant} />
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
