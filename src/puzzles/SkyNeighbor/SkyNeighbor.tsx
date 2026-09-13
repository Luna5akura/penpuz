import { useCallback, useMemo } from 'react';
import NumberPlacementBoard, {
  type NumberPlacementCellValue,
  type NumberPlacementOutsideValues,
  type NumberPlacementOutsideInput,
} from '../shared/NumberPlacementBoard';
import type { SkyNeighborPuzzleData } from '../types';
import {
  boardClassNames,
  getBoardTextStyle,
  getRoomBoundaryStrokeWidth,
  woodBoardTheme,
} from '../boardTheme';
import { validateSkyNeighbor, type SkyNeighborOutsideValues } from './utils';

interface Props {
  puzzle: SkyNeighborPuzzleData;
  startTime: number;
  resetToken: number;
  onComplete: (time: number) => void;
  initialSnapshot?: unknown;
  onSnapshotChange?: (snapshot: unknown) => void;
  fixedCellSize?: number;
  showValidationMessage?: boolean;
}

const SKY_NEIGHBOR_NUMBERS = [1, 2, 3];
const SKY_NEIGHBOR_CYCLE: NumberPlacementCellValue[] = [null, 1, 2, 3];

interface SkyNeighborOverlayProps {
  boardWidth: number;
  boardHeight: number;
}

/**
 * Draw the heavy frame around the central box. Cell decorations themselves
 * are supplied by the shared NumberPlacementBoard cell renderer.
 */
function SkyNeighborOverlay({
  boardWidth,
  boardHeight,
}: SkyNeighborOverlayProps) {
  // The overlay is only the heavy frame around the central box.  Gray-cell
  // decorations are rendered by NumberPlacementBoard's shared cell layer so
  // inner and outside cells use one geometry and cannot drift apart.
  const frameStroke = getRoomBoundaryStrokeWidth();

  return (
    <svg
      className="pointer-events-none absolute left-0 top-0"
      width={boardWidth}
      height={boardHeight}
      viewBox={`0 0 ${boardWidth} ${boardHeight}`}
      aria-hidden="true"
    >
      {/* The paper layout has a heavy frame around the central 9×9 box. */}
      <rect
        // Keep the heavy central frame inside the 9×9 box. Drawing a
        // centered stroke at x/y=0 would overlap the neighbouring outside
        // cells and make their boxes appear a different size.
        x={frameStroke / 2}
        y={frameStroke / 2}
        width={Math.max(0, boardWidth - frameStroke)}
        height={Math.max(0, boardHeight - frameStroke)}
        fill="none"
        stroke={woodBoardTheme.border}
        strokeWidth={frameStroke}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** Interactive 9×9 Sky-neighbors board with four skyscraper clue gutters. */
export default function SkyNeighborBoard({
  puzzle,
  startTime,
  resetToken,
  onComplete,
  initialSnapshot,
  onSnapshotChange,
  fixedCellSize,
  showValidationMessage = false,
}: Props) {
  const getFixedValue = useCallback(
    (row: number, col: number) => puzzle.givens[row]?.[col] ?? null,
    [puzzle.givens]
  );
  const getCellTone = useCallback(
    (row: number, col: number) => puzzle.grayCells[row]?.[col] ? 'outlined' as const :
      getFixedValue(row, col) !== null ? 'clue' as const : 'cell' as const,
    [getFixedValue, puzzle.grayCells]
  );
  const renderOverlay = useCallback(
    (_cellSize: number, boardWidth: number, boardHeight: number) => (
      <SkyNeighborOverlay
        boardWidth={boardWidth}
        boardHeight={boardHeight}
      />
    ),
    []
  );
  const outsideInput = useMemo<NumberPlacementOutsideInput>(() => ({
    top: true,
    right: true,
    bottom: true,
    left: true,
    getFixedValue: (side, index) => puzzle.clues[side][index] ?? null,
    getCellTone: (side, index) => {
      const gray = puzzle.outsideGrayCells?.[side]?.[index] === true;
      return gray ? 'outlined' : puzzle.clues[side][index] !== null ? 'clue' : 'cell';
    },
  }), [puzzle.clues, puzzle.outsideGrayCells]);
  const validate = useCallback(
    (
      grid: (number | null)[][],
      _puzzle: SkyNeighborPuzzleData,
      outsideValues?: NumberPlacementOutsideValues
    ) => validateSkyNeighbor(
      grid,
      puzzle,
      outsideValues as SkyNeighborOutsideValues | undefined
    ),
    [puzzle]
  );

  return (
    <div className="flex w-full min-w-0 flex-col items-center gap-3">
      <div className={`${boardClassNames.cellText} text-sm text-muted-foreground`}>1 · 2 · 3</div>
      <NumberPlacementBoard
        puzzle={puzzle}
        numbers={SKY_NEIGHBOR_NUMBERS}
        startTime={startTime}
        resetToken={resetToken}
        onComplete={onComplete}
        validate={validate}
        getFixedValue={getFixedValue}
        getCellTone={getCellTone}
        cycleValues={SKY_NEIGHBOR_CYCLE}
        cellInputMode="cycle"
        showValueButtons
        squareOutsideCells
        outsideInput={outsideInput}
        renderOverlay={renderOverlay}
        fixedCellSize={fixedCellSize}
        initialSnapshot={initialSnapshot}
        onSnapshotChange={onSnapshotChange}
        showValidationMessage={showValidationMessage}
        renderCellValue={(value, cellSize) => (
          <span style={getBoardTextStyle(cellSize, 0.68, 18)}>{value}</span>
        )}
      />
    </div>
  );
}

export { SkyNeighborBoard };
