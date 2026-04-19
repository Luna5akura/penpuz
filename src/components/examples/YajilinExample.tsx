import { useMemo, useState } from 'react';
import ExampleAnswerRevealDialog from '@/components/ExampleAnswerRevealDialog';
import type { YajilinClue, YajilinPuzzleData, YajilinSolutionEdge } from '../../puzzles/types';
import YajilinBoard from '../../puzzles/Yajilin/Yajilin';
import { commonBoardChrome, getBoardCellColors, woodBoardTheme } from '../../puzzles/boardTheme';
import { ClueArrow } from '../../puzzles/Yajilin/ClueArrow';
import { getClueNumberFontSize } from '../../puzzles/Yajilin/clueSizing';
import { createYajilinEdgeSet, parseYajilinEdgeKey } from '../../puzzles/Yajilin/utils';

interface Props {
  width: number;
  height: number;
  clues: YajilinClue[];
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

export default function YajilinExample({
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

  const examplePuzzle = useMemo<YajilinPuzzleData>(
    () => ({ type: 'yajilin', width, height, clues }),
    [clues, height, width]
  );
  const clueMap = useMemo(() => {
    const map = new Map<string, YajilinClue>();
    clues.forEach((clue) => map.set(`${clue.row},${clue.col}`, clue));
    return map;
  }, [clues]);

  const shadedSet = useMemo(() => new Set(shadedCells.map((cell) => `${cell.row},${cell.col}`)), [shadedCells]);
  const loopSet = useMemo(() => createYajilinEdgeSet(loopEdges), [loopEdges]);
  const crossedSet = useMemo(() => createYajilinEdgeSet(crossedEdges), [crossedEdges]);
  const boardWidthPx = width * CELL_SIZE + (width - 1) * GAP + PADDING * 2;
  const boardHeightPx = height * CELL_SIZE + (height - 1) * GAP + PADDING * 2;
  const clueNumberFontSize = useMemo(() => getClueNumberFontSize(CELL_SIZE), []);
  const verticalClueNumberTop = useMemo(() => Math.floor(CELL_SIZE * 0.5), []);
  const horizontalClueNumberTop = useMemo(() => Math.floor(CELL_SIZE * 0.52), []);

  return (
    <>
      <div className="flex flex-col xl:flex-row gap-10 justify-center">
        <div className="flex flex-col items-center">
          <p className="text-base font-medium text-muted-foreground mb-4 dark:text-gray-400">
            {playableLabel}
          </p>
          <YajilinBoard
            key={`yajilin-example-${width}-${height}`}
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
                className="grid dark:bg-gray-800"
                style={{
                  gridTemplateColumns: `repeat(${width}, ${CELL_SIZE}px)`,
                  gap: `${GAP}px`,
                  background: woodBoardTheme.gridLine,
                  padding: `${commonBoardChrome.padding}px`,
                  border: `${BORDER}px solid ${woodBoardTheme.border}`,
                }}
              >
                {Array.from({ length: width * height }, (_, index) => (
                  <div
                    key={index}
                    className="dark:bg-gray-800"
                    style={{ width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px`, background: woodBoardTheme.cell }}
                  />
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 dark:bg-black/80">
                <div className="text-white text-6xl">👁️‍🗨️</div>
              </div>
            </div>
          ) : (
            <div
              className="relative"
              style={{
                width: `${boardWidthPx + BORDER * 2}px`,
                height: `${boardHeightPx + BORDER * 2}px`,
                padding: `${PADDING}px`,
                background: woodBoardTheme.frame,
                border: `${BORDER}px solid ${woodBoardTheme.border}`,
                boxSizing: 'border-box',
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
                    const clue = clueMap.get(`${r},${c}`);
                    const isShaded = shadedSet.has(`${r},${c}`);
                    return (
                      <div
                        key={`${r}-${c}`}
                        className="flex items-center justify-center font-semibold tabular-nums tracking-tight"
                        style={{
                          width: `${CELL_SIZE}px`,
                          height: `${CELL_SIZE}px`,
                          paddingTop: clue ? '0px' : '2px',
                          ...getBoardCellColors(clue ? 'clue' : isShaded ? 'playerShaded' : 'cell'),
                        }}
                      >
                        {clue ? (
                          <div className="relative w-full h-full">
                            <ClueArrow direction={clue.direction} cellSize={CELL_SIZE} />
                            <span
                              className="absolute leading-none font-semibold tabular-nums"
                              style={{
                                left: clue.direction === 'up' || clue.direction === 'down' ? `${Math.floor(CELL_SIZE * 0.5)}px` : '50%',
                                top:
                                  clue.direction === 'left' || clue.direction === 'right'
                                    ? `${horizontalClueNumberTop}px`
                                    : `${verticalClueNumberTop}px`,
                                transform: 'translate(-50%, -50%)',
                                fontSize: `${clueNumberFontSize}px`,
                                lineHeight: 1,
                              }}
                            >
                              {clue.value}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>

              <svg className="absolute top-0 left-0 pointer-events-none" width={boardWidthPx} height={boardHeightPx}>
                {[...loopSet].map((edgeKey) => {
                  const edge = parseYajilinEdgeKey(edgeKey);
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
                  const edge = parseYajilinEdgeKey(edgeKey);
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
