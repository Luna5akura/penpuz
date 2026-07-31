export const woodBoardTheme = {
  frame: '#d2b48c',
  border: '#3f2a1e',
  cell: '#f8f1e3',
  whiteCell: '#fffdf6',
  clueCell: '#f5ead8',
  prefilledCell: '#f0e6d2',
  panel: '#fbf6ed',
  shaded: '#3f2a1e',
  shadedText: '#ffffff',
  marked: '#ead9bf',
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

export const boardClassNames = {
  cellText: 'font-semibold tabular-nums',
  cellTextTight: 'font-semibold tabular-nums tracking-tight',
  cellContent: 'relative flex items-center justify-center font-semibold tabular-nums',
  touchCellContent: 'relative flex items-center justify-center touch-none font-semibold tabular-nums',
} as const;

export const boardLayoutMetrics = {
  directionalClueReferenceSize: 44,
} as const;

export type BoardCellTone =
  | 'cell'
  | 'clue'
  | 'prefilled'
  | 'marked'
  | 'playerShaded'
  | 'shaded'
  | 'lit'
  | 'brightLit';

export function getBoardCellColors(tone: BoardCellTone) {
  switch (tone) {
    case 'clue':
      return { background: woodBoardTheme.clueCell, color: woodBoardTheme.border } as const;
    case 'prefilled':
      return { background: woodBoardTheme.prefilledCell, color: woodBoardTheme.border } as const;
    case 'marked':
      return { background: woodBoardTheme.marked, color: woodBoardTheme.markedText } as const;
    case 'playerShaded':
      return { background: woodBoardTheme.shaded, color: woodBoardTheme.shadedText } as const;
    case 'shaded':
      return { background: woodBoardTheme.shaded, color: woodBoardTheme.shadedText } as const;
    case 'lit':
      return { background: woodBoardTheme.lit, color: woodBoardTheme.border } as const;
    case 'brightLit':
      return { background: woodBoardTheme.brightLit, color: woodBoardTheme.border } as const;
    case 'cell':
    default:
      return { background: woodBoardTheme.cell, color: woodBoardTheme.border } as const;
  }
}

export function getInvalidBoardCellColors(kind: 'dark' | 'soft' | 'marked' = 'soft') {
  if (kind === 'dark') {
    return { background: woodBoardTheme.invalidDark, color: woodBoardTheme.shadedText } as const;
  }

  return {
    background: kind === 'marked' ? woodBoardTheme.invalidMarked : woodBoardTheme.invalidSoft,
    color: woodBoardTheme.invalidText,
  } as const;
}

export function getCrossMarkStyle(fontSize: number, color = woodBoardTheme.markedText) {
  return {
    fontSize: `${fontSize}px`,
    lineHeight: 1,
    color,
    fontWeight: boardTypography.markWeight,
  } as const;
}

export function getBoardTextStyle(cellSize: number, ratio = 0.68, min = 22, lineHeight = boardTypography.lineHeight) {
  return {
    fontSize: `${getBoardNumberFontSize(cellSize, ratio, min)}px`,
    lineHeight,
    fontWeight: boardTypography.textWeight,
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

export function getBoardCrossFontSize(cellSize: number, ratio = 0.52, min = 18) {
  return Math.max(min, Math.floor(cellSize * ratio));
}

export function getBoardNumberFontSize(cellSize: number, ratio = 0.68, min = 22) {
  return Math.max(min, Math.floor(cellSize * ratio));
}

export function getLoopLineStrokeWidth(cellSize: number, ratio = 0.08, min = 2.5) {
  return Math.max(min, Math.floor(cellSize * ratio));
}

export function getLoopCrossSize(cellSize: number, ratio = 0.07, min = 3) {
  return Math.max(min, Math.floor(cellSize * ratio));
}

export function getLoopCrossStrokeWidth() {
  return 1.6;
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

export function getBoardBoundaryStrokeWidth(cellSize: number, ratio = 0.08, min = 3) {
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
  return 3;
}

export function getBoardCircleClueDiameter(cellSize: number, ratio = 0.76, min = 28) {
  return Math.max(min, Math.floor(cellSize * ratio));
}

export function getBoardCircleClueStrokeWidth(cellSize: number, ratio = 0.065, min = 2.5) {
  return Math.max(min, Number((cellSize * ratio).toFixed(1)));
}

export function getKurarinClueColors(color: 'black' | 'white' | 'gray') {
  if (color === 'black') {
    return {
      fill: woodBoardTheme.neutralInk,
      stroke: woodBoardTheme.neutralInk,
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

export function getCellDividerStyle(width = 1, color = woodBoardTheme.gridLine) {
  return {
    boxSizing: 'border-box',
    borderRight: `${width}px solid ${color}`,
    borderBottom: `${width}px solid ${color}`,
  } as const;
}

export function getBoardFrameStyle(borderWidth = commonBoardChrome.border) {
  return {
    background: woodBoardTheme.frame,
    border: `${borderWidth}px solid ${woodBoardTheme.border}`,
    boxSizing: 'border-box',
    maxWidth: '100%',
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

interface ResponsiveCellSizeOptions {
  fixedCellSize?: number;
  viewportWidth: number;
  width: number;
  columnGap?: number;
}

export function getResponsiveCellSize({
  fixedCellSize,
  viewportWidth,
  width,
  columnGap = 0,
}: ResponsiveCellSizeOptions) {
  if (fixedCellSize) return fixedCellSize;

  const mobile = viewportWidth < commonBoardChrome.mobileBreakpoint;
  const horizontalViewportPadding = mobile
    ? commonBoardChrome.mobileViewportPadding
    : commonBoardChrome.desktopViewportPadding;
  const boardChromeWidth = (commonBoardChrome.padding + commonBoardChrome.border) * 2;
  const maxAvailableWidth = Math.max(0, viewportWidth - horizontalViewportPadding - boardChromeWidth);
  const nextSize = Math.floor((maxAvailableWidth - (width - 1) * columnGap) / width);

  return Math.max(
    commonBoardChrome.minCellSize,
    Math.min(
      mobile ? commonBoardChrome.defaultMaxMobileCellSize : commonBoardChrome.maxDesktopCellSize,
      nextSize
    )
  );
}
