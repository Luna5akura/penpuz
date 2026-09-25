import BoardCellMark from '../shared/BoardCellMark';
import DirectionalArrowMark, { type DirectionalArrowVariant } from '../shared/DirectionalArrowMark';
import type { FourWindsWithParksCellValue } from '../types';

export type FourWindsWithParksMarkValue = Exclude<FourWindsWithParksCellValue, null>;

/**
 * A centred vector mark shared by the playable board, examples and replays.
 * Arrow styling (run shafts, arrowheads and length badges) is identical to
 * Four Winds: both types use the shared DirectionalArrowMark style library.
 */
export default function FourWindsWithParksMark({
  value,
  cellSize,
  variant = 'full',
  runLength,
}: {
  value: FourWindsWithParksMarkValue;
  cellSize: number;
  variant?: DirectionalArrowVariant;
  runLength?: number;
}) {
  // `0` is the legacy answer/snapshot representation for the park.  New
  // player snapshots use the explicit `circle` value so a circle can be
  // distinguished from an empty cell without overloading a direction.
  if (value === 0 || value === 'circle') {
    return <BoardCellMark kind="circle" cellSize={cellSize} />;
  }

  if (value === 'cross') {
    return <BoardCellMark kind="cross" cellSize={cellSize} />;
  }

  return <DirectionalArrowMark direction={value} cellSize={cellSize} variant={variant} runLength={runLength} />;
}
