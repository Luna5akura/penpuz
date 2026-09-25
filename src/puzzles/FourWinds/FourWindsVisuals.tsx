import BoardCellMark from '../shared/BoardCellMark';
import DirectionalArrowMark, { type DirectionalArrowVariant } from '../shared/DirectionalArrowMark';
import type { FourWindsDirection } from '../types';

export type FourWindsMarkValue = FourWindsDirection | 'cross';

/**
 * A centred arrow (or auxiliary cross) shared by the playable board,
 * examples and replays.  Arrow styling (run shafts, arrowheads and length
 * badges) lives in the shared DirectionalArrowMark style library.
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

  return <DirectionalArrowMark direction={value} cellSize={cellSize} variant={variant} runLength={runLength} />;
}
