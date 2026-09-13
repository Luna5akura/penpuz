import { useMemo, useState } from 'react';
import ExampleAnswerReveal from '@/components/ExampleAnswerReveal';
import type { KurarinClue, KurarinPuzzleData, YajilinSolutionEdge } from '../../puzzles/types';
import KurarinBoard from '../../puzzles/Kurarin/Kurarin';
import {
  boardLayoutMetrics,
  commonBoardChrome,
  getBoardCellColors,
  getBoardClueCircleMetrics,
  getBoardFrameStyle,
  getBoardGridSurfaceStyle,
  getKurarinClueColors,
  getLoopCrossStrokeWidth,
  getLoopLineStrokeWidth,
  woodBoardTheme,
} from '../../puzzles/boardTheme';
import { createKurarinEdgeSet, parseKurarinEdgeKey } from '../../puzzles/Kurarin/utils';

interface Props {
  width: number;
  height: number;
  clues: KurarinClue[];
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

export default function KurarinExample({
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

  const examplePuzzle = useMemo<KurarinPuzzleData>(
    () => ({ type: 'kurarin', width, height, clues }),
    [clues, height, width]
  );
  const shadedSet = useMemo(() => new Set(shadedCells.map((cell) => `${cell.row},${cell.col}`)), [shadedCells]);
  const loopSet = useMemo(() => createKurarinEdgeSet(loopEdges), [loopEdges]);
  const crossedSet = useMemo(() => createKurarinEdgeSet(crossedEdges), [crossedEdges]);
  const boardWidthPx = width * CELL_SIZE + (width - 1) * GAP + PADDING * 2;
  const boardHeightPx = height * CELL_SIZE + (height - 1) * GAP + PADDING * 2;

  return (
    <>
      <div className="flex flex-col xl:flex-row gap-10 justify-center">
        <div className="flex flex-col items-center">
          <p className="mb-4 text-center text-base font-medium text-muted-foreground">
            {playableLabel}
          </p>
          <KurarinBoard
            key={`kurarin-example-${width}-${height}`}
            puzzle={examplePuzzle}
            startTime={exampleStartTime}
            resetToken={0}
            onComplete={() => setShowAnswer(true)}
            fixedCellSize={CELL_SIZE}
          />
        </div>

        <div className="flex flex-col items-center">
          <p className="mb-4 text-center text-base font-medium text-muted-foreground">
            {answerLabel}
          </p>
          <ExampleAnswerReveal
            visible={showAnswer}
            onVisibleChange={setShowAnswer}
            ariaLabel={answerLabel}
            className="relative"
          >
            {!showAnswer ? (
              <div
                className="relative"
                style={{
                  width: `${boardWidthPx + BORDER * 2}px`,
                  height: `${boardHeightPx + BORDER * 2}px`,
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
                  {Array.from({ length: width * height }, (_, index) => (
                    <div
                      key={index}
                      style={{ width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px`, ...getBoardCellColors('cell') }}
                    />
                  ))}
                </div>
              </div>
          ) : (
            <div
              className="relative"
              style={{
                width: `${boardWidthPx + BORDER * 2}px`,
                height: `${boardHeightPx + BORDER * 2}px`,
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
                {Array.from({ length: height }).flatMap((_, r) =>
                  Array.from({ length: width }).map((__, c) => {
                    const isShaded = shadedSet.has(`${r},${c}`);
                    return (
                      <div
                        key={`${r}-${c}`}
                        className="relative flex items-center justify-center"
                        style={{
                          width: `${CELL_SIZE}px`,
                          height: `${CELL_SIZE}px`,
                          ...getBoardCellColors(isShaded ? 'playerShaded' : 'cell'),
                        }}
                      />
                    );
                  })
                )}
              </div>

              <svg className="absolute top-0 left-0 pointer-events-none" width={boardWidthPx} height={boardHeightPx}>
                {[...loopSet].map((edgeKey) => {
                  const edge = parseKurarinEdgeKey(edgeKey);
                  if (!edge) return null;
                  const x1 = PADDING + edge.c1 * (CELL_SIZE + GAP) + CELL_SIZE / 2;
                  const y1 = PADDING + edge.r1 * (CELL_SIZE + GAP) + CELL_SIZE / 2;
                  const x2 = PADDING + edge.c2 * (CELL_SIZE + GAP) + CELL_SIZE / 2;
                  const y2 = PADDING + edge.r2 * (CELL_SIZE + GAP) + CELL_SIZE / 2;
                  return (
                    <line
                      key={edgeKey}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={woodBoardTheme.ink}
                      strokeWidth={getLoopLineStrokeWidth(CELL_SIZE)}
                      strokeLinecap="round"
                    />
                  );
                })}

                {[...crossedSet].map((edgeKey) => {
                  const edge = parseKurarinEdgeKey(edgeKey);
                  if (!edge) return null;
                  const centerX = PADDING + ((edge.c1 + edge.c2) / 2) * (CELL_SIZE + GAP) + CELL_SIZE / 2;
                  const centerY = PADDING + ((edge.r1 + edge.r2) / 2) * (CELL_SIZE + GAP) + CELL_SIZE / 2;
                  return (
                    <g key={`cross-${edgeKey}`} stroke={woodBoardTheme.border} strokeWidth={getLoopCrossStrokeWidth()} strokeLinecap="round">
                      <line x1={centerX - 3} y1={centerY - 3} x2={centerX + 3} y2={centerY + 3} />
                      <line x1={centerX - 3} y1={centerY + 3} x2={centerX + 3} y2={centerY - 3} />
                    </g>
                  );
                })}

                {clues.map((clue, index) => {
                  const clueStyle = getKurarinClueColors(clue.color);
                  const x = PADDING + (clue.col * (CELL_SIZE + GAP)) / 2 + CELL_SIZE / 2;
                  const y = PADDING + (clue.row * (CELL_SIZE + GAP)) / 2 + CELL_SIZE / 2;
                  return (
                    <circle
                      key={`clue-${clue.row}-${clue.col}-${index}`}
                      cx={x}
                      cy={y}
                    r={getBoardClueCircleMetrics(CELL_SIZE).radius}
                      fill={clueStyle.fill}
                      stroke={clueStyle.stroke}
                      strokeWidth={getBoardClueCircleMetrics(CELL_SIZE).strokeWidth}
                    />
                  );
                })}
              </svg>
            </div>
          )}
          </ExampleAnswerReveal>
        </div>
      </div>
    </>
  );
}
