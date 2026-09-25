import { useMemo, useState } from 'react';
import ExampleAnswerReveal from '@/components/ExampleAnswerReveal';
import type { KoburinClue, KoburinPuzzleData, YajilinSolutionEdge } from '@/puzzles/types';
import KoburinBoard from '@/puzzles/Koburin/Koburin';
import {
  boardClassNames,
  boardLayoutMetrics,
  commonBoardChrome,
  getBoardCellColors,
  getBoardFrameDimensions,
  getBoardFrameStyle,
  getBoardGridSurfaceStyle,
  getBoardGridStyle,
  getBoardTextStyle,
  getLoopLineStrokeWidth,
  woodBoardTheme,
} from '@/puzzles/boardTheme';
import { createKoburinEdgeSet, parseKoburinEdgeKey } from '@/puzzles/Koburin/utils';
import BoardEdgeCross from '@/puzzles/shared/BoardEdgeCross';
import { useExampleCellSize } from './exampleCellSizeContext';

interface Props {
  width: number;
  height: number;
  clues: KoburinClue[];
  shadedCells: { row: number; col: number }[];
  loopEdges: YajilinSolutionEdge[];
  crossedEdges?: YajilinSolutionEdge[];
  playableLabel: string;
  answerLabel: string;
}

const GAP = boardLayoutMetrics.cellGap;
const PADDING = commonBoardChrome.padding;
const BORDER = commonBoardChrome.border;

export default function KoburinExample({
  width,
  height,
  clues,
  shadedCells,
  loopEdges,
  crossedEdges = [],
  playableLabel,
  answerLabel,
}: Props) {
  const CELL_SIZE = useExampleCellSize();
  const [showAnswer, setShowAnswer] = useState(false);
  const [exampleStartTime] = useState(() => Date.now());
  const puzzle = useMemo<KoburinPuzzleData>(
    () => ({ type: 'koburin', width, height, clues }),
    [clues, height, width]
  );
  const clueMap = useMemo(
    () => new Map(clues.map((clue) => [`${clue.row},${clue.col}`, clue.value])),
    [clues]
  );
  const shadedSet = useMemo(
    () => new Set(shadedCells.map((cell) => `${cell.row},${cell.col}`)),
    [shadedCells]
  );
  const loopSet = useMemo(() => createKoburinEdgeSet(loopEdges), [loopEdges]);
  const crossedSet = useMemo(() => createKoburinEdgeSet(crossedEdges), [crossedEdges]);
  const { boardWidth, boardHeight, outerWidth, outerHeight } = getBoardFrameDimensions(
    width,
    height,
    CELL_SIZE,
    { columnGap: GAP, rowGap: GAP, borderWidth: BORDER, padding: PADDING }
  );
  const svgWidth = boardWidth + PADDING * 2;
  const svgHeight = boardHeight + PADDING * 2;

  const answerBoard = (
    <div
      className="relative select-none"
      style={{
        width: `${outerWidth}px`,
        height: `${outerHeight}px`,
        ...getBoardFrameStyle(BORDER),
      }}
    >
      <div
        className="grid"
        style={{
          ...getBoardGridStyle(PADDING, PADDING, width, CELL_SIZE, GAP, GAP),
          ...getBoardGridSurfaceStyle(),
        }}
      >
        {Array.from({ length: height }, (_, row) =>
          Array.from({ length: width }, (_, col) => {
            const clue = clueMap.get(`${row},${col}`);
            const shaded = shadedSet.has(`${row},${col}`);
            return (
              <div
                key={`${row}-${col}`}
                className={boardClassNames.cellContent}
                style={{
                  width: `${CELL_SIZE}px`,
                  height: `${CELL_SIZE}px`,
                  ...(clue !== undefined
                    ? getBoardCellColors('clue')
                    : getBoardCellColors(shaded ? 'playerShaded' : 'cell')),
                  ...getBoardTextStyle(CELL_SIZE, 0.52, 18),
                }}
              >
                {clue}
              </div>
            );
          })
        )}
      </div>

      <svg className="pointer-events-none absolute left-0 top-0" width={svgWidth} height={svgHeight}>
        {[...loopSet].map((key) => {
          const edge = parseKoburinEdgeKey(key);
          if (!edge) return null;
          return (
            <line
              key={key}
              x1={PADDING + edge.c1 * (CELL_SIZE + GAP) + CELL_SIZE / 2}
              y1={PADDING + edge.r1 * (CELL_SIZE + GAP) + CELL_SIZE / 2}
              x2={PADDING + edge.c2 * (CELL_SIZE + GAP) + CELL_SIZE / 2}
              y2={PADDING + edge.r2 * (CELL_SIZE + GAP) + CELL_SIZE / 2}
              stroke={woodBoardTheme.ink}
              strokeWidth={getLoopLineStrokeWidth(CELL_SIZE)}
              strokeLinecap="round"
            />
          );
        })}
        {[...crossedSet].map((key) => {
          const edge = parseKoburinEdgeKey(key);
          if (!edge) return null;
          const centerX = PADDING + ((edge.c1 + edge.c2) / 2) * (CELL_SIZE + GAP) + CELL_SIZE / 2;
          const centerY = PADDING + ((edge.r1 + edge.r2) / 2) * (CELL_SIZE + GAP) + CELL_SIZE / 2;
          return (
            <BoardEdgeCross key={`cross-${key}`} x={centerX} y={centerY} cellSize={CELL_SIZE} />
          );
        })}
      </svg>
    </div>
  );

  return (
    <div className="flex flex-col justify-center gap-10 xl:flex-row">
      <div className="flex flex-col items-center">
        <p className="mb-4 text-center text-base font-medium text-muted-foreground">{playableLabel}</p>
        <div className="w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain pb-1">
          <div className="mx-auto w-max min-w-0">
  <KoburinBoard
            key={`koburin-example-${width}-${height}`}
            puzzle={puzzle}
            startTime={exampleStartTime}
            resetToken={0}
            onComplete={() => setShowAnswer(true)}
            fixedCellSize={CELL_SIZE}
          />
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center">
        <p className="mb-4 text-center text-base font-medium text-muted-foreground">{answerLabel}</p>
        <ExampleAnswerReveal
          visible={showAnswer}
          onVisibleChange={setShowAnswer}
          ariaLabel={answerLabel}
          className="relative"
        >
          {answerBoard}
        </ExampleAnswerReveal>
      </div>
    </div>
  );
}
