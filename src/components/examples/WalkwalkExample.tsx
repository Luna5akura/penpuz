import { useMemo, useState } from 'react';
import ExampleAnswerOverlay from '@/components/ExampleAnswerOverlay';
import ExampleAnswerRevealDialog from '@/components/ExampleAnswerRevealDialog';
import type { WalkwalkPuzzleData, YajilinSolutionEdge } from '../../puzzles/types';
import WalkwalkBoard from '../../puzzles/Walkwalk/Walkwalk';
import {
  commonBoardChrome,
  getBoardCellColors,
  getBoardFrameStyle,
  getBoardNumberFontSize,
  getCellDividerStyle,
  getLoopCrossSize,
  getLoopCrossStrokeWidth,
  getLoopLineStrokeWidth,
  getOutlinedBorderStrokeWidth,
  getRoomBoundaryStrokeWidth,
  woodBoardTheme,
} from '../../puzzles/boardTheme';
import {
  createWalkwalkEdgeSet,
  getWalkwalkBoundarySegments,
  parseWalkwalkEdgeKey,
} from '../../puzzles/Walkwalk/utils';

interface Props extends WalkwalkPuzzleData {
  solutionEdges: YajilinSolutionEdge[];
  crossedEdges?: YajilinSolutionEdge[];
  playableLabel: string;
  answerLabel: string;
}

const CELL_SIZE = 42;
const BOARD_PADDING = commonBoardChrome.padding;
const BOARD_BORDER = commonBoardChrome.border;

function StaticWalkwalkBoard({
  puzzle,
  lineEdges,
  crossedEdges,
}: {
  puzzle: WalkwalkPuzzleData;
  lineEdges: Set<string>;
  crossedEdges: Set<string>;
}) {
  const { width, height, clues, regionIds } = puzzle;
  const clueMap = useMemo(() => {
    const map = new Map<string, number>();
    clues.forEach((clue) => map.set(`${clue.row},${clue.col}`, clue.value));
    return map;
  }, [clues]);
  const boundaries = useMemo(
    () => getWalkwalkBoundarySegments(regionIds, width, height),
    [height, regionIds, width]
  );
  const boardWidth = width * CELL_SIZE;
  const boardHeight = height * CELL_SIZE;
  const outerWidth = boardWidth + BOARD_PADDING * 2 + BOARD_BORDER * 2;
  const outerHeight = boardHeight + BOARD_PADDING * 2 + BOARD_BORDER * 2;
  const clueFontSize = getBoardNumberFontSize(CELL_SIZE);
  const boundaryStroke = getRoomBoundaryStrokeWidth();
  const boundaryOutlineStroke = getOutlinedBorderStrokeWidth(boundaryStroke);
  const loopLineStrokeWidth = getLoopLineStrokeWidth(CELL_SIZE);
  const loopCrossSize = getLoopCrossSize(CELL_SIZE);
  const loopCrossStrokeWidth = getLoopCrossStrokeWidth();
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
        ...getBoardFrameStyle(BOARD_BORDER),
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
          Array.from({ length: width }, (_, col) => (
            <div
              key={`${row}-${col}`}
              className="flex items-center justify-center font-semibold tabular-nums"
              style={{
                width: `${CELL_SIZE}px`,
                height: `${CELL_SIZE}px`,
                ...getBoardCellColors('cell'),
                ...getCellDividerStyle(),
                fontSize: `${clueFontSize}px`,
                lineHeight: 1,
              }}
            >
              {clueMap.get(`${row},${col}`) ?? ''}
            </div>
          ))
        )}
      </div>

      <svg
        className="absolute top-0 left-0 pointer-events-none"
        width={outerWidth - BOARD_BORDER * 2}
        height={outerHeight - BOARD_BORDER * 2}
        style={{ zIndex: 2 }}
      >
        {boundaries.horizontal.map((segment) => {
          const x1 = BOARD_PADDING + segment.col * CELL_SIZE;
          const y = BOARD_PADDING + segment.row * CELL_SIZE;
          const x2 = x1 + CELL_SIZE;
          return (
            <line
              key={`h-outline-${segment.row}-${segment.col}`}
              x1={x1}
              y1={y}
              x2={x2}
              y2={y}
              stroke={woodBoardTheme.cell}
              strokeWidth={boundaryOutlineStroke}
            />
          );
        })}

        {boundaries.vertical.map((segment) => {
          const x = BOARD_PADDING + segment.col * CELL_SIZE;
          const y1 = BOARD_PADDING + segment.row * CELL_SIZE;
          const y2 = y1 + CELL_SIZE;
          return (
            <line
              key={`v-outline-${segment.row}-${segment.col}`}
              x1={x}
              y1={y1}
              x2={x}
              y2={y2}
              stroke={woodBoardTheme.cell}
              strokeWidth={boundaryOutlineStroke}
            />
          );
        })}

        {boundaries.horizontal.map((segment) => {
          const x1 = BOARD_PADDING + segment.col * CELL_SIZE;
          const y = BOARD_PADDING + segment.row * CELL_SIZE;
          const x2 = x1 + CELL_SIZE;
          return (
            <line
              key={`h-border-${segment.row}-${segment.col}`}
              x1={x1}
              y1={y}
              x2={x2}
              y2={y}
              stroke={woodBoardTheme.border}
              strokeWidth={boundaryStroke}
            />
          );
        })}

        {boundaries.vertical.map((segment) => {
          const x = BOARD_PADDING + segment.col * CELL_SIZE;
          const y1 = BOARD_PADDING + segment.row * CELL_SIZE;
          const y2 = y1 + CELL_SIZE;
          return (
            <line
              key={`v-border-${segment.row}-${segment.col}`}
              x1={x}
              y1={y1}
              x2={x}
              y2={y2}
              stroke={woodBoardTheme.border}
              strokeWidth={boundaryStroke}
            />
          );
        })}

        {[...lineEdges].map((edgeKey) => {
          const edge = parseWalkwalkEdgeKey(edgeKey);
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
              strokeWidth={loopLineStrokeWidth}
              strokeLinecap="round"
            />
          );
        })}

        {[...crossedEdges].map((edgeKey) => {
          const edge = parseWalkwalkEdgeKey(edgeKey);
          if (!edge) return null;
          const centerX = (getCenter(edge.r1, edge.c1).x + getCenter(edge.r2, edge.c2).x) / 2;
          const centerY = (getCenter(edge.r1, edge.c1).y + getCenter(edge.r2, edge.c2).y) / 2;
          return (
            <g
              key={`cross-${edgeKey}`}
              stroke={woodBoardTheme.border}
              strokeWidth={loopCrossStrokeWidth}
              strokeLinecap="round"
            >
              <line x1={centerX - loopCrossSize} y1={centerY - loopCrossSize} x2={centerX + loopCrossSize} y2={centerY + loopCrossSize} />
              <line x1={centerX - loopCrossSize} y1={centerY + loopCrossSize} x2={centerX + loopCrossSize} y2={centerY - loopCrossSize} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function WalkwalkExample({
  width,
  height,
  regionIds,
  clues,
  solutionEdges,
  crossedEdges = [],
  playableLabel,
  answerLabel,
}: Props) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [confirmSpoiler, setConfirmSpoiler] = useState(false);
  const [exampleStartTime] = useState(() => Date.now());

  const examplePuzzle = useMemo<WalkwalkPuzzleData>(
    () => ({ type: 'walkwalk', width, height, regionIds, clues }),
    [clues, height, regionIds, width]
  );
  const solutionEdgeSet = useMemo(() => createWalkwalkEdgeSet(solutionEdges), [solutionEdges]);
  const crossedEdgeSet = useMemo(() => createWalkwalkEdgeSet(crossedEdges), [crossedEdges]);
  const outerWidth = width * CELL_SIZE + BOARD_PADDING * 2 + BOARD_BORDER * 2;
  const outerHeight = height * CELL_SIZE + BOARD_PADDING * 2 + BOARD_BORDER * 2;

  return (
    <>
      <div className="flex flex-col justify-center gap-10 xl:flex-row">
        <div className="flex flex-col items-center">
          <p className="mb-4 text-base font-medium text-muted-foreground dark:text-gray-400">
            {playableLabel}
          </p>
          <WalkwalkBoard
            key={`walkwalk-example-${width}-${height}`}
            puzzle={examplePuzzle}
            startTime={exampleStartTime}
            resetToken={0}
            onComplete={() => setShowAnswer(true)}
            fixedCellSize={CELL_SIZE}
            showValidationMessage
          />
        </div>

        <div className="flex flex-col items-center">
          <p className="mb-4 text-base font-medium text-muted-foreground dark:text-gray-400">
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
              <ExampleAnswerOverlay />
            </div>
          ) : (
            <StaticWalkwalkBoard
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
