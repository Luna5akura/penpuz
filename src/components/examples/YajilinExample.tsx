import { useMemo, useState } from 'react';
import type { YajilinClue, YajilinSolutionEdge } from '../../puzzles/types';
import YajilinBoard from '../../puzzles/Yajilin/Yajilin';
import { createYajilinEdgeSet, YAJILIN_ARROWS, parseYajilinEdgeKey } from '../../puzzles/Yajilin/utils';

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
const PADDING = 3;
const BORDER = 4;

function getArrowPositionStyle(direction: string) {
  if (direction === 'up') {
    return { left: '2px', top: '50%', transform: 'translateY(-50%)' };
  }
  if (direction === 'down') {
    return { left: '2px', top: '50%', transform: 'translateY(-50%)' };
  }
  if (direction === 'left') {
    return { left: '50%', top: '-20px', transform: 'translateX(-50%)' };
  }
  return { left: '50%', top: '-20px', transform: 'translateX(-50%)' };
}

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

  return (
    <>
      <div className="flex flex-col xl:flex-row gap-10 justify-center">
        <div className="flex flex-col items-center">
          <p className="text-base font-medium text-muted-foreground mb-4 dark:text-gray-400">
            {playableLabel}
          </p>
          <YajilinBoard
            key={`yajilin-example-${width}-${height}`}
            puzzle={{ type: 'yajilin', width, height, clues }}
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
                className="grid bg-[#d2b48c] dark:bg-gray-800 border-4 border-[#3f2a1e] dark:border-gray-700 p-[3px]"
                style={{ gridTemplateColumns: `repeat(${width}, ${CELL_SIZE}px)`, gap: `${GAP}px` }}
              >
                {Array.from({ length: width * height }, (_, index) => (
                  <div
                    key={index}
                    className="bg-[#f8f1e3] dark:bg-gray-800"
                    style={{ width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px` }}
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
                background: '#d2b48c',
                border: `${BORDER}px solid #3f2a1e`,
                boxSizing: 'border-box',
              }}
            >
              <div
                className="grid"
                style={{ gridTemplateColumns: `repeat(${width}, ${CELL_SIZE}px)`, gap: `${GAP}px` }}
              >
                {Array.from({ length: height }).flatMap((_, r) =>
                  Array.from({ length: width }).map((__, c) => {
                    const clue = clueMap.get(`${r},${c}`);
                    const isShaded = shadedSet.has(`${r},${c}`);
                    return (
                      <div
                        key={`${r}-${c}`}
                        className={`flex items-center justify-center font-mono font-bold tracking-tight
                          ${clue
                            ? 'bg-[#f5ead8] dark:bg-gray-800 text-[#3f2a1e] dark:text-gray-100'
                            : isShaded
                              ? 'bg-[#3f2a1e] text-white'
                              : 'bg-[#f8f1e3] dark:bg-gray-800 text-[#3f2a1e] dark:text-gray-100'}`}
                        style={{ width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px`, paddingTop: clue ? '0px' : '2px' }}
                      >
                        {clue ? (
                          <div className="relative w-full h-full">
                            <span
                              className="absolute leading-none"
                              style={{
                                ...getArrowPositionStyle(clue.direction),
                                fontSize: '26px',
                                lineHeight: 1,
                              }}
                            >
                              {YAJILIN_ARROWS[clue.direction]}
                            </span>
                            <span
                              className="absolute leading-none font-bold"
                              style={{
                                left: clue.direction === 'up' || clue.direction === 'down' ? '50%' : '50%',
                                top: clue.direction === 'left' || clue.direction === 'right' ? '55%' : '53%',
                                transform: 'translate(-50%, -50%)',
                                fontSize: '31px',
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
                      stroke="#111111"
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
                    <g key={`cross-${edgeKey}`} stroke="#111111" strokeWidth="1.6" strokeLinecap="round">
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

      {confirmSpoiler && !showAnswer && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="max-w-sm w-full mx-4 bg-white dark:bg-gray-900 rounded-lg p-6 text-center shadow-xl">
            <p className="text-lg mb-6 dark:text-gray-200">你确定要查看答案吗？<br />(完成左边的题目可以自动解锁)</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmSpoiler(false)} className="flex-1 py-3 border rounded-lg">取消</button>
              <button onClick={() => { setShowAnswer(true); setConfirmSpoiler(false); }} className="flex-1 py-3 bg-[#3f2a1e] text-white rounded-lg">确定查看</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
