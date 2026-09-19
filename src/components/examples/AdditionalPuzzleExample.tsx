import { useState, type ReactNode } from 'react';
import ExampleAnswerReveal from '@/components/ExampleAnswerReveal';
import type { PuzzleExample } from '@/puzzles/types';
import {
  boardClassNames,
  boardLayoutMetrics,
  commonBoardChrome,
  getBoardCellStyle,
  getBoardCellColors,
  getBoardClueCircleMetrics,
  getBoardDotRadius,
  getBoardBoundaryStrokeMetrics,
  getBoardBoundaryStrokeWidth,
  getBoardFrameDimensions,
  getBoardFrameStyle,
  getBoardGridStyle,
  getBoardGridOutlineRect,
  getBoardPillCapsuleMetrics,
  getBoardPoleMarkMetrics,
  getBoardSvgTextProps,
  getBoardTextStyle,
  getKurarinClueColors,
  getLoopLineStrokeWidth,
  woodBoardTheme,
} from '@/puzzles/boardTheme';
import { getEdgeKey, getRegionBoundarySegments, parseGridLineEdgeKey, parseSolutionEdgeKey } from '@/puzzles/gridUtils';
import { getPillComponents, getPillsPipsLayout } from '@/puzzles/Pills/utils';
import SlovakSumsClue from '@/puzzles/SlovakSums/SlovakSumsClue';
import WolvesAndSheepSymbol from '@/puzzles/WolvesAndSheep/WolvesAndSheepSymbol';
import KakuroClue from '@/puzzles/Kakuro/KakuroClue';
import FourWindsWithParksMark from '@/puzzles/FourWindsWithParks/FourWindsWithParksVisuals';
import BoardEdgeCross from '@/puzzles/shared/BoardEdgeCross';

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
  | { puzzleType: 'magnets' }
  | { puzzleType: 'pills' }
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
  const { outerWidth, outerHeight } = getBoardFrameDimensions(width, height, CELL_SIZE, {
    borderWidth: BOARD_BORDER,
    padding: BOARD_PADDING,
  });
  return (
    <div className="flex justify-center overflow-x-auto">
      <div
        className="relative select-none"
        style={{
          width: `${outerWidth}px`,
          height: `${outerHeight}px`,
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
      style={getBoardGridStyle(BOARD_PADDING, BOARD_PADDING, width, CELL_SIZE)}
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
            <BoardEdgeCross key={`x-${key}`} x={x} y={y} cellSize={CELL_SIZE} />
          );
        })}
      </svg>
    </BoardFrame>
  );
}

function DominoBoard({ example, answer }: { example: Extract<AdditionalPuzzleExampleData, { puzzleType: 'domino-search' }>; answer: boolean }) {
  const edges = answer ? example.solutionEdges.map(getEdgeKey) : [];

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
              {...getBoardGridOutlineRect(
                BOARD_PADDING + col * CELL_SIZE,
                BOARD_PADDING + row * CELL_SIZE,
                (horizontal ? 2 : 1) * CELL_SIZE,
                (horizontal ? 1 : 2) * CELL_SIZE
              )}
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

function FourWindsWithParksExampleBoard({ example, answer }: { example: Extract<AdditionalPuzzleExampleData, { puzzleType: 'four-winds-with-parks' }>; answer: boolean }) {
  return <BoardFrame width={example.width} height={example.height}><CellGrid width={example.width} height={example.height}>{(row, col) => {
    const clue = example.clues[row][col];
    return clue !== null ? <span className={boardClassNames.cellText}>{clue}</span> : answer ? <FourWindsWithParksMark value={example.correctGrid[row][col]} cellSize={CELL_SIZE} /> : null;
  }}</CellGrid></BoardFrame>;
}

function ConsecutiveKakuroExampleBoard({ example, answer }: { example: Extract<AdditionalPuzzleExampleData, { puzzleType: 'consecutive-kakuro' }>; answer: boolean }) {
  const { radius, strokeWidth, outerRadiusOffset } = getBoardClueCircleMetrics(CELL_SIZE);
  const dotColors = getKurarinClueColors('white');
  const haloFill = getBoardCellColors('cell').background;
  const renderBarDot = (key: string, x: number, y: number) => (
    <g key={key}>
      <circle cx={x} cy={y} r={radius + outerRadiusOffset} fill={haloFill} />
      <circle cx={x} cy={y} r={radius} fill={dotColors.fill} stroke={dotColors.stroke} strokeWidth={strokeWidth} />
    </g>
  );
  const bars = [
    ...example.horizontalBars.flatMap((row, r) => row.map((bar, c) =>
      bar && example.cells[r][c] === null && example.cells[r][c + 1] === null
        ? renderBarDot(`h-${r}-${c}`, BOARD_PADDING + (c + 1) * CELL_SIZE, BOARD_PADDING + r * CELL_SIZE + CELL_SIZE / 2)
        : null
    )),
    ...example.verticalBars.flatMap((row, r) => row.map((bar, c) =>
      bar && example.cells[r][c] === null && example.cells[r + 1][c] === null
        ? renderBarDot(`v-${r}-${c}`, BOARD_PADDING + c * CELL_SIZE + CELL_SIZE / 2, BOARD_PADDING + (r + 1) * CELL_SIZE)
        : null
    )),
  ];
  return <BoardFrame width={example.width} height={example.height}><CellGrid width={example.width} height={example.height}>{(row, col) => {
    const cell = example.cells[row][col];
    if (cell) return <KakuroClue right={cell.right} down={cell.down} cellSize={CELL_SIZE} />;
    return answer ? example.correctGrid[row][col] : null;
  }}</CellGrid><svg className="pointer-events-none absolute left-0 top-0" width={example.width * CELL_SIZE + BOARD_PADDING * 2} height={example.height * CELL_SIZE + BOARD_PADDING * 2} aria-hidden="true">{bars}</svg></BoardFrame>;
}

function MagnetsExampleBoard({ example, answer }: { example: Extract<AdditionalPuzzleExampleData, { puzzleType: 'magnets' }>; answer: boolean }) {
  const regionOf = Array.from({ length: example.height }, () => Array<number>(example.width).fill(-1));
  example.regions.forEach((region, index) => {
    region.forEach(({ row, col }) => { regionOf[row][col] = index; });
  });
  const { length, thickness } = getBoardPoleMarkMetrics(CELL_SIZE);
  const strokeWidth = getBoardBoundaryStrokeWidth(CELL_SIZE);
  const borders = [] as Array<{ key: string; x1: number; y1: number; x2: number; y2: number }>;
  for (let row = 0; row < example.height; row++) {
    for (let col = 0; col < example.width; col++) {
      if (col + 1 < example.width && regionOf[row][col] !== regionOf[row][col + 1]) {
        borders.push({ key: `v-${row}-${col}`, x1: BOARD_PADDING + (col + 1) * CELL_SIZE, y1: BOARD_PADDING + row * CELL_SIZE, x2: BOARD_PADDING + (col + 1) * CELL_SIZE, y2: BOARD_PADDING + (row + 1) * CELL_SIZE });
      }
      if (row + 1 < example.height && regionOf[row][col] !== regionOf[row + 1][col]) {
        borders.push({ key: `h-${row}-${col}`, x1: BOARD_PADDING + col * CELL_SIZE, y1: BOARD_PADDING + (row + 1) * CELL_SIZE, x2: BOARD_PADDING + (col + 1) * CELL_SIZE, y2: BOARD_PADDING + (row + 1) * CELL_SIZE });
      }
    }
  }
  const renderPole = (key: string, cx: number, cy: number, value: number | null) => {
    if (value === null) return null;
    const x = BOARD_PADDING + cx * CELL_SIZE;
    const y = BOARD_PADDING + cy * CELL_SIZE;
    return (
      <g key={key}>
        <rect x={x + (CELL_SIZE - length) / 2} y={y + (CELL_SIZE - thickness) / 2} width={length} height={thickness} fill={woodBoardTheme.ink} />
        {value === 1 ? <rect x={x + (CELL_SIZE - thickness) / 2} y={y + (CELL_SIZE - length) / 2} width={thickness} height={length} fill={woodBoardTheme.ink} /> : null}
      </g>
    );
  };
  const clues = [] as Array<{ key: string; x: number; y: number; value: number }>;
  example.topClues.forEach((value, col) => {
    if (value !== null) clues.push({ key: `top-${col}`, x: BOARD_PADDING + (col + 0.5) * CELL_SIZE, y: BOARD_PADDING * 0.22, value });
  });
  example.topMinusClues.forEach((value, col) => {
    if (value !== null) clues.push({ key: `topm-${col}`, x: BOARD_PADDING + (col + 0.5) * CELL_SIZE, y: BOARD_PADDING * 0.68, value });
  });
  example.leftPlusClues.forEach((value, row) => {
    if (value !== null) clues.push({ key: `leftp-${row}`, x: BOARD_PADDING * 0.22, y: BOARD_PADDING + (row + 0.5) * CELL_SIZE, value });
  });
  example.leftClues.forEach((value, row) => {
    if (value !== null) clues.push({ key: `left-${row}`, x: BOARD_PADDING * 0.68, y: BOARD_PADDING + (row + 0.5) * CELL_SIZE, value });
  });
  return <BoardFrame width={example.width} height={example.height}><CellGrid width={example.width} height={example.height}>{() => null}</CellGrid><svg className="pointer-events-none absolute left-0 top-0" width={example.width * CELL_SIZE + BOARD_PADDING * 2} height={example.height * CELL_SIZE + BOARD_PADDING * 2} aria-hidden="true">
    {borders.map((border) => <line key={border.key} x1={border.x1} y1={border.y1} x2={border.x2} y2={border.y2} stroke={woodBoardTheme.ink} strokeWidth={strokeWidth} strokeLinecap="round" />)}
    {answer ? example.correctGrid.flatMap((row, r) => row.map((value, c) => renderPole(`p-${r}-${c}`, c, r, value))) : example.givens.flatMap((row, r) => row.map((value, c) => value ? renderPole(`p-${r}-${c}`, c, r, value === '+' ? 1 : 2) : null))}
    {clues.map((clue) => <text key={clue.key} x={clue.x} y={clue.y} textAnchor="middle" dominantBaseline="middle" {...getBoardSvgTextProps(CELL_SIZE)}>{clue.value}</text>)}
  </svg></BoardFrame>;
}

function PillsExampleBoard({ example, answer }: { example: Extract<AdditionalPuzzleExampleData, { puzzleType: 'pills' }>; answer: boolean }) {
  const clues = [] as Array<{ key: string; x: number; y: number; value: number }>;
  example.topClues.forEach((value, col) => {
    if (value !== null) clues.push({ key: `top-${col}`, x: BOARD_PADDING + (col + 0.5) * CELL_SIZE, y: BOARD_PADDING * 0.22, value });
  });
  example.topMinusClues.forEach((value, col) => {
    if (value !== null) clues.push({ key: `topm-${col}`, x: BOARD_PADDING + (col + 0.5) * CELL_SIZE, y: BOARD_PADDING * 0.68, value });
  });
  example.leftPlusClues.forEach((value, row) => {
    if (value !== null) clues.push({ key: `leftp-${row}`, x: BOARD_PADDING * 0.22, y: BOARD_PADDING + (row + 0.5) * CELL_SIZE, value });
  });
  example.leftClues.forEach((value, row) => {
    if (value !== null) clues.push({ key: `left-${row}`, x: BOARD_PADDING * 0.68, y: BOARD_PADDING + (row + 0.5) * CELL_SIZE, value });
  });
  const pills = answer
    ? getPillComponents(example.correctGrid.map((row) => row.map((value) => (value === 1 ? 1 : 0))), [], example.width, example.height)
    : [];
  const lineStroke = getLoopLineStrokeWidth(CELL_SIZE);
  return <BoardFrame width={example.width} height={example.height}><CellGrid width={example.width} height={example.height}>{(row, col) => {
    const count = example.dots[row][col];
    if (count <= 0) return null;
    const { radius, positions } = getPillsPipsLayout(count, CELL_SIZE);
    return (
      <span
        className="relative flex h-full w-full items-center justify-center"
        style={{ transform: count > 1 ? 'rotate(18deg)' : undefined }}
      >
        {positions.map((position, index) => (
          <span
            key={index}
            className="absolute block rounded-full"
            style={{
              width: `${radius * 2}px`,
              height: `${radius * 2}px`,
              left: `calc(${(position.x * 100).toFixed(2)}% - ${radius}px)`,
              top: `calc(${(position.y * 100).toFixed(2)}% - ${radius}px)`,
              background: woodBoardTheme.ink,
            }}
          />
        ))}
      </span>
    );
  }}</CellGrid><svg className="pointer-events-none absolute left-0 top-0" width={example.width * CELL_SIZE + BOARD_PADDING * 2} height={example.height * CELL_SIZE + BOARD_PADDING * 2} aria-hidden="true">
    {pills.map((pill, index) => {
      const { inset, radius } = getBoardPillCapsuleMetrics(CELL_SIZE);
      if (pill.orientation === 'h') {
        const minCol = Math.min(...pill.cells.map((cell) => cell.col));
        return (
          <rect
            key={`capsule-${index}`}
            x={BOARD_PADDING + minCol * CELL_SIZE + inset}
            y={BOARD_PADDING + pill.cells[0].row * CELL_SIZE + inset}
            width={CELL_SIZE * pill.cells.length - inset * 2}
            height={CELL_SIZE - inset * 2}
            rx={radius}
            fill="none"
            stroke={woodBoardTheme.ink}
            strokeWidth={lineStroke}
          />
        );
      }
      const minRow = Math.min(...pill.cells.map((cell) => cell.row));
      return (
        <rect
          key={`capsule-${index}`}
          x={BOARD_PADDING + pill.cells[0].col * CELL_SIZE + inset}
          y={BOARD_PADDING + minRow * CELL_SIZE + inset}
          width={CELL_SIZE - inset * 2}
          height={CELL_SIZE * pill.cells.length - inset * 2}
          rx={radius}
          fill="none"
          stroke={woodBoardTheme.ink}
          strokeWidth={lineStroke}
        />
      );
    })}
    {clues.map((clue) => <text key={clue.key} x={clue.x} y={clue.y} textAnchor="middle" dominantBaseline="middle" {...getBoardSvgTextProps(CELL_SIZE)}>{clue.value}</text>)}
  </svg></BoardFrame>;
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
      left={<FourWindsWithParksExampleBoard example={example} answer={false} />} right={<FourWindsWithParksExampleBoard example={example} answer />} />;
  }

  if (example.puzzleType === 'consecutive-kakuro') {
    return <ExamplePair example={example} playableLabel={playableLabel} answerLabel={answerLabel}
      left={<ConsecutiveKakuroExampleBoard example={example} answer={false} />} right={<ConsecutiveKakuroExampleBoard example={example} answer />} />;
  }

  if (example.puzzleType === 'magnets') {
    return <ExamplePair example={example} playableLabel={playableLabel} answerLabel={answerLabel}
      left={<MagnetsExampleBoard example={example} answer={false} />} right={<MagnetsExampleBoard example={example} answer />} />;
  }
  if (example.puzzleType === 'pills') {
    return <ExamplePair example={example} playableLabel={playableLabel} answerLabel={answerLabel}
      left={<PillsExampleBoard example={example} answer={false} />} right={<PillsExampleBoard example={example} answer />} />;
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
