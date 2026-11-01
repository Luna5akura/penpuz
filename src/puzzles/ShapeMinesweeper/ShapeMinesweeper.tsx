import { useCallback, useMemo } from 'react';
import ShadingBoard, { type ShadingCellState } from '../shared/ShadingBoard';
import type { ShapeMinesweeperPuzzleData } from '../types';
import { getCellKey } from '../gridUtils';
import { boardClassNames, getBoardClueTextStyle, woodBoardTheme } from '../boardTheme';
import ShapeInventory from './ShapeInventory';
import { getPlacedShapeLabels, validateShapeMinesweeper } from './utils';

interface Props {
  puzzle: ShapeMinesweeperPuzzleData;
  startTime: number;
  resetToken: number;
  onComplete: (time: number) => void;
  initialSnapshot?: unknown;
  onSnapshotChange?: (snapshot: unknown) => void;
  fixedCellSize?: number;
  showValidationMessage?: boolean;
}

export default function ShapeMinesweeperBoard({
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
      puzzle.clues.flatMap((row, rowIndex) => row.flatMap((clue, colIndex) =>
        clue === null ? [] : [[getCellKey(rowIndex, colIndex), clue] as const]
      ))
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
      validate={validateShapeMinesweeper}
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
      renderCellContent={(row, col, _state, cellSize, grid) => {
        const clue = clueMap.get(getCellKey(row, col));
        if (clue === undefined) return null;

        // 数字线索满足要求（周围八格被覆盖格数 = 数字）后变灰
        let covered = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = row + dr;
            const nc = col + dc;
            if (nr < 0 || nr >= puzzle.height || nc < 0 || nc >= puzzle.width) continue;
            if (grid[nr][nc] === 1) covered += 1;
          }
        }
        const satisfied = covered === clue;

        return (
          <span
            className={boardClassNames.cellText}
            style={{
              ...getBoardClueTextStyle(cellSize),
              ...(satisfied ? { color: woodBoardTheme.neutralSoft } : {}),
            }}
          >
            {clue}
          </span>
        );
      }}
      renderBoardAccessory={(cellSize, grid) => (
        <ShapeInventory
          shapes={puzzle.shapes}
          cellSize={Math.max(11, Math.floor(cellSize * 0.42))}
          placedLabels={getPlacedShapeLabels(grid, puzzle)}
        />
      )}
    />
  );
}
