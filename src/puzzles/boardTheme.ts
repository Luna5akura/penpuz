import type { TrialLevelColors } from './trialStyles';

// Keep the dark square colour in one place.  A number of puzzle families use
// a dark square for a blocked/clue cell (Nurikabe, Kakuro, Yajilin, etc.).
// Historically a few of those renderers carried their own near-black token,
// which made the same semantic cell look different between the main board,
// examples, and replay thumbnails.
const DARK_CELL_BACKGROUND = '#3f2a1e';
const DARK_CELL_TEXT = '#ffffff';
const MARKED_CELL_BACKGROUND = '#ead9bf';

export const woodBoardTheme = {
  frame: '#d2b48c',
  border: '#3f2a1e',
  /** The semantic color used for every resolved Battleship segment. */
  battleshipShip: DARK_CELL_BACKGROUND,
  /** Unknown Battleship clues stay visually distinct from resolved segments. */
  battleshipUnknownShip: '#9ca3af',
  cell: '#f8f1e3',
  whiteCell: '#fffdf6',
  /** Clue cells intentionally share the same fill as crossed/marked cells. */
  clueCell: MARKED_CELL_BACKGROUND,
  prefilledCell: '#f0e6d2',
  panel: '#fbf6ed',
  /** Canonical background for every dark/shaded board cell. */
  darkCell: DARK_CELL_BACKGROUND,
  darkCellText: DARK_CELL_TEXT,
  // Backwards-compatible names used by older puzzle renderers.  Keep these
  // aliases equal to the canonical tokens so a legacy branch cannot drift.
  shaded: DARK_CELL_BACKGROUND,
  shadedText: DARK_CELL_TEXT,
  marked: MARKED_CELL_BACKGROUND,
  markedText: '#7a6a5b',
  lit: '#d9efb5',
  brightLit: '#b7dd7f',
  ink: '#111111',
  thinLine: 'rgba(93, 64, 39, 0.48)',
  deepLine: '#374151',
  faintLine: '#d4c1a6',
  accentBorder: '#6d5134',
  accentFill: '#f6ead6',
  accentText: '#5a3d27',
  gridLine: '#d4c1a6',
  invalidDark: '#7c2d2d',
  invalidSoft: '#f5d0c5',
  invalidMarked: '#f2c9bf',
  invalidText: '#7a3b2e',
  neutralInk: '#111827',
  neutralMid: '#374151',
  neutralSoft: '#9ca3af',
  neutralLight: '#f9fafb',
} as const;

export const boardTypography = {
  textWeight: 600,
  markWeight: 500,
  controlWeight: 600,
  lineHeight: 1,
} as const;

/**
 * Shared geometry and stroke tokens.  Puzzle renderers should never carry a
 * literal border/stroke width: using these values keeps interactive boards,
 * examples and replay thumbnails visually interchangeable.
 */
export const boardStrokeWidths = {
  grid: 1,
  boundary: 3,
  boundaryOutlineExtra: 2,
  loopCross: 1.6,
  clueDiagonal: 2.2,
  icon: 2.2,
  marker: 2,
  selection: 3,
} as const;

export const boardGeometry = {
  /** Small inset used for secondary marks in a clue cell. */
  clueInsetRatio: 0.08,
  /** Radius used by compact circular clues. */
  clueRadiusRatio: 0.19,
  /** Relative size of a bulb/center symbol. */
  symbolRatio: 0.8,
  boundaryRatio: 0.08,
  boundaryMin: 3,
  regionRatio: 0.1,
  regionMin: 4,
  thinRatio: 0.05,
  thinMin: 2,
  /** Shared panel shadow used by numeric keypad/popovers. */
  panelShadow: '0 10px 25px -5px rgb(0 0 0 / 0.2)',
} as const;

/** Shared dimensions for compact board controls such as the Fillomino keypad. */
export const boardControlMetrics = {
  panelRadius: 12,
  panelPadding: 12,
  panelMaxWidth: 340,
  dismissButtonSize: 32,
  keypadButtonSize: 52,
  keypadGap: 8,
  keypadRadius: 8,
} as const;

export const boardClassNames = {
  cellText: 'font-semibold tabular-nums',
  cellTextTight: 'font-semibold tabular-nums tracking-tight',
  cellContent: 'relative flex items-center justify-center font-semibold tabular-nums',
  touchCellContent: 'relative flex items-center justify-center touch-none font-semibold tabular-nums',
} as const;

export const boardLayoutMetrics = {
  directionalClueReferenceSize: 44,
  /** Canonical cell sizes used by static rule examples. */
  exampleCellSize: 42,
  compactExampleCellSize: 36,
  /** Slightly larger scale used by loop/edge examples. */
  loopExampleCellSize: 44,
  /** Baseline size for read-only history thumbnails. */
  replayCellSize: 38,
  cellGap: 1,
  inventoryCellSize: 15,
  compactInventoryCellSize: 13,
  shipPreviewCellSize: 16,
  /** Shared example size for four-sided number-placement boards. */
  skyNeighborCellSize: 42,
  /** Geometry used by every outlined/gray cell, regardless of renderer. */
  outlinedCellInsetRatio: 0.08,
  outlinedCellMinInset: 2,
} as const;

export type BoardCellTone =
  | 'cell'
  | 'clue'
  | 'prefilled'
  | 'outlined'
  | 'marked'
  | 'playerShaded'
  | 'shaded'
  | 'lit'
  | 'brightLit';

/** The four optional sides on which a board may render directional clues. */
export interface BoardOutsideClues {
  top?: readonly (number | null)[];
  bottom?: readonly (number | null)[];
  left?: readonly (number | null)[];
  right?: readonly (number | null)[];
}

export interface BoardOutsideClueLayout {
  clueSize: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** Return the largest number of digits present in an outside clue set. */
export function getBoardOutsideClueMaxDigits(outsideClues?: BoardOutsideClues | null) {
  if (!outsideClues) return 1;
  const lines: Array<readonly (number | null)[] | undefined> = [
    outsideClues.top,
    outsideClues.right,
    outsideClues.bottom,
    outsideClues.left,
  ];
  return Math.max(
    1,
    ...lines.flatMap((line) =>
      (line ?? [])
        .filter((value): value is number => typeof value === 'number')
        .map((value) => String(Math.abs(value)).length)
    )
  );
}

/** Width needed by an outside gutter for its largest numeric clue. */
export function getBoardOutsideClueGutter(cellSize: number, maxDigits = 1) {
  // Outside clues occupy a full corresponding row/column. Matching the cell
  // size keeps four-sided boards (notably Sky-neighbors) properly aligned.
  const baseGutter = Math.max(24, cellSize);
  const digits = Math.min(3, Math.max(1, maxDigits));
  const baseFontSize = getBoardNumberFontSize(cellSize, 0.48, 14);
  const textWidth = Math.ceil(baseFontSize * 0.62 * digits + 4);
  return Math.max(baseGutter, textWidth);
}

/**
 * Keep clue gutters consistent across interactive boards, examples, and
 * replay thumbnails. A side is present when its array is provided, even if
 * all entries are null; this preserves the intentional alignment of a clue
 * system with an empty side.
 */
export function getBoardOutsideClueLayout(
  cellSize: number,
  outsideClues?: BoardOutsideClues | null
): BoardOutsideClueLayout {
  const maxDigits = getBoardOutsideClueMaxDigits(outsideClues);
  const clueSize = outsideClues ? getBoardOutsideClueGutter(cellSize, maxDigits) : 0;
  return {
    clueSize,
    left: outsideClues?.left === undefined ? 0 : clueSize,
    right: outsideClues?.right === undefined ? 0 : clueSize,
    top: outsideClues?.top === undefined ? 0 : clueSize,
    bottom: outsideClues?.bottom === undefined ? 0 : clueSize,
  };
}

export function getBoardCellColors(tone: BoardCellTone) {
  switch (tone) {
    case 'clue':
      return { background: woodBoardTheme.clueCell, color: woodBoardTheme.border } as const;
    case 'prefilled':
      return { background: woodBoardTheme.prefilledCell, color: woodBoardTheme.border } as const;
    case 'outlined':
      // Neighbor-family gray cells use the same dark surface as Nurikabe;
      // the shared outline remains as an additional visual cue.
      return { background: woodBoardTheme.darkCell, color: woodBoardTheme.darkCellText } as const;
    case 'marked':
      return { background: woodBoardTheme.marked, color: woodBoardTheme.markedText } as const;
    case 'playerShaded':
      return { background: woodBoardTheme.darkCell, color: woodBoardTheme.darkCellText } as const;
    case 'shaded':
      return { background: woodBoardTheme.darkCell, color: woodBoardTheme.darkCellText } as const;
    case 'lit':
      return { background: woodBoardTheme.lit, color: woodBoardTheme.border } as const;
    case 'brightLit':
      return { background: woodBoardTheme.brightLit, color: woodBoardTheme.border } as const;
    case 'cell':
    default:
      return { background: woodBoardTheme.cell, color: woodBoardTheme.border } as const;
  }
}

/** Build the common CSS style for an individual board cell. */
export function getBoardCellStyle(
  cellSize: number,
  tone: BoardCellTone = 'cell',
  options: {
    editable?: boolean;
    selected?: boolean;
    cursor?: string;
  } = {}
) {
  const { editable = false, selected = false, cursor } = options;
  return {
    width: `${cellSize}px`,
    height: `${cellSize}px`,
    ...getBoardCellColors(tone),
    ...getCellDividerStyle(),
    ...(editable ? { cursor: cursor ?? 'pointer' } : cursor ? { cursor } : undefined),
    ...getBoardSelectionStyle(selected),
  } as const;
}

/** Selection outline shared by editable cells and outside clue cells. */
export function getBoardSelectionStyle(selected: boolean) {
  if (!selected) return {} as const;
  return {
    outline: `${boardStrokeWidths.selection}px solid ${woodBoardTheme.accentBorder}`,
    outlineOffset: '-4px',
  } as const;
}

/**
 * Apply a trial-level palette to a cell without duplicating palette semantics
 * in each puzzle renderer.  `filled` is used for dark/shaded cells, while
 * `soft` is used for marks and regular entered values.
 */
export function getBoardTrialCellStyle(
  colors: TrialLevelColors | null | undefined,
  mode: 'filled' | 'soft' | 'line' = 'soft',
  textColor?: string
) {
  if (!colors) return {} as const;
  if (mode === 'line') {
    return { boxShadow: `inset 0 0 0 ${boardStrokeWidths.marker}px ${colors.line}` } as const;
  }
  return mode === 'filled'
    ? { background: colors.fill, color: woodBoardTheme.darkCellText }
    : { background: colors.softFill, color: textColor ?? colors.text };
}

/**
 * Return the content and frame dimensions for a fixed-cell board.
 *
 * Keeping this calculation beside the frame/grid tokens is important: a
 * board that uses an auto-sized inline element can end up with a different
 * content box (and therefore different pointer coordinates) from a board
 * that uses the normal fixed frame.  All board renderers should use these
 * dimensions when they need an explicit width/height.
 */
export function getBoardFrameDimensions(
  width: number,
  height: number,
  cellSize: number,
  options: {
    columnGap?: number;
    rowGap?: number;
    outsideLeft?: number;
    outsideRight?: number;
    outsideTop?: number;
    outsideBottom?: number;
    borderWidth?: number;
    padding?: number;
  } = {}
) {
  const {
    columnGap = 0,
    rowGap = columnGap,
    outsideLeft = 0,
    outsideRight = 0,
    outsideTop = 0,
    outsideBottom = 0,
    borderWidth = commonBoardChrome.border,
    padding = commonBoardChrome.padding,
  } = options;
  const boardWidth = width * cellSize + Math.max(0, width - 1) * columnGap;
  const boardHeight = height * cellSize + Math.max(0, height - 1) * rowGap;
  return {
    boardWidth,
    boardHeight,
    outerWidth: boardWidth + outsideLeft + outsideRight + padding * 2 + borderWidth * 2,
    outerHeight: boardHeight + outsideTop + outsideBottom + padding * 2 + borderWidth * 2,
  } as const;
}

/** Grid container geometry shared by every fixed-cell board. */
export function getBoardGridStyle(
  left: number,
  top: number,
  width: number,
  cellSize: number,
  columnGap = 0,
  rowGap = columnGap
) {
  return {
    position: 'absolute',
    display: 'grid',
    left: `${left}px`,
    top: `${top}px`,
    gridTemplateColumns: `repeat(${width}, ${cellSize}px)`,
    columnGap: columnGap ? `${columnGap}px` : undefined,
    rowGap: rowGap ? `${rowGap}px` : undefined,
  } as const;
}

/** Shared style for non-interactive keypad/popover surfaces. */
export function getBoardPanelStyle(borderWidth = boardStrokeWidths.boundary) {
  return {
    background: woodBoardTheme.panel,
    border: `${borderWidth}px solid ${woodBoardTheme.border}`,
    boxShadow: boardGeometry.panelShadow,
  } as const;
}

export function getBoardPanelColors() {
  return { background: woodBoardTheme.panel } as const;
}

export function getBoardGridSurfaceStyle() {
  return { background: woodBoardTheme.gridLine } as const;
}

/** Shared accent badge (quota/status) used above puzzle boards. */
export function getBoardBadgeStyle() {
  return {
    border: `${boardStrokeWidths.grid}px solid ${woodBoardTheme.accentBorder}`,
    background: woodBoardTheme.accentFill,
    color: woodBoardTheme.accentText,
  } as const;
}

/** Cell style used by compact shape/ship inventories. */
export function getBoardInventoryCellStyle(occupied: boolean) {
  return {
    background: occupied ? woodBoardTheme.darkCell : 'transparent',
    border: occupied ? `${boardStrokeWidths.grid}px solid ${woodBoardTheme.border}` : undefined,
  } as const;
}

export function getBoardDominoBadgeStyle(used: boolean) {
  return {
    borderColor: used ? woodBoardTheme.border : woodBoardTheme.accentBorder,
    background: used ? woodBoardTheme.darkCell : woodBoardTheme.panel,
    color: used ? woodBoardTheme.darkCellText : woodBoardTheme.accentText,
  } as const;
}

/** Shared toggle style for board mode controls (number/boundary/mark, etc.). */
export function getBoardModeButtonStyle(active: boolean) {
  return {
    borderColor: woodBoardTheme.border,
    ...getBoardCellColors(active ? 'shaded' : 'cell'),
  } as const;
}

/** Shared style for a compact board control button. */
export function getBoardControlStyle(fontSize: number) {
  return {
    ...getBoardControlTextStyle(fontSize),
    color: woodBoardTheme.border,
    background: 'transparent',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  } as const;
}

/** Shared shell for a floating numeric keypad/popover. */
export function getBoardNumpadPanelStyle() {
  return {
    ...getBoardPanelStyle(),
    borderRadius: `${boardControlMetrics.panelRadius}px`,
    padding: `${boardControlMetrics.panelPadding}px`,
    maxWidth: `${boardControlMetrics.panelMaxWidth}px`,
  } as const;
}

/** Shared keypad key style, including semantic cell tone and border width. */
export function getBoardNumpadButtonStyle(
  cellSize: number,
  tone: BoardCellTone | 'invalid' = 'prefilled',
  fontSize = 24
) {
  return {
    width: `${boardControlMetrics.keypadButtonSize}px`,
    height: `${boardControlMetrics.keypadButtonSize}px`,
    ...getBoardControlStyle(fontSize),
    ...(tone === 'invalid' ? getInvalidBoardCellColors('soft') : getBoardCellColors(tone)),
    border: `${getBoardThinStrokeWidth(cellSize)}px solid ${woodBoardTheme.border}`,
    borderRadius: `${boardControlMetrics.keypadRadius}px`,
  } as const;
}

export function getBoardNumpadDismissStyle() {
  return {
    width: `${boardControlMetrics.dismissButtonSize}px`,
    height: `${boardControlMetrics.dismissButtonSize}px`,
    ...getBoardControlStyle(24),
    borderRadius: '50%',
  } as const;
}

export function getBoardNumpadHeaderStyle() {
  return {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: `${boardControlMetrics.keypadGap}px`,
  } as const;
}

export function getBoardNumpadGridStyle() {
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(3, ${boardControlMetrics.keypadButtonSize}px)`,
    gap: `${boardControlMetrics.keypadGap}px`,
  } as const;
}

export const boardOverlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'transparent',
  zIndex: -1,
} as const;

export function getInvalidBoardCellColors(kind: 'dark' | 'soft' | 'marked' = 'soft') {
  if (kind === 'dark') {
    return { background: woodBoardTheme.invalidDark, color: woodBoardTheme.darkCellText } as const;
  }

  return {
    background: kind === 'marked' ? woodBoardTheme.invalidMarked : woodBoardTheme.invalidSoft,
    color: woodBoardTheme.invalidText,
  } as const;
}

export function getBoardTextStyle(cellSize: number, ratio = 0.68, min = 22, lineHeight = boardTypography.lineHeight) {
  return {
    fontSize: `${getBoardNumberFontSize(cellSize, ratio, min)}px`,
    lineHeight,
    fontWeight: boardTypography.textWeight,
  } as const;
}

/** Text style for a clue value, including the canonical clue ink color. */
export function getBoardClueTextStyle(
  cellSize: number,
  ratio = 0.68,
  min = 22,
  lineHeight = boardTypography.lineHeight
) {
  return {
    ...getBoardTextStyle(cellSize, ratio, min, lineHeight),
    color: woodBoardTheme.border,
  } as const;
}

/** Text style for a clue whose requirement is already satisfied. */
export function getBoardSatisfiedClueTextStyle(
  cellSize: number,
  ratio = 0.68,
  min = 22,
  lineHeight = boardTypography.lineHeight
) {
  return {
    ...getBoardClueTextStyle(cellSize, ratio, min, lineHeight),
    color: woodBoardTheme.neutralSoft,
  } as const;
}

export function getBoardInkStyle(color = woodBoardTheme.border) {
  return { color } as const;
}

/**
 * Text styling for a numeric clue rendered in a board's outside gutter.
 *
 * Gutters are intentionally kept compact, so a multi-digit clue needs a
 * slightly smaller type size than a single digit to avoid spilling into the
 * neighbouring cell. The available width is supplied by the caller because
 * top/bottom gutters use the cell width while left/right gutters use the
 * dedicated clue width.
 */
export function getBoardOutsideClueTextStyle(
  cellSize: number,
  availableWidth: number,
  value: number | string
) {
  const baseFontSize = getBoardNumberFontSize(cellSize, 0.48, 14);
  const digitCount = Math.max(1, String(value).length);
  // Tabular digits are roughly 0.62em wide. Keep a small horizontal buffer
  // so the glyphs remain inside the gutter even with font-rendering variance.
  const widthLimitedFontSize = Math.floor(Math.max(0, availableWidth - 4) / (digitCount * 0.62));
  // Three-digit clues retain the regular clue size. Their gutter is widened
  // by getBoardOutsideClueLayout; only four digits and above are compressed.
  const fontSize = digitCount <= 3
    ? baseFontSize
    : Math.max(8, Math.min(baseFontSize, widthLimitedFontSize || 8));
  return {
    fontSize: `${fontSize}px`,
    lineHeight: boardTypography.lineHeight,
    fontWeight: boardTypography.textWeight,
    color: woodBoardTheme.border,
    whiteSpace: 'nowrap',
    display: 'block',
    width: `${Math.max(0, availableWidth - 2)}px`,
    overflow: 'hidden',
  } as const;
}

export function getBoardFixedTextStyle(fontSize: number, lineHeight = boardTypography.lineHeight) {
  return {
    fontSize: `${fontSize}px`,
    lineHeight,
    fontWeight: boardTypography.textWeight,
  } as const;
}

export function getBoardControlTextStyle(fontSize: number, lineHeight = boardTypography.lineHeight) {
  return {
    fontSize: `${fontSize}px`,
    lineHeight,
    fontWeight: boardTypography.controlWeight,
  } as const;
}

export function getBoardSvgTextProps(cellSize: number, ratio = 0.68, min = 22) {
  return {
    fontSize: getBoardNumberFontSize(cellSize, ratio, min),
    fontWeight: boardTypography.textWeight,
  } as const;
}

export function getBoardNumberFontSize(cellSize: number, ratio = 0.68, min = 22) {
  return Math.max(min, Math.floor(cellSize * ratio));
}

export function getLoopLineStrokeWidth(cellSize: number, ratio = 0.08, min = 2.5) {
  return Math.max(min, Math.floor(cellSize * ratio));
}

/**
 * Shared edge-drawing input styles (Slitherlink and Pills): the hit radius
 * around a grid vertex and the pick distance for a grid-line segment.
 */
export function getBoardVertexHitRadius(cellSize: number) {
  return Math.max(14, Math.floor(cellSize * 0.3));
}

export function getBoardEdgeHitThreshold(cellSize: number) {
  return Math.max(8, Math.floor(cellSize * 0.18));
}

/**
 * Geometry for the hollow capsule outline drawn over placed pills: the
 * capsule is inset inside the covered cells so the dot clues stay visible.
 * A single marked cell renders as a circle of the same diameter.
 */
export function getBoardPillCapsuleMetrics(cellSize: number) {
  const inset = Math.max(2, Math.floor(cellSize * 0.12));
  return {
    inset,
    radius: (cellSize - inset * 2) / 2,
  } as const;
}

/** Stroke used by thin internal grid separators. */
export function getBoardGridStrokeWidth() {
  return boardStrokeWidths.grid;
}

/**
 * Build an SVG rectangle whose stroke occupies the same pixels as the shared
 * CSS cell dividers.
 *
 * `getCellDividerStyle` paints right/bottom borders inside each cell, whereas
 * SVG centres a stroke on the rectangle edge. Moving each SVG edge toward the
 * preceding cell by half the stroke width makes all four edges occupy the same
 * strip as the shared grid divider instead of creating a wider overlap.
 */
export function getBoardGridOutlineRect(
  x: number,
  y: number,
  width: number,
  height: number,
  stroke = woodBoardTheme.border
) {
  const strokeWidth = getBoardGridStrokeWidth();
  const strokeOffset = strokeWidth / 2;

  return {
    x: x - strokeOffset,
    y: y - strokeOffset,
    width,
    height,
    fill: 'none',
    stroke,
    strokeWidth,
    strokeLinejoin: 'miter',
    shapeRendering: 'crispEdges',
  } as const;
}

/** Stroke used by a prominent region/deep separator. */
export function getBoardRegionStrokeWidth(
  cellSize: number,
  ratio = boardGeometry.regionRatio,
  min = boardGeometry.regionMin
) {
  return Math.max(min, Math.floor(cellSize * ratio));
}

/** Stroke used by secondary (thin) region separators. */
export function getBoardThinStrokeWidth(
  cellSize: number,
  ratio = boardGeometry.thinRatio,
  min = boardGeometry.thinMin
) {
  return Math.max(min, Math.floor(cellSize * ratio));
}

/** Stroke used by diagonal clue marks (for example Kakuro). */
export function getBoardClueDiagonalStrokeWidth() {
  return boardStrokeWidths.clueDiagonal;
}

export function getBoardIconStrokeWidth() {
  return boardStrokeWidths.icon;
}

/** Padding used inside split clue cells (Kakuro and related variants). */
export function getBoardClueInset(cellSize: number, min = 3) {
  return Math.max(min, Math.floor(cellSize * boardGeometry.clueInsetRatio));
}

/** Stroke used by compact crossing markers. */
export function getBoardMarkerStrokeWidth() {
  return boardStrokeWidths.marker;
}

/** Stroke used by compact symbol outlines (sheep/wolf and similar icons). */
export function getBoardSymbolStrokeWidth() {
  return boardStrokeWidths.boundary + 1;
}

export function getBoardSymbolDetailStrokeWidth() {
  return boardStrokeWidths.boundary;
}

/** Canonical size of every cross drawn on a cell boundary. */
export function getLoopCrossSize(cellSize: number) {
  return Math.max(5, Math.floor(cellSize * 0.12));
}

/**
 * Magnets pole-symbol metrics: the bar length and thickness used to draw
 * the '+' (cross) and '−' (single bar) marks, matching the pzpr magnets
 * proportions (length 0.7 of the cell, thickness at least cellSize/12).
 */
export function getBoardPoleMarkMetrics(cellSize: number) {
  return {
    length: Math.max(8, Math.floor(cellSize * 0.7)),
    thickness: Math.max(3, Math.floor(cellSize / 12)),
  } as const;
}
export function getLoopCrossStrokeWidth() {
  return boardStrokeWidths.loopCross;
}

export function getBoardDotRadius(cellSize: number, ratio = 0.055, min = 2.4) {
  return Math.max(min, cellSize * ratio);
}

export function getBoardCenterMarkMetrics(cellSize: number) {
  return {
    radius: Math.max(9, cellSize * 0.3),
    crossSize: Math.max(9, cellSize * 0.26),
    strokeWidth: Math.max(2.4, cellSize * 0.065),
  } as const;
}

export function getBoardSymbolFontSize(cellSize: number, ratio = 0.54, min = 18) {
  return Math.max(min, Math.floor(cellSize * ratio));
}

/** Size used by iconography rendered inside a board cell. */
export function getBoardIconSize(cellSize: number, ratio = 0.56, min = 18) {
  return Math.max(min, Math.floor(cellSize * ratio));
}

export function getBoardPreviewCellSize(boardCellSize: number, compact = false) {
  const max = compact ? 13 : 18;
  return Math.max(10, Math.min(max, Math.floor(boardCellSize * 0.34)));
}

export function getBoardSymbolDiameter(cellSize: number, ratio = boardGeometry.symbolRatio, min = 20) {
  return Math.max(min, Math.floor(cellSize * ratio));
}

export function getBoardClueCircleMetrics(cellSize: number) {
  // Scale proportionally with the cell so clue dots stay in step with a
  // board that shrinks on narrow screens; the small floors only guard
  // against rounding to zero on tiny cells.
  return {
    radius: Math.max(4, Math.round(cellSize * boardGeometry.clueRadiusRatio)),
    strokeWidth: Math.max(1, Math.round(cellSize * 0.05)),
    outerRadiusOffset: Math.max(1, Math.round(cellSize * 0.03)),
  } as const;
}

export function getBoardBoundaryStrokeWidth(
  cellSize: number,
  ratio = boardGeometry.boundaryRatio,
  min = boardGeometry.boundaryMin
) {
  return Math.max(min, Math.floor(cellSize * ratio));
}

export function getDirectionalClueNumberFontSize(cellSize: number) {
  if (cellSize >= boardLayoutMetrics.directionalClueReferenceSize) {
    return getBoardNumberFontSize(cellSize, 0.68, 22);
  }
  return getBoardNumberFontSize(cellSize, 0.7, 22);
}

export function getDirectionalClueArrowStrokeWidth(cellSize: number) {
  return cellSize >= boardLayoutMetrics.directionalClueReferenceSize ? 2.8 : 2.4;
}

export function getRoomBoundaryStrokeWidth() {
  return boardStrokeWidths.boundary;
}

export function getBoardCircleClueDiameter(cellSize: number, ratio = 0.76, min = 28) {
  return Math.max(min, Math.floor(cellSize * ratio));
}

export function getBoardCircleClueStrokeWidth(cellSize: number, ratio = 0.065, min = 2.5) {
  return Math.max(min, Number((cellSize * ratio).toFixed(1)));
}

/** Boundary widths for room/region overlays and their contrasting underlay. */
export function getBoardBoundaryStrokeMetrics(cellSize: number, ratio = boardGeometry.boundaryRatio) {
  const strokeWidth = getBoardBoundaryStrokeWidth(cellSize, ratio, boardStrokeWidths.boundary);
  return {
    strokeWidth,
    outlineWidth: getOutlinedBorderStrokeWidth(strokeWidth, boardStrokeWidths.boundaryOutlineExtra),
  } as const;
}

export function getKurarinClueColors(color: 'black' | 'white' | 'gray') {
  if (color === 'black') {
    return {
      fill: woodBoardTheme.darkCell,
      stroke: woodBoardTheme.darkCell,
    } as const;
  }

  if (color === 'gray') {
    return {
      fill: woodBoardTheme.neutralSoft,
      stroke: woodBoardTheme.neutralMid,
    } as const;
  }

  return {
    fill: woodBoardTheme.neutralLight,
    stroke: woodBoardTheme.neutralInk,
  } as const;
}

export function getCellDividerStyle(width = boardStrokeWidths.grid, color = woodBoardTheme.gridLine) {
  return {
    boxSizing: 'border-box',
    borderRight: `${width}px solid ${color}`,
    borderBottom: `${width}px solid ${color}`,
  } as const;
}

/**
 * Return the shared inset geometry for an outlined/gray cell.
 *
 * CSS and SVG renderers paint borders differently: CSS inset shadows/borders
 * are painted inside the element, while an SVG stroke is centred on its
 * rectangle.  Keeping the inset and stroke in this helper lets both paths
 * describe exactly the same visible box.
 */
export function getBoardCellOutlineMetrics(cellSize: number) {
  const strokeWidth = boardStrokeWidths.boundary;
  const maxInset = Math.max(0, Math.floor(cellSize / 4));
  const inset = Math.min(
    maxInset,
    Math.max(
      boardLayoutMetrics.outlinedCellMinInset,
      Math.floor(cellSize * boardLayoutMetrics.outlinedCellInsetRatio)
    )
  );
  return { inset, strokeWidth } as const;
}

/** CSS decoration used by interactive and replay cells. */
export function getBoardCellOutlineStyle(cellSize: number) {
  const { inset, strokeWidth } = getBoardCellOutlineMetrics(cellSize);
  return {
    position: 'absolute',
    inset: `${inset}px`,
    boxSizing: 'border-box',
    border: `${strokeWidth}px solid ${woodBoardTheme.accentBorder}`,
    pointerEvents: 'none',
  } as const;
}

/** SVG decoration with the same painted bounds as getBoardCellOutlineStyle. */
export function getBoardCellOutlineRect(
  x: number,
  y: number,
  width: number,
  height: number,
  cellSize: number
) {
  const { inset, strokeWidth } = getBoardCellOutlineMetrics(cellSize);
  const xInset = Math.min(inset, Math.max(0, width / 4));
  const yInset = Math.min(inset, Math.max(0, height / 4));
  return {
    x: x + xInset + strokeWidth / 2,
    y: y + yInset + strokeWidth / 2,
    width: Math.max(0, width - xInset * 2 - strokeWidth),
    height: Math.max(0, height - yInset * 2 - strokeWidth),
    fill: 'none',
    stroke: woodBoardTheme.accentBorder,
    strokeWidth,
  } as const;
}

export function getBoardFrameStyle(borderWidth = commonBoardChrome.border) {
  return {
    background: woodBoardTheme.frame,
    border: `${borderWidth}px solid ${woodBoardTheme.border}`,
    boxSizing: 'border-box',
    // A fixed-cell board must keep its frame and contents at the same width.
    // Responsive sizing handles ordinary viewports; an enclosing scroll area
    // handles boards that intentionally retain a larger minimum cell size.
    // flexShrink keeps the frame from being squeezed by a flex parent while
    // its absolutely positioned contents keep the declared size.
    flexShrink: 0,
    maxWidth: 'none',
  } as const;
}

export function getOutlinedBorderStrokeWidth(strokeWidth: number, outlineExtra = 2) {
  return strokeWidth + outlineExtra;
}

export const commonBoardChrome = {
  padding: 10,
  border: 4,
  minCellSize: 32,
  maxDesktopCellSize: 58,
  defaultMaxMobileCellSize: 46,
  desktopViewportPadding: 96,
  mobileViewportPadding: 48,
  mobileBreakpoint: 640,
} as const;

/** Public aggregate used by tooling and future renderers as the single style API. */
export const boardStyleLibrary = {
  colors: woodBoardTheme,
  typography: boardTypography,
  classNames: boardClassNames,
  strokes: boardStrokeWidths,
  geometry: boardGeometry,
  controls: boardControlMetrics,
  layout: boardLayoutMetrics,
  chrome: commonBoardChrome,
} as const;

interface ResponsiveCellSizeOptions {
  fixedCellSize?: number;
  viewportWidth: number;
  width: number;
  columnGap?: number;
  extraWidth?: number;
  /** Number of horizontal clue gutters that consume board width. */
  outsideClueSides?: number;
  /**
   * Additional full-cell-width columns consumed by stacked outside clue
   * gutters (their clue size always equals the cell size).
   */
  outsideClueStackColumns?: number;
  /** Largest clue width (in digits) used when sizing a responsive board. */
  outsideClueMaxDigits?: number;
  /** Optional puzzle-specific cap for the responsive cell size. */
  maxCellSize?: number;
  minCellSize?: number;
  /** Treat viewportWidth as the actual board container width (no page gutters). */
  containerWidth?: boolean;
}

export function getResponsiveCellSize({
  fixedCellSize,
  viewportWidth,
  width,
  columnGap = 0,
  extraWidth = 0,
  outsideClueSides = 0,
  outsideClueStackColumns = 0,
  outsideClueMaxDigits = 1,
  maxCellSize,
  minCellSize = commonBoardChrome.minCellSize,
  containerWidth = false,
}: ResponsiveCellSizeOptions) {
  // A puzzle-specific maximum is a hard visual contract, including when a
  // caller supplies a nominal fixed size. This keeps any future specialised
  // board from silently exceeding its declared visual scale.
  if (fixedCellSize) return Math.min(fixedCellSize, maxCellSize ?? Number.POSITIVE_INFINITY);

  const mobile = viewportWidth < commonBoardChrome.mobileBreakpoint;
  const horizontalViewportPadding = containerWidth
    ? 0
    : mobile
      ? commonBoardChrome.mobileViewportPadding
      : commonBoardChrome.desktopViewportPadding;
  const boardChromeWidth = (commonBoardChrome.padding + commonBoardChrome.border) * 2;
  const maxAvailableWidth = Math.max(
    0,
    viewportWidth - horizontalViewportPadding - boardChromeWidth - extraWidth
  );
  const cellGapWidth = (width - 1) * columnGap;
  const constrainedColumnCount = width + outsideClueSides + outsideClueStackColumns;
  const effectiveMinCellSize = containerWidth
    ? Math.min(minCellSize, Math.floor(maxAvailableWidth / Math.max(1, constrainedColumnCount)))
    : minCellSize;
  let nextSize = Math.floor((maxAvailableWidth - cellGapWidth) / (width + outsideClueStackColumns));

  // Gutters scale with the cell size. Iterate to solve the small dependency
  // instead of reserving a hard-coded 24px and allowing mobile boards to
  // overflow their frame.  Stacked clue columns are full cell-width columns
  // and are reserved directly.
  if (outsideClueSides > 0) {
    for (let iteration = 0; iteration < 3; iteration++) {
      const clueGutter = getBoardOutsideClueGutter(nextSize, outsideClueMaxDigits);
      nextSize = Math.floor(
        (maxAvailableWidth - outsideClueSides * clueGutter - cellGapWidth) / (width + outsideClueStackColumns)
      );
    }
  }

  return Math.max(
    effectiveMinCellSize,
    Math.min(
      Math.min(
        mobile ? commonBoardChrome.defaultMaxMobileCellSize : commonBoardChrome.maxDesktopCellSize,
        maxCellSize ?? Number.POSITIVE_INFINITY
      ),
      nextSize
    )
  );
}
