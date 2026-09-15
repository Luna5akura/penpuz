import NumberPlacementBoard from '../shared/NumberPlacementBoard';
import type { FourWindsPuzzleData } from '../types';
import { boardClassNames, getBoardTextStyle } from '../boardTheme';
import { validateFourWinds } from './utils';

const VALUES = [0, 1, 2, 3, 4];
const SYMBOLS = ['X', '↑', '→', '↓', '←'];

export default function FourWindsBoard({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange, fixedCellSize, showValidationMessage }: {
  puzzle: FourWindsPuzzleData; startTime: number; resetToken: number; onComplete: (time: number) => void;
  initialSnapshot?: unknown; onSnapshotChange?: (snapshot: unknown) => void; fixedCellSize?: number; showValidationMessage?: boolean;
}) {
  return <NumberPlacementBoard puzzle={puzzle} numbers={VALUES} cycleValues={VALUES} cellInputMode="cycle" startTime={startTime} resetToken={resetToken} onComplete={onComplete} validate={validateFourWinds} isBlockedCell={(row, col) => puzzle.clues[row][col] !== null} renderBlockedCell={(row, col, cellSize) => <span className={boardClassNames.cellText} style={getBoardTextStyle(cellSize, 0.65, 9)}>{puzzle.clues[row][col]}</span>} renderCellValue={(value, cellSize) => <span className={boardClassNames.cellText} style={getBoardTextStyle(cellSize, 0.55, 9)}>{typeof value === 'number' ? SYMBOLS[value] : ''}</span>} getCellTone={(row, col) => puzzle.clues[row][col] !== null ? 'clue' : 'cell'} fixedCellSize={fixedCellSize} initialSnapshot={initialSnapshot} onSnapshotChange={onSnapshotChange} showValidationMessage={showValidationMessage} />;
}
