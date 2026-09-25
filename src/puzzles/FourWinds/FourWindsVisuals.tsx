import BoardCellMark from '../shared/BoardCellMark';
import DirectionalArrowMark, { type DirectionalArrowVariant } from '../shared/DirectionalArrowMark';
import type { FourWindsDirection } from '../types';

export type FourWindsMarkValue = FourWindsDirection | 'cross';

/**
 * A centred arrow (or auxiliary cross) shared by the playable board,
 * examples and replays.  `variant` controls how a cell of a same-direction
 * arrow run renders: `shaft` is the bare line through the cell and `head`
 * is the final cell carrying the arrowhead.
 */
export default function FourWindsMark({
  value,
  cellSize,
  variant = 'full',
}: {
  value: FourWindsMarkValue;
  cellSize: number;
  variant?: DirectionalArrowVariant;
}) {
  if (value === 'cross') {
    return <BoardCellMark kind="cross" cellSize={cellSize} />;
  }

  return <DirectionalArrowMark direction={value} cellSize={cellSize} variant={variant} />;
}
