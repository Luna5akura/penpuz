import { useCallback, useMemo } from 'react';
import { useI18n } from '@/i18n/useI18n';
import NumberPlacementBoard from '../shared/NumberPlacementBoard';
import {
  getBoardTextStyle,
} from '../boardTheme';
import type { SkyscrapersPuzzleData } from '../types';
import { validateSkyscrapers } from './utils';

interface Props {
  puzzle: SkyscrapersPuzzleData;
  startTime: number;
  resetToken: number;
  onComplete: (time: number) => void;
  initialSnapshot?: unknown;
  onSnapshotChange?: (snapshot: unknown) => void;
  fixedCellSize?: number;
  showValidationMessage?: boolean;
}

export default function SkyscrapersBoard({
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
  const getFixedValue = useCallback(
    (row: number, col: number) => puzzle.givens[row]?.[col] ?? null,
    [puzzle.givens]
  );
  const inputModeOptions = useMemo(
    () => [
      { mode: 'cycle' as const, label: copy.shared.numberInputModes.normal },
      { mode: 'candidates' as const, label: copy.shared.numberInputModes.candidates },
    ],
    [copy.shared.numberInputModes.candidates, copy.shared.numberInputModes.normal]
  );
  const cycleValues = useMemo(
    () => [null, ...puzzle.numbers],
    [puzzle.numbers]
  );
  const renderCandidates = useCallback(
    (values: number[], cellSize: number) => (
      <span
        className="grid w-[82%] min-w-0 place-items-center text-center tabular-nums"
        style={{
          gridTemplateColumns: `repeat(${Math.min(3, Math.max(values.length, 1))}, minmax(0, 1fr))`,
          ...getBoardTextStyle(cellSize, 0.25, 10, 1),
        }}
      >
        {values.map((value) => <span key={value}>{value}</span>)}
      </span>
    ),
    []
  );

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="w-full text-right text-sm font-semibold text-muted-foreground">
        {copy.shared.numberRange(Math.min(...puzzle.numbers), Math.max(...puzzle.numbers))}
      </div>
      <NumberPlacementBoard
        puzzle={puzzle}
        numbers={puzzle.numbers}
        startTime={startTime}
        resetToken={resetToken}
        onComplete={onComplete}
        validate={validateSkyscrapers}
        getFixedValue={getFixedValue}
        getCellTone={(row, col) =>
          puzzle.givens[row]?.[col] === null ? 'cell' : 'prefilled'
        }
        renderCandidates={renderCandidates}
        outsideClues={puzzle.clues}
        cellInputMode="cycle"
        cycleValues={cycleValues}
        inputModeOptions={inputModeOptions}
        initialSnapshot={initialSnapshot}
        onSnapshotChange={onSnapshotChange}
        fixedCellSize={fixedCellSize}
        showValidationMessage={showValidationMessage}
      />
    </div>
  );
}
