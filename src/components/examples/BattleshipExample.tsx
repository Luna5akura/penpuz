import { useMemo, useState } from 'react';
import ExampleAnswerReveal from '@/components/ExampleAnswerReveal';
import {
  boardClassNames,
  boardLayoutMetrics,
  commonBoardChrome,
  getBoardCellColors,
  getBoardFrameStyle,
  getBoardOutsideClueLayout,
  getBoardTextStyle,
  getCellDividerStyle,
  woodBoardTheme,
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
import type { BattleshipCellClue, BattleshipPuzzleData, BattleshipShipShape } from '@/puzzles/types';

interface Props {
  width: number;
  height: number;
  columnClues: (number | null)[];
  rowClues: (number | null)[];
  cellClues: BattleshipCellClue[];
  fleet: BattleshipShipShape[];
  correctSolution: (0 | 1)[][];
  playableLabel: string;
  answerLabel: string;
}

const CELL_SIZE = boardLayoutMetrics.compactExampleCellSize;

function BattleshipDiagram({
  puzzle,
  solution,
}: {
  puzzle: BattleshipPuzzleData;
  solution?: (0 | 1)[][];
}) {
  const clueMap = useMemo(
    () => new Map(puzzle.cellClues.map((clue) => [getCellKey(clue.row, clue.col), clue])),
    [puzzle.cellClues]
  );
  const grid = solution ?? Array.from(
    { length: puzzle.height },
    () => Array.from({ length: puzzle.width }, () => 0 as const)
  );
  const occupied = getBattleshipOccupiedGrid(grid, puzzle);
  const outsideClueLayout = getBoardOutsideClueLayout(CELL_SIZE, {
    top: puzzle.columnClues,
    left: puzzle.rowClues,
  });
  const gridLeft = commonBoardChrome.padding + outsideClueLayout.left;
  const gridTop = commonBoardChrome.padding + outsideClueLayout.top;
  const boardWidth = puzzle.width * CELL_SIZE;
  const boardHeight = puzzle.height * CELL_SIZE;
  const outerWidth = boardWidth + outsideClueLayout.left + outsideClueLayout.right + commonBoardChrome.padding * 2 + commonBoardChrome.border * 2;
  const outerHeight = boardHeight + outsideClueLayout.top + outsideClueLayout.bottom + commonBoardChrome.padding * 2 + commonBoardChrome.border * 2;

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
          style={{
            left: `${gridLeft}px`,
            top: `${gridTop}px`,
            gridTemplateColumns: `repeat(${puzzle.width}, ${CELL_SIZE}px)`,
          }}
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
                    width: `${CELL_SIZE}px`,
                    height: `${CELL_SIZE}px`,
                    ...getBoardCellColors(clue ? 'clue' : 'cell'),
                    ...getCellDividerStyle(),
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
                      resolved
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
              color: woodBoardTheme.border,
              ...getBoardTextStyle(CELL_SIZE, 0.48, 14),
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
              color: woodBoardTheme.border,
              ...getBoardTextStyle(CELL_SIZE, 0.48, 14),
            }}
          >
            {value}
          </span>
        ))}
      </div>
      <BattleshipFleet fleet={puzzle.fleet} boardCellSize={CELL_SIZE} compact />
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
  playableLabel,
  answerLabel,
}: Props) {
  const [showAnswer, setShowAnswer] = useState(false);
  const puzzle: BattleshipPuzzleData = {
    type: 'battleship',
    width,
    height,
    columnClues,
    rowClues,
    cellClues,
    fleet,
  };

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <div className="mb-4 text-center text-base font-medium text-muted-foreground">{playableLabel}</div>
          <div className="flex justify-center overflow-x-auto">
            <BattleshipDiagram puzzle={puzzle} />
          </div>
        </div>
        <div>
          <div className="mb-4 text-center text-base font-medium text-muted-foreground">{answerLabel}</div>
          <ExampleAnswerReveal
            visible={showAnswer}
            onVisibleChange={setShowAnswer}
            ariaLabel={answerLabel}
            className="flex justify-center overflow-x-auto"
          >
            <BattleshipDiagram puzzle={puzzle} solution={correctSolution} />
          </ExampleAnswerReveal>
        </div>
      </div>
    </>
  );
}
