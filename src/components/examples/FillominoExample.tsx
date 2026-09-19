// src/components/examples/FillominoExample.tsx
import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import ExampleAnswerReveal from '@/components/ExampleAnswerReveal';
import { useI18n } from '@/i18n/useI18n';
import { getKeyboardDigit } from '@/lib/keyboard';
import {
  boardClassNames,
  boardOverlayStyle,
  commonBoardChrome,
  getBoardBoundaryStrokeWidth,
  getBoardCellStyle,
  getBoardFrameDimensions,
  getBoardFrameStyle,
  getBoardGridStyle,
  getBoardGridStrokeWidth,
  getBoardNumpadPanelStyle,
  getBoardNumpadButtonStyle,
  getBoardNumpadDismissStyle,
  getBoardNumpadHeaderStyle,
  getBoardNumpadGridStyle,
  getBoardRegionStrokeWidth,
  getBoardThinStrokeWidth,
  getBoardTextStyle,
  woodBoardTheme,
} from '../../puzzles/boardTheme';
import { getFillominoAutoBoundaryLines, getFillominoEdgeKey, validateFillomino } from '../../puzzles/Fillomino/utils';

const BOARD_PADDING = commonBoardChrome.padding;
const KEYBOARD_ENTRY_TIMEOUT_MS = 1000;

interface Props {
  width: number;
  height: number;
  cluesGrid: (number | null)[][];
  correctGrid: (number | null)[][];
  playableLabel: string;
  answerLabel: string;
}

export default function FillominoExample({
  width,
  height,
  cluesGrid,
  correctGrid,
  playableLabel,
  answerLabel,
}: Props) {
  const { copy } = useI18n();
  const [grid, setGrid] = useState<(number | null)[][]>(cluesGrid.map(row => [...row]));
  const [thinLines, setThinLines] = useState<Set<string>>(new Set());
  const [deepLines, setDeepLines] = useState<Set<string>>(new Set());
  const [showAnswer, setShowAnswer] = useState(false);

  const [cellSize, setCellSize] = useState(() => {
    const safeMargin = 150;
    const maxAvailableWidth = window.innerWidth - safeMargin;
    const theoreticalCellSize = Math.floor((maxAvailableWidth - 6) / width);
    return Math.max(32, Math.min(60, theoreticalCellSize));
  });

  const [showNumpad, setShowNumpad] = useState(false);
  const [numpadTarget, setNumpadTarget] = useState<{ row: number; col: number } | null>(null);

  const hoveredCellRef = useRef<{ row: number; col: number } | null>(null);
  const keyboardEntryRef = useRef<{ row: number; col: number; text: string; timestamp: number } | null>(null);
  const isDragging = useRef(false);
  const startRow = useRef(-1);
  const startCol = useRef(-1);
  const lastRowRef = useRef(-1);
  const lastColRef = useRef(-1);
  const lastVertexRef = useRef<{ rowLine: number; colLine: number }>({ rowLine: -1, colLine: -1 });
  const dragIsLeft = useRef(true);
  const dragType = useRef<'copy' | 'clear' | 'thinLine' | 'deepLine'>('copy');
  const pointerIdRef = useRef<number | null>(null);
  const hasEditedBoundary = useRef(false);
  const boundaryOperationRef = useRef<'add' | 'delete' | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressThreshold = 500;

  // 自适应尺寸
  useLayoutEffect(() => {
    const updateSize = () => {
      const safeMargin = 40;
      const maxAvailableWidth = window.innerWidth - safeMargin;
      const theoreticalCellSize = Math.floor((maxAvailableWidth - 6) / width);
      const newCellSize = Math.max(
        commonBoardChrome.minCellSize,
        Math.min(commonBoardChrome.maxDesktopCellSize, theoreticalCellSize)
      );
      setCellSize(newCellSize);
    };
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [width]);

  const validationResult = useMemo(
    () => (grid.length === 0 ? null : validateFillomino(grid, width, height, deepLines)),
    [deepLines, grid, height, width]
  );
  const invalidCells = validationResult?.invalidCells || [];

  // 键盘输入
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const hovered = hoveredCellRef.current;
    if (!hovered) return;
    const { row, col } = hovered;
    if (cluesGrid[row][col] !== null) return;

    const num = getKeyboardDigit(e);
    if (num === null) return;

    const now = Date.now();
    const previousEntry = keyboardEntryRef.current;
    const canAppend = previousEntry !== null &&
      previousEntry.row === row &&
      previousEntry.col === col &&
      now - previousEntry.timestamp <= KEYBOARD_ENTRY_TIMEOUT_MS;
    const nextText = canAppend ? `${previousEntry.text}${num}` : String(num);
    const nextNumber = Number(nextText);

    if (nextNumber >= 1 && nextNumber <= 99 && nextText.length <= 2) {
      e.preventDefault();
      keyboardEntryRef.current = { row, col, text: nextText, timestamp: now };
      setGrid(prev => {
        const newGrid = prev.map(r => [...r]);
        newGrid[row][col] = nextNumber;
        return newGrid;
      });
      return;
    }

    keyboardEntryRef.current = null;
    if (num >= 1 && num <= 9) {
      e.preventDefault();
      keyboardEntryRef.current = { row, col, text: String(num), timestamp: now };
      setGrid(prev => {
        const newGrid = prev.map(r => [...r]);
        newGrid[row][col] = num;
        return newGrid;
      });
    }
  }, [cluesGrid]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const getCenter = useCallback((r: number, c: number) => {
    return { x: c * cellSize + cellSize / 2, y: r * cellSize + cellSize / 2 };
  }, [cellSize]);

  const autoThinLines = useMemo(
    () => getFillominoAutoBoundaryLines(grid, width, height),
    [grid, height, width]
  );

  const autoThinLinesAnswer = useMemo(
    () => getFillominoAutoBoundaryLines(correctGrid, width, height),
    [correctGrid, height, width]
  );

  // ==================== 关键修复：getLineStyle ====================
  const getLineStyle = useCallback((key: string, isAnswer = false): { stroke: string; strokeWidth: number } => {
    // 优先级：deepLines（手动绘制） → autoThinLines（自动灰线） → 默认细线
    if (!isAnswer && deepLines.has(key)) {
      return { stroke: woodBoardTheme.deepLine, strokeWidth: getBoardRegionStrokeWidth(cellSize) };
    }
    const currentAuto = isAnswer ? autoThinLinesAnswer : autoThinLines;
    if (currentAuto.has(key)) {
      return { stroke: woodBoardTheme.accentBorder, strokeWidth: getBoardBoundaryStrokeWidth(cellSize) };
    }
    return { stroke: woodBoardTheme.gridLine, strokeWidth: getBoardGridStrokeWidth() };
  }, [cellSize, deepLines, autoThinLines, autoThinLinesAnswer]);

  const alignStrokeCoordinate = useCallback((coordinate: number, strokeWidth: number) => (
    strokeWidth % 2 === 1 ? coordinate + 0.5 : coordinate
  ), []);

  const changeNumber = useCallback((r: number, c: number, increment: number) => {
    if (cluesGrid[r][c] !== null) return;
    setGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      let val = newGrid[r][c];
      if (val === null) val = increment > 0 ? 1 : 9;
      else val += increment;
      if (val < 1) val = null;
      if (val !== null && val > 99) val = 99;
      newGrid[r][c] = val;
      return newGrid;
    });
  }, [cluesGrid]);

  const copyValueDrag = useCallback((r: number, c: number) => {
    if (cluesGrid[r][c] !== null) return;
    const startValue = grid[startRow.current][startCol.current];
    if (startValue === null) return;
    setGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      newGrid[r][c] = startValue;
      return newGrid;
    });
  }, [grid, cluesGrid]);

  const clearCellDrag = useCallback((r: number, c: number) => {
    if (cluesGrid[r][c] !== null) return;
    setGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      newGrid[r][c] = null;
      return newGrid;
    });
  }, [cluesGrid]);

  const getCellFromPos = useCallback((effectiveX: number, effectiveY: number) => {
    return {
      row: Math.max(0, Math.min(height - 1, Math.floor(effectiveY / cellSize))),
      col: Math.max(0, Math.min(width - 1, Math.floor(effectiveX / cellSize))),
    };
  }, [cellSize, height, width]);

  const getNearestVertex = useCallback((effectiveX: number, effectiveY: number) => {
    return {
      rowLine: Math.max(0, Math.min(height, Math.round(effectiveY / cellSize))),
      colLine: Math.max(0, Math.min(width, Math.round(effectiveX / cellSize))),
    };
  }, [cellSize, height, width]);

  const handleBoundaryEdit = useCallback((type: 'thin' | 'deep', key: string) => {
    if (boundaryOperationRef.current === null) {
      const currentSet = type === 'thin' ? thinLines : deepLines;
      boundaryOperationRef.current = currentSet.has(key) ? 'delete' : 'add';
    }
    const op = boundaryOperationRef.current!;
    if (type === 'thin') {
      setThinLines(prev => {
        const next = new Set(prev);
        if (op === 'add') next.add(key);
        else next.delete(key);
        return next;
      });
    } else {
      setDeepLines(prev => {
        const next = new Set(prev);
        if (op === 'add') next.add(key);
        else next.delete(key);
        return next;
      });
    }
    hasEditedBoundary.current = true;
  }, [thinLines, deepLines]);

  const handleDocumentPointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging.current || pointerIdRef.current === null) return;
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const boardInset = commonBoardChrome.border + BOARD_PADDING;
    const effectiveX = e.clientX - rect.left - boardInset;
    const effectiveY = e.clientY - rect.top - boardInset;
    const currentCell = getCellFromPos(effectiveX, effectiveY);

    if (longPressTimerRef.current) {
      if (currentCell.row !== startRow.current || currentCell.col !== startCol.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }

    if (dragType.current === 'deepLine') {
      const currentVertex = getNearestVertex(effectiveX, effectiveY);
      const last = lastVertexRef.current;
      if (last.rowLine !== -1 && last.colLine !== -1) {
        const dr = last.rowLine - currentVertex.rowLine;
        const dc = last.colLine - currentVertex.colLine;
        let edgeKey = '';
        if (dr === 0 && Math.abs(dc) === 1) {
          const minCol = Math.min(last.colLine, currentVertex.colLine);
          const edgeRow = last.rowLine - 1;
          if (edgeRow >= 0 && edgeRow < height && minCol >= 0 && minCol < width) edgeKey = `v-${edgeRow}-${minCol}`;
        } else if (dc === 0 && Math.abs(dr) === 1) {
          const minRow = Math.min(last.rowLine, currentVertex.rowLine);
          const edgeCol = last.colLine - 1;
          if (minRow >= 0 && minRow < height && edgeCol >= 0 && edgeCol < width) edgeKey = `h-${minRow}-${edgeCol}`;
        }
        if (edgeKey) handleBoundaryEdit('deep', edgeKey);
      }
      lastVertexRef.current = currentVertex;
    } else if (dragType.current === 'thinLine') {
      const lastR = lastRowRef.current;
      const lastC = lastColRef.current;
      const dr = Math.abs(lastR - currentCell.row);
      const dc = Math.abs(lastC - currentCell.col);
      if (lastR !== -1 && lastC !== -1 && dr + dc === 1) {
        const edgeKey = getFillominoEdgeKey(lastR, lastC, currentCell.row, currentCell.col);
        if (edgeKey) handleBoundaryEdit('thin', edgeKey);
      }
    } else if (dragType.current === 'clear') {
      clearCellDrag(currentCell.row, currentCell.col);
    }

    lastRowRef.current = currentCell.row;
    lastColRef.current = currentCell.col;
    if (dragType.current === 'copy' && (currentCell.row !== startRow.current || currentCell.col !== startCol.current)) {
      copyValueDrag(currentCell.row, currentCell.col);
    }
  }, [getCellFromPos, getNearestVertex, handleBoundaryEdit, copyValueDrag, clearCellDrag, height, width]);

  const handleDocumentPointerUp = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (!isDragging.current) return;

    const isSameCell = lastRowRef.current === startRow.current && lastColRef.current === startCol.current && startRow.current >= 0 && startCol.current >= 0;
    if (isSameCell && !hasEditedBoundary.current) {
      if (dragIsLeft.current) changeNumber(startRow.current, startCol.current, 1);
      else if (grid[startRow.current][startCol.current] !== null) changeNumber(startRow.current, startCol.current, -1);
    }

    isDragging.current = false;
    startRow.current = -1;
    startCol.current = -1;
    lastRowRef.current = -1;
    lastColRef.current = -1;
    lastVertexRef.current = { rowLine: -1, colLine: -1 };
    pointerIdRef.current = null;
    hasEditedBoundary.current = false;
    boundaryOperationRef.current = null;

    document.removeEventListener('pointermove', handleDocumentPointerMove);
  }, [handleDocumentPointerMove, changeNumber, grid]);

  const handleNumpadInput = useCallback((num: number | null) => {
    if (!numpadTarget) return;
    const { row, col } = numpadTarget;
    if (cluesGrid[row][col] !== null) return;
    setGrid(prev => {
      const newGrid = prev.map(r => [...r]);
      newGrid[row][col] = num;
      return newGrid;
    });
    setShowNumpad(false);
    setNumpadTarget(null);
  }, [numpadTarget, cluesGrid]);

  const closeNumpad = useCallback(() => {
    setShowNumpad(false);
    setNumpadTarget(null);
  }, []);

  const handlePointerDown = (r: number, c: number, e: React.PointerEvent<HTMLDivElement>) => {
    keyboardEntryRef.current = null;
    e.preventDefault();
    e.stopPropagation();
    if (e.button === 2) e.preventDefault();

    const board = boardRef.current;
    if (board) {
      board.setPointerCapture(e.pointerId);
      pointerIdRef.current = e.pointerId;
    }

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (e.pointerType === 'touch' && cluesGrid[r][c] === null) {
      longPressTimerRef.current = setTimeout(() => {
        if (longPressTimerRef.current === null) return;
        isDragging.current = false;
        setNumpadTarget({ row: r, col: c });
        setShowNumpad(true);
      }, longPressThreshold);
    }

    isDragging.current = true;
    startRow.current = r;
    startCol.current = c;
    lastRowRef.current = r;
    lastColRef.current = c;
    lastVertexRef.current = { rowLine: -1, colLine: -1 };
    dragIsLeft.current = e.button === 0;
    hasEditedBoundary.current = false;
    boundaryOperationRef.current = null;

    let mode: 'copy' | 'clear' | 'thinLine' | 'deepLine' = 'copy';
    if (e.button === 2) {
      mode = 'thinLine';
    } else if (e.button === 0) {
      const target = e.currentTarget as HTMLElement;
      const cellRect = target.getBoundingClientRect();
      const offsetX = e.clientX - cellRect.left;
      const offsetY = e.clientY - cellRect.top;

      const threshold = Math.max(8, Math.floor(cellSize * 0.23));
      const nearCorner =
        (offsetX <= threshold && offsetY <= threshold) ||
        (offsetX >= cellSize - threshold && offsetY <= threshold) ||
        (offsetX <= threshold && offsetY >= cellSize - threshold) ||
        (offsetX >= cellSize - threshold && offsetY >= cellSize - threshold);

      if (nearCorner) {
        mode = 'deepLine';
      } else if (grid[r][c] === null) {
        mode = 'clear';
      }
    }
    dragType.current = mode;

    if (mode === 'deepLine') {
      const rect = boardRef.current?.getBoundingClientRect();
      if (rect) {
        const boardInset = commonBoardChrome.border + BOARD_PADDING;
        const mouseX = e.clientX - rect.left - boardInset;
        const mouseY = e.clientY - rect.top - boardInset;
        lastVertexRef.current = getNearestVertex(mouseX, mouseY);
      }
    }

    document.addEventListener('pointermove', handleDocumentPointerMove, { passive: true });
    document.addEventListener('pointerup', handleDocumentPointerUp, { passive: true, once: true });
  };

  const { boardWidth, boardHeight, outerWidth, outerHeight } = getBoardFrameDimensions(
    width,
    height,
    cellSize,
    { borderWidth: commonBoardChrome.border, padding: BOARD_PADDING }
  );
  const svgWidth = boardWidth;
  const svgHeight = boardHeight;

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-8 justify-center">
        {/* 可游玩例题 */}
        <div className="flex flex-col items-center">
          <p className="mb-4 text-center text-base font-medium text-muted-foreground">
            {playableLabel}
          </p>
          <div
            ref={boardRef}
            className="mx-auto select-none"
            style={{
              position: 'relative',
              width: `${outerWidth}px`,
              height: `${outerHeight}px`,
              touchAction: 'none',
              ...getBoardFrameStyle(commonBoardChrome.border),
            }}
            onContextMenu={(e) => e.preventDefault()}
          >
            <div
              className="grid"
              style={getBoardGridStyle(BOARD_PADDING, BOARD_PADDING, width, cellSize)}
            >
              {grid.flatMap((row, r) =>
                row.map((value, c) => {
                  const isClue = cluesGrid[r][c] !== null;
                  return (
                    <div
                      key={`${r}-${c}`}
                      onPointerDown={(e) => handlePointerDown(r, c, e)}
                      onMouseEnter={() => {
                        if (!isClue) hoveredCellRef.current = { row: r, col: c };
                      }}
                      onMouseLeave={() => {
                        if (!isDragging.current) hoveredCellRef.current = null;
                      }}
                      className={`flex items-center justify-center cursor-pointer border-0 relative ${boardClassNames.cellText}
                        ${isClue ? '' : 'hover:bg-gray-100 active:bg-gray-200'}
                        ${invalidCells.some(cell => cell.r === r && cell.c === c) ? 'text-red-600' : ''}`}
                      style={{
                        ...getBoardCellStyle(cellSize, isClue ? 'clue' : 'cell'),
                        ...getBoardTextStyle(cellSize),
                      }}
                    >
                      {value ?? ''}
                    </div>
                  );
                })
              )}
            </div>

            <svg
              width={svgWidth}
              height={svgHeight}
              style={{
                position: 'absolute',
                top: `${commonBoardChrome.padding}px`,
                left: `${commonBoardChrome.padding}px`,
                pointerEvents: 'none',
                overflow: 'visible',
                zIndex: 10,
              }}
              shapeRendering="crispEdges"
            >
              {Array.from({ length: height }, (_, r) =>
                Array.from({ length: width - 1 }, (_, c) => {
                  const key = `h-${r}-${c}`;
                  if (!autoThinLines.has(key)) return null;
                  const { stroke, strokeWidth } = getLineStyle(key);
                  const x = alignStrokeCoordinate((c + 1) * cellSize, strokeWidth);
                  const y1 = r * cellSize;
                  const y2 = (r + 1) * cellSize;
                  return <line key={`edge-v-${r}-${c}`} x1={x} y1={y1} x2={x} y2={y2} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="butt" />;
                })
              )}
              {Array.from({ length: height - 1 }, (_, r) =>
                Array.from({ length: width }, (_, c) => {
                  const key = `v-${r}-${c}`;
                  if (!autoThinLines.has(key)) return null;
                  const { stroke, strokeWidth } = getLineStyle(key);
                  const y = alignStrokeCoordinate((r + 1) * cellSize, strokeWidth);
                  const x1 = c * cellSize;
                  const x2 = (c + 1) * cellSize;
                  return <line key={`edge-h-${r}-${c}`} x1={x1} y1={y} x2={x2} y2={y} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="butt" />;
                })
              )}
              {Array.from(thinLines).map((key) => {
                const [type, rStr, cStr] = key.split('-');
                const r = parseInt(rStr);
                const c = parseInt(cStr);
                let x1 = 0, y1 = 0, x2 = 0, y2 = 0;
                if (type === 'h') {
                  const { x: cx1, y: cy } = getCenter(r, c);
                  const { x: cx2 } = getCenter(r, c + 1);
                  x1 = cx1; y1 = cy; x2 = cx2; y2 = cy;
                } else if (type === 'v') {
                  const { x: cx, y: cy1 } = getCenter(r, c);
                  const { y: cy2 } = getCenter(r + 1, c);
                  x1 = cx; y1 = cy1; x2 = cx; y2 = cy2;
                }
                return <line key={`thin-${key}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={woodBoardTheme.thinLine} strokeWidth={getBoardThinStrokeWidth(cellSize)} strokeLinecap="round" />;
              })}
            </svg>

            {showNumpad && numpadTarget && (
              <div
                style={{
                  position: 'fixed',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  ...getBoardNumpadPanelStyle(),
                  zIndex: 9999,
                  touchAction: 'none',
                  userSelect: 'none',
                }}
              >
                <div style={getBoardNumpadHeaderStyle()}>
                  <button onClick={closeNumpad} style={getBoardNumpadDismissStyle()}>✕</button>
                </div>
                <div style={getBoardNumpadGridStyle()}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleNumpadInput(num)}
                      style={{
                        ...getBoardNumpadButtonStyle(cellSize),
                      }}
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    onClick={() => handleNumpadInput(null)}
                    style={{
                      gridColumn: 'span 3',
                      ...getBoardNumpadButtonStyle(cellSize, 'invalid', 20),
                    }}
                  >
                    {copy.shared.delete}
                  </button>
                </div>
                <div onClick={closeNumpad} style={boardOverlayStyle} />
              </div>
            )}
          </div>
        </div>

        {/* 正确答案题板 */}
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
            <div
              className="mx-auto select-none"
              style={{
                position: 'relative',
                width: `${outerWidth}px`,
                height: `${outerHeight}px`,
                ...getBoardFrameStyle(commonBoardChrome.border),
              }}
            >
              <div
                className="grid"
                style={getBoardGridStyle(BOARD_PADDING, BOARD_PADDING, width, cellSize)}
              >
                {correctGrid.flatMap((row, r) =>
                  row.map((val, c) => (
                    <div
                      key={`${r}-${c}`}
                      className={`flex items-center justify-center ${boardClassNames.cellText}`}
                      style={{
                        ...getBoardCellStyle(cellSize, 'cell'),
                        ...getBoardTextStyle(cellSize),
                      }}
                    >
                      {val ?? ''}
                    </div>
                  ))
                )}
              </div>

              <svg
                width={svgWidth}
                height={svgHeight}
                style={{
                  position: 'absolute',
                  top: `${BOARD_PADDING}px`,
                  left: `${BOARD_PADDING}px`,
                  pointerEvents: 'none',
                  overflow: 'visible',
                  zIndex: 10,
                }}
                shapeRendering="crispEdges"
              >
                {Array.from({ length: height }, (_, r) =>
                  Array.from({ length: width - 1 }, (_, c) => {
                    const key = `h-${r}-${c}`;
                    if (!autoThinLinesAnswer.has(key)) return null;
                    const { stroke, strokeWidth } = getLineStyle(key, true);
                    const x = alignStrokeCoordinate((c + 1) * cellSize, strokeWidth);
                    const y1 = r * cellSize;
                    const y2 = (r + 1) * cellSize;
                    return <line key={`edge-v-${r}-${c}`} x1={x} y1={y1} x2={x} y2={y2} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="butt" />;
                  })
                )}
                {Array.from({ length: height - 1 }, (_, r) =>
                  Array.from({ length: width }, (_, c) => {
                    const key = `v-${r}-${c}`;
                    if (!autoThinLinesAnswer.has(key)) return null;
                    const { stroke, strokeWidth } = getLineStyle(key, true);
                    const y = alignStrokeCoordinate((r + 1) * cellSize, strokeWidth);
                    const x1 = c * cellSize;
                    const x2 = (c + 1) * cellSize;
                    return <line key={`edge-h-${r}-${c}`} x1={x1} y1={y} x2={x2} y2={y} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="butt" />;
                  })
                )}
              </svg>
            </div>
          </ExampleAnswerReveal>
        </div>
      </div>
    </>
  );
}
