import type { Locale } from '@/i18n/types';
import { getPuzzleTemplate } from './registry';
import type { PuzzleData } from './types';

function matrixCount<T>(matrix: T[][], predicate: (value: T) => boolean) {
  return matrix.reduce((total, row) => total + row.filter(predicate).length, 0);
}

function regionCount(regionIds: number[][]) {
  const ids = new Set<number>();
  regionIds.forEach((row) => {
    row.forEach((id) => {
      if (id >= 0) ids.add(id);
    });
  });
  return ids.size;
}

function getPuzzleSizeText(puzzle: PuzzleData) {
  return `${puzzle.width}×${puzzle.height}`;
}

function getPuzzleFactTexts(puzzle: PuzzleData, locale: Locale) {
  const isZh = locale === 'zh-CN';

  switch (puzzle.type) {
    case 'nurikabe':
      return [isZh ? `${puzzle.clues.length} 个数字线索` : `${puzzle.clues.length} clues`];
    case 'fillomino':
      return [isZh
        ? `${matrixCount(puzzle.clues, (value) => value !== null)} 个给定数字`
        : `${matrixCount(puzzle.clues, (value) => value !== null)} givens`];
    case 'yajilin':
      return [isZh ? `${puzzle.clues.length} 个方向线索` : `${puzzle.clues.length} arrow clues`];
    case 'koburin':
      return [isZh ? `${puzzle.clues.length} 个相邻黑格数量线索` : `${puzzle.clues.length} neighbour-count clues`];
    case 'neighbor': {
      const givenCount = matrixCount(puzzle.givens, (value) => value !== null);
      const grayCount = matrixCount(puzzle.grayCells, (value) => value);
      return [
        isZh ? `${givenCount} 个预填数字` : `${givenCount} givens`,
        isZh ? `${grayCount} 个灰色格` : `${grayCount} gray cells`,
      ];
    }
    case 'sky-neighbor': {
      const givenCount = matrixCount(puzzle.givens, (value) => value !== null);
      const grayCount = matrixCount(puzzle.grayCells, (value) => value) +
        (puzzle.outsideGrayCells
          ? Object.values(puzzle.outsideGrayCells).reduce((total, side) => total + side.filter(Boolean).length, 0)
          : 0);
      const clueCount = Object.values(puzzle.clues).reduce(
        (total, side) => total + side.filter((value: number | null) => value !== null).length,
        0
      );
      return [
        isZh ? `${givenCount} 个预填数字` : `${givenCount} givens`,
        isZh ? `${clueCount} 个摩天楼线索，${grayCount} 个灰色格` : `${clueCount} skyscraper clues, ${grayCount} gray cells`,
      ];
    }
    case 'starbattle':
      return [
        isZh ? `每行每列每区 ${puzzle.starsPerUnit} 颗星` : `${puzzle.starsPerUnit} stars per row, column and region`,
        isZh ? `${regionCount(puzzle.regionIds)} 个区域` : `${regionCount(puzzle.regionIds)} regions`,
      ];
    case 'heyawake':
    case 'aqre':
      return [
        isZh ? `${regionCount(puzzle.regionIds)} 个区域` : `${regionCount(puzzle.regionIds)} regions`,
        isZh ? `${puzzle.clues.length} 个数字线索` : `${puzzle.clues.length} clues`,
      ];
    case 'mintonette':
      return [isZh ? `${puzzle.clues.length} 个圆形线索` : `${puzzle.clues.length} circle clues`];
    case 'nikoji':
      return [isZh
        ? `${matrixCount(puzzle.letters, (value) => value !== null)} 个字母线索`
        : `${matrixCount(puzzle.letters, (value) => value !== null)} letter clues`];
    case 'akari':
      return [isZh
        ? `${matrixCount(puzzle.cells, (value) => value !== null)} 个黑格或数字线索`
        : `${matrixCount(puzzle.cells, (value) => value !== null)} black cells or numbered clues`];
    case 'kurarin':
      return [isZh ? `${puzzle.clues.length} 个圆点线索` : `${puzzle.clues.length} dot clues`];
    case 'walkwalk':
      return [
        isZh ? `${regionCount(puzzle.regionIds)} 个区域` : `${regionCount(puzzle.regionIds)} regions`,
        isZh ? `${puzzle.clues.length} 个数字线索` : `${puzzle.clues.length} clues`,
      ];
    case 'slither':
      return [isZh
        ? `${matrixCount(puzzle.clues, (value) => value !== null)} 个数字线索`
        : `${matrixCount(puzzle.clues, (value) => value !== null)} clues`];
    case 'lits':
      return [isZh ? `${regionCount(puzzle.regionIds)} 个区域` : `${regionCount(puzzle.regionIds)} regions`];
    case 'lakes':
      return [isZh ? `${puzzle.clues.length} 个数字线索` : `${puzzle.clues.length} clues`];
    case 'tapa':
      return [isZh
        ? `${matrixCount(puzzle.clues, (value) => value !== null)} 个数字线索`
        : `${matrixCount(puzzle.clues, (value) => value !== null)} clues`];
    case 'magic-summer': {
      const magicSummerClues = puzzle.clues
        ? Object.values(puzzle.clues).flat()
        : [...puzzle.rowSums, ...puzzle.columnSums];
      return [
        isZh ? `${puzzle.numbers.length} 个可填数码` : `${puzzle.numbers.length} available digits`,
        isZh
          ? `${magicSummerClues.filter((value) => value !== null).length} 个外侧和数`
          : `${magicSummerClues.filter((value) => value !== null).length} outside sums`,
      ];
    }
    case 'skyscrapers':
      return [
        isZh ? `${puzzle.numbers.length} 种楼高` : `${puzzle.numbers.length} building heights`,
        isZh
          ? `${Object.values(puzzle.clues).flat().filter((value) => value !== null).length} 个外部线索`
          : `${Object.values(puzzle.clues).flat().filter((value) => value !== null).length} outside clues`,
      ];
    case 'battleship':
      return [
        isZh ? `${puzzle.fleet.length} 艘船` : `${puzzle.fleet.length} ships`,
        isZh
          ? `${puzzle.cellClues.length} 个盘内线索`
          : `${puzzle.cellClues.length} in-grid clues`,
      ];
    case 'domino-search':
      return [
        isZh ? `${puzzle.dominoes.length} 个待找骨牌` : `${puzzle.dominoes.length} dominoes to find`,
        isZh
          ? `${matrixCount(puzzle.numbers, (value) => value !== null)} 个盘面数字`
          : `${matrixCount(puzzle.numbers, (value) => value !== null)} grid numbers`,
      ];
    case 'snail':
      return [
        isZh ? `${puzzle.numbers.length} 个可填数字` : `${puzzle.numbers.length} available numbers`,
        isZh
          ? `${matrixCount(puzzle.cells, (value) => value === 'block')} 个黑格`
          : `${matrixCount(puzzle.cells, (value) => value === 'block')} blocks`,
      ];
    case 'slovak-sums':
      return [
        isZh ? `${puzzle.numbers.length} 个可填数字` : `${puzzle.numbers.length} available numbers`,
        isZh
          ? `${matrixCount(puzzle.cells, (value) => value !== null)} 个和数线索`
          : `${matrixCount(puzzle.cells, (value) => value !== null)} sum clues`,
      ];
    case 'kakuro':
      return [
        isZh
          ? `${matrixCount(puzzle.cells, (value) => value === null)} 个待填白格`
          : `${matrixCount(puzzle.cells, (value) => value === null)} white cells to fill`,
        isZh
          ? `${matrixCount(puzzle.cells, (value) => value !== null)} 个和数线索格`
          : `${matrixCount(puzzle.cells, (value) => value !== null)} clue cells`,
      ];
    case 'wolvesandsheepfences':
      return [
        isZh
          ? `${matrixCount(puzzle.clues, (value) => typeof value === 'number')} 个数字线索`
          : `${matrixCount(puzzle.clues, (value) => typeof value === 'number')} number clues`,
        isZh
          ? `${matrixCount(puzzle.clues, (value) => value === 'sheep' || value === 'wolf')} 个动物线索`
          : `${matrixCount(puzzle.clues, (value) => value === 'sheep' || value === 'wolf')} animal clues`,
      ];
    case 'shape-minesweeper':
      return [
        isZh ? `${puzzle.shapes.length} 个待放形状` : `${puzzle.shapes.length} shapes to place`,
        isZh
          ? `${matrixCount(puzzle.clues, (value) => value !== null)} 个扫雷线索`
          : `${matrixCount(puzzle.clues, (value) => value !== null)} minesweeper clues`,
      ];
    case 'cave':
      return [isZh
        ? `${matrixCount(puzzle.clues, (value) => value !== null)} 个可见格线索`
        : `${matrixCount(puzzle.clues, (value) => value !== null)} visibility clues`];
    case 'japanese-sums-with-zeroes':
      return [isZh ? '填入 0–6 的数字' : 'digits 0–6'];
    case 'abc-box':
      return [isZh ? 'A、B、C 三种字母' : 'letters A, B and C'];
    case 'japanese-arrows':
      return [isZh
        ? `${matrixCount(puzzle.clues, (value) => value !== null)} 个箭头线索`
        : `${matrixCount(puzzle.clues, (value) => value !== null)} arrow clues`];
    case 'four-winds-with-parks':
      return [isZh
        ? `${matrixCount(puzzle.clues, (value) => value !== null)} 个风向数字线索`
        : `${matrixCount(puzzle.clues, (value) => value !== null)} wind clues`];
    case 'consecutive-kakuro':
      return [isZh
        ? `${matrixCount(puzzle.cells, (value) => value === null)} 个待填白格`
        : `${matrixCount(puzzle.cells, (value) => value === null)} white cells to fill`];
    default:
      return [];
  }
}

export function getPuzzleMetadata(puzzle: PuzzleData, locale: Locale) {
  const template = getPuzzleTemplate(puzzle.type);
  const name = template.name[locale];
  const alternateName = template.name[locale === 'zh-CN' ? 'en' : 'zh-CN'];
  const size = getPuzzleSizeText(puzzle);
  const facts = getPuzzleFactTexts(puzzle, locale);
  const factText = facts.length > 0
    ? locale === 'zh-CN'
      ? `，${facts.join('，')}`
      : `, ${facts.join(', ')}`
    : '';

  return {
    name,
    alternateName,
    size,
    title: `${name} ${size}`,
    description: locale === 'zh-CN'
      ? `${name}（${alternateName}）${size} 纸笔题目${factText}。`
      : `${name} (${alternateName}) ${size} pencil puzzle${factText}.`,
  };
}
