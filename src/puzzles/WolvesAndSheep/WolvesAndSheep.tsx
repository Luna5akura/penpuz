import { useCallback, useMemo } from 'react';
import SlitherlinkBoard from '../Slitherlink/Slitherlink';
import { commonBoardChrome, getBoardSvgTextProps, woodBoardTheme } from '../boardTheme';
import type { SlitherlinkPuzzleData, WolvesAndSheepPuzzleData } from '../types';
import WolvesAndSheepSymbol from './WolvesAndSheepSymbol';
import { validateWolvesAndSheep } from './utils';

interface Props {
  puzzle: WolvesAndSheepPuzzleData;
  startTime: number;
  resetToken: number;
  onComplete: (time: number) => void;
  initialSnapshot?: unknown;
  onSnapshotChange?: (snapshot: unknown) => void;
  fixedCellSize?: number;
  showValidationMessage?: boolean;
}

const BOARD_PADDING = commonBoardChrome.padding;

function toSlitherlinkPuzzle(puzzle: WolvesAndSheepPuzzleData): SlitherlinkPuzzleData {
  return {
    type: 'slither',
    width: puzzle.width,
    height: puzzle.height,
    clues: puzzle.clues.map((row) => row.map((clue) =>
      clue === 'sheep' ? 5 : clue === 'wolf' ? 6 : clue
    )),
  };
}

export default function WolvesAndSheepBoard({
  puzzle,
  startTime,
  resetToken,
  onComplete,
  initialSnapshot,
  onSnapshotChange,
  fixedCellSize,
  showValidationMessage,
}: Props) {
  const slitherPuzzle = useMemo(() => toSlitherlinkPuzzle(puzzle), [puzzle]);
  const validateLines = useCallback(
    (lineEdges: string[]) => validateWolvesAndSheep(lineEdges, puzzle),
    [puzzle]
  );
  const renderClue = useCallback((clue: number, row: number, col: number, cellSize: number) => {
    const x = BOARD_PADDING + col * cellSize;
    const y = BOARD_PADDING + row * cellSize;

    if (clue === 5 || clue === 6) {
      return (
        <g transform={`translate(${x} ${y}) scale(${cellSize / 100})`}>
          <WolvesAndSheepSymbol kind={clue === 5 ? 'sheep' : 'wolf'} cellSize={cellSize} asSvg />
        </g>
      );
    }

    return (
      <text
        x={x + cellSize / 2}
        y={y + cellSize / 2}
        dominantBaseline="central"
        textAnchor="middle"
        fill={woodBoardTheme.border}
        {...getBoardSvgTextProps(cellSize)}
      >
        {clue}
      </text>
    );
  }, []);

  return (
    <SlitherlinkBoard
      puzzle={slitherPuzzle}
      startTime={startTime}
      resetToken={resetToken}
      onComplete={onComplete}
      initialSnapshot={initialSnapshot}
      onSnapshotChange={onSnapshotChange}
      fixedCellSize={fixedCellSize}
      showValidationMessage={showValidationMessage}
      validateLines={validateLines}
      renderClue={renderClue}
    />
  );
}

