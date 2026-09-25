import { getResponsiveCellSize, getBoardOutsideClueGutter, getBoardFrameDimensions, commonBoardChrome } from './boardTheme.ts';
for (const vw of [296, 326, 256, 390]) {
  const cellSize = getResponsiveCellSize({ viewportWidth: vw, width: 4, outsideClueSides: 2, outsideClueMaxDigits: 1, maxCellSize: 42, containerWidth: true });
  const gutter = getBoardOutsideClueGutter(cellSize, 1);
  const { outerWidth } = getBoardFrameDimensions(4, 4, cellSize, { outsideLeft: gutter, outsideRight: gutter, outsideTop: gutter, outsideBottom: gutter, borderWidth: commonBoardChrome.border, padding: commonBoardChrome.padding });
  console.log(`viewport ${vw}: cell=${cellSize} gutter=${gutter} frame=${outerWidth} fits=${outerWidth <= vw}`);
}
