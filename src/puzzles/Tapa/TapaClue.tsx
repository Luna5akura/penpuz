import { boardClassNames, getBoardTextStyle, woodBoardTheme } from '../boardTheme';
import type { TapaClue } from '../types';
import { getTapaClueValues } from './utils';

const cluePositions = {
  1: [{ left: '50%', top: '50%' }],
  2: [
    { left: '31%', top: '31%' },
    { left: '69%', top: '69%' },
  ],
  3: [
    { left: '27%', top: '31%' },
    { left: '50%', top: '69%' },
    { left: '73%', top: '31%' },
  ],
  4: [
    { left: '50%', top: '24%' },
    { left: '76%', top: '50%' },
    { left: '50%', top: '76%' },
    { left: '24%', top: '50%' },
  ],
} as const;

export default function TapaClue({
  clue,
  cellSize,
}: {
  clue: TapaClue;
  cellSize: number;
}) {
  const values = getTapaClueValues(clue);
  const positions = cluePositions[Math.min(values.length, 4) as 1 | 2 | 3 | 4];
  const textStyle = values.length === 1
    ? getBoardTextStyle(cellSize, 0.68, 6)
    : values.length === 2
      ? getBoardTextStyle(cellSize, 0.48, 6)
      : values.length === 3
        ? getBoardTextStyle(cellSize, 0.4, 6)
        : getBoardTextStyle(cellSize, 0.34, 6);

  return (
    <span
      className="relative block h-full w-full overflow-hidden"
      aria-label={values.join(', ')}
    >
      {values.slice(0, 4).map((value, index) => {
        const position = positions[index];
        return (
          <span
            key={`${value}-${index}`}
            className={`absolute -translate-x-1/2 -translate-y-1/2 ${boardClassNames.cellText}`}
            style={{
              left: position.left,
              top: position.top,
              color: woodBoardTheme.border,
              ...textStyle,
            }}
          >
            {value}
          </span>
        );
      })}
    </span>
  );
}
