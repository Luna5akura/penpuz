import { useCallback, useMemo } from 'react';
import ShadingBoard, { type ShadingCellState } from '../shared/ShadingBoard';
import type { TapaPuzzleData } from '../types';
import { getCellKey } from '../gridUtils';
import { getBoardCellColors, getBoardTextStyle, woodBoardTheme } from '../boardTheme';
import { getTapaClueValues, validateTapa } from './utils';
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
      renderCellContent={(row, col, _state, cellSize, grid) => {
        const clue = clueMap.get(getCellKey(row, col));
        if (!clue) return null;

        // 数字线索满足要求（周围八格连续黑格段长度与线索一致）后变灰
        const values = getTapaClueValues(clue);
        let satisfied = false;
        if (!values.some((value) => value === '?')) {
          const ring: number[] = [];
          for (const [dr, dc] of [[-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [1, -1], [0, -1]] as const) {
            const nr = row + dr;
            const nc = col + dc;
            ring.push(
              nr < 0 || nr >= puzzle.height || nc < 0 || nc >= puzzle.width
                ? 0
                : grid[nr][nc] === 1 ? 1 : 0
            );
          }
          const runs: number[] = [];
          let current = 0;
          for (const cell of [...ring, ...ring]) {
            if (cell === 1) {
              current += 1;
            } else if (current > 0) {
              runs.push(current);
              current = 0;
            }
          }
          if (current > 0) runs.push(current);
          if (ring.every((cell) => cell === 1)) {
            runs.length = 0;
            runs.push(8);
          }
          const sortedRuns = [...runs].sort((a, b) => a - b);
          const sortedValues = [...(values as number[])].sort((a, b) => a - b);
          satisfied = JSON.stringify(sortedRuns) === JSON.stringify(sortedValues);
        }

        return (
          <span
            className="relative block h-full w-full"
            style={{
              ...getBoardCellColors('clue'),
              ...getBoardTextStyle(cellSize),
              ...(satisfied ? { color: woodBoardTheme.neutralSoft } : {}),
            }}
          >
            <TapaClue clue={clue} cellSize={cellSize} />
          </span>
        );
      }}
    />
  );
}
