import { useCallback, useMemo } from 'react';
import { useI18n } from '@/i18n/useI18n';
import NumberPlacementBoard from '../shared/NumberPlacementBoard';
import type { MagicSummerPuzzleData } from '../types';
import {
  getBoardCrossFontSize,
  getBoardTextStyle,
  getCrossMarkStyle,
  woodBoardTheme,
} from '../boardTheme';
import { validateMagicSummer } from './utils';

interface Props {
  puzzle: MagicSummerPuzzleData;
  startTime: number;
  resetToken: number;
  onComplete: (time: number) => void;
  initialSnapshot?: unknown;
  onSnapshotChange?: (snapshot: unknown) => void;
  fixedCellSize?: number;
  showValidationMessage?: boolean;
}

export default function MagicSummerBoard({
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
    (row: number, col: number) => {
      const cell = puzzle.cells[row][col];
      return typeof cell === 'number' ? cell : null;
    },
    [puzzle.cells]
  );
  const isBlockedCell = useCallback(
    (row: number, col: number) => puzzle.cells[row][col] === 'block',
    [puzzle.cells]
  );
  const getCellTone = useCallback(
    (row: number, col: number) => {
      const cell = puzzle.cells[row][col];
      if (cell === 'block') return 'marked';
      if (typeof cell === 'number') return 'prefilled';
      return 'cell';
    },
    [puzzle.cells]
  );
  const renderCandidates = useCallback(
    (values: number[], cellSize: number) => (
      <span
        className="grid w-full max-w-full"
        style={{
          gridTemplateColumns: `repeat(${Math.min(3, Math.max(1, puzzle.numbers.length))}, minmax(0, 1fr))`,
          ...getBoardTextStyle(cellSize, 0.27, 10, 1),
        }}
      >
        {values.map((value) => (
          <span key={value} className="text-center">
            {value}
          </span>
        ))}
      </span>
    ),
    [puzzle.numbers.length]
  );
  const inputModeOptions = useMemo(
    () => [
      { mode: 'select' as const, label: copy.shared.numberInputModes.normal },
      { mode: 'candidates' as const, label: copy.shared.numberInputModes.candidates },
    ],
    [copy.shared.numberInputModes.candidates, copy.shared.numberInputModes.normal]
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
        validate={validateMagicSummer}
        getFixedValue={getFixedValue}
        isBlockedCell={isBlockedCell}
        renderBlockedCell={(_row, _col, cellSize) => (
          <span style={getCrossMarkStyle(getBoardCrossFontSize(cellSize), woodBoardTheme.shadedText)}>×</span>
        )}
        renderCandidates={renderCandidates}
        getCellTone={getCellTone}
        inputModeOptions={inputModeOptions}
        outsideClues={{
          top: puzzle.columnSums,
          left: puzzle.rowSums,
        }}
        initialSnapshot={initialSnapshot}
        onSnapshotChange={onSnapshotChange}
        fixedCellSize={fixedCellSize}
        showValidationMessage={showValidationMessage}
      />
    </div>
  );
}
