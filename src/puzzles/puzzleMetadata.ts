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
    case 'magic-summer':
      return [
        isZh ? `${puzzle.numbers.length} 个可填数码` : `${puzzle.numbers.length} available digits`,
        isZh
          ? `${puzzle.rowSums.filter((value) => value !== null).length + puzzle.columnSums.filter((value) => value !== null).length} 个外侧和数`
          : `${puzzle.rowSums.filter((value) => value !== null).length + puzzle.columnSums.filter((value) => value !== null).length} outside sums`,
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
