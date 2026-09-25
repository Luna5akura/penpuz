// src/components/examples/NurikabeExample.tsx
import {
  boardClassNames,
  commonBoardChrome,
  getBoardCellStyle,
  getBoardFrameDimensions,
  getBoardFrameStyle,
  getBoardGridStyle,
  getBoardTextStyle,
} from '../../puzzles/boardTheme';
import type { NurikabeClue } from '../../puzzles/types';
import { useExampleCellSize } from './exampleCellSizeContext';

interface Props {
  width: number;
  height: number;
  clues: NurikabeClue[];
  correctSolution: (0 | 1)[][];
}

const BOARD_PADDING = commonBoardChrome.padding;
const BOARD_BORDER = commonBoardChrome.border;

const getClueValue = (clues: NurikabeClue[], r: number, c: number) => {
  const clue = clues.find((item) => item.row === r && item.col === c);
  return clue ? clue.value : '';
};

/** Official answer diagram shown after the playable example is solved. */
export default function NurikabeExample({ width, height, clues, correctSolution }: Props) {
  const CELL_SIZE = useExampleCellSize();
  const { outerWidth, outerHeight } = getBoardFrameDimensions(width, height, CELL_SIZE, {
    borderWidth: BOARD_BORDER,
    padding: BOARD_PADDING,
  });

  return (
    <div
      className="relative select-none"
      style={{
        width: `${outerWidth}px`,
        height: `${outerHeight}px`,
        ...getBoardFrameStyle(BOARD_BORDER),
      }}
    >
      <div
        className="grid"
        style={getBoardGridStyle(BOARD_PADDING, BOARD_PADDING, width, CELL_SIZE)}
      >
        {correctSolution.flatMap((row, r) =>
          row.map((isBlack, c) => (
            <div
              key={`${r}-${c}`}
              className={`flex items-center justify-center border-0 ${boardClassNames.cellTextTight}`}
              style={{
                ...getBoardCellStyle(CELL_SIZE, isBlack ? 'shaded' : 'cell'),
                ...getBoardTextStyle(CELL_SIZE),
              }}
            >
              {getClueValue(clues, r, c)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
