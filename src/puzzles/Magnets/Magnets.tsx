import NumberPlacementBoard from '../shared/NumberPlacementBoard';
import type { MagnetsPuzzleData } from '../types';
import {
  getBoardBoundaryStrokeWidth,
  getBoardPoleMarkMetrics,
  woodBoardTheme,
} from '../boardTheme';
import { validateMagnets } from './utils';

const PLUS = 1;
const MINUS = 2;
const SHADED = 'shaded' as const;

interface Props {
  puzzle: MagnetsPuzzleData;
  startTime: number;
  resetToken: number;
  onComplete: (time: number) => void;
  initialSnapshot?: unknown;
  onSnapshotChange?: (snapshot: unknown) => void;
  fixedCellSize?: number;
  showValidationMessage?: boolean;
}

export default function MagnetsBoard({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange, fixedCellSize, showValidationMessage }: Props) {
  const regionOf = Array.from({ length: puzzle.height }, () => Array<number>(puzzle.width).fill(-1));
  puzzle.regions.forEach((region, index) => {
    region.forEach(({ row, col }) => { regionOf[row][col] = index; });
  });
  const getFixedValue = (row: number, col: number) => {
    const given = puzzle.givens[row]?.[col] ?? null;
    return given === '+' ? PLUS : given === '-' ? MINUS : null;
  };
  const getGroupCells = (row: number, col: number) => {
    const region = regionOf[row][col];
    return region >= 0 ? puzzle.regions[region] : null;
  };
  /**
   * Left-click sequence for a region: with no given pole the magnet cycles
   * empty → (+|−) → (−|+); a region containing a given pole cycles between
   * empty and the opposite pole on the first free cell.
   */
  const getGroupStates = (cells: Array<{ row: number; col: number }>): Array<Array<number | null>> => {
    const fixed = cells.map(({ row, col }) => getFixedValue(row, col));
    const freeIndexes = fixed.flatMap((value, index) => (value === null ? [index] : []));
    const emptyState = fixed.map((value) => value);
    if (fixed.length === freeIndexes.length) {
      if (cells.length < 2) return [emptyState];
      const plusMinus = fixed.map(() => null as number | null);
      plusMinus[0] = PLUS;
      plusMinus[1] = MINUS;
      const minusPlus = fixed.map(() => null as number | null);
      minusPlus[0] = MINUS;
      minusPlus[1] = PLUS;
      return [emptyState, plusMinus, minusPlus];
    }
    if (freeIndexes.length === 0) return [emptyState];
    const opposite = fixed.includes(PLUS) ? MINUS : PLUS;
    const oppositeState = fixed.map((value, index) => (index === freeIndexes[0] ? opposite : value));
    return [emptyState, oppositeState];
  };
  const renderOverlay = (cellSize: number) => {
    const strokeWidth = getBoardBoundaryStrokeWidth(cellSize);
    const segments = [] as Array<{ key: string; x1: number; y1: number; x2: number; y2: number }>;
    for (let row = 0; row < puzzle.height; row++) {
      for (let col = 0; col < puzzle.width; col++) {
        if (col + 1 < puzzle.width && regionOf[row][col] !== regionOf[row][col + 1]) {
          segments.push({
            key: `v-${row}-${col}`,
            x1: (col + 1) * cellSize,
            y1: row * cellSize,
            x2: (col + 1) * cellSize,
            y2: (row + 1) * cellSize,
          });
        }
        if (row + 1 < puzzle.height && regionOf[row][col] !== regionOf[row + 1][col]) {
          segments.push({
            key: `h-${row}-${col}`,
            x1: col * cellSize,
            y1: (row + 1) * cellSize,
            x2: (col + 1) * cellSize,
            y2: (row + 1) * cellSize,
          });
        }
      }
    }
    return (
      <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${puzzle.width * cellSize} ${puzzle.height * cellSize}`} preserveAspectRatio="none">
        {segments.map((segment) => (
          <line
            key={segment.key}
            x1={segment.x1}
            y1={segment.y1}
            x2={segment.x2}
            y2={segment.y2}
            stroke={woodBoardTheme.ink}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        ))}
      </svg>
    );
  };
  return <NumberPlacementBoard
    puzzle={puzzle}
    numbers={[PLUS, MINUS]}
    cellInputMode="cycle"
    getFixedValue={getFixedValue}
    getGroupCells={getGroupCells}
    getGroupStates={getGroupStates}
    groupBlackValue={SHADED}
    extraCellValues={[SHADED]}
    getCellTone={(_row, _col, value) => (value === SHADED ? 'playerShaded' : undefined)}
    outsideClueStacks={{
      // pzpr layout: two clue rows above (farther '+' then nearer '−') and
      // two clue columns left (farther '+' then nearer '−').
      top: Array.from({ length: puzzle.width }, (_, col) => [puzzle.topClues[col], puzzle.topMinusClues[col]]),
      left: Array.from({ length: puzzle.height }, (_, row) => [puzzle.leftPlusClues[row], puzzle.leftClues[row]]),
    }}
    outsideClueStackCellTextSize
    outsideClueCornerMarks={[
      { row: 0, col: 0, label: '+' },
      { row: 1, col: 1, label: '−' },
    ]}
    startTime={startTime}
    resetToken={resetToken}
    onComplete={onComplete}
    validate={validateMagnets}
    renderOverlay={renderOverlay}
    renderCellValue={(value, cellSize) => {
      if (value !== PLUS && value !== MINUS) return null;
      const { length, thickness } = getBoardPoleMarkMetrics(cellSize);
      return (
        <span className="relative flex h-full w-full items-center justify-center">
          <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${cellSize} ${cellSize}`} preserveAspectRatio="none" aria-hidden="true">
            <rect x={(cellSize - length) / 2} y={(cellSize - thickness) / 2} width={length} height={thickness} fill={woodBoardTheme.ink} />
            {value === PLUS ? <rect x={(cellSize - thickness) / 2} y={(cellSize - length) / 2} width={thickness} height={length} fill={woodBoardTheme.ink} /> : null}
          </svg>
        </span>
      );
    }}
    fixedCellSize={fixedCellSize}
    initialSnapshot={initialSnapshot}
    onSnapshotChange={onSnapshotChange}
    showValidationMessage={showValidationMessage}
  />;
}
