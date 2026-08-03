import { useCallback, useMemo } from 'react';
import ShadingBoard, { type ShadingCellState } from '../shared/ShadingBoard';
import type { TapaPuzzleData } from '../types';
import { getCellKey } from '../gridUtils';
import { getBoardTextStyle, woodBoardTheme } from '../boardTheme';
import { validateTapa } from './utils';
import TapaClue from './TapaClue';

interface Props {
  puzzle: TapaPuzzleData;
  startTime: number;
  resetToken: number;
  onComplete: (time: number) => void;
  initialSnapshot?: unknown;
  onSnapshotChange?: (snapshot: unknown) => void;
  fixedCellSize?: number;
  showValidationMessage?: boolean;
}

export default function TapaBoard({
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
    () => new Map(
      puzzle.clues.flatMap((row, rowIndex) =>
        row.flatMap((clue, colIndex) => clue ? [[getCellKey(rowIndex, colIndex), clue] as const] : [])
      )
    ),
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
      validate={validateTapa}
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
        const clue = clueMap.get(getCellKey(row, col));
        if (!clue) return null;

        return (
          <span
            className="relative block h-full w-full"
            style={{
              background: woodBoardTheme.clueCell,
              color: woodBoardTheme.border,
              ...getBoardTextStyle(cellSize),
            }}
          >
            <TapaClue clue={clue} cellSize={cellSize} />
          </span>
        );
      }}
    />
  );
}
