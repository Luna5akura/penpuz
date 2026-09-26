import { useMemo } from 'react';
import {
  boardClassNames,
  commonBoardChrome,
  getBoardCellStyle,
  getBoardClueTextStyle,
  getBoardFrameDimensions,
  getBoardFrameStyle,
  getBoardGridStyle,
  getBoardOutsideClueLayout,
} from '@/puzzles/boardTheme';
import {
  BattleshipFleet,
  BattleshipSegmentSymbol,
  BattleshipWaterSymbol,
} from '@/puzzles/Battleship/BattleshipVisuals';
import {
  getBattleshipOccupiedGrid,
  getBattleshipNeighborConnections,
  inferBattleshipSegment,
} from '@/puzzles/Battleship/utils';
import { getCellKey } from '@/puzzles/gridUtils';
import { getBattleshipShapeKey } from '@/puzzles/Battleship/utils';
import type { BattleshipCellClue, BattleshipPuzzleData, BattleshipShipShape } from '@/puzzles/types';
import { useExampleCellSize } from './exampleCellSizeContext';

interface Props {
  width: number;
  height: number;
  columnClues: (number | null)[];
  rowClues: (number | null)[];
  cellClues: BattleshipCellClue[];
  fleet: BattleshipShipShape[];
  correctSolution: (0 | 1)[][];
}


function BattleshipDiagram({
  puzzle,
  solution,
}: {
  puzzle: BattleshipPuzzleData;
  solution?: (0 | 1)[][];
}) {
  const CELL_SIZE = useExampleCellSize();
  const clueMap = useMemo(
    () => new Map(puzzle.cellClues.map((clue) => [getCellKey(clue.row, clue.col), clue])),
    [puzzle.cellClues]
  );
  // The official answer places every fleet ship, so the whole bank is
  // grayed out, matching the board's determined-ship behavior.
  const answerUsedCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const shape of puzzle.fleet) {
      const key = getBattleshipShapeKey(shape);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [puzzle.fleet]);

  const grid = solution ?? Array.from(
    { length: puzzle.height },
    () => Array.from({ length: puzzle.width }, () => 0 as const)
  );
  const occupied = getBattleshipOccupiedGrid(grid, puzzle);
  const outsideClueLayout = getBoardOutsideClueLayout(CELL_SIZE, {
    top: puzzle.columnClues,
    left: puzzle.rowClues,
  });
  const { outerWidth, outerHeight } = getBoardFrameDimensions(
    puzzle.width,
    puzzle.height,
    CELL_SIZE,
    {
      outsideLeft: outsideClueLayout.left,
      outsideRight: outsideClueLayout.right,
      outsideTop: outsideClueLayout.top,
      outsideBottom: outsideClueLayout.bottom,
      borderWidth: commonBoardChrome.border,
      padding: commonBoardChrome.padding,
    }
  );
  const gridLeft = commonBoardChrome.padding + outsideClueLayout.left;
  const gridTop = commonBoardChrome.padding + outsideClueLayout.top;

  return (
    <div className="flex flex-col items-center gap-3">
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
          style={getBoardGridStyle(gridLeft, gridTop, puzzle.width, CELL_SIZE)}
        >
          {Array.from({ length: puzzle.height }, (_, row) =>
            Array.from({ length: puzzle.width }, (_, col) => {
              const clue = clueMap.get(getCellKey(row, col));
              const isShip = occupied[row][col];
              const neighbors = getBattleshipNeighborConnections(occupied, row, col);
              return (
                <div
                  key={`${row}-${col}`}
                  className={boardClassNames.cellContent}
                  style={{
                    ...getBoardCellStyle(CELL_SIZE, clue ? 'clue' : 'cell'),
                  }}
                >
                  {clue?.kind === 'water' ? <BattleshipWaterSymbol cellSize={CELL_SIZE} /> : null}
                  {clue?.kind === 'ship' ? (
                    <BattleshipSegmentSymbol
                      segment={clue.segment ?? 'unknown'}
                      cellSize={CELL_SIZE}
                      given
                      neighbors={neighbors}
                    />
                  ) : null}
                  {!clue && isShip ? (
                    <BattleshipSegmentSymbol
                      segment={inferBattleshipSegment(occupied, row, col)}
                      cellSize={CELL_SIZE}
                      // Single-cell ships stay diamond; only multi-cell
                      // ships render their resolved round caps.
                      resolved={Object.values(neighbors).some(Boolean)}
                      neighbors={neighbors}
                    />
                  ) : null}
                </div>
              );
            })
          )}
        </div>

        {puzzle.columnClues.map((value, col) => value === null ? null : (
          <span
            key={`top-${col}`}
            className="absolute -translate-x-1/2 -translate-y-1/2 text-center tabular-nums"
            style={{
              left: `${gridLeft + (col + 0.5) * CELL_SIZE}px`,
              top: `${commonBoardChrome.padding + outsideClueLayout.top / 2}px`,
              ...getBoardClueTextStyle(CELL_SIZE),
            }}
          >
            {value}
          </span>
        ))}
        {puzzle.rowClues.map((value, row) => value === null ? null : (
          <span
            key={`left-${row}`}
            className="absolute -translate-x-1/2 -translate-y-1/2 text-center tabular-nums"
            style={{
              left: `${commonBoardChrome.padding + outsideClueLayout.left / 2}px`,
              top: `${gridTop + (row + 0.5) * CELL_SIZE}px`,
              ...getBoardClueTextStyle(CELL_SIZE),
            }}
          >
            {value}
          </span>
        ))}
      </div>
      <BattleshipFleet
        fleet={puzzle.fleet}
        boardCellSize={CELL_SIZE}
        compact
        usedCounts={answerUsedCounts}
      />
    </div>
  );
}

export default function BattleshipExample({
  width,
  height,
  columnClues,
  rowClues,
  cellClues,
  fleet,
  correctSolution,
}: Props) {
  const puzzle: BattleshipPuzzleData = {
    type: 'battleship',
    width,
    height,
    columnClues,
    rowClues,
    cellClues,
    fleet,
  };

  return <BattleshipDiagram puzzle={puzzle} solution={correctSolution} />;
}
