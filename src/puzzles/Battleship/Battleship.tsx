import { useCallback, useMemo } from 'react';
import ShadingBoard, { type ShadingCellState } from '../shared/ShadingBoard';
import { getCellKey } from '../gridUtils';
import type { BattleshipPuzzleData } from '../types';
import {
  getBattleshipOccupiedGrid,
  inferBattleshipSegment,
  isBattleshipSegmentResolved,
  validateBattleship,
} from './utils';
import {
  BattleshipFleet,
  BattleshipSegmentSymbol,
  BattleshipWaterSymbol,
} from './BattleshipVisuals';

interface Props {
  puzzle: BattleshipPuzzleData;
  startTime: number;
  resetToken: number;
  onComplete: (time: number) => void;
  initialSnapshot?: unknown;
  onSnapshotChange?: (snapshot: unknown) => void;
  fixedCellSize?: number;
  showValidationMessage?: boolean;
}

export default function BattleshipBoard({
  puzzle,
  startTime,
  resetToken,
  onComplete,
  initialSnapshot,
  onSnapshotChange,
  fixedCellSize,
  showValidationMessage,
}: Props) {
  const clueMap = useMemo(
    () => new Map(puzzle.cellClues.map((clue) => [getCellKey(clue.row, clue.col), clue])),
    [puzzle.cellClues]
  );
  const isLockedCell = useCallback(
    (row: number, col: number) => clueMap.has(getCellKey(row, col)),
    [clueMap]
  );

  return (
    <ShadingBoard
      puzzle={puzzle}
      startTime={startTime}
      resetToken={resetToken}
      onComplete={onComplete}
      validate={validateBattleship}
      initialSnapshot={initialSnapshot}
      onSnapshotChange={onSnapshotChange}
      fixedCellSize={fixedCellSize}
      showValidationMessage={showValidationMessage}
      outsideClues={{ top: puzzle.columnClues, left: puzzle.rowClues }}
      renderBoardAccessory={(cellSize) => (
        <BattleshipFleet fleet={puzzle.fleet} boardCellSize={cellSize} />
      )}
      isLockedCell={isLockedCell}
      getCellTone={(row, col, state) => {
        if (clueMap.has(getCellKey(row, col))) return 'clue';
        if (state === 2) return 'marked';
        return 'cell';
      }}
      renderCellContent={(row, col, state: ShadingCellState, cellSize, grid) => {
        const clue = clueMap.get(getCellKey(row, col));
        if (clue?.kind === 'water') return <BattleshipWaterSymbol cellSize={cellSize} />;

        const occupied = getBattleshipOccupiedGrid(grid, puzzle);
        if (clue?.kind === 'ship') {
          const segment = clue.segment ?? 'unknown';
          return (
            <BattleshipSegmentSymbol
              segment={segment}
              cellSize={cellSize}
              given
              neighbors={{
                top: occupied[row - 1]?.[col] === true,
                right: occupied[row]?.[col + 1] === true,
                bottom: occupied[row + 1]?.[col] === true,
                left: occupied[row]?.[col - 1] === true,
              }}
            />
          );
        }

        if (state !== 1) return undefined;
        return (
          <BattleshipSegmentSymbol
            segment={inferBattleshipSegment(occupied, row, col)}
            cellSize={cellSize}
            resolved={isBattleshipSegmentResolved(grid, puzzle, occupied, row, col)}
            neighbors={{
              top: occupied[row - 1]?.[col] === true,
              right: occupied[row]?.[col + 1] === true,
              bottom: occupied[row + 1]?.[col] === true,
              left: occupied[row]?.[col - 1] === true,
            }}
          />
        );
      }}
    />
  );
}
