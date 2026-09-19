import { getDirectionalClueArrowStrokeWidth } from '../boardTheme';
import BoardCellMark from '../shared/BoardCellMark';
import type { FourWindsWithParksCellValue, FourWindsWithParksDirection } from '../types';

type ArrowValue = Exclude<FourWindsWithParksDirection, 0>;
export type FourWindsWithParksMarkValue = Exclude<FourWindsWithParksCellValue, null>;

const DIRECTION_ROTATIONS: Record<ArrowValue, number> = {
  1: 0,
  2: 90,
  3: 180,
  4: 270,
};

/** A centred vector mark shared by the playable board, examples and replays. */
export default function FourWindsWithParksMark({ value, cellSize }: { value: FourWindsWithParksMarkValue; cellSize: number }) {
  const center = cellSize / 2;

  // `0` is the legacy answer/snapshot representation for the park.  New
  // player snapshots use the explicit `circle` value so a circle can be
  // distinguished from an empty cell without overloading a direction.
  if (value === 0 || value === 'circle') {
    return <BoardCellMark kind="circle" cellSize={cellSize} />;
  }

  if (value === 'cross') {
    return <BoardCellMark kind="cross" cellSize={cellSize} />;
  }

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
      <g transform={`rotate(${DIRECTION_ROTATIONS[value]} ${center} ${center})`}>
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
