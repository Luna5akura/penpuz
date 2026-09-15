import { useCallback } from 'react';
import NumberPlacementBoard from '../shared/NumberPlacementBoard';
import type { JapaneseArrowsPuzzleData } from '../types';
import { boardClassNames, getBoardTextStyle } from '../boardTheme';
import { validateJapaneseArrows } from './utils';

const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const ARROWS: Record<string, string> = { N: '↑', NE: '↗', E: '→', SE: '↘', S: '↓', SW: '↙', W: '←', NW: '↖' };

export default function JapaneseArrowsBoard({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange, fixedCellSize, showValidationMessage }: {
  puzzle: JapaneseArrowsPuzzleData; startTime: number; resetToken: number; onComplete: (time: number) => void;
  initialSnapshot?: unknown; onSnapshotChange?: (snapshot: unknown) => void; fixedCellSize?: number; showValidationMessage?: boolean;
}) {
  const getFixedValue = useCallback((row: number, col: number) => puzzle.clues[row]?.[col] ?? null, [puzzle.clues]);
  return <NumberPlacementBoard puzzle={puzzle} numbers={NUMBERS} startTime={startTime} resetToken={resetToken} onComplete={onComplete} validate={validateJapaneseArrows} getFixedValue={getFixedValue} getCellTone={(row, col) => getFixedValue(row, col) === null ? 'cell' : 'clue'} fixedCellSize={fixedCellSize} initialSnapshot={initialSnapshot} onSnapshotChange={onSnapshotChange} showValidationMessage={showValidationMessage} renderCellValue={(value, cellSize, row, col) => <span className="relative flex h-full w-full items-center justify-center"><span className="absolute top-0 text-[0.55em] leading-none">{ARROWS[puzzle.arrows[row][col]]}</span><span className={boardClassNames.cellText} style={getBoardTextStyle(cellSize, 0.62, 9)}>{value}</span></span>} renderBlockedCell={(row, col, cellSize) => <span className="absolute inset-0 flex items-center justify-center" style={getBoardTextStyle(cellSize, 0.42, 8)}>{ARROWS[puzzle.arrows[row][col]]}<span className="absolute bottom-0 right-0.5 text-[0.65em]">{puzzle.clues[row][col]}</span></span>} />;
}
