import { useCallback } from 'react';
import NumberPlacementBoard, {
  type NumberPlacementCellValue,
} from '../shared/NumberPlacementBoard';
import type { NeighborPuzzleData } from '../types';
import {
  boardClassNames,
  getBoardTextStyle,
} from '../boardTheme';
import { validateNeighbor } from './utils';

interface Props {
  puzzle: NeighborPuzzleData;
  startTime: number;
  resetToken: number;
  onComplete: (time: number) => void;
  initialSnapshot?: unknown;
  onSnapshotChange?: (snapshot: unknown) => void;
  fixedCellSize?: number;
  showValidationMessage?: boolean;
}

const NEIGHBOR_NUMBERS = [1, 2, 3];
const NEIGHBOR_CYCLE: NumberPlacementCellValue[] = [null, 1, 2, 3];

/** Interactive board for the WPF 2015 Neighbors number-placement puzzle. */
export default function NeighborBoard({
  puzzle,
  startTime,
  resetToken,
  onComplete,
  initialSnapshot,
  onSnapshotChange,
  fixedCellSize,
  showValidationMessage = false,
}: Props) {
  const getFixedValue = useCallback(
    (row: number, col: number) => puzzle.givens[row]?.[col] ?? null,
    [puzzle.givens]
  );
  const getCellTone = useCallback(
    (row: number, col: number) => {
      if (puzzle.grayCells[row]?.[col] === true) return 'outlined' as const;
      if (getFixedValue(row, col) !== null) return 'clue' as const;
      return 'cell' as const;
    },
    [getFixedValue, puzzle.grayCells]
  );
  const validate = useCallback(
    (grid: (number | null)[][]) => {
      const result = validateNeighbor(grid, puzzle);
      return {
        ...result,
        badCells: result.badCells.map(({ r, c }) => ({ row: r, col: c })),
      };
    },
    [puzzle]
  );

  return (
    <div className="flex w-full min-w-0 flex-col items-center gap-3">
      <div className={`${boardClassNames.cellText} text-sm text-muted-foreground`}>
        1 · 2 · 3
      </div>
      <NumberPlacementBoard
        puzzle={puzzle}
        numbers={NEIGHBOR_NUMBERS}
        startTime={startTime}
        resetToken={resetToken}
        onComplete={onComplete}
        validate={validate}
        getFixedValue={getFixedValue}
        getCellTone={getCellTone}
        cycleValues={NEIGHBOR_CYCLE}
        cellInputMode="cycle"
        showValueButtons
        fixedCellSize={fixedCellSize}
        initialSnapshot={initialSnapshot}
        onSnapshotChange={onSnapshotChange}
        showValidationMessage={showValidationMessage}
        renderCellValue={(value, cellSize) => (
          <span style={getBoardTextStyle(cellSize, 0.68, 18)}>{value}</span>
        )}
      />
    </div>
  );
}

export { NeighborBoard };
