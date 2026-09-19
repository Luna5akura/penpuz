import NumberPlacementBoard, { type NumberPlacementCellValue } from '../shared/NumberPlacementBoard';
import type { JapaneseSumsWithZeroesPuzzleData } from '../types';
import { boardClassNames, getBoardTextStyle } from '../boardTheme';
import { validateJapaneseSums } from './utils';
import BoardCellMark from '../shared/BoardCellMark';
interface Props { puzzle: JapaneseSumsWithZeroesPuzzleData; startTime: number; resetToken: number; onComplete: (time: number) => void; initialSnapshot?: unknown; onSnapshotChange?: (snapshot: unknown) => void; fixedCellSize?: number; showValidationMessage?: boolean; }
export default function JapaneseSumsBoard({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange, fixedCellSize, showValidationMessage }: Props) {
  const outsideClues = { top: puzzle.clues.top.map((v) => v[0] ?? null), left: puzzle.clues.left.map((v) => v[0] ?? null) };
  const renderValue = (value: NumberPlacementCellValue, cellSize: number) => {
    if (value !== 'circle' && value !== 'cross') return <span className={boardClassNames.cellText} style={getBoardTextStyle(cellSize, 0.65, 9)}>{value}</span>;
    return <BoardCellMark kind={value} cellSize={cellSize} />;
  };
  const digits = Array.from({ length: puzzle.maxDigit + 1 }, (_, i) => i);
  const getCellTone = (_row: number, _col: number, value: NumberPlacementCellValue) => (
    value === 'cross' ? 'marked' : 'cell'
  );
  return <NumberPlacementBoard puzzle={puzzle} numbers={digits} cycleValues={['circle', ...digits, 'cross']} cycleValuesLeft={['circle', ...digits, 'cross']} cycleValuesRight={['cross', ...digits.slice().reverse(), 'circle']} extraCellValues={['circle','cross']} cellInputMode="cycle" startTime={startTime} resetToken={resetToken} onComplete={onComplete} validate={validateJapaneseSums} outsideClues={outsideClues} outsideClueStacks={puzzle.clues} renderCellValue={renderValue} getCellTone={getCellTone} fixedCellSize={fixedCellSize} initialSnapshot={initialSnapshot} onSnapshotChange={onSnapshotChange} showValidationMessage={showValidationMessage} />;
}
