import { useCallback, useMemo } from 'react';
import { useI18n } from '@/i18n/useI18n';
import NumberPlacementBoard, { type NumberPlacementCellValue } from '../shared/NumberPlacementBoard';
import {
  getBoardCenterMarkMetrics,
  getBoardCrossFontSize,
  getBoardTextStyle,
  getCrossMarkStyle,
  woodBoardTheme,
} from '../boardTheme';
import type { SlovakSumsPuzzleData } from '../types';
import SlovakSumsClue from './SlovakSumsClue';
import { validateSlovakSums } from './utils';

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
      const center = cellSize / 2;
      const { radius, strokeWidth } = getBoardCenterMarkMetrics(cellSize);

      return (
        <svg
          className="pointer-events-none absolute inset-0"
          width={cellSize}
          height={cellSize}
          viewBox={`0 0 ${cellSize} ${cellSize}`}
          aria-hidden="true"
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={woodBoardTheme.border}
            strokeWidth={strokeWidth}
          />
        </svg>
      );
    }

    if (value === 'cross') {
      return <span style={getCrossMarkStyle(getBoardCrossFontSize(cellSize))}>×</span>;
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
