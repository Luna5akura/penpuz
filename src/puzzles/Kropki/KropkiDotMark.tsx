import { getBoardCellColors, getBoardClueCircleMetrics, getKurarinClueColors } from '../boardTheme';
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
  return (
    <>
      <circle cx={center} cy={center} r={radius + outerRadiusOffset} fill={getBoardCellColors('cell').background} />
      <circle cx={center} cy={center} r={radius} fill={colors.fill} stroke={colors.stroke} strokeWidth={strokeWidth} />
    </>
  );
}
