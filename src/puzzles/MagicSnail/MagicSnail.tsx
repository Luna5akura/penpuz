import { useCallback, useMemo } from 'react';
import { useI18n } from '@/i18n/useI18n';
import NumberPlacementBoard, { type NumberPlacementCellValue } from '../shared/NumberPlacementBoard';
import type { MagicSnailPuzzleData } from '../types';
import {
  getBoardBoundaryStrokeWidth,
  getBoardCenterMarkMetrics,
  getBoardCrossFontSize,
  getCrossMarkStyle,
  woodBoardTheme,
} from '../boardTheme';
import {
  getMagicSnailBoundaryLines,
  validateMagicSnail,
} from './utils';

interface Props {
  puzzle: MagicSnailPuzzleData;
  startTime: number;
  resetToken: number;
  onComplete: (time: number) => void;
  initialSnapshot?: unknown;
  onSnapshotChange?: (snapshot: unknown) => void;
  fixedCellSize?: number;
  showValidationMessage?: boolean;
}

const magicSnailExtraValues: Array<Exclude<NumberPlacementCellValue, number | null>> = ['circle', 'cross'];

function renderMagicSnailCellValue(value: NumberPlacementCellValue, cellSize: number) {
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

function MagicSnailOverlay({
  puzzle,
  cellSize,
  boardWidthPx,
  boardHeightPx,
}: {
  puzzle: MagicSnailPuzzleData;
  cellSize: number;
  boardWidthPx: number;
  boardHeightPx: number;
}) {
  const boundaryStrokeWidth = getBoardBoundaryStrokeWidth(cellSize);

  return (
    <svg width={boardWidthPx} height={boardHeightPx} viewBox={`0 0 ${boardWidthPx} ${boardHeightPx}`}>
      {getMagicSnailBoundaryLines(puzzle.width, puzzle.height).map((line, index) => (
        <line
          key={`snail-boundary-${index}`}
          x1={line.x1 * cellSize}
          y1={line.y1 * cellSize}
          x2={line.x2 * cellSize}
          y2={line.y2 * cellSize}
          stroke={woodBoardTheme.border}
          strokeLinecap="square"
          strokeWidth={boundaryStrokeWidth}
        />
      ))}
    </svg>
  );
}

export default function MagicSnailBoard({
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
  const renderBlockedCell = useCallback(
    (_row: number, _col: number, cellSize: number) => (
      <span style={getCrossMarkStyle(getBoardCrossFontSize(cellSize))}>×</span>
    ),
    []
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
  const numberRange = useMemo(
    () => ({
      min: Math.min(...puzzle.numbers),
      max: Math.max(...puzzle.numbers),
    }),
    [puzzle.numbers]
  );

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="w-full text-right text-sm font-semibold text-muted-foreground">
        {copy.shared.numberRange(numberRange.min, numberRange.max)}
      </div>
      <NumberPlacementBoard
        puzzle={puzzle}
        numbers={puzzle.numbers}
        startTime={startTime}
        resetToken={resetToken}
        onComplete={onComplete}
        validate={validateMagicSnail}
        getFixedValue={getFixedValue}
        isBlockedCell={isBlockedCell}
        renderBlockedCell={renderBlockedCell}
        renderCellValue={renderMagicSnailCellValue}
        renderOverlay={(cellSize, boardWidthPx, boardHeightPx) => (
          <MagicSnailOverlay
            puzzle={puzzle}
            cellSize={cellSize}
            boardWidthPx={boardWidthPx}
            boardHeightPx={boardHeightPx}
          />
        )}
        getCellTone={getCellTone}
        extraCellValues={magicSnailExtraValues}
        cellInputMode="cycle"
        cycleValues={cycleValues}
        showValueButtons
        initialSnapshot={initialSnapshot}
        onSnapshotChange={onSnapshotChange}
        fixedCellSize={fixedCellSize}
        showValidationMessage={showValidationMessage}
      />
    </div>
  );
}
