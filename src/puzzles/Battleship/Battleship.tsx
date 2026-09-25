import { useCallback, useMemo, useRef } from 'react';
import ShadingBoard, { type ShadingCellState } from '../shared/ShadingBoard';
import { getCellKey } from '../gridUtils';
import { getTrialLevelColors } from '../trialStyles';
import { getBoardTrialCellStyle } from '../boardTheme';
import type { BattleshipPuzzleData } from '../types';
import {
  getBattleshipNeighborConnections,
  getBattleshipOccupiedGrid,
  getBattleshipPlacedShapeCounts,
  getBattleshipWaterClueKeys,
  getSegmentConnections,
  inferBattleshipSegment,
  isBattleshipSegmentResolved,
  validateBattleship,
} from './utils';
import {
  BattleshipFleet,
  BattleshipSegmentSymbol,
  BattleshipWaterSymbol,
} from './BattleshipVisuals';

interface Props {
  puzzle: BattleshipPuzzleData;
  startTime: number;
  resetToken: number;
  onComplete: (time: number) => void;
  initialSnapshot?: unknown;
  onSnapshotChange?: (snapshot: unknown) => void;
  fixedCellSize?: number;
  showValidationMessage?: boolean;
}

export default function BattleshipBoard({
  puzzle,
  startTime,
  resetToken,
  onComplete,
  initialSnapshot,
  onSnapshotChange,
  fixedCellSize,
  showValidationMessage,
}: Props) {
  const clueMap = useMemo(
    () => new Map(puzzle.cellClues.map((clue) => [getCellKey(clue.row, clue.col), clue])),
    [puzzle.cellClues]
  );
  const isLockedCell = useCallback(
    (row: number, col: number) => clueMap.has(getCellKey(row, col)),
    [clueMap]
  );
  const waterClueKeys = useMemo(() => getBattleshipWaterClueKeys(puzzle), [puzzle]);
  const givenShipKeys = useMemo(
    () => new Set(
      puzzle.cellClues
        .filter((clue) => clue.kind === 'ship')
        .map((clue) => getCellKey(clue.row, clue.col))
    ),
    [puzzle.cellClues]
  );
  const occupiedCache = useRef<{
    puzzle: BattleshipPuzzleData;
    grid: ShadingCellState[][];
    occupied: boolean[][];
  } | null>(null);
  const getOccupied = useCallback((grid: ShadingCellState[][]) => {
    if (occupiedCache.current?.puzzle === puzzle && occupiedCache.current.grid === grid) {
      return occupiedCache.current.occupied;
    }

    const occupied = getBattleshipOccupiedGrid(grid, puzzle);
    occupiedCache.current = { puzzle, grid, occupied };
    return occupied;
  }, [puzzle]);

  return (
    <ShadingBoard
      puzzle={puzzle}
      startTime={startTime}
      resetToken={resetToken}
      onComplete={onComplete}
      validate={validateBattleship}
      initialSnapshot={initialSnapshot}
      onSnapshotChange={onSnapshotChange}
      fixedCellSize={fixedCellSize}
      showValidationMessage={showValidationMessage}
      outsideClues={{ top: puzzle.columnClues, left: puzzle.rowClues }}
      outsideClueCellTextSize
      renderBoardAccessory={(cellSize, grid) => (
        <BattleshipFleet
          fleet={puzzle.fleet}
          boardCellSize={cellSize}
          usedCounts={getBattleshipPlacedShapeCounts(grid, puzzle)}
        />
      )}
      isLockedCell={isLockedCell}
      getCellTone={(row, col, state) => {
        if (clueMap.has(getCellKey(row, col))) return 'clue';
        if (state === 2) return 'marked';
        return 'cell';
      }}
      getTrialCellStyle={(_row, _col, state, level) => {
        if (state !== 1) return undefined;
        const trialColors = getTrialLevelColors(level);
        return getBoardTrialCellStyle(trialColors, 'soft', trialColors?.line);
      }}
      renderCellContent={(row, col, state: ShadingCellState, cellSize, grid, levels) => {
        const clue = clueMap.get(getCellKey(row, col));
        if (clue?.kind === 'water') return <BattleshipWaterSymbol cellSize={cellSize} />;

        const occupied = getOccupied(grid);
        const neighbors = getBattleshipNeighborConnections(occupied, row, col);
        if (clue?.kind === 'ship') {
          const segment = clue.segment ?? 'unknown';
          const implied = getSegmentConnections(segment);
          // A drawn neighbour in a direction the given shape does not imply
          // extends the clue; its open sides then render like ordinary
          // endpoints (round only when blocked, diamond otherwise).
          const directionDeltas = { top: [-1, 0], right: [0, 1], bottom: [1, 0], left: [0, -1] } as const;
          const extended = (Object.keys(directionDeltas) as Array<keyof typeof directionDeltas>).some((direction) => {
            if (!neighbors[direction]) return false;
            const [dr, dc] = directionDeltas[direction];
            if (givenShipKeys.has(getCellKey(clue.row + dr, clue.col + dc))) return false;
            return !implied[direction];
          });
          return (
            <BattleshipSegmentSymbol
              segment={segment}
              cellSize={cellSize}
              given
              neighbors={neighbors}
              extended={extended}
              resolved={isBattleshipSegmentResolved(grid, puzzle, occupied, clue.row, clue.col, waterClueKeys)}
            />
          );
        }

        if (state !== 1) return undefined;
        return (
          <BattleshipSegmentSymbol
            segment={inferBattleshipSegment(occupied, row, col)}
            cellSize={cellSize}
            resolved={isBattleshipSegmentResolved(grid, puzzle, occupied, row, col, waterClueKeys)}
            neighbors={neighbors}
            color={getTrialLevelColors(levels[row]?.[col] ?? 0)?.line}
          />
        );
      }}
    />
  );
}
