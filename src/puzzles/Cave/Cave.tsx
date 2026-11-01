import { useCallback, useMemo } from 'react';
import ShadingBoard, { type ShadingCellState } from '../shared/ShadingBoard';
import type { CavePuzzleData } from '../types';
import { getCellKey } from '../gridUtils';
import { boardClassNames, getBoardClueTextStyle, woodBoardTheme } from '../boardTheme';
import { validateCave } from './utils';

interface Props {
  puzzle: CavePuzzleData;
  startTime: number;
  resetToken: number;
  onComplete: (time: number) => void;
  initialSnapshot?: unknown;
  onSnapshotChange?: (snapshot: unknown) => void;
  fixedCellSize?: number;
  showValidationMessage?: boolean;
}

export default function CaveBoard({
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
      validate={validateCave}
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

        // 数字线索满足要求（上下左右可见山洞格数 = 数字）后变灰
        let visible = 1;
        for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) {
          let r = row + dr;
          let c = col + dc;
          while (r >= 0 && r < puzzle.height && c >= 0 && c < puzzle.width && grid[r][c] !== 1) {
            visible += 1;
            r += dr;
            c += dc;
          }
        }
        const satisfied = visible === clue;

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
    />
  );
}
