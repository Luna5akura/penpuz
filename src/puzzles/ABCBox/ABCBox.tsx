import NumberPlacementBoard from '../shared/NumberPlacementBoard';
import type { ABCBoxPuzzleData } from '../types';
import { boardClassNames, getBoardTextStyle } from '../boardTheme';
import { validateABCBox } from './utils';
const LETTERS = ['', 'A', 'B', 'C'];
interface Props { puzzle: ABCBoxPuzzleData; startTime: number; resetToken: number; onComplete: (time: number) => void; initialSnapshot?: unknown; onSnapshotChange?: (snapshot: unknown) => void; fixedCellSize?: number; showValidationMessage?: boolean; }
export default function ABCBoxBoard({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange, fixedCellSize, showValidationMessage }: Props) {
  const getFixedValue = (r: number, c: number) => ({ A: 1, B: 2, C: 3 } as Record<string, number>)[puzzle.givens[r]?.[c] ?? ''] ?? null;
  return <NumberPlacementBoard puzzle={puzzle} numbers={[1,2,3]} cycleValues={[1,2,3]} cellInputMode="cycle" getFixedValue={getFixedValue} outsideClueStacks={puzzle.clues} startTime={startTime} resetToken={resetToken} onComplete={onComplete} validate={validateABCBox} renderCellValue={(value, cellSize) => <span className={boardClassNames.cellText} style={getBoardTextStyle(cellSize, 0.65, 9)}>{typeof value === 'number' ? LETTERS[value] : ''}</span>} fixedCellSize={fixedCellSize} initialSnapshot={initialSnapshot} onSnapshotChange={onSnapshotChange} showValidationMessage={showValidationMessage} />;
}
