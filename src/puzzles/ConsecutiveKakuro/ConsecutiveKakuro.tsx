import { useCallback } from 'react';
import { useI18n } from '@/i18n/useI18n';
import NumberPlacementBoard from '../shared/NumberPlacementBoard';
import type { ConsecutiveKakuroPuzzleData } from '../types';
import { boardClassNames, getBoardCellColors, getBoardClueCircleMetrics, getBoardTextStyle, getKurarinClueColors } from '../boardTheme';
import KakuroClue from '../Kakuro/KakuroClue';
import { validateConsecutiveKakuro } from './utils';

const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export default function ConsecutiveKakuroBoard({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange, fixedCellSize, showValidationMessage }: {
  puzzle: ConsecutiveKakuroPuzzleData; startTime: number; resetToken: number; onComplete: (time: number) => void;
  initialSnapshot?: unknown; onSnapshotChange?: (snapshot: unknown) => void; fixedCellSize?: number; showValidationMessage?: boolean;
}) {
  const { copy } = useI18n();
  const isBlocked = useCallback((row: number, col: number) => puzzle.cells[row][col] !== null, [puzzle.cells]);
  const renderOverlay = useCallback((cellSize: number) => {
    // The white consecutive-bar markers reuse the white-dot clue style of
    // the dark-loop (Kurarin) boards: halo + dot tokens from boardTheme.
    const { radius, strokeWidth, outerRadiusOffset } = getBoardClueCircleMetrics(cellSize);
    const dotColors = getKurarinClueColors('white');
    const haloFill = getBoardCellColors('cell').background;
    const renderDot = (key: string, x: number, y: number) => (
      <g key={key}>
        <circle cx={x} cy={y} r={radius + outerRadiusOffset} fill={haloFill} />
        <circle cx={x} cy={y} r={radius} fill={dotColors.fill} stroke={dotColors.stroke} strokeWidth={strokeWidth} />
      </g>
    );
    return <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${puzzle.width * cellSize} ${puzzle.height * cellSize}`} preserveAspectRatio="none">
      {puzzle.horizontalBars.flatMap((row, r) => row.map((bar, c) => bar ? renderDot(`h-${r}-${c}`, (c + 1) * cellSize, r * cellSize + cellSize / 2) : null))}
      {puzzle.verticalBars.flatMap((row, r) => row.map((bar, c) => bar ? renderDot(`v-${r}-${c}`, c * cellSize + cellSize / 2, (r + 1) * cellSize) : null))}
    </svg>;
  }, [puzzle.horizontalBars, puzzle.verticalBars, puzzle.height, puzzle.width]);
  return <NumberPlacementBoard puzzle={puzzle} numbers={NUMBERS} startTime={startTime} resetToken={resetToken} onComplete={onComplete} validate={validateConsecutiveKakuro} isBlockedCell={isBlocked} renderBlockedCell={(row, col, cellSize, grid) => { const clue = puzzle.cells[row][col]; if (!clue) return null; const isSatisfied = (dr: number, dc: number, target: number | null) => { if (target === null) return false; let sum = 0; let r = row + dr; let c = col + dc; while (r >= 0 && r < puzzle.height && c >= 0 && c < puzzle.width && puzzle.cells[r][c] === null) { const cell = grid[r]?.[c]; if (typeof cell !== 'number') return false; sum += cell; r += dr; c += dc; } return sum === target; }; return <KakuroClue right={clue.right} down={clue.down} cellSize={cellSize} satisfiedRight={isSatisfied(0, 1, clue.right)} satisfiedDown={isSatisfied(1, 0, clue.down)} />; }} renderCellValue={(value, cellSize) => <span className={boardClassNames.cellText} style={getBoardTextStyle(cellSize, 0.7, 12)}>{typeof value === 'number' ? value : ''}</span>} renderCandidates={(values) => values.join(' ')} renderOverlay={renderOverlay} inputModeOptions={[{ mode: 'select', label: copy.shared.numberInputModes.normal }, { mode: 'candidates', label: copy.shared.numberInputModes.candidates }]} showValueButtons fixedCellSize={fixedCellSize} initialSnapshot={initialSnapshot} onSnapshotChange={onSnapshotChange} showValidationMessage={showValidationMessage} />;
}
