import { useCallback, useMemo } from 'react';
import ShadingBoard, { type ShadingCellState } from '../shared/ShadingBoard';
import type { LakesPuzzleData } from '../types';
import { getCellKey } from '../gridUtils';
import { getBoardNumberFontSize, woodBoardTheme } from '../boardTheme';
import { validateLakes } from './utils';

interface Props {
  puzzle: LakesPuzzleData;
  startTime: number;
  resetToken: number;
  onComplete: (time: number) => void;
  initialSnapshot?: unknown;
  onSnapshotChange?: (snapshot: unknown) => void;
  fixedCellSize?: number;
  showValidationMessage?: boolean;
}

export default function LakesBoard({
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
    () => new Map(puzzle.clues.map((clue) => [getCellKey(clue.row, clue.col), clue.value])),
    [puzzle.clues]
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
      validate={validateLakes}
      initialSnapshot={initialSnapshot}
      onSnapshotChange={onSnapshotChange}
      fixedCellSize={fixedCellSize}
      showValidationMessage={showValidationMessage}
      isLockedCell={isLockedCell}
      getCellTone={(row, col, state: ShadingCellState) => {
        if (isLockedCell(row, col)) return 'clue';
        if (state === 1) return 'playerShaded';
        if (state === 2) return 'marked';
        return 'cell';
      }}
      renderCellContent={(row, col, _state, cellSize) => {
        const value = clueMap.get(getCellKey(row, col));
        if (value === undefined) return null;

        return (
          <span
            className="font-semibold tabular-nums"
            style={{
              color: woodBoardTheme.border,
              fontSize: `${getBoardNumberFontSize(cellSize)}px`,
              lineHeight: 1,
            }}
          >
            {value}
          </span>
        );
      }}
    />
  );
}

