import { useCallback, useMemo } from 'react';
import { useI18n } from '@/i18n/useI18n';
import NumberPlacementBoard, { type NumberPlacementCellValue } from '../shared/NumberPlacementBoard';
import type { MagicSummerPuzzleData } from '../types';
import {
  getBoardTextStyle,
  woodBoardTheme,
} from '../boardTheme';
import { validateMagicSummer } from './utils';
import BoardCellMark from '../shared/BoardCellMark';

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
    return <BoardCellMark kind="circle" cellSize={cellSize} />;
  }

  if (value === 'cross') {
    return <BoardCellMark kind="cross" cellSize={cellSize} />;
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
    // Magic Summer places its line-sum clues above and to the left of the
    // grid.  PuzzLink can encode clues on either side; use the merged sums so
    // a clue encoded on the bottom/right is still shown in the canonical spot.
    () => ({
      top: puzzle.columnSums,
      left: puzzle.rowSums,
    }),
    [puzzle.columnSums, puzzle.rowSums]
  );

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col items-center gap-3">
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
          <BoardCellMark kind="cross" cellSize={cellSize} color={woodBoardTheme.darkCellText} />
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
