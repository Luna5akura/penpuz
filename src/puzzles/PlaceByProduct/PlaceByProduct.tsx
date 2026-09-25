import { useCallback } from 'react';
import ShadingBoard, { type ShadingCellState } from '../shared/ShadingBoard';
import { getBoardFrameDimensions, woodBoardTheme } from '../boardTheme';
import type { PlaceByProductPuzzleData } from '../types';
import { validatePlaceByProduct } from './utils';

interface Props {
  puzzle: PlaceByProductPuzzleData;
  startTime: number;
  resetToken: number;
  onComplete: (time: number) => void;
  initialSnapshot?: unknown;
  onSnapshotChange?: (snapshot: unknown) => void;
  fixedCellSize?: number;
  showValidationMessage?: boolean;
}

const LEGEND_CELL = 20;

/** Mini diagram of one piece shape used in the legend below the board. */
function PieceLegend({ puzzle }: { puzzle: PlaceByProductPuzzleData }) {
  return (
    <div className="flex w-full flex-wrap items-center justify-center gap-3">
      {puzzle.pieces.map((piece, index) => {
        let maxRow = 0;
        let maxCol = 0;
        for (const [row, col] of piece.cells) {
          maxRow = Math.max(maxRow, row);
          maxCol = Math.max(maxCol, col);
        }
        const { outerWidth, outerHeight } = getBoardFrameDimensions(
          maxCol + 1,
          maxRow + 1,
          LEGEND_CELL,
          { borderWidth: 1, padding: 2 }
        );
        return (
          <div
            key={index}
            className="relative"
            style={{ width: outerWidth, height: outerHeight, flexShrink: 0 }}
          >
            {piece.cells.map(([row, col], cellIndex) => (
              <div
                key={cellIndex}
                className="absolute"
                style={{
                  left: 2 + col * LEGEND_CELL,
                  top: 2 + row * LEGEND_CELL,
                  width: LEGEND_CELL,
                  height: LEGEND_CELL,
                  background: woodBoardTheme.deepLine,
                  borderRadius: 2,
                }}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

export default function PlaceByProductBoard({
  puzzle,
  startTime,
  resetToken,
  onComplete,
  initialSnapshot,
  onSnapshotChange,
  fixedCellSize,
  showValidationMessage = false,
}: Props) {
  const getInitialGrid = useCallback(
    (width: number, height: number): ShadingCellState[][] =>
      Array.from({ length: height }, (_, row) =>
        Array.from({ length: width }, (_, col) => (puzzle.givens[row][col] ? 1 : 0))
      ),
    [puzzle.givens]
  );

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col items-center gap-3">
      <ShadingBoard
        puzzle={puzzle}
        startTime={startTime}
        resetToken={resetToken}
        onComplete={onComplete}
        validate={validatePlaceByProduct}
        initialSnapshot={initialSnapshot}
        onSnapshotChange={onSnapshotChange}
        fixedCellSize={fixedCellSize}
        showValidationMessage={showValidationMessage}
        getInitialGrid={getInitialGrid}
        applyOnPointerDown
        outsideClues={{ top: puzzle.colClues, left: puzzle.rowClues }}
        outsideClueCellTextSize
        isLockedCell={(row, col) => puzzle.givens[row][col]}
        getCellTone={(_row, _col, state) => (state === 1 ? 'shaded' : state === 2 ? 'marked' : 'cell')}
        renderBoardAccessory={() => <PieceLegend puzzle={puzzle} />}
      />
    </div>
  );
}
