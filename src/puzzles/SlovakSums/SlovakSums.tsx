import { useCallback, useMemo } from 'react';
import { useI18n } from '@/i18n/useI18n';
import NumberPlacementBoard, { type NumberPlacementCellValue } from '../shared/NumberPlacementBoard';
import { getBoardTextStyle } from '../boardTheme';
import type { SlovakSumsPuzzleData } from '../types';
import SlovakSumsClue from './SlovakSumsClue';
import { validateSlovakSums } from './utils';
import BoardCellMark from '../shared/BoardCellMark';

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

const SLOVAK_EXTRA_CELL_VALUES: Array<Exclude<NumberPlacementCellValue, number | null>> = ['circle', 'cross'];

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
  const { copy } = useI18n();
  const isBlockedCell = useCallback(
    (row: number, col: number) => puzzle.cells[row][col] !== null,
    [puzzle.cells]
  );
  const cycleValues = useMemo<NumberPlacementCellValue[]>(
    () => [null, 'circle', ...puzzle.numbers, 'cross'],
    [puzzle.numbers]
  );

  const renderCellValue = useCallback((value: NumberPlacementCellValue, cellSize: number) => {
    if (value === 'circle') {
      return <BoardCellMark kind="circle" cellSize={cellSize} />;
    }

    if (value === 'cross') {
      return <BoardCellMark kind="cross" cellSize={cellSize} />;
    }

    return value;
  }, []);

  const renderCandidates = useCallback((values: number[], cellSize: number) => (
    <span
      className="grid w-[78%] place-items-center tabular-nums"
      style={{
        gridTemplateColumns: `repeat(${Math.min(3, Math.max(values.length, 1))}, minmax(0, 1fr))`,
        ...getBoardTextStyle(cellSize, 0.25, 10),
      }}
    >
      {values.map((value) => <span key={value}>{value}</span>)}
    </span>
  ), []);
  const getCellTone = useCallback((row: number, col: number, value: NumberPlacementCellValue) => {
    if (puzzle.cells[row][col] !== null) return 'shaded';
    return value === 'cross' ? 'marked' : 'cell';
  }, [puzzle.cells]);

  return (
    <NumberPlacementBoard
      puzzle={puzzle}
      numbers={puzzle.numbers}
      startTime={startTime}
      resetToken={resetToken}
      onComplete={onComplete}
      validate={validateSlovakSums}
      isBlockedCell={isBlockedCell}
      renderCellValue={renderCellValue}
      getCellTone={getCellTone}
      renderCandidates={renderCandidates}
      extraCellValues={SLOVAK_EXTRA_CELL_VALUES}
      cellInputMode="cycle"
      cycleValues={cycleValues}
      inputModeOptions={[
        { mode: 'cycle', label: copy.shared.numberInputModes.normal },
        { mode: 'candidates', label: copy.shared.numberInputModes.candidates },
      ]}
      renderBlockedCell={(row, col, cellSize, grid) => {
        const clue = puzzle.cells[row][col];
        if (!clue) return null;
        // 数字线索满足要求：相邻白格已填数字之和 = 上方数字，
        // 且有圆点数量要求时，相邻已填数字个数 = 圆点数。
        let sum = 0;
        let filled = 0;
        for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) {
          const nr = row + dr;
          const nc = col + dc;
          if (nr < 0 || nr >= puzzle.height || nc < 0 || nc >= puzzle.width) continue;
          const cell = grid[nr]?.[nc];
          if (typeof cell === 'number') {
            sum += cell;
            filled += 1;
          }
        }
        const satisfied = clue.sum !== null && sum === clue.sum && (clue.count <= 0 || filled === clue.count);
        return <SlovakSumsClue sum={clue.sum} count={clue.count} cellSize={cellSize} satisfied={satisfied} />;
      }}
      initialSnapshot={initialSnapshot}
      onSnapshotChange={onSnapshotChange}
      fixedCellSize={fixedCellSize}
      showValidationMessage={showValidationMessage}
    />
  );
}
