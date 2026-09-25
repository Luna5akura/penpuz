import type { PuzzleData, PuzzleExample } from './types';

/**
 * Build the playable puzzle data carried by a template example so the
 * example can be solved with the type's regular board.  Answer-only fields
 * (correctSolution, loopEdges, …) are deliberately dropped.
 */
export function buildExamplePuzzleData(example: PuzzleExample): PuzzleData {
  switch (example.puzzleType) {
    case 'nurikabe':
      return { type: 'nurikabe', width: example.width, height: example.height, clues: example.clues };
    case 'fillomino':
      return { type: 'fillomino', width: example.width, height: example.height, clues: example.cluesGrid };
    case 'yajilin':
      return { type: 'yajilin', width: example.width, height: example.height, clues: example.clues };
    case 'koburin':
      return { type: 'koburin', width: example.width, height: example.height, clues: example.clues };
    case 'neighbor':
      return { type: 'neighbor', width: example.width, height: example.height, givens: example.givens, grayCells: example.grayCells };
    case 'sky-neighbor':
      return {
        type: 'sky-neighbor',
        width: example.width,
        height: example.height,
        givens: example.givens,
        grayCells: example.grayCells,
        clues: example.clues,
        ...(example.outsideGrayCells ? { outsideGrayCells: example.outsideGrayCells } : {}),
      };
    case 'starbattle':
      return { type: 'starbattle', width: example.width, height: example.height, starsPerUnit: example.starsPerUnit, regionIds: example.regionIds };
    case 'heyawake':
      return { type: 'heyawake', width: example.width, height: example.height, regionIds: example.regionIds, clues: example.clues };
    case 'aqre':
      return { type: 'aqre', width: example.width, height: example.height, regionIds: example.regionIds, clues: example.clues };
    case 'mintonette':
      return { type: 'mintonette', width: example.width, height: example.height, clues: example.clues };
    case 'nikoji':
      return { type: 'nikoji', width: example.width, height: example.height, letters: example.letters };
    case 'akari':
      return { type: 'akari', width: example.width, height: example.height, cells: example.cells };
    case 'kurarin':
      return { type: 'kurarin', width: example.width, height: example.height, clues: example.clues };
    case 'walkwalk':
      return { type: 'walkwalk', width: example.width, height: example.height, regionIds: example.regionIds, clues: example.clues };
    case 'slither':
      return { type: 'slither', width: example.width, height: example.height, clues: example.clues };
    case 'lits':
      return { type: 'lits', width: example.width, height: example.height, regionIds: example.regionIds };
    case 'lakes':
      return { type: 'lakes', width: example.width, height: example.height, clues: example.clues };
    case 'tapa':
      return { type: 'tapa', width: example.width, height: example.height, clues: example.clues };
    case 'magic-summer':
      return {
        type: 'magic-summer',
        width: example.width,
        height: example.height,
        numbers: example.numbers,
        rowSums: example.rowSums,
        columnSums: example.columnSums,
        cells: example.cells,
        ...(example.clues ? { clues: example.clues } : {}),
      };
    case 'skyscrapers':
      return {
        type: 'skyscrapers',
        width: example.width,
        height: example.height,
        numbers: example.numbers,
        clues: example.clues,
        givens: Array.from({ length: example.height }, () => Array<number | null>(example.width).fill(null)),
      };
    case 'battleship':
      return {
        type: 'battleship',
        width: example.width,
        height: example.height,
        columnClues: example.columnClues,
        rowClues: example.rowClues,
        cellClues: example.cellClues,
        fleet: example.fleet,
      };
    case 'domino-search':
      return { type: 'domino-search', width: example.width, height: example.height, numbers: example.numbers, dominoes: example.dominoes };
    case 'snail':
      return {
        type: 'snail',
        width: example.width,
        height: example.height,
        numbers: example.numbers,
        cells: example.cells,
        ...(example.start ? { start: example.start } : {}),
      };
    case 'slovak-sums':
      return { type: 'slovak-sums', width: example.width, height: example.height, numbers: example.numbers, cells: example.cells };
    case 'kakuro':
      return { type: 'kakuro', width: example.width, height: example.height, cells: example.cells, topClues: example.topClues, leftClues: example.leftClues };
    case 'wolvesandsheepfences':
      return { type: 'wolvesandsheepfences', width: example.width, height: example.height, clues: example.clues };
    case 'shape-minesweeper':
      return { type: 'shape-minesweeper', width: example.width, height: example.height, clues: example.clues, shapes: example.shapes };
    case 'cave':
      return { type: 'cave', width: example.width, height: example.height, clues: example.clues };
    case 'japanese-arrows':
      return { type: 'japanese-arrows', width: example.width, height: example.height, arrows: example.arrows, clues: example.clues };
    case 'four-winds-with-parks':
      return { type: 'four-winds-with-parks', width: example.width, height: example.height, clues: example.clues };
    case 'fourwinds':
      return { type: 'fourwinds', width: example.width, height: example.height, clues: example.clues };
    case 'consecutive-kakuro':
      return {
        type: 'consecutive-kakuro',
        width: example.width,
        height: example.height,
        cells: example.cells,
        topClues: example.topClues,
        leftClues: example.leftClues,
        horizontalBars: example.horizontalBars,
        verticalBars: example.verticalBars,
      };
    case 'japanese-sums-with-zeroes':
      return { type: 'japanese-sums-with-zeroes', width: example.width, height: example.height, maxDigit: example.maxDigit, clues: example.clues };
    case 'abc-box':
      return { type: 'abc-box', width: example.width, height: example.height, givens: example.givens, clues: example.clues };
    case 'magnets':
      return {
        type: 'magnets',
        width: example.width,
        height: example.height,
        regions: example.regions,
        topClues: example.topClues,
        topMinusClues: example.topMinusClues,
        leftClues: example.leftClues,
        leftPlusClues: example.leftPlusClues,
        givens: example.givens,
      };
    case 'pills':
      return {
        type: 'pills',
        width: example.width,
        height: example.height,
        dots: example.dots,
        topClues: example.topClues,
        leftClues: example.leftClues,
        pillValues: example.pillValues,
      };
    case 'place-by-product':
      return {
        type: 'place-by-product',
        width: example.width,
        height: example.height,
        rowClues: example.rowClues,
        colClues: example.colClues,
        pieces: example.pieces,
        givens: example.givens,
      };
    case 'masyu':
      return {
        type: 'masyu',
        width: example.width,
        height: example.height,
        cells: example.cells,
      };
    default: {
      const unreachable: never = example;
      throw new Error(`Unhandled example type: ${String(unreachable)}`);
    }
  }
}
