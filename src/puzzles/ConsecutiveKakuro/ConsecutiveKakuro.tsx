import { useCallback } from 'react';
import { useI18n } from '@/i18n/useI18n';
import NumberPlacementBoard from '../shared/NumberPlacementBoard';
import type { ConsecutiveKakuroPuzzleData } from '../types';
import { boardClassNames, getBoardTextStyle, boardStrokeWidths, woodBoardTheme } from '../boardTheme';
import KakuroClue from '../Kakuro/KakuroClue';
import { validateConsecutiveKakuro } from './utils';

const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export default function ConsecutiveKakuroBoard({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange, fixedCellSize, showValidationMessage }: {
  puzzle: ConsecutiveKakuroPuzzleData; startTime: number; resetToken: number; onComplete: (time: number) => void;
  initialSnapshot?: unknown; onSnapshotChange?: (snapshot: unknown) => void; fixedCellSize?: number; showValidationMessage?: boolean;
}) {
  const { copy } = useI18n();
  const isBlocked = useCallback((row: number, col: number) => puzzle.cells[row][col] !== null, [puzzle.cells]);
  const renderOverlay = useCallback((cellSize: number) => <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${puzzle.width * cellSize} ${puzzle.height * cellSize}`} preserveAspectRatio="none">
    {puzzle.horizontalBars.flatMap((row, r) => row.map((bar, c) => bar ? <line key={`h-${r}-${c}`} x1={(c + 1) * cellSize - 2} y1={r * cellSize + cellSize / 2} x2={(c + 1) * cellSize + 2} y2={r * cellSize + cellSize / 2} stroke={woodBoardTheme.whiteCell} strokeWidth={boardStrokeWidths.selection} /> : null))}
    {puzzle.verticalBars.flatMap((row, r) => row.map((bar, c) => bar ? <line key={`v-${r}-${c}`} x1={c * cellSize + cellSize / 2} y1={(r + 1) * cellSize - 2} x2={c * cellSize + cellSize / 2} y2={(r + 1) * cellSize + 2} stroke={woodBoardTheme.whiteCell} strokeWidth={boardStrokeWidths.selection} /> : null))}
  </svg>, [puzzle.horizontalBars, puzzle.verticalBars, puzzle.height, puzzle.width]);
  return <NumberPlacementBoard puzzle={puzzle} numbers={NUMBERS} startTime={startTime} resetToken={resetToken} onComplete={onComplete} validate={validateConsecutiveKakuro} isBlockedCell={isBlocked} renderBlockedCell={(row, col, cellSize) => { const clue = puzzle.cells[row][col]; return clue ? <KakuroClue right={clue.right} down={clue.down} cellSize={cellSize} /> : null; }} renderCellValue={(value, cellSize) => <span className={boardClassNames.cellText} style={getBoardTextStyle(cellSize, 0.7, 12)}>{value}</span>} renderOverlay={renderOverlay} inputModeOptions={[{ mode: 'select', label: copy.shared.numberInputModes.normal }, { mode: 'candidates', label: copy.shared.numberInputModes.candidates }]} showValueButtons fixedCellSize={fixedCellSize} initialSnapshot={initialSnapshot} onSnapshotChange={onSnapshotChange} showValidationMessage={showValidationMessage} />;
}
