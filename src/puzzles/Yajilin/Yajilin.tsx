import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { YajilinPuzzleData } from '../types';
import {
  createEmptyYajilinGrid,
  detectYajilinHitTarget,
  getIncidentYajilinEdgeKeys,
  getYajilinEdgeKey,
  parseYajilinEdgeKey,
  type YajilinCellState,
  validateYajilin,
  YAJILIN_ARROWS,
} from './utils';

interface Props {
  puzzle: YajilinPuzzleData;
  startTime: number;
  onComplete: (time: number) => void;
  fixedCellSize?: number;
}

const BOARD_PADDING = 3;
const BOARD_GAP = 1;
const BOARD_BORDER = 4;

function getArrowPositionStyle(direction: string, cellSize: number) {
  const leftInset = Math.max(2, Math.floor(cellSize * 0.04));
  const topInset = 0;
  const horizontalTopInset = Math.min(-12, -Math.floor(cellSize * 0.05));

  if (direction === 'up') {
    return {
      left: `${leftInset}px`,
      top: '50%',
      transform: 'translateY(-50%)',
    };
  }
  if (direction === 'down') {
    return {
      left: `${leftInset}px`,
      top: '50%',
      transform: 'translateY(-50%)',
    };
  }
  if (direction === 'left') {
    return {
      left: '50%',
      top: `${horizontalTopInset}px`,
      transform: 'translateX(-50%)',
    };
  }
  return {
    left: '50%',
    top: `${horizontalTopInset}px`,
    transform: 'translateX(-50%)',
  };
}

type PendingTap =
  | { kind: 'desktop-left-cell'; row: number; col: number }
  | { kind: 'mobile-cell'; row: number; col: number }
  | { kind: 'mobile-edge'; key: string }
  | null;

export default function YajilinBoard({ puzzle, startTime, onComplete, fixedCellSize }: Props) {
  const { width, height, clues } = puzzle;
  const [grid, setGrid] = useState<YajilinCellState[][]>(() => createEmptyYajilinGrid(width, height));
  const [loopEdges, setLoopEdges] = useState<Set<string>>(new Set());
  const [crossedEdges, setCrossedEdges] = useState<Set<string>>(new Set());
  const [cellSize, setCellSize] = useState(48);
  const [hasEdited, setHasEdited] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const pointerState = useRef<{
    pointerId: number | null;
    isTouch: boolean;
    startCell: { row: number; col: number } | null;
    lastCell: { row: number; col: number } | null;
    drawMode: 'add' | 'remove' | null;
    movedToDraw: boolean;
    pendingTap: PendingTap;
  }>({
    pointerId: null,
    isTouch: false,
    startCell: null,
    lastCell: null,
    drawMode: null,
    movedToDraw: false,
    pendingTap: null,
  });
  const hasCompleted = useRef(false);

  const clueMap = useMemo(() => {
    const map = new Map<string, (typeof clues)[number]>();
    clues.forEach((clue, index) => {
      map.set(`${clue.row},${clue.col}`, { ...clue, index });
    });
    return map;
  }, [clues]);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  const validation = useMemo(
    () => (hasEdited ? validateYajilin(grid, loopEdges, clues, width, height) : null),
    [clues, grid, hasEdited, height, loopEdges, width]
  );

  useEffect(() => {
    if (fixedCellSize) {
      setCellSize(fixedCellSize);
      return;
    }

    const updateSize = () => {
      const mobile = window.innerWidth < 640;
      const maxAvailableWidth = window.innerWidth - (mobile ? 24 : 80);
      const nextSize = Math.floor((maxAvailableWidth - BOARD_PADDING * 2 - (width - 1) * BOARD_GAP) / width);
      setCellSize(Math.max(mobile ? 36 : 42, Math.min(mobile ? 48 : 58, nextSize)));
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [fixedCellSize, width]);

  useEffect(() => {
    if (!validation?.valid || hasCompleted.current) return;
    hasCompleted.current = true;
    onComplete(Math.floor((Date.now() - startTime) / 1000));
  }, [onComplete, startTime, validation]);

  const resetBoard = useCallback(() => {
    setGrid(createEmptyYajilinGrid(width, height));
    setLoopEdges(new Set());
    setCrossedEdges(new Set());
    setHasEdited(false);
    hasCompleted.current = false;
  }, [height, width]);

  const isClueCell = useCallback((row: number, col: number) => clueMap.has(`${row},${col}`), [clueMap]);

  const clearIncidentLoopEdges = useCallback((row: number, col: number) => {
    const incident = getIncidentYajilinEdgeKeys(row, col, width, height);
    if (incident.length === 0) return;
    setLoopEdges((prev) => {
      const next = new Set(prev);
      let changed = false;
      incident.forEach((key) => {
        if (next.delete(key)) changed = true;
      });
      return changed ? next : prev;
    });
  }, [height, width]);

  const toggleCellShade = useCallback((row: number, col: number) => {
    if (isClueCell(row, col)) return;
    setGrid((prev) => {
      const next = prev.map((currentRow) => [...currentRow]);
      next[row][col] = prev[row][col] === 1 ? 0 : 1;
      return next;
    });
    clearIncidentLoopEdges(row, col);
    setHasEdited(true);
  }, [clearIncidentLoopEdges, isClueCell]);

  const cycleMobileCell = useCallback((row: number, col: number) => {
    if (isClueCell(row, col)) return;
    setGrid((prev) => {
      const next = prev.map((currentRow) => [...currentRow]);
      const current = prev[row][col];
      next[row][col] = current === 0 ? 1 : current === 1 ? 2 : 0;
      return next;
    });
    clearIncidentLoopEdges(row, col);
    setHasEdited(true);
  }, [clearIncidentLoopEdges, isClueCell]);

  const toggleCellMark = useCallback((row: number, col: number) => {
    if (isClueCell(row, col)) return;
    setGrid((prev) => {
      const next = prev.map((currentRow) => [...currentRow]);
      next[row][col] = prev[row][col] === 2 ? 0 : 2;
      return next;
    });
    clearIncidentLoopEdges(row, col);
    setHasEdited(true);
  }, [clearIncidentLoopEdges, isClueCell]);

  const toggleEdgeCross = useCallback((edgeKey: string) => {
    setCrossedEdges((prev) => {
      const next = new Set(prev);
      if (next.has(edgeKey)) next.delete(edgeKey);
      else next.add(edgeKey);
      return next;
    });
    setLoopEdges((prev) => {
      if (!prev.has(edgeKey)) return prev;
      const next = new Set(prev);
      next.delete(edgeKey);
      return next;
    });
    setHasEdited(true);
  }, []);

  const toggleLoopEdge = useCallback((edgeKey: string) => {
    setLoopEdges((prev) => {
      const next = new Set(prev);
      if (next.has(edgeKey)) next.delete(edgeKey);
      else next.add(edgeKey);
      return next;
    });
    setCrossedEdges((prev) => {
      if (!prev.has(edgeKey)) return prev;
      const next = new Set(prev);
      next.delete(edgeKey);
      return next;
    });
    setHasEdited(true);
  }, []);

  const applyLoopSegment = useCallback((from: { row: number; col: number }, to: { row: number; col: number }) => {
    const edgeKey = getYajilinEdgeKey(from.row, from.col, to.row, to.col);
    if (!edgeKey) return;
    const current = pointerState.current;
    if (current.drawMode === null) {
      current.drawMode = loopEdges.has(edgeKey) ? 'remove' : 'add';
    }

    setLoopEdges((prev) => {
      const next = new Set(prev);
      if (current.drawMode === 'add') next.add(edgeKey);
      else next.delete(edgeKey);
      return next;
    });

    if (current.drawMode === 'add') {
      setCrossedEdges((prev) => {
        if (!prev.has(edgeKey)) return prev;
        const next = new Set(prev);
        next.delete(edgeKey);
        return next;
      });
    }

    current.movedToDraw = true;
    current.pendingTap = null;
    current.lastCell = to;
    setHasEdited(true);
  }, [loopEdges]);

  const getRelativePoint = useCallback((clientX: number, clientY: number) => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: clientX - rect.left - BOARD_PADDING,
      y: clientY - rect.top - BOARD_PADDING,
    };
  }, []);

  const getCellFromPoint = useCallback((x: number, y: number) => {
    const step = cellSize + BOARD_GAP;
    const col = Math.floor(x / step);
    const row = Math.floor(y / step);
    if (row < 0 || row >= height || col < 0 || col >= width) return null;
    return { row, col };
  }, [cellSize, height, width]);

  const finishPointer = useCallback(() => {
    const current = pointerState.current;
    if (current.pendingTap?.kind === 'desktop-left-cell') {
      toggleCellShade(current.pendingTap.row, current.pendingTap.col);
    } else if (current.pendingTap?.kind === 'mobile-cell') {
      cycleMobileCell(current.pendingTap.row, current.pendingTap.col);
    } else if (current.pendingTap?.kind === 'mobile-edge') {
      toggleEdgeCross(current.pendingTap.key);
    }

    pointerState.current = {
      pointerId: null,
      isTouch: false,
      startCell: null,
      lastCell: null,
      drawMode: null,
      movedToDraw: false,
      pendingTap: null,
    };
  }, [cycleMobileCell, toggleCellShade, toggleEdgeCross]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const point = getRelativePoint(event.clientX, event.clientY);
    if (!point) return;

    const hitTarget = detectYajilinHitTarget(point.x, point.y, width, height, cellSize, BOARD_GAP);
    const button = event.button;
    const isTouchPointer = event.pointerType === 'touch' || (button === 0 && isMobile);

    if (!hitTarget) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    if (!isTouchPointer && button === 2) {
      if (hitTarget.kind === 'edge') {
        toggleEdgeCross(hitTarget.key);
      } else {
        toggleCellMark(hitTarget.row, hitTarget.col);
      }
      return;
    }

    if (!isTouchPointer && button !== 0) return;

    const current = pointerState.current;
    current.pointerId = event.pointerId;
    current.isTouch = isTouchPointer;
    current.drawMode = null;
    current.movedToDraw = false;
    current.pendingTap = null;

    if (hitTarget.kind === 'edge') {
      if (isTouchPointer) {
        current.pendingTap = { kind: 'mobile-edge', key: hitTarget.key };
        current.startCell = hitTarget.cells[0];
        current.lastCell = hitTarget.cells[0];
      } else {
        toggleLoopEdge(hitTarget.key);
      }
      return;
    }

    if (isClueCell(hitTarget.row, hitTarget.col)) return;

    current.startCell = { row: hitTarget.row, col: hitTarget.col };
    current.lastCell = { row: hitTarget.row, col: hitTarget.col };
    current.pendingTap = isTouchPointer
      ? { kind: 'mobile-cell', row: hitTarget.row, col: hitTarget.col }
      : { kind: 'desktop-left-cell', row: hitTarget.row, col: hitTarget.col };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const current = pointerState.current;
    if (current.pointerId !== event.pointerId || !current.startCell) return;

    const point = getRelativePoint(event.clientX, event.clientY);
    if (!point) return;
    const cell = getCellFromPoint(point.x, point.y);
    if (!cell) return;
    if (isClueCell(cell.row, cell.col) || grid[cell.row][cell.col] === 1) return;

    if (!current.lastCell) {
      current.lastCell = cell;
      return;
    }

    const sameCell = current.lastCell.row === cell.row && current.lastCell.col === cell.col;
    if (sameCell) return;

    if (Math.abs(current.lastCell.row - cell.row) + Math.abs(current.lastCell.col - cell.col) !== 1) return;

    applyLoopSegment(current.lastCell, cell);
  };

  const boardWidthPx = width * cellSize + (width - 1) * BOARD_GAP + BOARD_PADDING * 2;
  const boardHeightPx = height * cellSize + (height - 1) * BOARD_GAP + BOARD_PADDING * 2;
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={boardRef}
        className="relative select-none touch-none"
        style={{
          width: `${boardWidthPx + BOARD_BORDER * 2}px`,
          height: `${boardHeightPx + BOARD_BORDER * 2}px`,
          padding: `${BOARD_PADDING}px`,
          background: '#d2b48c',
          border: `${BOARD_BORDER}px solid #3f2a1e`,
          boxSizing: 'border-box',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointer}
        onPointerLeave={finishPointer}
        onContextMenu={(event) => event.preventDefault()}
      >
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${width}, ${cellSize}px)`,
            gap: `${BOARD_GAP}px`,
          }}
        >
          {grid.flatMap((row, r) =>
            row.map((state, c) => {
              const clue = clueMap.get(`${r},${c}`);
              const isShaded = state === 1;
              const isMarked = state === 2;
              return (
                <div
                  key={`${r}-${c}`}
                  className={`relative flex items-center justify-center font-mono font-bold tracking-tight
                    ${clue
                      ? 'bg-[#f5ead8] dark:bg-gray-800 text-[#3f2a1e] dark:text-gray-100'
                      : isShaded
                        ? 'bg-[#3f2a1e] text-white'
                        : isMarked
                          ? 'bg-[#efe2ca] dark:bg-gray-700 text-gray-500 dark:text-gray-300'
                          : 'bg-[#f8f1e3] dark:bg-gray-800 text-[#3f2a1e] dark:text-gray-100'}`}
                  style={{
                    width: `${cellSize}px`,
                    height: `${cellSize}px`,
                    paddingTop: clue ? '0px' : '2px',
                  }}
                >
                  {clue ? (
                    <div className="relative w-full h-full">
                      <span
                        className="absolute leading-none"
                        style={{
                          ...getArrowPositionStyle(clue.direction, cellSize),
                          fontSize: `${Math.max(30, Math.floor(cellSize * 0.6))}px`,
                          lineHeight: 1,
                        }}
                      >
                        {YAJILIN_ARROWS[clue.direction]}
                      </span>
                      <span
                        className="absolute leading-none font-bold"
                        style={{
                          left: clue.direction === 'up' || clue.direction === 'down' ? `${Math.floor(cellSize * 0.5)}px` : '50%',
                          top:
                            clue.direction === 'left' || clue.direction === 'right'
                              ? `${Math.floor(cellSize * 0.55)}px`
                              : `${Math.floor(cellSize * 0.53)}px`,
                          transform: 'translate(-50%, -50%)',
                          fontSize: `${Math.max(32, Math.floor(cellSize * 0.7))}px`,
                          lineHeight: 1,
                        }}
                      >
                        {clue.value}
                      </span>
                    </div>
                  ) : isMarked ? (
                    <span style={{ fontSize: `${Math.max(20, Math.floor(cellSize * 0.52))}px` }}>×</span>
                  ) : null}
                </div>
              );
            })
          )}
        </div>

        <svg
          className="absolute top-0 left-0 pointer-events-none"
          width={boardWidthPx}
          height={boardHeightPx}
        >
          {[...loopEdges].map((edgeKey) => {
            const edge = parseYajilinEdgeKey(edgeKey);
            if (!edge) return null;

            const x1 = BOARD_PADDING + edge.c1 * (cellSize + BOARD_GAP) + cellSize / 2;
            const y1 = BOARD_PADDING + edge.r1 * (cellSize + BOARD_GAP) + cellSize / 2;
            const x2 = BOARD_PADDING + edge.c2 * (cellSize + BOARD_GAP) + cellSize / 2;
            const y2 = BOARD_PADDING + edge.r2 * (cellSize + BOARD_GAP) + cellSize / 2;

            return (
              <line
                key={edgeKey}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#111111"
                strokeWidth={Math.max(2.5, Math.floor(cellSize * 0.08))}
                strokeLinecap="round"
              />
            );
          })}

          {[...crossedEdges].map((edgeKey) => {
            const edge = parseYajilinEdgeKey(edgeKey);
            if (!edge) return null;

            const centerX = BOARD_PADDING + ((edge.c1 + edge.c2) / 2) * (cellSize + BOARD_GAP) + cellSize / 2;
            const centerY = BOARD_PADDING + ((edge.r1 + edge.r2) / 2) * (cellSize + BOARD_GAP) + cellSize / 2;
            const size = Math.max(3, Math.floor(cellSize * 0.07));

            return (
              <g key={`cross-${edgeKey}`} stroke="#111111" strokeWidth="1.6" strokeLinecap="round">
                <line x1={centerX - size} y1={centerY - size} x2={centerX + size} y2={centerY + size} />
                <line x1={centerX - size} y1={centerY + size} x2={centerX + size} y2={centerY - size} />
              </g>
            );
          })}
        </svg>
      </div>

      <button
        type="button"
        onClick={resetBoard}
        className="px-4 py-2 rounded-md border bg-white/80 hover:bg-white text-sm dark:bg-gray-800 dark:hover:bg-gray-700"
      >
        重置本题
      </button>

      {validation?.message && (
        <div className="text-sm text-muted-foreground dark:text-gray-400 text-center">
          {validation.message}
        </div>
      )}
    </div>
  );
}
