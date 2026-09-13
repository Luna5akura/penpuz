import { useCallback, useMemo } from 'react';
import type { KoburinPuzzleData, YajilinClue } from '../types';
import YajilinBoard from '../Yajilin/Yajilin';
import type { YajilinCellState } from '../Yajilin/utils';
import { validateKoburin } from './utils';
import {
  boardClassNames,
  getBoardFixedTextStyle,
  getDirectionalClueNumberFontSize,
} from '../boardTheme';

interface Props {
  puzzle: KoburinPuzzleData;
  startTime: number;
  resetToken: number;
  onComplete: (time: number) => void;
  initialSnapshot?: unknown;
  onSnapshotChange?: (snapshot: unknown) => void;
  fixedCellSize?: number;
  showValidationMessage?: boolean;
}

/**
 * Koburin uses the same cell-centre loop interaction as Yajilin.  The board
 * is intentionally shared so pointer gestures, trial branches and replay
 * snapshots stay identical across the two loop variants; only clue rendering
 * and validation differ.
 */
export function KoburinBoard({
  puzzle,
  startTime,
  resetToken,
  onComplete,
  initialSnapshot,
  onSnapshotChange,
  fixedCellSize,
  showValidationMessage = false,
}: Props) {
  const adaptedPuzzle = useMemo(() => ({
    type: 'yajilin' as const,
    width: puzzle.width,
    height: puzzle.height,
    clues: puzzle.clues.map((clue) => ({
      row: clue.row,
      col: clue.col,
      value: clue.value,
      direction: 'up' as const,
    })),
  }), [puzzle.clues, puzzle.height, puzzle.width]);

  const validate = useCallback((
    grid: YajilinCellState[][],
    loopEdges: Set<string>,
  ) => validateKoburin(grid, loopEdges, puzzle), [puzzle]);

  const renderClue = useCallback((clue: YajilinClue, cellSize: number) => (
    <span
      className={`flex h-full w-full items-center justify-center ${boardClassNames.cellText}`}
      style={getBoardFixedTextStyle(getDirectionalClueNumberFontSize(cellSize))}
    >
      {clue.value}
    </span>
  ), []);

  return (
    <YajilinBoard
      puzzle={adaptedPuzzle}
      startTime={startTime}
      resetToken={resetToken}
      onComplete={onComplete}
      initialSnapshot={initialSnapshot}
      onSnapshotChange={onSnapshotChange}
      fixedCellSize={fixedCellSize}
      showValidationMessage={showValidationMessage}
      validateBoard={validate}
      renderClue={renderClue}
    />
  );
}

export default KoburinBoard;
