import { useCallback, useMemo } from 'react';
import ShadingBoard, { type ShadingCellState } from '../shared/ShadingBoard';
import type { LakesPuzzleData } from '../types';
import { getCellKey } from '../gridUtils';
import { boardClassNames, getBoardClueTextStyle, woodBoardTheme } from '../boardTheme';
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
      renderCellContent={(row, col, _state, cellSize, grid) => {
        const value = clueMap.get(getCellKey(row, col));
        if (value === undefined) return null;

        // 数字线索满足要求（湖区大小 = 数字）后变灰
        let satisfied = false;
        if (value !== '?') {
          const visited = Array.from({ length: puzzle.height }, () => Array(puzzle.width).fill(false));
          const stack: Array<[number, number]> = [[row, col]];
          visited[row][col] = true;
          let size = 0;
          while (stack.length > 0) {
            const [r, c] = stack.pop()!;
            size += 1;
            for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr < 0 || nr >= puzzle.height || nc < 0 || nc >= puzzle.width) continue;
              if (visited[nr][nc] || grid[nr][nc] === 1) continue;
              visited[nr][nc] = true;
              stack.push([nr, nc]);
            }
          }
          satisfied = size === value;
        }

        return (
          <span
            className={boardClassNames.cellText}
            style={{
              ...getBoardClueTextStyle(cellSize),
              ...(satisfied ? { color: woodBoardTheme.neutralSoft } : {}),
            }}
          >
            {value}
          </span>
        );
      }}
    />
  );
}
