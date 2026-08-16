import { useCallback, useMemo } from 'react';
import { useI18n } from '@/i18n/useI18n';
import NumberPlacementBoard, { type NumberPlacementCellValue } from '../shared/NumberPlacementBoard';
import type { MagicSummerPuzzleData } from '../types';
import {
  getBoardCenterMarkMetrics,
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

const magicSummerExtraValues: Array<Exclude<NumberPlacementCellValue, number | null>> = ['circle', 'cross'];

function renderMagicSummerCellValue(value: NumberPlacementCellValue, cellSize: number) {
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
  const cycleValues = useMemo<NumberPlacementCellValue[]>(
    () => [null, 'circle', ...puzzle.numbers, 'cross'],
    [puzzle.numbers]
  );
  const getCellTone = useCallback(
    (row: number, col: number, value: NumberPlacementCellValue) => {
      const cell = puzzle.cells[row][col];
      if (cell === 'block' || value === 'cross') return 'marked';
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
  const outsideClues = useMemo(
    () => puzzle.clues ?? {
      top: puzzle.columnSums,
      bottom: Array<number | null>(puzzle.width).fill(null),
      left: puzzle.rowSums,
      right: Array<number | null>(puzzle.height).fill(null),
    },
    [puzzle.clues, puzzle.columnSums, puzzle.height, puzzle.rowSums, puzzle.width]
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
        renderCellValue={renderMagicSummerCellValue}
        renderCandidates={renderCandidates}
        getCellTone={getCellTone}
        extraCellValues={magicSummerExtraValues}
        cellInputMode="cycle"
        cycleValues={cycleValues}
        inputModeOptions={inputModeOptions}
        outsideClues={outsideClues}
        initialSnapshot={initialSnapshot}
        onSnapshotChange={onSnapshotChange}
        fixedCellSize={fixedCellSize}
        showValidationMessage={showValidationMessage}
      />
    </div>
  );
}
