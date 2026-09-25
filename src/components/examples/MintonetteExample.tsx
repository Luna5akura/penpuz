import { useMemo, useState } from 'react';
import ExampleAnswerReveal from '@/components/ExampleAnswerReveal';
import type { MintonettePuzzleData, MintonetteSolutionEdge } from '../../puzzles/types';
import MintonetteBoard from '../../puzzles/Mintonette/Mintonette';
import {
  boardClassNames,
  commonBoardChrome,
  getBoardCellColors,
  getBoardRegionStrokeWidth,
  getBoardCircleClueDiameter,
  getBoardCircleClueStrokeWidth,
  getBoardFrameDimensions,
  getBoardFrameStyle,
  getBoardGridStyle,
  getBoardTextStyle,
  getCellDividerStyle,
  woodBoardTheme,
} from '../../puzzles/boardTheme';
import { createMintonetteEdgeSet, parseMintonetteEdgeKey } from '../../puzzles/Mintonette/utils';
import BoardEdgeCross from '../../puzzles/shared/BoardEdgeCross';
import { useExampleCellSize } from './exampleCellSizeContext';

interface Props extends Omit<MintonettePuzzleData, 'type'> {
  solutionEdges: MintonetteSolutionEdge[];
  crossedEdges?: MintonetteSolutionEdge[];
  playableLabel: string;
  answerLabel: string;
}

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
  const CELL_SIZE = useExampleCellSize();
  const { width, height, clues } = puzzle;
  const clueMap = useMemo(() => {
    const map = new Map<string, number | null>();
    clues.forEach((clue) => map.set(`${clue.row},${clue.col}`, clue.value));
    return map;
  }, [clues]);

  const { outerWidth, outerHeight } = getBoardFrameDimensions(
    width,
    height,
    CELL_SIZE,
    { borderWidth: commonBoardChrome.border, padding: BOARD_PADDING }
  );
  const clueNumberTextStyle = getBoardTextStyle(CELL_SIZE, 0.58, 18);
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
        style={getBoardGridStyle(BOARD_PADDING, BOARD_PADDING, width, CELL_SIZE)}
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
                    className={`flex items-center justify-center rounded-full ${boardClassNames.cellText}`}
                    style={{
                      width: `${clueCircleDiameter}px`,
                      height: `${clueCircleDiameter}px`,
                      border: `${clueCircleStrokeWidth}px solid ${woodBoardTheme.border}`,
                      ...getBoardCellColors('cell'),
                      ...clueNumberTextStyle,
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
              strokeWidth={getBoardRegionStrokeWidth(CELL_SIZE, 0.11, 4)}
              strokeLinecap="round"
            />
          );
        })}

        {[...crossedEdges].map((edgeKey) => {
          const edge = parseMintonetteEdgeKey(edgeKey);
          if (!edge) return null;
          const centerX = (getCenter(edge.r1, edge.c1).x + getCenter(edge.r2, edge.c2).x) / 2;
          const centerY = (getCenter(edge.r1, edge.c1).y + getCenter(edge.r2, edge.c2).y) / 2;
          return (
            <BoardEdgeCross
              key={`cross-${edgeKey}`}
              x={centerX}
              y={centerY}
              cellSize={CELL_SIZE}
            />
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
  const CELL_SIZE = useExampleCellSize();
  const [showAnswer, setShowAnswer] = useState(false);
  const [exampleStartTime] = useState(() => Date.now());

  const examplePuzzle = useMemo<MintonettePuzzleData>(
    () => ({ type: 'mintonette', width, height, clues }),
    [clues, height, width]
  );
  const solutionEdgeSet = useMemo(() => createMintonetteEdgeSet(solutionEdges), [solutionEdges]);
  const crossedEdgeSet = useMemo(() => createMintonetteEdgeSet(crossedEdges), [crossedEdges]);
  return (
    <>
      <div className="flex flex-col xl:flex-row gap-10 justify-center">
        <div className="flex flex-col items-center">
          <p className="mb-4 text-center text-base font-medium text-muted-foreground">
            {playableLabel}
          </p>
          <div className="w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain pb-1">
          <div className="flex w-full min-w-0 justify-center">
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
            className="flex justify-center overflow-x-auto"
          >
            <StaticMintonetteBoard
              puzzle={examplePuzzle}
              lineEdges={solutionEdgeSet}
              crossedEdges={crossedEdgeSet}
            />
          </ExampleAnswerReveal>
        </div>
      </div>
    </>
  );
}
