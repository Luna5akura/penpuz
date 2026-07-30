import { useCallback } from 'react';
import NumberPlacementBoard from '../shared/NumberPlacementBoard';
import type { SlovakSumsPuzzleData } from '../types';
import { validateSlovakSums } from './utils';

interface Props {
  puzzle: SlovakSumsPuzzleData;
  startTime: number;
  resetToken: number;
  onComplete: (time: number) => void;
  initialSnapshot?: unknown;
  onSnapshotChange?: (snapshot: unknown) => void;
  fixedCellSize?: number;
  showValidationMessage?: boolean;
}

export default function SlovakSumsBoard({
  puzzle,
  startTime,
  resetToken,
  onComplete,
  initialSnapshot,
  onSnapshotChange,
  fixedCellSize,
  showValidationMessage,
}: Props) {
  const isBlockedCell = useCallback(
    (row: number, col: number) => puzzle.cells[row][col] !== null,
    [puzzle.cells]
  );

  return (
    <NumberPlacementBoard
      puzzle={puzzle}
      numbers={puzzle.numbers}
      startTime={startTime}
      resetToken={resetToken}
      onComplete={onComplete}
      validate={validateSlovakSums}
      isBlockedCell={isBlockedCell}
      renderBlockedCell={(row, col, cellSize) => {
        const clue = puzzle.cells[row][col];
        if (!clue) return null;

        return (
          <span
            className="flex flex-col items-center justify-center font-semibold tabular-nums"
            style={{
              fontSize: `${Math.max(11, Math.floor(cellSize * 0.28))}px`,
              lineHeight: 1.05,
            }}
          >
            <span>{clue.sum}</span>
            <span className="mt-0.5 border-t border-white/65 px-1 pt-0.5">{clue.count}</span>
          </span>
        );
      }}
      initialSnapshot={initialSnapshot}
      onSnapshotChange={onSnapshotChange}
      fixedCellSize={fixedCellSize}
      showValidationMessage={showValidationMessage}
    />
  );
}

