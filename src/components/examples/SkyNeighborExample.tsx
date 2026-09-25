import { useResponsiveExampleCellSize } from './exampleCellSizeContext';
import { ExampleCellSizeProvider } from './ExampleBoardChrome';
import { useMemo, useState } from 'react';
import ExampleAnswerReveal from '@/components/ExampleAnswerReveal';
import SkyNeighborBoard from '@/puzzles/SkyNeighbor/SkyNeighbor';
import BoardCellOutline from '@/puzzles/shared/BoardCellOutline';
import { getSkyNeighborVisibilityClues } from '@/puzzles/SkyNeighbor/utils';
import type {
  NeighborDigit,
  SkyNeighborClues,
  SkyNeighborOutsideGrayCells,
  SkyNeighborPuzzleData,
} from '@/puzzles/types';
import {
  boardClassNames,
  commonBoardChrome,
  getBoardCellStyle,
  getBoardFrameDimensions,
  getBoardFrameStyle,
  getBoardGridStyle,
  getBoardTextStyle,
  getRoomBoundaryStrokeWidth,
  woodBoardTheme,
} from '@/puzzles/boardTheme';

interface Props {
  width: number;
  height: number;
  givens: (NeighborDigit | null)[][];
  grayCells: boolean[][];
  clues: SkyNeighborClues;
  outsideGrayCells?: SkyNeighborOutsideGrayCells;
  correctGrid: NeighborDigit[][];
  playableLabel: string;
  answerLabel: string;
}

// Match the standard example cell size while preserving square ring geometry.

function getOutsideGray(
  outsideGrayCells: SkyNeighborOutsideGrayCells | undefined,
  width: number,
  height: number
): SkyNeighborOutsideGrayCells {
  return outsideGrayCells ?? {
    top: Array<boolean>(width).fill(false),
    right: Array<boolean>(height).fill(false),
    bottom: Array<boolean>(width).fill(false),
    left: Array<boolean>(height).fill(false),
  };
}

function SkyNeighborDiagram({
  width,
  height,
  clues,
  grayCells,
  outsideGrayCells,
  values,
}: {
  width: number;
  height: number;
  clues: SkyNeighborClues;
  grayCells: boolean[][];
  outsideGrayCells?: SkyNeighborOutsideGrayCells;
  values?: NeighborDigit[][];
}) {
  const CELL_SIZE = useExampleCellSize();
  const CLUE_GUTTER = CELL_SIZE;
  const outside = getOutsideGray(outsideGrayCells, width, height);
  const { outerWidth, outerHeight } = getBoardFrameDimensions(
    width + 2,
    height + 2,
    CELL_SIZE,
    { borderWidth: commonBoardChrome.border, padding: commonBoardChrome.padding }
  );

  const renderCell = (row: number, col: number) => {
    const isCorner = (row === 0 || row === height + 1) && (col === 0 || col === width + 1);
    const cellWidth = col === 0 || col === width + 1 ? CLUE_GUTTER : CELL_SIZE;
    const cellHeight = row === 0 || row === height + 1 ? CLUE_GUTTER : CELL_SIZE;
    if (isCorner) {
      return <div key={`${row}-${col}`} style={{ width: `${cellWidth}px`, height: `${cellHeight}px` }} />;
    }

    const inner = row > 0 && row <= height && col > 0 && col <= width;
    const innerRow = row - 1;
    const innerCol = col - 1;
    const isGray = inner
      ? grayCells[innerRow]?.[innerCol] === true
      : row === 0
        ? outside.top[col - 1] === true
        : row === height + 1
          ? outside.bottom[col - 1] === true
          : col === 0
            ? outside.left[row - 1] === true
            : outside.right[row - 1] === true;
    const value = inner
      ? values?.[innerRow]?.[innerCol] ?? null
      : row === 0
        ? clues.top[col - 1]
        : row === height + 1
          ? clues.bottom[col - 1]
          : col === 0
            ? clues.left[row - 1]
            : clues.right[row - 1];

    return (
      <div
        key={`${row}-${col}`}
        className={boardClassNames.cellContent}
        style={{
          ...getBoardCellStyle(CELL_SIZE, isGray ? 'outlined' : 'cell'),
          ...getBoardTextStyle(CELL_SIZE, inner ? 0.68 : 0.48, 14),
        }}
      >
        {isGray ? <BoardCellOutline cellSize={Math.min(cellWidth, cellHeight)} /> : null}
        {value ?? null}
      </div>
    );
  };

  return (
    <div
      className="relative mx-auto select-none"
      style={{
        width: `${outerWidth}px`,
        height: `${outerHeight}px`,
        ...getBoardFrameStyle(),
        maxWidth: 'none',
      }}
    >
      <div
        className="grid"
        style={getBoardGridStyle(
          commonBoardChrome.padding,
          commonBoardChrome.padding,
          width + 2,
          CELL_SIZE
        )}
      >
        {Array.from({ length: height + 2 }, (_, row) =>
          Array.from({ length: width + 2 }, (_, col) => renderCell(row, col))
        )}
      </div>
      <div
        className="pointer-events-none absolute"
        aria-hidden="true"
        style={{
          left: `${commonBoardChrome.padding + CLUE_GUTTER}px`,
          top: `${commonBoardChrome.padding + CLUE_GUTTER}px`,
          width: `${width * CELL_SIZE}px`,
          height: `${height * CELL_SIZE}px`,
          border: `${getRoomBoundaryStrokeWidth() + 1}px solid ${woodBoardTheme.border}`,
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

export default function SkyNeighborExample({
  width,
  height,
  givens,
  grayCells,
  clues,
  outsideGrayCells,
  correctGrid,
  playableLabel,
  answerLabel,
}: Props) {
  // The board includes the outside answer ring, so reserve width + 2 cell
  // columns when fitting the example to the column width.
  const { containerRef, cellSize } = useResponsiveExampleCellSize(width + 2);
  const [showAnswer, setShowAnswer] = useState(false);
  const [exampleStartTime] = useState(() => Date.now());
  const puzzle = useMemo<SkyNeighborPuzzleData>(
    () => ({
      type: 'sky-neighbor',
      width,
      height,
      givens,
      grayCells,
      clues,
      outsideGrayCells,
    }),
    [clues, grayCells, givens, height, outsideGrayCells, width]
  );
  const answerClues = useMemo<SkyNeighborClues>(() => {
    // The WPF answer diagram includes the visibility values even though the
    // puzzle's outside cells start blank. Fall back to the supplied values
    // for malformed/partial example data.
    return getSkyNeighborVisibilityClues(correctGrid) ?? clues;
  }, [clues, correctGrid]);

  return (
    <div className="grid min-w-0 gap-6 md:grid-cols-2">
      <div className="min-w-0">
        <p className="mb-4 text-center text-base font-medium text-muted-foreground">{playableLabel}</p>
        <div ref={containerRef} className="w-full min-w-0 max-w-full overflow-hidden">
          <div className="w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain pb-1">
          <div className="mx-auto w-max min-w-0">
  <SkyNeighborBoard
              puzzle={puzzle}
              startTime={exampleStartTime}
              resetToken={0}
              onComplete={() => setShowAnswer(true)}
              fixedCellSize={cellSize}
            />
          </div>
        </div>
        </div>
      </div>
      <div className="min-w-0">
        <p className="mb-4 text-center text-base font-medium text-muted-foreground">{answerLabel}</p>
        <ExampleAnswerReveal
          visible={showAnswer}
          onVisibleChange={setShowAnswer}
          ariaLabel={answerLabel}
          className="flex max-w-full justify-start overflow-x-auto overscroll-x-contain pb-1 md:justify-center"
        >
          <ExampleCellSizeProvider cellSize={cellSize}>
            <SkyNeighborDiagram
              width={width}
              height={height}
              clues={answerClues}
              grayCells={grayCells}
              outsideGrayCells={outsideGrayCells}
              values={correctGrid}
            />
          </ExampleCellSizeProvider>
        </ExampleAnswerReveal>
      </div>
    </div>
  );
}
