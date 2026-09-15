import NumberPlacementBoard from '../shared/NumberPlacementBoard';
import type { JapaneseSumsWithZeroesPuzzleData } from '../types';
import { boardClassNames, getBoardTextStyle, getBoardCenterMarkMetrics, woodBoardTheme } from '../boardTheme';
import { validateJapaneseSums } from './utils';
interface Props { puzzle: JapaneseSumsWithZeroesPuzzleData; startTime: number; resetToken: number; onComplete: (time: number) => void; initialSnapshot?: unknown; onSnapshotChange?: (snapshot: unknown) => void; fixedCellSize?: number; showValidationMessage?: boolean; }
export default function JapaneseSumsBoard({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange, fixedCellSize, showValidationMessage }: Props) {
  const outsideClues = { top: puzzle.clues.top.map((v) => v[0] ?? null), left: puzzle.clues.left.map((v) => v[0] ?? null) };
  const renderValue = (value: number | 'circle' | 'cross' | null, cellSize: number) => {
    if (value !== 'circle' && value !== 'cross') return <span className={boardClassNames.cellText} style={getBoardTextStyle(cellSize, 0.65, 9)}>{value}</span>;
    const { radius, crossSize, strokeWidth } = getBoardCenterMarkMetrics(cellSize);
    const center = cellSize / 2;
    return <svg className="pointer-events-none" width={cellSize} height={cellSize} viewBox={`0 0 ${cellSize} ${cellSize}`} aria-hidden="true">
      {value === 'circle' ? <circle cx={center} cy={center} r={radius} fill="none" stroke={woodBoardTheme.border} strokeWidth={strokeWidth} /> : <g stroke={woodBoardTheme.border} strokeWidth={strokeWidth} strokeLinecap="round"><line x1={center - crossSize} y1={center - crossSize} x2={center + crossSize} y2={center + crossSize} /><line x1={center - crossSize} y1={center + crossSize} x2={center + crossSize} y2={center - crossSize} /></g>}
    </svg>;
  };
  const digits = Array.from({ length: puzzle.maxDigit + 1 }, (_, i) => i);
  return <NumberPlacementBoard puzzle={puzzle} numbers={digits} cycleValues={['circle', ...digits, 'cross']} cycleValuesLeft={['circle', ...digits, 'cross']} cycleValuesRight={['cross', ...digits.slice().reverse(), 'circle']} extraCellValues={['circle','cross']} cellInputMode="cycle" startTime={startTime} resetToken={resetToken} onComplete={onComplete} validate={validateJapaneseSums} outsideClues={outsideClues} outsideClueStacks={puzzle.clues} renderCellValue={renderValue} fixedCellSize={fixedCellSize} initialSnapshot={initialSnapshot} onSnapshotChange={onSnapshotChange} showValidationMessage={showValidationMessage} />;
}
