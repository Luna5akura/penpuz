import { getBoardCellColors, getBoardClueCircleMetrics, getKurarinClueColors, woodBoardTheme } from '../boardTheme';
import type { KropkiDot } from '../types';

/**
 * Dot drawn on a Kropki edge.  Uses the same style library as the Kurarin
 * clue dots: proportional radius and stroke from getBoardClueCircleMetrics,
 * a cell-tone halo to separate the dot from grid lines, and the same
 * fill/stroke colours.
 */
export default function KropkiDotMark({ dot, cellSize }: { dot: KropkiDot | null; cellSize: number }) {
  if (dot === null) return null;
  const { radius, strokeWidth, outerRadiusOffset } = getBoardClueCircleMetrics(cellSize);
  const center = cellSize / 2;
  const colors = dot === 'black' ? getKurarinClueColors('black') : getKurarinClueColors('white');
  const cross = radius * 0.55;
  return (
    <>
      <circle cx={center} cy={center} r={radius + outerRadiusOffset} fill={getBoardCellColors('cell').background} />
      <circle cx={center} cy={center} r={radius} fill={colors.fill} stroke={colors.stroke} strokeWidth={strokeWidth} />
      {dot === 'either' ? (
        <g stroke={woodBoardTheme.neutralInk} strokeWidth={strokeWidth} strokeLinecap="round">
          <line x1={center - cross} y1={center - cross} x2={center + cross} y2={center + cross} />
          <line x1={center - cross} y1={center + cross} x2={center + cross} y2={center - cross} />
        </g>
      ) : null}
    </>
  );
}
