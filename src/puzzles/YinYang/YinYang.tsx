import { useCallback } from 'react';
import ShadingBoard, { type ShadingCellState } from '../shared/ShadingBoard';
import BoardCellMark from '../shared/BoardCellMark';
import { getBoardCenterMarkMetrics, woodBoardTheme } from '../boardTheme';
import type { YinYangPuzzleData } from '../types';
import { validateYinYang } from './utils';

interface Props {
  puzzle: YinYangPuzzleData;
  startTime: number;
  resetToken: number;
  onComplete: (time: number) => void;
  initialSnapshot?: unknown;
  onSnapshotChange?: (snapshot: unknown) => void;
  fixedCellSize?: number;
  showValidationMessage?: boolean;
}

/** Filled dark circle drawn for a black Yin-Yang cell. */
function YinYangBlackCircleMark({ cellSize }: { cellSize: number }) {
  const { radius } = getBoardCenterMarkMetrics(cellSize);
  const center = cellSize / 2;
  return (
    <svg
      className="pointer-events-none absolute inset-0"
      width={cellSize}
      height={cellSize}
      viewBox={`0 0 ${cellSize} ${cellSize}`}
      aria-hidden="true"
    >
      <circle cx={center} cy={center} r={radius} fill={woodBoardTheme.border} />
    </svg>
  );
}

export default function YinYangBoard({
  puzzle,
  startTime,
  resetToken,
  onComplete,
  initialSnapshot,
  onSnapshotChange,
  fixedCellSize,
  showValidationMessage,
}: Props) {
  const getInitialGrid = useCallback(
    (width: number, height: number): ShadingCellState[][] =>
      Array.from({ length: height }, (_, row) =>
        Array.from({ length: width }, (_, col) => {
          const given = puzzle.givens[row]?.[col];
          return given === 1 ? 1 : given === 0 ? 2 : 0;
        })
      ),
    [puzzle.givens]
  );

  const isLockedCell = useCallback(
    (row: number, col: number) => puzzle.givens[row]?.[col] !== null && puzzle.givens[row]?.[col] !== undefined,
    [puzzle.givens]
  );

  const renderCellContent = useCallback((_row: number, _col: number, state: ShadingCellState, cellSize: number) => {
    if (state === 1) return <YinYangBlackCircleMark cellSize={cellSize} />;
    if (state === 2) return <BoardCellMark kind="circle" cellSize={cellSize} />;
    return undefined;
  }, []);

  return (
    <ShadingBoard
      puzzle={puzzle}
      startTime={startTime}
      resetToken={resetToken}
      onComplete={onComplete}
      validate={validateYinYang}
      getInitialGrid={getInitialGrid}
      isLockedCell={isLockedCell}
      renderCellContent={renderCellContent}
      getCellTone={(row, col) => (isLockedCell(row, col) ? 'clue' : 'cell')}
      applyOnPointerDown
      initialSnapshot={initialSnapshot}
      onSnapshotChange={onSnapshotChange}
      fixedCellSize={fixedCellSize}
      showValidationMessage={showValidationMessage}
    />
  );
}
