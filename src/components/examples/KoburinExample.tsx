import { useMemo, useState } from 'react';
import ExampleAnswerReveal from '@/components/ExampleAnswerReveal';
import type { KoburinClue, KoburinPuzzleData, YajilinSolutionEdge } from '@/puzzles/types';
import KoburinBoard from '@/puzzles/Koburin/Koburin';
import {
  boardClassNames,
  boardLayoutMetrics,
  commonBoardChrome,
  getBoardCellColors,
  getBoardFrameStyle,
  getBoardGridSurfaceStyle,
  getBoardTextStyle,
  getLoopCrossSize,
  getLoopCrossStrokeWidth,
  getLoopLineStrokeWidth,
  woodBoardTheme,
} from '@/puzzles/boardTheme';
import { createKoburinEdgeSet, parseKoburinEdgeKey } from '@/puzzles/Koburin/utils';

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

const CELL_SIZE = boardLayoutMetrics.loopExampleCellSize;
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
  const boardWidth = width * CELL_SIZE + (width - 1) * GAP + PADDING * 2;
  const boardHeight = height * CELL_SIZE + (height - 1) * GAP + PADDING * 2;

  const answerBoard = (
    <div
      className="relative select-none"
      style={{
        width: `${boardWidth + BORDER * 2}px`,
        height: `${boardHeight + BORDER * 2}px`,
        padding: `${PADDING}px`,
        ...getBoardFrameStyle(BORDER),
      }}
    >
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${width}, ${CELL_SIZE}px)`,
          gap: `${GAP}px`,
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

      <svg className="pointer-events-none absolute left-0 top-0" width={boardWidth} height={boardHeight}>
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
          const size = getLoopCrossSize(CELL_SIZE);
          return (
            <g key={`cross-${key}`} stroke={woodBoardTheme.border} strokeWidth={getLoopCrossStrokeWidth()} strokeLinecap="round">
              <line x1={centerX - size} y1={centerY - size} x2={centerX + size} y2={centerY + size} />
              <line x1={centerX - size} y1={centerY + size} x2={centerX + size} y2={centerY - size} />
            </g>
          );
        })}
      </svg>
    </div>
  );

  return (
    <div className="flex flex-col justify-center gap-10 xl:flex-row">
      <div className="flex flex-col items-center">
        <p className="mb-4 text-center text-base font-medium text-muted-foreground">{playableLabel}</p>
        <KoburinBoard
          key={`koburin-example-${width}-${height}`}
          puzzle={puzzle}
          startTime={exampleStartTime}
          resetToken={0}
          onComplete={() => setShowAnswer(true)}
          fixedCellSize={CELL_SIZE}
        />
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
