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
      renderBlockedCell={(row, col, cellSize) => {
        const clue = puzzle.cells[row][col];
        if (!clue) return null;
        return <SlovakSumsClue sum={clue.sum} count={clue.count} cellSize={cellSize} />;
      }}
      initialSnapshot={initialSnapshot}
      onSnapshotChange={onSnapshotChange}
      fixedCellSize={fixedCellSize}
      showValidationMessage={showValidationMessage}
    />
  );
}
