import { getBoardSymbolFontSize } from '../boardTheme';

/** Ten vertices of a classic five-pointed star in a 100×100 view box. */
const STAR_POINTS = (() => {
  const points: string[] = [];
  for (let index = 0; index < 10; index++) {
    const radius = index % 2 === 0 ? 47 : 18;
    const angle = (Math.PI / 5) * index - Math.PI / 2;
    points.push(`${(50 + radius * Math.cos(angle)).toFixed(2)},${(50 + radius * Math.sin(angle)).toFixed(2)}`);
  }
  return points.join(' ');
})();

/**
 * A drawn star icon shared by the Star Battle board, its example answer and
 * the notes/replay thumbnails.  Sizes with the cell and inherits the cell's
 * ink colour through `currentColor`.
 */
export default function StarMark({ cellSize }: { cellSize: number }) {
  const span = Math.round(getBoardSymbolFontSize(cellSize) * 0.8);
  return (
    <svg
      className="pointer-events-none"
      width={span}
      height={span}
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
    >
      <polygon points={STAR_POINTS} fill="currentColor" />
    </svg>
  );
}
