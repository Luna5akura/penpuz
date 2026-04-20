export const woodBoardTheme = {
  frame: '#d2b48c',
  border: '#3f2a1e',
  cell: '#f8f1e3',
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
    fontWeight: 500,
  } as const;
}

export function getBoardCrossFontSize(cellSize: number, ratio = 0.52, min = 18) {
  return Math.max(min, Math.floor(cellSize * ratio));
}

export function getBoardNumberFontSize(cellSize: number, ratio = 0.68, min = 22) {
  return Math.max(min, Math.floor(cellSize * ratio));
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
