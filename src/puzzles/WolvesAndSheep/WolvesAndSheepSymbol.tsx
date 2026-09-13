import { getBoardIconStrokeWidth, getBoardSymbolDetailStrokeWidth, woodBoardTheme } from '../boardTheme';
import { useI18n } from '@/i18n/useI18n';

interface Props {
  kind: 'sheep' | 'wolf';
  cellSize: number;
  /** Render either an SVG group (for a loop board) or a regular inline icon. */
  asSvg?: boolean;
}

/** A small, theme-safe animal glyph used for fixed Sheep/Wolf clues. */
export default function WolvesAndSheepSymbol({ kind, cellSize, asSvg = false }: Props) {
  const { copy } = useI18n();
  const dark = kind === 'wolf';
  const fill = dark ? woodBoardTheme.darkCell : woodBoardTheme.whiteCell;
  const stroke = dark ? woodBoardTheme.darkCell : woodBoardTheme.neutralMid;
  const label = kind === 'sheep' ? copy.puzzles.wolvesAndSheep.sheep : copy.puzzles.wolvesAndSheep.wolf;

  const glyph = (
    <g aria-label={label}>
      <circle cx="50" cy="54" r="24" fill={fill} stroke={stroke} strokeWidth={getBoardIconStrokeWidth()} />
      <path
        d="M31 37 L28 20 L42 30 M69 37 L72 20 L58 30"
        fill={fill}
        stroke={stroke}
        strokeWidth={getBoardIconStrokeWidth()}
        strokeLinejoin="round"
      />
      <circle cx="42" cy="52" r="3.5" fill={dark ? woodBoardTheme.whiteCell : woodBoardTheme.neutralInk} />
      <circle cx="58" cy="52" r="3.5" fill={dark ? woodBoardTheme.whiteCell : woodBoardTheme.neutralInk} />
      <path
        d="M43 64 Q50 70 57 64"
        fill="none"
        stroke={dark ? woodBoardTheme.whiteCell : woodBoardTheme.neutralInk}
        strokeWidth={getBoardSymbolDetailStrokeWidth()}
        strokeLinecap="round"
      />
    </g>
  );

  if (asSvg) {
    return glyph;
  }

  return (
    <svg
      className="pointer-events-none"
      width={cellSize}
      height={cellSize}
      viewBox="0 0 100 100"
      role="img"
      aria-label={label}
      style={{
        width: '100%',
        height: '100%',
      }}
    >
      {glyph}
    </svg>
  );
}
