import {
  boardClassNames,
  boardLayoutMetrics,
  commonBoardChrome,
  getBoardCellStyle,
  getBoardFrameDimensions,
  getBoardFrameStyle,
  getBoardGridStyle,
  getBoardTextStyle,
} from '@/puzzles/boardTheme';
import ShapeInventory from '@/puzzles/ShapeMinesweeper/ShapeInventory';
import type { CavePuzzleData, ShapeMinesweeperPuzzleData } from '@/puzzles/types';
import { useExampleCellSize } from './exampleCellSizeContext';

interface Props {
  puzzle: CavePuzzleData | ShapeMinesweeperPuzzleData;
  correctSolution: (0 | 1)[][];
  cellSize?: number;
}

function Diagram({
  puzzle,
  solution,
  cellSize,
}: {
  puzzle: Props['puzzle'];
  solution?: (0 | 1)[][];
  cellSize: number;
}) {
  const { outerWidth, outerHeight } = getBoardFrameDimensions(
    puzzle.width,
    puzzle.height,
    cellSize,
    { borderWidth: commonBoardChrome.border, padding: commonBoardChrome.padding }
  );

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain pb-1">
      <div className="flex w-max min-w-full justify-center">
        <div
          className="relative select-none"
          style={{
            width: `${outerWidth}px`,
            height: `${outerHeight}px`,
            ...getBoardFrameStyle(commonBoardChrome.border),
          }}
        >
          <div
            className="absolute grid"
            style={getBoardGridStyle(commonBoardChrome.padding, commonBoardChrome.padding, puzzle.width, cellSize)}
          >
            {Array.from({ length: puzzle.height }, (_, row) =>
              Array.from({ length: puzzle.width }, (_, col) => {
                const clue = puzzle.clues[row][col];
                const shaded = solution?.[row]?.[col] === 1;
                return (
                  <div
                    key={`${row}-${col}`}
                    className={boardClassNames.cellContent}
                    style={{
                      ...getBoardCellStyle(cellSize, shaded ? 'playerShaded' : clue === null ? 'cell' : 'clue'),
                      ...getBoardTextStyle(cellSize),
                    }}
                  >
                    {clue}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExamplePanel({
  puzzle,
  solution,
  cellSize,
}: {
  puzzle: Props['puzzle'];
  solution?: (0 | 1)[][];
  cellSize: number;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-3">
      <Diagram puzzle={puzzle} solution={solution} cellSize={cellSize} />
      {puzzle.type === 'shape-minesweeper' ? (
        <ShapeInventory shapes={puzzle.shapes} cellSize={boardLayoutMetrics.compactInventoryCellSize} />
      ) : null}
    </div>
  );
}

export default function ShadingPuzzleExample({
  puzzle,
  correctSolution,
  cellSize: cellSizeProp,
}: Props) {
  const contextCellSize = useExampleCellSize();
  return <ExamplePanel puzzle={puzzle} solution={correctSolution} cellSize={cellSizeProp ?? contextCellSize} />;
}
