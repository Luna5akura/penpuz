import type { ReactNode } from 'react';
import { useMemo } from 'react';
import type { PuzzleExample } from '@/puzzles/types';
import type { BoardCellTone } from '@/puzzles/boardTheme';
import {
  boardClassNames,
  boardLayoutMetrics,
  commonBoardChrome,
  getBoardCellStyle,
  getBoardCellColors,
  getBoardClueCircleMetrics,
  getBoardClueTextStyle,
  getBoardSatisfiedClueTextStyle,
  getBoardDotRadius,
  getBoardBoundaryStrokeMetrics,
  getBoardBoundaryStrokeWidth,
  getBoardFrameStyle,
  getBoardGridStyle,
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
import { getMagicSnailBoundaryLines } from '@/puzzles/MagicSnail/utils';
import SlovakSumsClue from '@/puzzles/SlovakSums/SlovakSumsClue';
import WolvesAndSheepSymbol from '@/puzzles/WolvesAndSheep/WolvesAndSheepSymbol';
import KakuroClue from '@/puzzles/Kakuro/KakuroClue';
import FourWindsWithParksMark from '@/puzzles/FourWindsWithParks/FourWindsWithParksVisuals';
import { getSatisfiedFourWindsWithParksClues } from '@/puzzles/FourWindsWithParks/utils';
import { useExampleCellSize } from './exampleCellSizeContext';
import { ExampleBoardFrame, ExampleCellGrid } from './ExampleBoardChrome';
import FourWindsMark from '@/puzzles/FourWinds/FourWindsVisuals';
import { getSatisfiedFourWindsClues } from '@/puzzles/FourWinds/utils';
import { computeArrowRunLengths, computeArrowRunVariants } from '@/puzzles/shared/ArrowRunLayout';
import BoardEdgeCross from '@/puzzles/shared/BoardEdgeCross';
import PlayableExample from './PlayableExample';
import SlitherlinkBoard from '@/puzzles/Slitherlink/Slitherlink';
import WolvesAndSheepBoard from '@/puzzles/WolvesAndSheep/WolvesAndSheep';
import LitsBoard from '@/puzzles/Lits/Lits';
import LakesBoard from '@/puzzles/Lakes/Lakes';
import DominoSearchBoard from '@/puzzles/DominoSearch/DominoSearch';
import MagicSnailBoard from '@/puzzles/MagicSnail/MagicSnail';
import SlovakSumsBoard from '@/puzzles/SlovakSums/SlovakSums';
import JapaneseArrowsGameBoard from '@/puzzles/JapaneseArrows/JapaneseArrows';
import FourWindsWithParksBoard from '@/puzzles/FourWindsWithParks/FourWindsWithParks';
import FourWindsBoard from '@/puzzles/FourWinds/FourWinds';
import ConsecutiveKakuroBoard from '@/puzzles/ConsecutiveKakuro/ConsecutiveKakuro';
import JapaneseSumsBoard from '@/puzzles/JapaneseSums/JapaneseSums';
import MagnetsBoard from '@/puzzles/Magnets/Magnets';
import PillsBoard from '@/puzzles/Pills/Pills';
import type {
  ConsecutiveKakuroPuzzleData,
  DominoSearchPuzzleData,
  FourWindsPuzzleData,
  FourWindsWithParksPuzzleData,
  JapaneseArrowsPuzzleData,
  JapaneseSumsWithZeroesPuzzleData,
  LakesPuzzleData,
  LitsPuzzleData,
  MagicSnailPuzzleData,
  MagnetsPuzzleData,
  PillsPuzzleData,
  SlitherlinkPuzzleData,
  SlovakSumsPuzzleData,
  WolvesAndSheepPuzzleData,
} from '@/puzzles/types';

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
  | { puzzleType: 'fourwinds' }
  | { puzzleType: 'japanese-sums-with-zeroes' }
  | { puzzleType: 'consecutive-kakuro' }
  | { puzzleType: 'magnets' }
  | { puzzleType: 'pills' }
>;

interface Props {
  example: AdditionalPuzzleExampleData;
  playableLabel: string;
  answerLabel: string;
}

const BOARD_PADDING = commonBoardChrome.padding;
const BOARD_BORDER = commonBoardChrome.border;

function BoardFrame({ width, height, children }: { width: number; height: number; children: ReactNode }) {
  const CELL_SIZE = useExampleCellSize();
  return <ExampleBoardFrame width={width} height={height} cellSize={CELL_SIZE}>{children}</ExampleBoardFrame>;
}

function CellGrid({
  width,
  height,
  getCellTone,
  children,
}: {
  width: number;
  height: number;
  getCellTone?: (row: number, col: number) => BoardCellTone;
  children: (row: number, col: number) => ReactNode;
}) {
  const CELL_SIZE = useExampleCellSize();
  return (
    <ExampleCellGrid width={width} height={height} cellSize={CELL_SIZE} getCellTone={getCellTone}>
      {children}
    </ExampleCellGrid>
  );
}

function RegionBoundaries({ regionIds, width, height }: { regionIds: number[][]; width: number; height: number }) {
  const CELL_SIZE = useExampleCellSize();
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
  const CELL_SIZE = useExampleCellSize();
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
  const CELL_SIZE = useExampleCellSize();
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
          const x = BOARD_PADDING + col * CELL_SIZE;
          const y = BOARD_PADDING + row * CELL_SIZE;
          const w = (horizontal ? 2 : 1) * CELL_SIZE;
          const h = (horizontal ? 1 : 2) * CELL_SIZE;
          // Domino boundaries share the bold loop-line style used by
          // Slitherlink's player-drawn lines.
          const perimeter = [
            { x1: x, y1: y, x2: x + w, y2: y },
            { x1: x, y1: y + h, x2: x + w, y2: y + h },
            { x1: x, y1: y, x2: x, y2: y + h },
            { x1: x + w, y1: y, x2: x + w, y2: y + h },
          ];

          return (
            <g key={key}>
              {perimeter.map((segment, index) => (
                <line
                  key={index}
                  x1={segment.x1}
                  y1={segment.y1}
                  x2={segment.x2}
                  y2={segment.y2}
                  stroke={woodBoardTheme.ink}
                  strokeWidth={getLoopLineStrokeWidth(CELL_SIZE)}
                  strokeLinecap="round"
                />
              ))}
            </g>
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
  spiralBoundary = false,
}: {
  width: number;
  height: number;
  cells: Array<Array<unknown>>;
  values?: (number | null)[][];
  clueTone?: boolean;
  spiralBoundary?: boolean;
}) {
  const CELL_SIZE = useExampleCellSize();
  // The Magic Snail board draws its spiral wall from the same shared
  // boundary-line library; the answer diagram reuses it so both views
  // render the identical spiral.
  const boundaryLines = useMemo(
    () => (spiralBoundary ? getMagicSnailBoundaryLines(width, height) : []),
    [height, spiralBoundary, width]
  );
  const boundaryStrokeWidth = getBoardBoundaryStrokeWidth(CELL_SIZE);
  return (
    <BoardFrame width={width} height={height}>
      {boundaryLines.length > 0 ? (
        <svg
          className="pointer-events-none absolute"
          style={{ left: `${commonBoardChrome.padding}px`, top: `${commonBoardChrome.padding}px` }}
          width={width * CELL_SIZE}
          height={height * CELL_SIZE}
          viewBox={`0 0 ${width * CELL_SIZE} ${height * CELL_SIZE}`}
          aria-hidden="true"
        >
          {boundaryLines.map((line, index) => (
            <line
              key={`snail-boundary-${index}`}
              x1={line.x1 * CELL_SIZE}
              y1={line.y1 * CELL_SIZE}
              x2={line.x2 * CELL_SIZE}
              y2={line.y2 * CELL_SIZE}
              stroke={woodBoardTheme.border}
              strokeLinecap="square"
              strokeWidth={boundaryStrokeWidth}
            />
          ))}
        </svg>
      ) : null}
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
  const CELL_SIZE = useExampleCellSize();
  const glyphs: Record<string, string> = { N: '↑', NE: '↗', E: '→', SE: '↘', S: '↓', SW: '↙', W: '←', NW: '↖' };
  return <BoardFrame width={example.width} height={example.height}><CellGrid width={example.width} height={example.height}>{(row, col) => {
    const clue = example.clues[row][col];
    const value = answer ? example.correctGrid[row][col] : clue;
    return <span className="relative flex h-full w-full items-center justify-center" style={getBoardTextStyle(CELL_SIZE, 0.62, 15)}><span className="absolute top-0 text-[0.58em] leading-none">{glyphs[example.arrows[row][col]]}</span>{value ?? ''}</span>;
  }}</CellGrid></BoardFrame>;
}

function FourWindsWithParksExampleBoard({ example, answer }: { example: Extract<AdditionalPuzzleExampleData, { puzzleType: 'four-winds-with-parks' }>; answer: boolean }) {
  const CELL_SIZE = useExampleCellSize();
  const grid = useMemo(
    () => example.correctGrid.map((row, r) => row.map((value, c) => (example.clues[r][c] !== null ? null : value))),
    [example]
  );
  const arrowVariants = useMemo(() => computeArrowRunVariants(grid, example.width, example.height), [example.height, example.width, grid]);
  const arrowRunLengths = useMemo(() => computeArrowRunLengths(grid, example.width, example.height), [example.height, example.width, grid]);
  const satisfied = useMemo(
    () => getSatisfiedFourWindsWithParksClues(grid, { type: 'four-winds-with-parks', width: example.width, height: example.height, clues: example.clues }),
    [example, grid]
  );
  return <BoardFrame width={example.width} height={example.height}><CellGrid width={example.width} height={example.height} getCellTone={(row, col) => (example.clues[row][col] !== null ? 'clue' : 'cell')}>{(row, col) => {
    const clue = example.clues[row][col];
    return clue !== null ? <span className={boardClassNames.cellTextTight} style={satisfied[row][col] ? getBoardSatisfiedClueTextStyle(CELL_SIZE) : getBoardClueTextStyle(CELL_SIZE)}>{clue}</span> : answer ? <FourWindsWithParksMark value={example.correctGrid[row][col]} cellSize={CELL_SIZE} variant={arrowVariants[row][col]} runLength={arrowRunLengths[row][col]} /> : null;
  }}</CellGrid></BoardFrame>;
}

function FourWindsExampleBoard({ example, answer }: { example: Extract<AdditionalPuzzleExampleData, { puzzleType: 'fourwinds' }>; answer: boolean }) {
  const CELL_SIZE = useExampleCellSize();
  const grid = useMemo(
    () => example.correctGrid.map((row, r) => row.map((value, c) => (example.clues[r][c] !== null ? null : value))),
    [example]
  );
  const arrowVariants = useMemo(() => computeArrowRunVariants(grid, example.width, example.height), [example.height, example.width, grid]);
  const arrowRunLengths = useMemo(() => computeArrowRunLengths(grid, example.width, example.height), [example.height, example.width, grid]);
  const satisfied = useMemo(
    () => getSatisfiedFourWindsClues(grid, { type: 'fourwinds', width: example.width, height: example.height, clues: example.clues }),
    [example, grid]
  );
  return <BoardFrame width={example.width} height={example.height}><CellGrid width={example.width} height={example.height} getCellTone={(row, col) => (example.clues[row][col] !== null ? 'clue' : 'cell')}>{(row, col) => {
    const clue = example.clues[row][col];
    return clue !== null ? <span className={boardClassNames.cellTextTight} style={satisfied[row][col] ? getBoardSatisfiedClueTextStyle(CELL_SIZE) : getBoardClueTextStyle(CELL_SIZE)}>{clue}</span> : answer ? <FourWindsMark value={example.correctGrid[row][col]} cellSize={CELL_SIZE} variant={arrowVariants[row][col]} runLength={arrowRunLengths[row][col]} /> : null;
  }}</CellGrid></BoardFrame>;
}

function JapaneseSumsWithZeroesExampleBoard({ example, answer }: { example: Extract<AdditionalPuzzleExampleData, { puzzleType: 'japanese-sums-with-zeroes' }>; answer: boolean }) {
  const CELL_SIZE = useExampleCellSize();
  const { width, height } = example;
  const topRows = Math.max(1, ...example.clues.top.map((values) => values.length));
  const leftCols = Math.max(1, ...example.clues.left.map((values) => values.length));
  const boardWidth = (leftCols + width) * CELL_SIZE;
  const boardHeight = (topRows + height) * CELL_SIZE;
  const frameWidth = boardWidth + BOARD_PADDING * 2 + BOARD_BORDER * 2;
  const frameHeight = boardHeight + BOARD_PADDING * 2 + BOARD_BORDER * 2;

  // Clue stacks sit in full cell slots and are anchored to the grid edge,
  // matching the playable board: the last value of a stack is nearest the grid.
  const clues = [] as ReactNode[];
  example.clues.top.forEach((values, col) => {
    values.forEach((value, stack) => {
      clues.push(
        <span key={`top-${col}-${stack}`} className="absolute flex items-center justify-center text-center tabular-nums" style={{ ...getBoardClueTextStyle(CELL_SIZE), left: BOARD_PADDING + (leftCols + col) * CELL_SIZE, top: BOARD_PADDING + (topRows - values.length + stack) * CELL_SIZE, width: CELL_SIZE, height: CELL_SIZE, display: 'flex', overflow: 'visible' }}>{value}</span>
      );
    });
  });
  example.clues.left.forEach((values, row) => {
    values.forEach((value, stack) => {
      clues.push(
        <span key={`left-${row}-${stack}`} className="absolute flex items-center justify-center text-center tabular-nums" style={{ ...getBoardClueTextStyle(CELL_SIZE), left: BOARD_PADDING + (leftCols - values.length + stack) * CELL_SIZE, top: BOARD_PADDING + (topRows + row) * CELL_SIZE, width: CELL_SIZE, height: CELL_SIZE, display: 'flex', overflow: 'visible' }}>{value}</span>
      );
    });
  });

  return (
    <div className="flex justify-center overflow-x-auto">
      <div
        className="relative select-none"
        style={{ width: `${frameWidth}px`, height: `${frameHeight}px`, ...getBoardFrameStyle(BOARD_BORDER) }}
      >
        <div
          className="absolute grid"
          style={getBoardGridStyle(BOARD_PADDING + leftCols * CELL_SIZE, BOARD_PADDING + topRows * CELL_SIZE, width, CELL_SIZE)}
        >
          {Array.from({ length: height }, (_, row) =>
            Array.from({ length: width }, (_, col) => {
              const value = answer ? example.correctGrid[row][col] : null;
              return (
                <div
                  key={`${row}-${col}`}
                  className={boardClassNames.cellContent}
                  style={{ ...getBoardCellStyle(CELL_SIZE, 'cell'), ...getBoardTextStyle(CELL_SIZE) }}
                >
                  {value !== null && value !== undefined ? <span className={boardClassNames.cellText}>{value}</span> : null}
                </div>
              );
            })
          )}
        </div>
        {clues}
      </div>
    </div>
  );
}

function ConsecutiveKakuroExampleBoard({ example, answer }: { example: Extract<AdditionalPuzzleExampleData, { puzzleType: 'consecutive-kakuro' }>; answer: boolean }) {
  const CELL_SIZE = useExampleCellSize();
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
  const CELL_SIZE = useExampleCellSize();
  const { width, height } = example;
  // Two clue rows above (farther '+' then nearer '−') and two clue columns
  // left (farther '+' then nearer '−'), matching the playable board.
  const TOP_ROWS = 2;
  const LEFT_COLS = 2;
  const gridLeft = BOARD_PADDING + LEFT_COLS * CELL_SIZE;
  const gridTop = BOARD_PADDING + TOP_ROWS * CELL_SIZE;
  const boardWidth = (LEFT_COLS + width) * CELL_SIZE;
  const boardHeight = (TOP_ROWS + height) * CELL_SIZE;
  const frameWidth = boardWidth + BOARD_PADDING * 2 + BOARD_BORDER * 2;
  const frameHeight = boardHeight + BOARD_PADDING * 2 + BOARD_BORDER * 2;

  const regionOf = Array.from({ length: height }, () => Array<number>(width).fill(-1));
  example.regions.forEach((region, index) => {
    region.forEach(({ row, col }) => { regionOf[row][col] = index; });
  });
  const { length, thickness } = getBoardPoleMarkMetrics(CELL_SIZE);
  const strokeWidth = getBoardBoundaryStrokeWidth(CELL_SIZE);
  const borders = [] as Array<{ key: string; x1: number; y1: number; x2: number; y2: number }>;
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      if (col + 1 < width && regionOf[row][col] !== regionOf[row][col + 1]) {
        borders.push({ key: `v-${row}-${col}`, x1: gridLeft + (col + 1) * CELL_SIZE, y1: gridTop + row * CELL_SIZE, x2: gridLeft + (col + 1) * CELL_SIZE, y2: gridTop + (row + 1) * CELL_SIZE });
      }
      if (row + 1 < height && regionOf[row][col] !== regionOf[row + 1][col]) {
        borders.push({ key: `h-${row}-${col}`, x1: gridLeft + col * CELL_SIZE, y1: gridTop + (row + 1) * CELL_SIZE, x2: gridLeft + (col + 1) * CELL_SIZE, y2: gridTop + (row + 1) * CELL_SIZE });
      }
    }
  }
  const renderPole = (key: string, cx: number, cy: number, value: number | null) => {
    if (value === null) return null;
    const x = gridLeft + cx * CELL_SIZE;
    const y = gridTop + cy * CELL_SIZE;
    return (
      <g key={key}>
        <rect x={x + (CELL_SIZE - length) / 2} y={y + (CELL_SIZE - thickness) / 2} width={length} height={thickness} fill={woodBoardTheme.ink} />
        {value === 1 ? <rect x={x + (CELL_SIZE - thickness) / 2} y={y + (CELL_SIZE - length) / 2} width={thickness} height={length} fill={woodBoardTheme.ink} /> : null}
      </g>
    );
  };
  const clueSpans = [] as ReactNode[];
  const renderClueSpan = (key: string, x: number, y: number, value: number | string) => (
    <span key={key} className="absolute flex items-center justify-center text-center tabular-nums" style={{ ...getBoardClueTextStyle(CELL_SIZE), left: x, top: y, width: CELL_SIZE, height: CELL_SIZE, display: 'flex', overflow: 'visible' }}>{value}</span>
  );
  example.topClues.forEach((value, col) => {
    if (value !== null) clueSpans.push(renderClueSpan(`top-${col}`, gridLeft + col * CELL_SIZE, BOARD_PADDING, value));
  });
  example.topMinusClues.forEach((value, col) => {
    if (value !== null) clueSpans.push(renderClueSpan(`topm-${col}`, gridLeft + col * CELL_SIZE, BOARD_PADDING + CELL_SIZE, value));
  });
  example.leftPlusClues.forEach((value, row) => {
    if (value !== null) clueSpans.push(renderClueSpan(`leftp-${row}`, BOARD_PADDING, gridTop + row * CELL_SIZE, value));
  });
  example.leftClues.forEach((value, row) => {
    if (value !== null) clueSpans.push(renderClueSpan(`left-${row}`, BOARD_PADDING + CELL_SIZE, gridTop + row * CELL_SIZE, value));
  });
  // Pole legend in the gutter corner: '+' labels the farther strip, '−' the nearer one.
  clueSpans.push(renderClueSpan('corner-0-0', BOARD_PADDING, BOARD_PADDING, '+'));
  clueSpans.push(renderClueSpan('corner-1-1', BOARD_PADDING + CELL_SIZE, BOARD_PADDING + CELL_SIZE, '−'));

  return (
    <div className="flex justify-center overflow-x-auto">
      <div
        className="relative select-none"
        style={{ width: `${frameWidth}px`, height: `${frameHeight}px`, ...getBoardFrameStyle(BOARD_BORDER) }}
      >
        <div className="absolute grid" style={getBoardGridStyle(gridLeft, gridTop, width, CELL_SIZE)}>
          {Array.from({ length: height }, (_, row) =>
            Array.from({ length: width }, (_, col) => (
              <div key={`${row}-${col}`} className={boardClassNames.cellContent} style={{ ...getBoardCellStyle(CELL_SIZE, 'cell'), ...getBoardTextStyle(CELL_SIZE) }} />
            ))
          )}
        </div>
        <svg className="pointer-events-none absolute left-0 top-0" width={boardWidth + BOARD_PADDING * 2} height={boardHeight + BOARD_PADDING * 2} aria-hidden="true">
          {borders.map((border) => <line key={border.key} x1={border.x1} y1={border.y1} x2={border.x2} y2={border.y2} stroke={woodBoardTheme.ink} strokeWidth={strokeWidth} strokeLinecap="round" />)}
          {answer ? example.correctGrid.flatMap((row, r) => row.map((value, c) => renderPole(`p-${r}-${c}`, c, r, value))) : example.givens.flatMap((row, r) => row.map((value, c) => value ? renderPole(`p-${r}-${c}`, c, r, value === '+' ? 1 : 2) : null))}
        </svg>
        {clueSpans}
      </div>
    </div>
  );
}

function PillsExampleBoard({ example, answer }: { example: Extract<AdditionalPuzzleExampleData, { puzzleType: 'pills' }>; answer: boolean }) {
  const CELL_SIZE = useExampleCellSize();
  const clues = [] as Array<{ key: string; x: number; y: number; value: number }>;
  example.topClues.forEach((value, col) => {
    if (value !== null) clues.push({ key: `top-${col}`, x: BOARD_PADDING + (col + 0.5) * CELL_SIZE, y: BOARD_PADDING * 0.22, value });
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
      <PlayableExample
        example={example}
        playableLabel={playableLabel}
        answerLabel={answerLabel}
        fixedCellSize={boardLayoutMetrics.exampleCellSize}
        answer={<SlitherBoard example={example} answer />}
        renderBoard={({ puzzle, startTime, onComplete, fixedCellSize }) => (
          example.puzzleType === 'slither'
            ? <SlitherlinkBoard puzzle={puzzle as SlitherlinkPuzzleData} startTime={startTime} resetToken={0} onComplete={onComplete} fixedCellSize={fixedCellSize} showValidationMessage />
            : <WolvesAndSheepBoard puzzle={puzzle as WolvesAndSheepPuzzleData} startTime={startTime} resetToken={0} onComplete={onComplete} fixedCellSize={fixedCellSize} showValidationMessage />
        )}
      />
    );
  }

  if (example.puzzleType === 'lits') {
    return (
      <PlayableExample
        example={example}
        playableLabel={playableLabel}
        answerLabel={answerLabel}
        fixedCellSize={boardLayoutMetrics.exampleCellSize}
        answer={<ShadedBoard width={example.width} height={example.height} shaded={example.correctSolution} regionIds={example.regionIds} />}
        renderBoard={({ puzzle, startTime, onComplete, fixedCellSize }) => (
          <LitsBoard puzzle={puzzle as LitsPuzzleData} startTime={startTime} resetToken={0} onComplete={onComplete} fixedCellSize={fixedCellSize} showValidationMessage />
        )}
      />
    );
  }

  if (example.puzzleType === 'lakes') {
    return (
      <PlayableExample
        example={example}
        playableLabel={playableLabel}
        answerLabel={answerLabel}
        fixedCellSize={boardLayoutMetrics.exampleCellSize}
        answer={<ShadedBoard width={example.width} height={example.height} clues={example.clues} shaded={example.correctSolution} />}
        renderBoard={({ puzzle, startTime, onComplete, fixedCellSize }) => (
          <LakesBoard puzzle={puzzle as LakesPuzzleData} startTime={startTime} resetToken={0} onComplete={onComplete} fixedCellSize={fixedCellSize} showValidationMessage />
        )}
      />
    );
  }

  if (example.puzzleType === 'domino-search') {
    return (
      <PlayableExample
        example={example}
        playableLabel={playableLabel}
        answerLabel={answerLabel}
        fixedCellSize={boardLayoutMetrics.exampleCellSize}
        answer={<DominoBoard example={example} answer />}
        renderBoard={({ puzzle, startTime, onComplete, fixedCellSize }) => (
          <DominoSearchBoard puzzle={puzzle as DominoSearchPuzzleData} startTime={startTime} resetToken={0} onComplete={onComplete} fixedCellSize={fixedCellSize} showValidationMessage />
        )}
      />
    );
  }

  if (example.puzzleType === 'snail') {
    return (
      <PlayableExample
        example={example}
        playableLabel={playableLabel}
        answerLabel={answerLabel}
        fixedCellSize={boardLayoutMetrics.exampleCellSize}
        answer={<NumberGridBoard width={example.width} height={example.height} cells={example.cells} values={example.correctGrid} clueTone spiralBoundary />}
        renderBoard={({ puzzle, startTime, onComplete, fixedCellSize }) => (
          <MagicSnailBoard puzzle={puzzle as MagicSnailPuzzleData} startTime={startTime} resetToken={0} onComplete={onComplete} fixedCellSize={fixedCellSize} showValidationMessage />
        )}
      />
    );
  }

  if (example.puzzleType === 'slovak-sums') {
    return (
      <PlayableExample
        example={example}
        playableLabel={playableLabel}
        answerLabel={answerLabel}
        fixedCellSize={boardLayoutMetrics.exampleCellSize}
        answer={<NumberGridBoard width={example.width} height={example.height} cells={example.cells} values={example.correctGrid} clueTone />}
        renderBoard={({ puzzle, startTime, onComplete, fixedCellSize }) => (
          <SlovakSumsBoard puzzle={puzzle as SlovakSumsPuzzleData} startTime={startTime} resetToken={0} onComplete={onComplete} fixedCellSize={fixedCellSize} showValidationMessage />
        )}
      />
    );
  }

  if (example.puzzleType === 'japanese-arrows') {
    return (
      <PlayableExample
        example={example}
        playableLabel={playableLabel}
        answerLabel={answerLabel}
        fixedCellSize={boardLayoutMetrics.exampleCellSize}
        answer={<JapaneseArrowsBoard example={example} answer />}
        renderBoard={({ puzzle, startTime, onComplete, fixedCellSize }) => (
          <JapaneseArrowsGameBoard puzzle={puzzle as JapaneseArrowsPuzzleData} startTime={startTime} resetToken={0} onComplete={onComplete} fixedCellSize={fixedCellSize} showValidationMessage />
        )}
      />
    );
  }

  if (example.puzzleType === 'four-winds-with-parks') {
    return (
      <PlayableExample
        example={example}
        playableLabel={playableLabel}
        answerLabel={answerLabel}
        fixedCellSize={boardLayoutMetrics.exampleCellSize}
        answer={<FourWindsWithParksExampleBoard example={example} answer />}
        renderBoard={({ puzzle, startTime, onComplete, fixedCellSize }) => (
          <FourWindsWithParksBoard puzzle={puzzle as FourWindsWithParksPuzzleData} startTime={startTime} resetToken={0} onComplete={onComplete} fixedCellSize={fixedCellSize} showValidationMessage />
        )}
      />
    );
  }

  if (example.puzzleType === 'fourwinds') {
    return (
      <PlayableExample
        example={example}
        playableLabel={playableLabel}
        answerLabel={answerLabel}
        fixedCellSize={boardLayoutMetrics.exampleCellSize}
        answer={<FourWindsExampleBoard example={example} answer />}
        renderBoard={({ puzzle, startTime, onComplete, fixedCellSize }) => (
          <FourWindsBoard puzzle={puzzle as FourWindsPuzzleData} startTime={startTime} resetToken={0} onComplete={onComplete} fixedCellSize={fixedCellSize} showValidationMessage />
        )}
      />
    );
  }

  if (example.puzzleType === 'japanese-sums-with-zeroes') {
    return (
      <PlayableExample
        example={example}
        playableLabel={playableLabel}
        answerLabel={answerLabel}
        fixedCellSize={boardLayoutMetrics.exampleCellSize}
        answer={<JapaneseSumsWithZeroesExampleBoard example={example} answer />}
        renderBoard={({ puzzle, startTime, onComplete, fixedCellSize }) => (
          <JapaneseSumsBoard puzzle={puzzle as JapaneseSumsWithZeroesPuzzleData} startTime={startTime} resetToken={0} onComplete={onComplete} fixedCellSize={fixedCellSize} showValidationMessage />
        )}
      />
    );
  }

  if (example.puzzleType === 'consecutive-kakuro') {
    return (
      <PlayableExample
        example={example}
        playableLabel={playableLabel}
        answerLabel={answerLabel}
        fixedCellSize={boardLayoutMetrics.exampleCellSize}
        answer={<ConsecutiveKakuroExampleBoard example={example} answer />}
        renderBoard={({ puzzle, startTime, onComplete, fixedCellSize }) => (
          <ConsecutiveKakuroBoard puzzle={puzzle as ConsecutiveKakuroPuzzleData} startTime={startTime} resetToken={0} onComplete={onComplete} fixedCellSize={fixedCellSize} showValidationMessage />
        )}
      />
    );
  }

  if (example.puzzleType === 'magnets') {
    return (
      <PlayableExample
        example={example}
        playableLabel={playableLabel}
        answerLabel={answerLabel}
        fixedCellSize={boardLayoutMetrics.exampleCellSize}
        answer={<MagnetsExampleBoard example={example} answer />}
        renderBoard={({ puzzle, startTime, onComplete, fixedCellSize }) => (
          <MagnetsBoard puzzle={puzzle as MagnetsPuzzleData} startTime={startTime} resetToken={0} onComplete={onComplete} fixedCellSize={fixedCellSize} showValidationMessage />
        )}
      />
    );
  }

  if (example.puzzleType === 'pills') {
    return (
      <PlayableExample
        example={example}
        playableLabel={playableLabel}
        answerLabel={answerLabel}
        fixedCellSize={boardLayoutMetrics.exampleCellSize}
        answer={<PillsExampleBoard example={example} answer />}
        renderBoard={({ puzzle, startTime, onComplete, fixedCellSize }) => (
          <PillsBoard puzzle={puzzle as PillsPuzzleData} startTime={startTime} resetToken={0} onComplete={onComplete} fixedCellSize={fixedCellSize} showValidationMessage />
        )}
      />
    );
  }

  // Every AdditionalPuzzleExampleData variant is handled above.
  const unreachable: never = example;
  throw new Error(`Unhandled additional example type: ${String(unreachable)}`);
}
