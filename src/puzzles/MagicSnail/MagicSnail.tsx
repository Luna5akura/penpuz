import { useCallback } from 'react';
import NumberPlacementBoard from '../shared/NumberPlacementBoard';
import type { MagicSnailPuzzleData } from '../types';
import { validateMagicSnail } from './utils';

interface Props {
  puzzle: MagicSnailPuzzleData;
  startTime: number;
  resetToken: number;
  onComplete: (time: number) => void;
  initialSnapshot?: unknown;
  onSnapshotChange?: (snapshot: unknown) => void;
  fixedCellSize?: number;
  showValidationMessage?: boolean;
}

export default function MagicSnailBoard({
  puzzle,
  startTime,
  resetToken,
  onComplete,
  initialSnapshot,
  onSnapshotChange,
  fixedCellSize,
  showValidationMessage,
}: Props) {
  const getFixedValue = useCallback(
    (row: number, col: number) => {
      const cell = puzzle.cells[row][col];
      return typeof cell === 'number' ? cell : null;
    },
    [puzzle.cells]
  );
  const isBlockedCell = useCallback(
    (row: number, col: number) => puzzle.cells[row][col] === 'block',
    [puzzle.cells]
  );

  return (
    <NumberPlacementBoard
      puzzle={puzzle}
      numbers={puzzle.numbers}
      startTime={startTime}
      resetToken={resetToken}
      onComplete={onComplete}
      validate={validateMagicSnail}
      getFixedValue={getFixedValue}
      isBlockedCell={isBlockedCell}
      initialSnapshot={initialSnapshot}
      onSnapshotChange={onSnapshotChange}
      fixedCellSize={fixedCellSize}
      showValidationMessage={showValidationMessage}
    />
  );
}

