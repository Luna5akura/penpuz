import BoardCellMark from '../shared/BoardCellMark';
import DirectionalArrowMark from '../shared/DirectionalArrowMark';
import type { FourWindsDirection } from '../types';

export type FourWindsMarkValue = FourWindsDirection | 'cross';

/** A centred arrow (or auxiliary cross) shared by the playable board, examples and replays. */
export default function FourWindsMark({ value, cellSize }: { value: FourWindsMarkValue; cellSize: number }) {
  if (value === 'cross') {
    return <BoardCellMark kind="cross" cellSize={cellSize} />;
  }

  return <DirectionalArrowMark direction={value} cellSize={cellSize} />;
}
