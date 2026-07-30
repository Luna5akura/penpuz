import { useCallback, useMemo } from 'react';
import ShadingBoard, { type ShadingCellState } from '../shared/ShadingBoard';
import type { LitsPuzzleData } from '../types';
import { getRegionBoundarySegments } from '../gridUtils';
import { getBoardCrossFontSize, getCrossMarkStyle, woodBoardTheme } from '../boardTheme';
import { validateLits } from './utils';

interface Props {
  puzzle: LitsPuzzleData;
  startTime: number;
  resetToken: number;
  onComplete: (time: number) => void;
  initialSnapshot?: unknown;
  onSnapshotChange?: (snapshot: unknown) => void;
  fixedCellSize?: number;
  showValidationMessage?: boolean;
}

export default function LitsBoard({
  puzzle,
  startTime,
  resetToken,
  onComplete,
  initialSnapshot,
  onSnapshotChange,
  fixedCellSize,
  showValidationMessage,
}: Props) {
  const boundaries = useMemo(
    () => getRegionBoundarySegments(puzzle.regionIds, puzzle.width, puzzle.height),
    [puzzle.height, puzzle.regionIds, puzzle.width]
  );
  const isExcludedCell = useCallback(
    (row: number, col: number) => puzzle.regionIds[row][col] < 0,
    [puzzle.regionIds]
  );

  return (
    <ShadingBoard
      puzzle={puzzle}
      startTime={startTime}
      resetToken={resetToken}
      onComplete={onComplete}
      validate={validateLits}
      initialSnapshot={initialSnapshot}
      onSnapshotChange={onSnapshotChange}
      fixedCellSize={fixedCellSize}
      showValidationMessage={showValidationMessage}
      boundaries={boundaries}
      isLockedCell={isExcludedCell}
      getCellTone={(row, col, state: ShadingCellState) => {
        if (isExcludedCell(row, col)) return 'marked';
        if (state === 1) return 'playerShaded';
        if (state === 2) return 'marked';
        return 'cell';
      }}
      renderCellContent={(row, col, _state, cellSize) => {
        if (!isExcludedCell(row, col)) return null;

        return (
          <span style={getCrossMarkStyle(getBoardCrossFontSize(cellSize), woodBoardTheme.markedText)}>
            ×
          </span>
        );
      }}
    />
  );
}
