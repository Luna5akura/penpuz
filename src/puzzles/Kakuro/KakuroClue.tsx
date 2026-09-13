import {
  boardClassNames,
  getBoardCellColors,
  getBoardClueDiagonalStrokeWidth,
  getBoardClueInset,
  getBoardTextStyle,
  woodBoardTheme,
} from '../boardTheme';
import { useI18n } from '@/i18n/useI18n';

interface KakuroClueProps {
  right: number | null;
  down: number | null;
  cellSize: number;
}

/** Standard Kakuro black cell: a diagonal with right/down sums. */
export default function KakuroClue({ right, down, cellSize }: KakuroClueProps) {
  const { locale, copy } = useI18n();
  const numberStyle = getBoardTextStyle(cellSize, 0.34, 10, 1);
  const padding = getBoardClueInset(cellSize);

  return (
    <span
      className="relative block h-full w-full overflow-hidden"
      aria-label={[right !== null ? `${copy.puzzles.kakuro.across} ${right}` : '', down !== null ? `${copy.puzzles.kakuro.down} ${down}` : '']
        .filter(Boolean)
        .join(locale === 'zh-CN' ? '，' : ', ') || copy.puzzles.kakuro.blackCell}
      style={getBoardCellColors('shaded')}
    >
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {/* Kakuro's standard slash runs from the upper-left to lower-right,
            leaving the right clue in the upper-right triangle and the down
            clue in the lower-left triangle. */}
        <line x1="0" y1="0" x2="100" y2="100" stroke={woodBoardTheme.whiteCell} strokeWidth={getBoardClueDiagonalStrokeWidth()} />
      </svg>
      {right !== null ? (
        <span
          className={`absolute right-0 top-0 text-right ${boardClassNames.cellTextTight}`}
          style={{ ...numberStyle, paddingTop: `${padding}px`, paddingRight: `${padding}px` }}
        >
          {right}
        </span>
      ) : null}
      {down !== null ? (
        <span
          className={`absolute bottom-0 left-0 text-left ${boardClassNames.cellTextTight}`}
          style={{ ...numberStyle, paddingBottom: `${padding}px`, paddingLeft: `${padding}px` }}
        >
          {down}
        </span>
      ) : null}
    </span>
  );
}
