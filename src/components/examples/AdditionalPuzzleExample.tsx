import { useState, type ReactNode } from 'react';
import ExampleAnswerReveal from '@/components/ExampleAnswerReveal';
import type { PuzzleExample } from '@/puzzles/types';
import {
  boardClassNames,
  boardLayoutMetrics,
  commonBoardChrome,
  getBoardCellStyle,
  getBoardCellColors,
  getBoardDotRadius,
  getBoardBoundaryStrokeMetrics,
  getBoardFrameStyle,
  getBoardSvgTextProps,
  getBoardTextStyle,
  getLoopCrossSize,
  getLoopCrossStrokeWidth,
  getLoopLineStrokeWidth,
  woodBoardTheme,
} from '@/puzzles/boardTheme';
import { getEdgeKey, getRegionBoundarySegments, parseGridLineEdgeKey, parseSolutionEdgeKey } from '@/puzzles/gridUtils';
import SlovakSumsClue from '@/puzzles/SlovakSums/SlovakSumsClue';
import WolvesAndSheepSymbol from '@/puzzles/WolvesAndSheep/WolvesAndSheepSymbol';
import KakuroClue from '@/puzzles/Kakuro/KakuroClue';

type AdditionalPuzzleExampleData = Extract<
  PuzzleExample,
  | { puzzleType: 'slither' }
  | { puzzleType: 'wolvesandsheepfences' }
  | { puzzleType: 'lits' }
  | { puzzleType: 'lakes' }
  | { puzzleType: 'domino-search' }
  | { puzzleType: 'snail' }
  | { puzzleType: 'slovak-sums' }
  | { puzzleType: 'japanese-arrows' }
  | { puzzleType: 'four-winds-with-parks' }
  | { puzzleType: 'consecutive-kakuro' }
>;

interface Props {
  example: AdditionalPuzzleExampleData;
  playableLabel: string;
  answerLabel: string;
}

const CELL_SIZE = boardLayoutMetrics.exampleCellSize;
const BOARD_PADDING = commonBoardChrome.padding;
const BOARD_BORDER = commonBoardChrome.border;

function ExamplePair({ left, right, playableLabel, answerLabel }: Props & { left: ReactNode; right: ReactNode }) {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <div className="mb-4 text-center text-base font-medium text-muted-foreground">{playableLabel}</div>
        {left}
      </div>
      <div>
        <div className="mb-4 text-center text-base font-medium text-muted-foreground">{answerLabel}</div>
        <ExampleAnswerReveal
          visible={showAnswer}
          onVisibleChange={setShowAnswer}
          ariaLabel={answerLabel}
          className="flex justify-center overflow-x-auto"
        >
          {right}
        </ExampleAnswerReveal>
      </div>
    </div>
  );
}

function BoardFrame({ width, height, children }: { width: number; height: number; children: ReactNode }) {
  return (
    <div className="flex justify-center overflow-x-auto">
      <div
        className="relative select-none"
        style={{
          width: `${width * CELL_SIZE + BOARD_PADDING * 2 + BOARD_BORDER * 2}px`,
          height: `${height * CELL_SIZE + BOARD_PADDING * 2 + BOARD_BORDER * 2}px`,
          ...getBoardFrameStyle(BOARD_BORDER),
        }}
      >
        {children}
      </div>
    </div>
  );
}

function CellGrid({
  width,
  height,
  children,
}: {
  width: number;
  height: number;
  children: (row: number, col: number) => ReactNode;
}) {
  return (
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
            className={boardClassNames.cellContent}
            style={{
              ...getBoardCellStyle(CELL_SIZE, 'cell'),
              ...getBoardTextStyle(CELL_SIZE),
            }}
          >
            {children(row, col)}
          </div>
        ))
      )}
    </div>
  );
}

function RegionBoundaries({ regionIds, width, height }: { regionIds: number[][]; width: number; height: number }) {
  const boundaries = getRegionBoundarySegments(regionIds, width, height);
  const { strokeWidth, outlineWidth } = getBoardBoundaryStrokeMetrics(CELL_SIZE);

  return (
    <svg
      className="pointer-events-none absolute left-0 top-0"
      width={width * CELL_SIZE + BOARD_PADDING * 2}
      height={height * CELL_SIZE + BOARD_PADDING * 2}
    >
      {boundaries.horizontal.map((segment) => {
        const x1 = BOARD_PADDING + segment.col * CELL_SIZE;
        const y = BOARD_PADDING + segment.row * CELL_SIZE;
        return (
          <line
            key={`ho-${segment.row}-${segment.col}`}
            x1={x1}
            y1={y}
            x2={x1 + CELL_SIZE}
            y2={y}
            stroke={woodBoardTheme.cell}
            strokeWidth={outlineWidth}
          />
        );
      })}
      {boundaries.vertical.map((segment) => {
        const x = BOARD_PADDING + segment.col * CELL_SIZE;
        const y1 = BOARD_PADDING + segment.row * CELL_SIZE;
        return (
          <line
            key={`vo-${segment.row}-${segment.col}`}
            x1={x}
            y1={y1}
            x2={x}
            y2={y1 + CELL_SIZE}
            stroke={woodBoardTheme.cell}
            strokeWidth={outlineWidth}
          />
        );
      })}
      {boundaries.horizontal.map((segment) => {
        const x1 = BOARD_PADDING + segment.col * CELL_SIZE;
        const y = BOARD_PADDING + segment.row * CELL_SIZE;
        return (
          <line
            key={`h-${segment.row}-${segment.col}`}
            x1={x1}
            y1={y}
            x2={x1 + CELL_SIZE}
            y2={y}
            stroke={woodBoardTheme.border}
            strokeWidth={strokeWidth}
            strokeLinecap="square"
          />
        );
      })}
      {boundaries.vertical.map((segment) => {
        const x = BOARD_PADDING + segment.col * CELL_SIZE;
        const y1 = BOARD_PADDING + segment.row * CELL_SIZE;
        return (
          <line
            key={`v-${segment.row}-${segment.col}`}
            x1={x}
            y1={y1}
            x2={x}
            y2={y1 + CELL_SIZE}
            stroke={woodBoardTheme.border}
            strokeWidth={strokeWidth}
            strokeLinecap="square"
          />
        );
      })}
    </svg>
  );
}

function ShadedBoard({
  width,
  height,
  shaded,
  clues = [],
  regionIds,
}: {
  width: number;
  height: number;
  shaded?: (0 | 1)[][];
  clues?: Array<{ row: number; col: number; value: number | '?' }>;
  regionIds?: number[][];
}) {
  const clueMap = new Map(clues.map((clue) => [`${clue.row},${clue.col}`, clue.value]));

  return (
    <BoardFrame width={width} height={height}>
      <CellGrid width={width} height={height}>
        {(row, col) => {
          const clue = clueMap.get(`${row},${col}`);
          const isShaded = shaded?.[row]?.[col] === 1;
          return (
            <div
              className={`absolute inset-0 flex items-center justify-center ${boardClassNames.cellText}`}
              style={getBoardCellColors(clue !== undefined ? 'clue' : isShaded ? 'shaded' : 'cell')}
            >
              {clue}
            </div>
          );
        }}
      </CellGrid>
      {regionIds ? <RegionBoundaries regionIds={regionIds} width={width} height={height} /> : null}
    </BoardFrame>
  );
}

function SlitherBoard({ example, answer }: {
  example: Extract<AdditionalPuzzleExampleData, { puzzleType: 'slither' | 'wolvesandsheepfences' }>;
  answer: boolean;
}) {
  const lineSet = new Set(answer ? example.loopEdges : []);
  const crossSet = new Set(answer ? example.crossedEdges ?? [] : []);
  const stroke = getLoopLineStrokeWidth(CELL_SIZE);
  const clueTextProps = getBoardSvgTextProps(CELL_SIZE);
  const crossSize = getLoopCrossSize(CELL_SIZE, 0.12, 4);

  return (
    <BoardFrame width={example.width} height={example.height}>
      <svg
        className="absolute left-0 top-0"
        width={example.width * CELL_SIZE + BOARD_PADDING * 2}
        height={example.height * CELL_SIZE + BOARD_PADDING * 2}
      >
        {Array.from({ length: example.height }, (_, row) =>
          Array.from({ length: example.width }, (_, col) => (
            <g key={`cell-${row}-${col}`}>
              <rect
                x={BOARD_PADDING + col * CELL_SIZE}
                y={BOARD_PADDING + row * CELL_SIZE}
                width={CELL_SIZE}
                height={CELL_SIZE}
                fill={woodBoardTheme.cell}
                stroke={woodBoardTheme.gridLine}
              />
              {example.clues[row][col] !== null ? (() => {
                const clue = example.clues[row][col];
                if (clue === 'sheep' || clue === 'wolf') {
                  return (
                    <g transform={`translate(${BOARD_PADDING + col * CELL_SIZE} ${BOARD_PADDING + row * CELL_SIZE}) scale(${CELL_SIZE / 100})`}>
                      <WolvesAndSheepSymbol kind={clue} cellSize={CELL_SIZE} asSvg />
                    </g>
                  );
                }
                return (
                  <text
                    x={BOARD_PADDING + (col + 0.5) * CELL_SIZE}
                    y={BOARD_PADDING + (row + 0.5) * CELL_SIZE}
                    dominantBaseline="central"
                    textAnchor="middle"
                    fill={woodBoardTheme.border}
                    {...clueTextProps}
                  >
                    {clue}
                  </text>
                );
              })() : null}
            </g>
          ))
        )}
        {Array.from({ length: example.height + 1 }, (_, row) =>
          Array.from({ length: example.width + 1 }, (_, col) => (
            <circle
              key={`dot-${row}-${col}`}
              cx={BOARD_PADDING + col * CELL_SIZE}
              cy={BOARD_PADDING + row * CELL_SIZE}
              r={getBoardDotRadius(CELL_SIZE)}
              fill={woodBoardTheme.border}
            />
          ))
        )}
        {Array.from(lineSet).map((key) => {
          const edge = parseGridLineEdgeKey(key);
          if (!edge) return null;
          const horizontal = edge.orientation === 'h';
          return (
            <line
              key={key}
              x1={BOARD_PADDING + edge.col * CELL_SIZE}
              y1={BOARD_PADDING + edge.row * CELL_SIZE}
              x2={BOARD_PADDING + (edge.col + (horizontal ? 1 : 0)) * CELL_SIZE}
              y2={BOARD_PADDING + (edge.row + (horizontal ? 0 : 1)) * CELL_SIZE}
              stroke={woodBoardTheme.ink}
              strokeWidth={stroke}
              strokeLinecap="round"
            />
          );
        })}
        {Array.from(crossSet).map((key) => {
          const edge = parseGridLineEdgeKey(key);
          if (!edge) return null;
          const x = BOARD_PADDING + (edge.col + (edge.orientation === 'h' ? 0.5 : 0)) * CELL_SIZE;
          const y = BOARD_PADDING + (edge.row + (edge.orientation === 'h' ? 0 : 0.5)) * CELL_SIZE;
          return (
            <g key={`x-${key}`} stroke={woodBoardTheme.border} strokeWidth={getLoopCrossStrokeWidth()} strokeLinecap="round">
              <line x1={x - crossSize} y1={y - crossSize} x2={x + crossSize} y2={y + crossSize} />
              <line x1={x - crossSize} y1={y + crossSize} x2={x + crossSize} y2={y - crossSize} />
            </g>
          );
        })}
      </svg>
    </BoardFrame>
  );
}

function DominoBoard({ example, answer }: { example: Extract<AdditionalPuzzleExampleData, { puzzleType: 'domino-search' }>; answer: boolean }) {
  const edges = answer ? example.solutionEdges.map(getEdgeKey) : [];
  const { strokeWidth } = getBoardBoundaryStrokeMetrics(CELL_SIZE);

  return (
    <BoardFrame width={example.width} height={example.height}>
      <CellGrid width={example.width} height={example.height}>
        {(row, col) => example.numbers[row][col]}
      </CellGrid>
      <svg
        className="pointer-events-none absolute left-0 top-0"
        width={example.width * CELL_SIZE + BOARD_PADDING * 2}
        height={example.height * CELL_SIZE + BOARD_PADDING * 2}
      >
        {edges.map((key) => {
          const edge = parseSolutionEdgeKey(key);
          if (!edge) return null;
          const horizontal = edge.r1 === edge.r2;
          const row = Math.min(edge.r1, edge.r2);
          const col = Math.min(edge.c1, edge.c2);

          return (
            <rect
              key={key}
              x={BOARD_PADDING + col * CELL_SIZE}
              y={BOARD_PADDING + row * CELL_SIZE}
              width={(horizontal ? 2 : 1) * CELL_SIZE}
              height={(horizontal ? 1 : 2) * CELL_SIZE}
              fill="none"
              stroke={woodBoardTheme.ink}
              strokeWidth={strokeWidth}
              strokeLinejoin="miter"
            />
          );
        })}
      </svg>
    </BoardFrame>
  );
}

function NumberGridBoard({
  width,
  height,
  cells,
  values,
  clueTone = false,
}: {
  width: number;
  height: number;
  cells: Array<Array<unknown>>;
  values?: (number | null)[][];
  clueTone?: boolean;
}) {
  return (
    <BoardFrame width={width} height={height}>
      <CellGrid width={width} height={height}>
        {(row, col) => {
          const cell = cells[row][col];
          const isBlock = cell === 'block' || (cell !== null && typeof cell === 'object');
          const clue = cell && typeof cell === 'object' && 'sum' in cell && 'count' in cell
            ? cell as { sum: number | null; count: number }
            : null;
          const value = values?.[row]?.[col] ?? (typeof cell === 'number' ? cell : null);

          return (
            <div
              className={`absolute inset-0 flex items-center justify-center ${boardClassNames.cellText}`}
              style={{
                ...getBoardCellColors(
                  isBlock ? 'shaded' : typeof cell === 'number' ? (clueTone ? 'clue' : 'prefilled') : 'cell'
                ),
                ...getBoardTextStyle(CELL_SIZE, clue ? 0.31 : 0.68, clue ? 13 : 22),
              }}
            >
              {clue ? <SlovakSumsClue sum={clue.sum} count={clue.count} cellSize={CELL_SIZE} /> : value}
            </div>
          );
        }}
      </CellGrid>
    </BoardFrame>
  );
}

function JapaneseArrowsBoard({ example, answer }: { example: Extract<AdditionalPuzzleExampleData, { puzzleType: 'japanese-arrows' }>; answer: boolean }) {
  const glyphs: Record<string, string> = { N: '↑', NE: '↗', E: '→', SE: '↘', S: '↓', SW: '↙', W: '←', NW: '↖' };
  return <BoardFrame width={example.width} height={example.height}><CellGrid width={example.width} height={example.height}>{(row, col) => {
    const clue = example.clues[row][col];
    const value = answer ? example.correctGrid[row][col] : clue;
    return <span className="relative flex h-full w-full items-center justify-center" style={getBoardTextStyle(CELL_SIZE, 0.62, 15)}><span className="absolute top-0 text-[0.58em] leading-none">{glyphs[example.arrows[row][col]]}</span>{value ?? ''}</span>;
  }}</CellGrid></BoardFrame>;
}

function FourWindsExampleBoard({ example, answer }: { example: Extract<AdditionalPuzzleExampleData, { puzzleType: 'four-winds-with-parks' }>; answer: boolean }) {
  const glyphs = ['X', '↑', '→', '↓', '←'];
  return <BoardFrame width={example.width} height={example.height}><CellGrid width={example.width} height={example.height}>{(row, col) => {
    const clue = example.clues[row][col];
    return clue !== null ? <span className={boardClassNames.cellText}>{clue}</span> : answer ? <span className={boardClassNames.cellText}>{glyphs[example.correctGrid[row][col]]}</span> : null;
  }}</CellGrid></BoardFrame>;
}

function ConsecutiveKakuroExampleBoard({ example, answer }: { example: Extract<AdditionalPuzzleExampleData, { puzzleType: 'consecutive-kakuro' }>; answer: boolean }) {
  return <BoardFrame width={example.width} height={example.height}><CellGrid width={example.width} height={example.height}>{(row, col) => {
    const cell = example.cells[row][col];
    if (cell) return <KakuroClue right={cell.right} down={cell.down} cellSize={CELL_SIZE} />;
    return answer ? example.correctGrid[row][col] : null;
  }}</CellGrid></BoardFrame>;
}

export default function AdditionalPuzzleExample({ example, playableLabel, answerLabel }: Props) {
  if (example.puzzleType === 'slither' || example.puzzleType === 'wolvesandsheepfences') {
    return (
      <ExamplePair
        example={example}
        playableLabel={playableLabel}
        answerLabel={answerLabel}
        left={<SlitherBoard example={example} answer={false} />}
        right={<SlitherBoard example={example} answer />}
      />
    );
  }

  if (example.puzzleType === 'lits') {
    return (
      <ExamplePair
        example={example}
        playableLabel={playableLabel}
        answerLabel={answerLabel}
        left={<ShadedBoard width={example.width} height={example.height} regionIds={example.regionIds} />}
        right={<ShadedBoard width={example.width} height={example.height} shaded={example.correctSolution} regionIds={example.regionIds} />}
      />
    );
  }

  if (example.puzzleType === 'lakes') {
    return (
      <ExamplePair
        example={example}
        playableLabel={playableLabel}
        answerLabel={answerLabel}
        left={<ShadedBoard width={example.width} height={example.height} clues={example.clues} />}
        right={<ShadedBoard width={example.width} height={example.height} clues={example.clues} shaded={example.correctSolution} />}
      />
    );
  }

  if (example.puzzleType === 'domino-search') {
    return (
      <ExamplePair
        example={example}
        playableLabel={playableLabel}
        answerLabel={answerLabel}
        left={<DominoBoard example={example} answer={false} />}
        right={<DominoBoard example={example} answer />}
      />
    );
  }

  if (example.puzzleType === 'snail') {
    return (
      <ExamplePair
        example={example}
        playableLabel={playableLabel}
        answerLabel={answerLabel}
        left={<NumberGridBoard width={example.width} height={example.height} cells={example.cells} clueTone />}
        right={<NumberGridBoard width={example.width} height={example.height} cells={example.cells} values={example.correctGrid} clueTone />}
      />
    );
  }

  if (example.puzzleType === 'japanese-arrows') {
    return <ExamplePair example={example} playableLabel={playableLabel} answerLabel={answerLabel}
      left={<JapaneseArrowsBoard example={example} answer={false} />} right={<JapaneseArrowsBoard example={example} answer />} />;
  }

  if (example.puzzleType === 'four-winds-with-parks') {
    return <ExamplePair example={example} playableLabel={playableLabel} answerLabel={answerLabel}
      left={<FourWindsExampleBoard example={example} answer={false} />} right={<FourWindsExampleBoard example={example} answer />} />;
  }

  if (example.puzzleType === 'consecutive-kakuro') {
    return <ExamplePair example={example} playableLabel={playableLabel} answerLabel={answerLabel}
      left={<ConsecutiveKakuroExampleBoard example={example} answer={false} />} right={<ConsecutiveKakuroExampleBoard example={example} answer />} />;
  }

  return (
    <ExamplePair
      example={example}
      playableLabel={playableLabel}
      answerLabel={answerLabel}
      left={<NumberGridBoard width={example.width} height={example.height} cells={example.cells} />}
      right={<NumberGridBoard width={example.width} height={example.height} cells={example.cells} values={example.correctGrid} />}
    />
  );
}
