import { useCallback } from 'react';
import { useI18n } from '@/i18n/useI18n';
import NumberPlacementBoard from '../shared/NumberPlacementBoard';
import { boardClassNames, getBoardTextStyle } from '../boardTheme';
import type { KakuroPuzzleData } from '../types';
import KakuroClue from './KakuroClue';
import { validateKakuro } from './utils';

interface Props {
  puzzle: KakuroPuzzleData;
  startTime: number;
  resetToken: number;
  onComplete: (time: number) => void;
  initialSnapshot?: unknown;
  onSnapshotChange?: (snapshot: unknown) => void;
  fixedCellSize?: number;
  showValidationMessage?: boolean;
}

const KAKURO_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export default function KakuroBoard({
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
  const renderCandidates = useCallback((values: number[], cellSize: number) => (
    <span
      className={`grid w-[78%] place-items-center ${boardClassNames.cellTextTight}`}
      style={{
        gridTemplateColumns: `repeat(${Math.min(3, Math.max(values.length, 1))}, minmax(0, 1fr))`,
        ...getBoardTextStyle(cellSize, 0.25, 10),
      }}
    >
      {values.map((value) => <span key={value}>{value}</span>)}
    </span>
  ), []);

  return (
    <NumberPlacementBoard
      puzzle={puzzle}
      numbers={KAKURO_NUMBERS}
      startTime={startTime}
      resetToken={resetToken}
      onComplete={onComplete}
      validate={validateKakuro}
      isBlockedCell={isBlockedCell}
      renderBlockedCell={(row, col, cellSize) => {
        const clue = puzzle.cells[row][col];
        if (!clue) return null;
        return <KakuroClue right={clue.right} down={clue.down} cellSize={cellSize} />;
      }}
      renderCandidates={renderCandidates}
      inputModeOptions={[
        { mode: 'select', label: copy.shared.numberInputModes.normal },
        { mode: 'candidates', label: copy.shared.numberInputModes.candidates },
      ]}
      cellInputMode="select"
      showValueButtons
      initialSnapshot={initialSnapshot}
      onSnapshotChange={onSnapshotChange}
      fixedCellSize={fixedCellSize}
      showValidationMessage={showValidationMessage}
    />
  );
}
