import { boardClassNames, getBoardTextStyle } from '../boardTheme';

interface SlovakSumsClueProps {
  sum: number | null;
  count: number;
  cellSize: number;
}

export default function SlovakSumsClue({ sum, count, cellSize }: SlovakSumsClueProps) {
  const dotPadding = Math.max(2, cellSize * 0.09);
  const dotGap = Math.max(1, cellSize * 0.035);
  const maxDotDiameter = count > 0
    ? (cellSize - dotPadding * 2 - dotGap * (count - 1)) / count
    : 0;
  const dotDiameter = count > 0
    ? Math.max(2, Math.min(cellSize * 0.16, maxDotDiameter))
    : 0;
  const hasDots = count > 0;
  const sumSpace = cellSize - dotPadding - (hasDots ? dotPadding + dotDiameter + dotGap : 0);
  const sumTextStyle = getBoardTextStyle(cellSize, 0.56, 10, 1);
  const sumFontSize = Math.max(10, Math.min(Number.parseFloat(sumTextStyle.fontSize), Math.max(10, sumSpace)));

  return (
    <span
      className={`relative flex h-full w-full ${hasDots ? 'flex-col' : 'items-center justify-center'} ${boardClassNames.cellText}`}
      style={{
        boxSizing: 'border-box',
        overflow: 'hidden',
        paddingLeft: `${dotPadding}px`,
        paddingRight: `${dotPadding}px`,
        paddingTop: hasDots ? `${dotPadding}px` : undefined,
        paddingBottom: hasDots ? `${dotPadding}px` : undefined,
      }}
    >
      {sum !== null ? (
        <span
          className="block w-full shrink-0 text-center"
          style={{ ...sumTextStyle, fontSize: `${sumFontSize}px` }}
        >
          {sum}
        </span>
      ) : null}
      {hasDots ? (
        <span
          className="mt-auto flex w-full shrink-0 items-center justify-center"
          style={{
            gap: `${dotGap}px`,
          }}
          aria-label={`${count} 个格`}
        >
          {Array.from({ length: count }, (_, index) => (
            <span
              key={index}
              className="rounded-full bg-white"
              style={{
                width: `${dotDiameter}px`,
                height: `${dotDiameter}px`,
                flex: '0 0 auto',
              }}
            />
          ))}
        </span>
      ) : null}
    </span>
  );
}
