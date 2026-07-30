import type { ReactNode } from 'react';
import type { PuzzleExample } from '@/puzzles/types';
import {
  commonBoardChrome,
  getBoardFrameStyle,
  getBoardNumberFontSize,
  getCellDividerStyle,
  getLoopLineStrokeWidth,
  getOutlinedBorderStrokeWidth,
  getRoomBoundaryStrokeWidth,
  woodBoardTheme,
} from '@/puzzles/boardTheme';
import { getEdgeKey, getRegionBoundarySegments, parseGridLineEdgeKey, parseSolutionEdgeKey } from '@/puzzles/gridUtils';

type AdditionalPuzzleExampleData = Extract<
  PuzzleExample,
  | { puzzleType: 'slither' }
  | { puzzleType: 'lits' }
  | { puzzleType: 'lakes' }
  | { puzzleType: 'domino-search' }
  | { puzzleType: 'snail' }
  | { puzzleType: 'slovak-sums' }
>;

interface Props {
  example: AdditionalPuzzleExampleData;
  playableLabel: string;
  answerLabel: string;
}

const CELL_SIZE = 42;
const BOARD_PADDING = commonBoardChrome.padding;
const BOARD_BORDER = commonBoardChrome.border;

function ExamplePair({ left, right, playableLabel, answerLabel }: Props & { left: ReactNode; right: ReactNode }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <div className="mb-2 text-center text-sm font-medium text-muted-foreground">{playableLabel}</div>
        {left}
      </div>
      <div>
        <div className="mb-2 text-center text-sm font-medium text-muted-foreground">{answerLabel}</div>
        {right}
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
            className="relative flex items-center justify-center font-semibold tabular-nums"
            style={{
              width: `${CELL_SIZE}px`,
              height: `${CELL_SIZE}px`,
              background: woodBoardTheme.cell,
              color: woodBoardTheme.border,
              fontSize: `${getBoardNumberFontSize(CELL_SIZE)}px`,
              lineHeight: 1,
              ...getCellDividerStyle(),
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
  const strokeWidth = getRoomBoundaryStrokeWidth();
  const outlineWidth = getOutlinedBorderStrokeWidth(strokeWidth);

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
              className="absolute inset-0 flex items-center justify-center font-semibold tabular-nums"
              style={{
                background: clue !== undefined
                  ? woodBoardTheme.clueCell
                  : isShaded
                    ? woodBoardTheme.shaded
                    : woodBoardTheme.cell,
                color: isShaded ? woodBoardTheme.shadedText : woodBoardTheme.border,
              }}
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

function SlitherBoard({ example, answer }: { example: Extract<AdditionalPuzzleExampleData, { puzzleType: 'slither' }>; answer: boolean }) {
  const lineSet = new Set(answer ? example.loopEdges : []);
  const crossSet = new Set(answer ? example.crossedEdges ?? [] : []);
  const stroke = getLoopLineStrokeWidth(CELL_SIZE);

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
              {example.clues[row][col] !== null ? (
                <text
                  x={BOARD_PADDING + (col + 0.5) * CELL_SIZE}
                  y={BOARD_PADDING + (row + 0.5) * CELL_SIZE}
                  dominantBaseline="central"
                  textAnchor="middle"
                  fill={woodBoardTheme.border}
                  fontSize={getBoardNumberFontSize(CELL_SIZE)}
                  fontWeight={700}
                >
                  {example.clues[row][col]}
                </text>
              ) : null}
            </g>
          ))
        )}
        {Array.from({ length: example.height + 1 }, (_, row) =>
          Array.from({ length: example.width + 1 }, (_, col) => (
            <circle
              key={`dot-${row}-${col}`}
              cx={BOARD_PADDING + col * CELL_SIZE}
              cy={BOARD_PADDING + row * CELL_SIZE}
              r={2.5}
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
            <g key={`x-${key}`} stroke={woodBoardTheme.border} strokeLinecap="round">
              <line x1={x - 4} y1={y - 4} x2={x + 4} y2={y + 4} />
              <line x1={x - 4} y1={y + 4} x2={x + 4} y2={y - 4} />
            </g>
          );
        })}
      </svg>
    </BoardFrame>
  );
}

function DominoBoard({ example, answer }: { example: Extract<AdditionalPuzzleExampleData, { puzzleType: 'domino-search' }>; answer: boolean }) {
  const edges = answer ? example.solutionEdges.map(getEdgeKey) : [];
  const strokeWidth = getRoomBoundaryStrokeWidth();

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
}: {
  width: number;
  height: number;
  cells: Array<Array<unknown>>;
  values?: (number | null)[][];
}) {
  return (
    <BoardFrame width={width} height={height}>
      <CellGrid width={width} height={height}>
        {(row, col) => {
          const cell = cells[row][col];
          const isBlock = cell === 'block' || (cell !== null && typeof cell === 'object');
          const clue = cell && typeof cell === 'object' && 'sum' in cell && 'count' in cell
            ? cell as { sum: number; count: number }
            : null;
          const value = values?.[row]?.[col] ?? (typeof cell === 'number' ? cell : null);

          return (
            <div
              className="absolute inset-0 flex items-center justify-center font-semibold tabular-nums"
              style={{
                background: isBlock ? woodBoardTheme.shaded : typeof cell === 'number' ? woodBoardTheme.prefilledCell : woodBoardTheme.cell,
                color: isBlock ? woodBoardTheme.shadedText : woodBoardTheme.border,
                fontSize: clue ? '13px' : `${getBoardNumberFontSize(CELL_SIZE)}px`,
                lineHeight: 1,
              }}
            >
              {clue ? (
                <span className="flex flex-col items-center">
                  <span>{clue.sum}</span>
                  <span className="mt-0.5 border-t border-white/65 px-1 pt-0.5">{clue.count}</span>
                </span>
              ) : value}
            </div>
          );
        }}
      </CellGrid>
    </BoardFrame>
  );
}

export default function AdditionalPuzzleExample({ example, playableLabel, answerLabel }: Props) {
  if (example.puzzleType === 'slither') {
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
        left={<NumberGridBoard width={example.width} height={example.height} cells={example.cells} />}
        right={<NumberGridBoard width={example.width} height={example.height} cells={example.cells} values={example.correctGrid} />}
      />
    );
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
