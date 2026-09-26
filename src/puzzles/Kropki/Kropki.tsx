import { useCallback } from 'react';
import { useI18n } from '@/i18n/useI18n';
import NumberPlacementBoard from '../shared/NumberPlacementBoard';
import { woodBoardTheme } from '../boardTheme';
import type { KropkiDot, KropkiPuzzleData } from '../types';
import { validateKropki } from './utils';

interface Props {
  puzzle: KropkiPuzzleData;
  startTime: number;
  resetToken: number;
  onComplete: (time: number) => void;
  initialSnapshot?: unknown;
  onSnapshotChange?: (snapshot: unknown) => void;
  fixedCellSize?: number;
  showValidationMessage?: boolean;
}

function KropkiDotMark({ dot, cellSize }: { dot: KropkiDot | null; cellSize: number }) {
  if (dot === null) return null;
  const radius = Math.max(3, cellSize * 0.09);
  const center = cellSize / 2;
  const strokeWidth = Math.max(1, radius * 0.28);
  if (dot === 'black') {
    return <circle cx={center} cy={center} r={radius} fill={woodBoardTheme.border} />;
  }
  // White dot: hollow circle.  Either: hollow circle with an × inside,
  // meaning "this pair must be 1 and 2 and the dot could be either colour".
  const cross = radius * 0.55;
  return (
    <>
      <circle cx={center} cy={center} r={radius} fill="#fffdf9" stroke={woodBoardTheme.border} strokeWidth={strokeWidth} />
      {dot === 'either' ? (
        <g stroke={woodBoardTheme.border} strokeWidth={strokeWidth} strokeLinecap="round">
          <line x1={center - cross} y1={center - cross} x2={center + cross} y2={center + cross} />
          <line x1={center - cross} y1={center + cross} x2={center + cross} y2={center - cross} />
        </g>
      ) : null}
    </>
  );
}

export default function KropkiBoard({
  puzzle,
  startTime,
  resetToken,
  onComplete,
  initialSnapshot,
  onSnapshotChange,
  fixedCellSize,
  showValidationMessage,
}: Props) {
  const { copy } = useI18n();
  const getFixedValue = useCallback(
    (row: number, col: number) => puzzle.givens[row][col],
    [puzzle.givens]
  );

  const renderOverlay = useCallback(
    (cellSize: number, boardWidthPx: number, boardHeightPx: number) => (
      <svg width={boardWidthPx} height={boardHeightPx} viewBox={`0 0 ${boardWidthPx} ${boardHeightPx}`}>
        {puzzle.verticalDots.flatMap((row, rowIndex) =>
          row.map((dot, colIndex) =>
            dot === null ? null : (
              <svg
                key={`v-${rowIndex}-${colIndex}`}
                x={(colIndex + 1) * cellSize - cellSize / 2}
                y={(rowIndex + 0.5) * cellSize - cellSize / 2}
                width={cellSize}
                height={cellSize}
                viewBox={`0 0 ${cellSize} ${cellSize}`}
              >
                <KropkiDotMark dot={dot} cellSize={cellSize} />
              </svg>
            )
          )
        )}
        {puzzle.horizontalDots.flatMap((row, rowIndex) =>
          row.map((dot, colIndex) =>
            dot === null ? null : (
              <svg
                key={`h-${rowIndex}-${colIndex}`}
                x={(colIndex + 0.5) * cellSize - cellSize / 2}
                y={(rowIndex + 1) * cellSize - cellSize / 2}
                width={cellSize}
                height={cellSize}
                viewBox={`0 0 ${cellSize} ${cellSize}`}
              >
                <KropkiDotMark dot={dot} cellSize={cellSize} />
              </svg>
            )
          )
        )}
      </svg>
    ),
    [puzzle.horizontalDots, puzzle.verticalDots]
  );

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col items-center gap-3">
      <div className="w-full text-right text-sm font-semibold text-muted-foreground">
        {copy.shared.numberRange(1, puzzle.width)}
      </div>
      <NumberPlacementBoard
        puzzle={puzzle}
        numbers={Array.from({ length: puzzle.width }, (_, index) => index + 1)}
        startTime={startTime}
        resetToken={resetToken}
        onComplete={onComplete}
        validate={validateKropki}
        getFixedValue={getFixedValue}
        renderOverlay={renderOverlay}
        getCellTone={(row, col) => (puzzle.givens[row][col] !== null ? 'clue' : 'cell')}
        cellInputMode="cycle"
        cycleValues={[null, ...Array.from({ length: puzzle.width }, (_, index) => index + 1)]}
        showValueButtons
        initialSnapshot={initialSnapshot}
        onSnapshotChange={onSnapshotChange}
        fixedCellSize={fixedCellSize}
        showValidationMessage={showValidationMessage}
      />
    </div>
  );
}
