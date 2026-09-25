import { useMemo, useState } from 'react';
import ExampleAnswerReveal from '@/components/ExampleAnswerReveal';
import type { YajilinClue, YajilinPuzzleData, YajilinSolutionEdge } from '../../puzzles/types';
import YajilinBoard from '../../puzzles/Yajilin/Yajilin';
import {
  boardClassNames,
  boardLayoutMetrics,
  commonBoardChrome,
  getBoardCellColors,
  getBoardFixedTextStyle,
  getBoardFrameDimensions,
  getBoardFrameStyle,
  getBoardGridStyle,
  getBoardGridSurfaceStyle,
  getDirectionalClueNumberFontSize,
  getLoopLineStrokeWidth,
  woodBoardTheme,
} from '../../puzzles/boardTheme';
import { ClueArrow } from '../../puzzles/Yajilin/ClueArrow';
import { createYajilinEdgeSet, parseYajilinEdgeKey } from '../../puzzles/Yajilin/utils';
import BoardEdgeCross from '../../puzzles/shared/BoardEdgeCross';

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

const CELL_SIZE = boardLayoutMetrics.loopExampleCellSize;
const GAP = boardLayoutMetrics.cellGap;
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
  const { boardWidth, boardHeight, outerWidth, outerHeight } = getBoardFrameDimensions(
    width,
    height,
    CELL_SIZE,
    { columnGap: GAP, rowGap: GAP, borderWidth: BORDER, padding: PADDING }
  );
  const boardWidthPx = boardWidth + PADDING * 2;
  const boardHeightPx = boardHeight + PADDING * 2;
  const clueNumberFontSize = useMemo(() => getDirectionalClueNumberFontSize(CELL_SIZE), []);
  const verticalClueNumberTop = useMemo(() => Math.floor(CELL_SIZE * 0.5), []);
  const horizontalClueNumberTop = useMemo(() => Math.floor(CELL_SIZE * 0.52), []);

  return (
    <>
      <div className="flex flex-col xl:flex-row gap-10 justify-center">
        <div className="flex flex-col items-center">
          <p className="mb-4 text-center text-base font-medium text-muted-foreground">
            {playableLabel}
          </p>
          <div className="w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain pb-1">
          <div className="mx-auto w-max min-w-0">
  <YajilinBoard
              key={`yajilin-example-${width}-${height}`}
              puzzle={examplePuzzle}
              startTime={exampleStartTime}
              resetToken={0}
              onComplete={() => setShowAnswer(true)}
              fixedCellSize={CELL_SIZE}
            />
          </div>
        </div>
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
                {Array.from({ length: height }).flatMap((_, r) =>
                  Array.from({ length: width }).map((__, c) => {
                    const clue = clueMap.get(`${r},${c}`);
                    const isShaded = shadedSet.has(`${r},${c}`);
                    return (
                      <div
                        key={`${r}-${c}`}
                        className={`flex items-center justify-center ${boardClassNames.cellTextTight}`}
                        style={{
                          width: `${CELL_SIZE}px`,
                          height: `${CELL_SIZE}px`,
                          paddingTop: clue ? '0px' : '2px',
                          ...(clue
                            ? getBoardCellColors('clue')
                            : getBoardCellColors(isShaded ? 'playerShaded' : 'cell')),
                        }}
                      >
                        {clue ? (
                          <div className="relative w-full h-full">
                            <ClueArrow direction={clue.direction} cellSize={CELL_SIZE} />
                            <span
                              className={`absolute ${boardClassNames.cellText}`}
                              style={{
                                left: clue.direction === 'up' || clue.direction === 'down' ? `${Math.floor(CELL_SIZE * 0.5)}px` : '50%',
                                top:
                                  clue.direction === 'left' || clue.direction === 'right'
                                    ? `${horizontalClueNumberTop}px`
                                    : `${verticalClueNumberTop}px`,
                                transform: 'translate(-50%, -50%)',
                                ...getBoardFixedTextStyle(clueNumberFontSize),
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
                      strokeWidth={getLoopLineStrokeWidth(CELL_SIZE)}
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
                    <BoardEdgeCross key={`cross-${edgeKey}`} x={centerX} y={centerY} cellSize={CELL_SIZE} />
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
