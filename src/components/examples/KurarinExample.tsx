import { useMemo, useState } from 'react';
import ExampleAnswerRevealDialog from '@/components/ExampleAnswerRevealDialog';
import ExampleAnswerOverlay from '@/components/ExampleAnswerOverlay';
import type { KurarinClue, KurarinPuzzleData, YajilinSolutionEdge } from '../../puzzles/types';
import KurarinBoard from '../../puzzles/Kurarin/Kurarin';
import { commonBoardChrome, getBoardCellColors, getBoardFrameStyle, woodBoardTheme } from '../../puzzles/boardTheme';
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

const CELL_SIZE = 44;
const GAP = 1;
const PADDING = commonBoardChrome.padding;
const BORDER = commonBoardChrome.border;

function getClueStyle(color: KurarinClue['color']) {
  if (color === 'black') {
    return { fill: '#111827', stroke: '#111827' };
  }
  if (color === 'gray') {
    return { fill: '#9ca3af', stroke: '#374151' };
  }
  return { fill: '#f9fafb', stroke: '#111827' };
}

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
  const [confirmSpoiler, setConfirmSpoiler] = useState(false);
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
          <p className="text-base font-medium text-muted-foreground mb-4 dark:text-gray-400">
            {playableLabel}
          </p>
          <KurarinBoard
            key={`kurarin-example-${width}-${height}`}
            puzzle={examplePuzzle}
            startTime={exampleStartTime}
            onComplete={() => setShowAnswer(true)}
            fixedCellSize={CELL_SIZE}
          />
        </div>

        <div className="flex flex-col items-center">
          <p className="text-base font-medium text-muted-foreground mb-4 dark:text-gray-400">
            {answerLabel}
          </p>
          {!showAnswer ? (
            <div
              onClick={() => setConfirmSpoiler(true)}
              className="relative cursor-pointer hover:opacity-90"
            >
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
                    background: woodBoardTheme.gridLine,
                  }}
                >
                  {Array.from({ length: width * height }, (_, index) => (
                    <div
                      key={index}
                      style={{ width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px`, background: woodBoardTheme.cell }}
                    />
                  ))}
                </div>
              </div>
              <ExampleAnswerOverlay />
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
                  background: woodBoardTheme.gridLine,
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
                      strokeWidth="3"
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
                    <g key={`cross-${edgeKey}`} stroke={woodBoardTheme.border} strokeWidth="1.6" strokeLinecap="round">
                      <line x1={centerX - 3} y1={centerY - 3} x2={centerX + 3} y2={centerY + 3} />
                      <line x1={centerX - 3} y1={centerY + 3} x2={centerX + 3} y2={centerY - 3} />
                    </g>
                  );
                })}

                {clues.map((clue, index) => {
                  const clueStyle = getClueStyle(clue.color);
                  const x = PADDING + (clue.col * (CELL_SIZE + GAP)) / 2 + CELL_SIZE / 2;
                  const y = PADDING + (clue.row * (CELL_SIZE + GAP)) / 2 + CELL_SIZE / 2;
                  return (
                    <circle
                      key={`clue-${clue.row}-${clue.col}-${index}`}
                      cx={x}
                      cy={y}
                      r={Math.max(8, Math.floor(CELL_SIZE * 0.26))}
                      fill={clueStyle.fill}
                      stroke={clueStyle.stroke}
                      strokeWidth={Math.max(2, Math.floor(CELL_SIZE * 0.05))}
                    />
                  );
                })}
              </svg>
            </div>
          )}
        </div>
      </div>

      <ExampleAnswerRevealDialog
        open={confirmSpoiler && !showAnswer}
        onCancel={() => setConfirmSpoiler(false)}
        onConfirm={() => {
          setShowAnswer(true);
          setConfirmSpoiler(false);
        }}
      />
    </>
  );
}
