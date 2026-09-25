import { getResponsiveCellSize } from './boardTheme.ts';

// Phone column ~296px (puzzle page card content on a 360px viewport)
const cases = [
  ['magnets 10x10 + 2 left stack cols', { viewportWidth: 296, width: 10, outsideClueStackColumns: 2, containerWidth: true }],
  ['japanese sums 12x12 + 2 left stacks', { viewportWidth: 296, width: 12, outsideClueStackColumns: 2, outsideClueMaxDigits: 2, containerWidth: true }],
  ['abc box 12x12 + left/right stacks', { viewportWidth: 296, width: 12, outsideClueStackColumns: 3, containerWidth: true }],
  ['skyscrapers example 4x4 + 2 gutters', { viewportWidth: 296, width: 4, outsideClueSides: 2, maxCellSize: 42, containerWidth: true }],
  ['kakuro example 6x6', { viewportWidth: 296, width: 6, maxCellSize: 42, containerWidth: true }],
  ['shape minesweeper example 8x8', { viewportWidth: 296, width: 8, maxCellSize: 42, containerWidth: true }],
  ['desktop magnets (fixed 42)', { viewportWidth: 900, width: 10, outsideClueStackColumns: 2, containerWidth: true }],
];
const chrome = (10 + 4) * 2;
for (const [name, opts] of cases) {
  const size = getResponsiveCellSize(opts);
  const widthUsed = opts.width * size + (opts.outsideClueSides ?? 0) * Math.max(24, size) + (opts.outsideClueStackColumns ?? 0) * size + chrome;
  console.log(`${name}: cell=${size} totalWidth=${widthUsed} fits=${widthUsed <= opts.viewportWidth}`);
}
