import { useMemo, useState } from 'react';
import ExampleAnswerRevealDialog from '@/components/ExampleAnswerRevealDialog';
import type { MintonettePuzzleData, MintonetteSolutionEdge } from '../../puzzles/types';
import MintonetteBoard from '../../puzzles/Mintonette/Mintonette';
import {
  commonBoardChrome,
  getBoardCellColors,
  getBoardCircleClueDiameter,
  getBoardCircleClueStrokeWidth,
  getBoardFrameStyle,
  getBoardNumberFontSize,
  getCellDividerStyle,
  woodBoardTheme,
} from '../../puzzles/boardTheme';
import { createMintonetteEdgeSet, parseMintonetteEdgeKey } from '../../puzzles/Mintonette/utils';

interface Props extends MintonettePuzzleData {
  solutionEdges: MintonetteSolutionEdge[];
  crossedEdges?: MintonetteSolutionEdge[];
  playableLabel: string;
  answerLabel: string;
}

const CELL_SIZE = 42;
const BOARD_PADDING = commonBoardChrome.padding;

function StaticMintonetteBoard({
  puzzle,
  lineEdges,
  crossedEdges,
}: {
  puzzle: MintonettePuzzleData;
  lineEdges: Set<string>;
  crossedEdges: Set<string>;
}) {
  const { width, height, clues } = puzzle;
  const clueMap = useMemo(() => {
    const map = new Map<string, number | null>();
    clues.forEach((clue) => map.set(`${clue.row},${clue.col}`, clue.value));
    return map;
  }, [clues]);

  const boardWidth = width * CELL_SIZE;
  const boardHeight = height * CELL_SIZE;
  const outerWidth = boardWidth + BOARD_PADDING * 2 + commonBoardChrome.border * 2;
  const outerHeight = boardHeight + BOARD_PADDING * 2 + commonBoardChrome.border * 2;
  const clueNumberFontSize = getBoardNumberFontSize(CELL_SIZE, 0.58, 18);
  const clueCircleDiameter = getBoardCircleClueDiameter(CELL_SIZE);
  const clueCircleStrokeWidth = getBoardCircleClueStrokeWidth(CELL_SIZE);
  const getCenter = (row: number, col: number) => ({
    x: BOARD_PADDING + col * CELL_SIZE + CELL_SIZE / 2,
    y: BOARD_PADDING + row * CELL_SIZE + CELL_SIZE / 2,
  });

  return (
    <div
      className="relative"
      style={{
        width: `${outerWidth}px`,
        height: `${outerHeight}px`,
        ...getBoardFrameStyle(),
      }}
    >
      <div
        className="absolute grid"
        style={{
          left: `${BOARD_PADDING}px`,
          top: `${BOARD_PADDING}px`,
          gridTemplateColumns: `repeat(${width}, ${CELL_SIZE}px)`,
        }}
      >
        {Array.from({ length: height }, (_, row) =>
          Array.from({ length: width }, (_, col) => {
            const clueValue = clueMap.get(`${row},${col}`);
            return (
              <div
                key={`${row}-${col}`}
                className="relative flex items-center justify-center"
                style={{
                  width: `${CELL_SIZE}px`,
                  height: `${CELL_SIZE}px`,
                  ...getBoardCellColors('cell'),
                  ...getCellDividerStyle(),
                }}
              >
                {clueValue !== undefined ? (
                  <div
                    className="flex items-center justify-center rounded-full font-semibold tabular-nums"
                    style={{
                      width: `${clueCircleDiameter}px`,
                      height: `${clueCircleDiameter}px`,
                      border: `${clueCircleStrokeWidth}px solid ${woodBoardTheme.border}`,
                      color: woodBoardTheme.border,
                      background: getBoardCellColors('cell').background,
                      fontSize: `${clueNumberFontSize}px`,
                      lineHeight: 1,
                      position: 'relative',
                      zIndex: 2,
                    }}
                  >
                    {clueValue ?? ''}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      <svg
        className="absolute top-0 left-0 pointer-events-none"
        width={outerWidth - commonBoardChrome.border * 2}
        height={outerHeight - commonBoardChrome.border * 2}
        style={{ zIndex: 2 }}
      >
        {[...lineEdges].map((edgeKey) => {
          const edge = parseMintonetteEdgeKey(edgeKey);
          if (!edge) return null;
          const from = getCenter(edge.r1, edge.c1);
          const to = getCenter(edge.r2, edge.c2);
          return (
            <line
              key={`line-${edgeKey}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={woodBoardTheme.ink}
              strokeWidth={Math.max(4, Math.floor(CELL_SIZE * 0.11))}
              strokeLinecap="round"
            />
          );
        })}

        {[...crossedEdges].map((edgeKey) => {
          const edge = parseMintonetteEdgeKey(edgeKey);
          if (!edge) return null;
          const centerX = (getCenter(edge.r1, edge.c1).x + getCenter(edge.r2, edge.c2).x) / 2;
          const centerY = (getCenter(edge.r1, edge.c1).y + getCenter(edge.r2, edge.c2).y) / 2;
          const size = Math.max(4, Math.floor(CELL_SIZE * 0.12));
          return (
            <g
              key={`cross-${edgeKey}`}
              stroke={woodBoardTheme.border}
              strokeWidth="1.7"
              strokeLinecap="round"
            >
              <line x1={centerX - size} y1={centerY - size} x2={centerX + size} y2={centerY + size} />
              <line x1={centerX - size} y1={centerY + size} x2={centerX + size} y2={centerY - size} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function MintonetteExample({
  width,
  height,
  clues,
  solutionEdges,
  crossedEdges = [],
  playableLabel,
  answerLabel,
}: Props) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [confirmSpoiler, setConfirmSpoiler] = useState(false);
  const [exampleStartTime] = useState(() => Date.now());

  const examplePuzzle = useMemo<MintonettePuzzleData>(
    () => ({ type: 'mintonette', width, height, clues }),
    [clues, height, width]
  );
  const solutionEdgeSet = useMemo(() => createMintonetteEdgeSet(solutionEdges), [solutionEdges]);
  const crossedEdgeSet = useMemo(() => createMintonetteEdgeSet(crossedEdges), [crossedEdges]);
  const outerWidth = width * CELL_SIZE + BOARD_PADDING * 2 + commonBoardChrome.border * 2;
  const outerHeight = height * CELL_SIZE + BOARD_PADDING * 2 + commonBoardChrome.border * 2;

  return (
    <>
      <div className="flex flex-col xl:flex-row gap-10 justify-center">
        <div className="flex flex-col items-center">
          <p className="text-base font-medium text-muted-foreground mb-4 dark:text-gray-400">
            {playableLabel}
          </p>
          <MintonetteBoard
            key={`mintonette-example-${width}-${height}`}
            puzzle={examplePuzzle}
            startTime={exampleStartTime}
            resetToken={0}
            onComplete={() => setShowAnswer(true)}
            fixedCellSize={CELL_SIZE}
            showValidationMessage
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
                style={{
                  width: `${outerWidth}px`,
                  height: `${outerHeight}px`,
                  padding: `${BOARD_PADDING}px`,
                  ...getBoardFrameStyle(),
                }}
              >
                <div className="grid" style={{ gridTemplateColumns: `repeat(${width}, ${CELL_SIZE}px)` }}>
                  {Array.from({ length: width * height }, (_, index) => (
                    <div
                      key={index}
                      style={{
                        width: `${CELL_SIZE}px`,
                        height: `${CELL_SIZE}px`,
                        ...getBoardCellColors('cell'),
                        ...getCellDividerStyle(),
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 dark:bg-black/80">
                <div className="text-white text-6xl">👁️‍🗨️</div>
              </div>
            </div>
          ) : (
            <StaticMintonetteBoard
              puzzle={examplePuzzle}
              lineEdges={solutionEdgeSet}
              crossedEdges={crossedEdgeSet}
            />
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
