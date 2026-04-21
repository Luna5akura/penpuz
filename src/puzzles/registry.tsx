import type { ReactElement } from 'react';
import NurikabeBoard from './Nurikabe/Nurikabe';
import FillominoBoard from './Fillomino/Fillomino';
import YajilinBoard from './Yajilin/Yajilin';
import StarbattleBoard from './Starbattle/Starbattle';
import HeyawakeBoard from './Heyawake/Heyawake';
import AqreBoard from './Aqre/Aqre';
import MintonetteBoard from './Mintonette/Mintonette';
import NikojiBoard from './Nikoji/Nikoji';
import AkariBoard from './Akari/Akari';
import NurikabeExample from '../components/examples/NurikabeExample';
import FillominoExample from '../components/examples/FillominoExample';
import YajilinExample from '../components/examples/YajilinExample';
import StarbattleExample from '../components/examples/StarbattleExample';
import HeyawakeExample from '../components/examples/HeyawakeExample';
import AqreExample from '../components/examples/AqreExample';
import MintonetteExample from '../components/examples/MintonetteExample';
import NikojiExample from '../components/examples/NikojiExample';
import AkariExample from '../components/examples/AkariExample';
import { parsePuzzLink } from './Nurikabe/utils';
import { parseFillominoLink } from './Fillomino/utils';
import { parseYajilinLink } from './Yajilin/utils';
import { parseStarbattleLink } from './Starbattle/utils';
import { parseHeyawakeLink } from './Heyawake/utils';
import { parseAqreLink } from './Aqre/utils';
import { parseMintonetteLink } from './Mintonette/utils';
import { parseNikojiLink } from './Nikoji/utils';
import { parseAkariLink } from './Akari/utils';
import type {
  AqrePuzzleData,
  AkariPuzzleData,
  FillominoPuzzleData,
  HeyawakePuzzleData,
  MintonettePuzzleData,
  NikojiPuzzleData,
  NurikabePuzzleData,
  PuzzleData,
  PuzzleEntry,
  PuzzleTemplate,
  PuzzleType,
  StarbattlePuzzleData,
  YajilinPuzzleData,
} from './types';
import type { Locale } from '@/i18n/types';

interface PuzzleBoardProps<TPuzzle extends PuzzleData> {
  puzzle: TPuzzle;
  startTime: number;
  resetToken: number;
  onComplete: (time: number) => void;
  initialSnapshot?: unknown;
  onSnapshotChange?: (snapshot: unknown) => void;
}

interface PuzzleRegistryEntry<TPuzzle extends PuzzleData> {
  parsePuzzLink: (link: string) => TPuzzle | null;
  template: PuzzleTemplate;
  renderBoard: (props: PuzzleBoardProps<TPuzzle>) => ReactElement;
  renderExample: (template: PuzzleTemplate, locale: Locale) => ReactElement;
}

type PuzzleRegistry = {
  nurikabe: PuzzleRegistryEntry<NurikabePuzzleData>;
  fillomino: PuzzleRegistryEntry<FillominoPuzzleData>;
  yajilin: PuzzleRegistryEntry<YajilinPuzzleData>;
  starbattle: PuzzleRegistryEntry<StarbattlePuzzleData>;
  heyawake: PuzzleRegistryEntry<HeyawakePuzzleData>;
  aqre: PuzzleRegistryEntry<AqrePuzzleData>;
  mintonette: PuzzleRegistryEntry<MintonettePuzzleData>;
  nikoji: PuzzleRegistryEntry<NikojiPuzzleData>;
  akari: PuzzleRegistryEntry<AkariPuzzleData>;
};

export const puzzleRegistry: PuzzleRegistry = {
  nurikabe: {
    parsePuzzLink,
    template: {
      type: 'nurikabe',
      name: {
        'zh-CN': '数墙',
        en: 'Nurikabe',
      },
      rulesTitle: {
        'zh-CN': '游戏规则',
        en: 'Rules',
      },
      rules: {
        'zh-CN': [
          '涂黑一些空格，使得所有涂黑的格子连通成一个整体，且没有全部涂黑的2×2结构。',
          '每一组连通的留白格必须恰好包含一个数字。',
          '数字表示其所在的留白的连通组格数。',
        ],
        en: [
          'Shade some cells so that all shaded cells form one connected area, and no 2×2 block is fully shaded.',
          'Each orthogonally connected white area must contain exactly one number.',
          'A number gives the size of the white area that contains it.',
        ],
      },
      exampleTitle: {
        'zh-CN': '例题（6×6）',
        en: 'Example (6×6)',
      },
      playableLabel: {
        'zh-CN': '可游玩例题',
        en: 'Playable example',
      },
      answerLabel: {
        'zh-CN': '正确答案',
        en: 'Answer',
      },
      example: {
        puzzleType: 'nurikabe',
        width: 5,
        height: 5,
        clues: [
          { row: 0, col: 0, value: '?' },
          { row: 2, col: 0, value: 3 },
          { row: 4, col: 1, value: 1 },
          { row: 3, col: 4, value: 5 },
        ],
        correctSolution: [
          [0, 0, 0, 1, 1],
          [1, 1, 1, 1, 0],
          [0, 0, 0, 1, 0],
          [1, 1, 1, 1, 0],
          [1, 0, 1, 0, 0],
        ],
      },
    },
    renderBoard: ({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange }) => (
      <NurikabeBoard
        puzzle={puzzle}
        startTime={startTime}
        resetToken={resetToken}
        onComplete={onComplete}
        initialSnapshot={initialSnapshot}
        onSnapshotChange={onSnapshotChange}
      />
    ),
    renderExample: (template, locale) => {
      const example = template.example;
      if (example.puzzleType !== 'nurikabe') {
        throw new Error('Nurikabe template example type mismatch.');
      }

      return (
        <NurikabeExample
          width={example.width}
          height={example.height}
          clues={example.clues}
          correctSolution={example.correctSolution}
          playableLabel={template.playableLabel[locale]}
          answerLabel={template.answerLabel[locale]}
        />
      );
    },
  },
  fillomino: {
    parsePuzzLink: (link) => parseFillominoLink(link),
    template: {
      type: 'fillomino',
      name: {
        'zh-CN': '码牌',
        en: 'Fillomino',
      },
      rulesTitle: {
        'zh-CN': '游戏规则',
        en: 'Rules',
      },
      rules: {
        'zh-CN': [
          '沿虚格线把盘面分成若干个区域，使得任意两个相邻的区域面积都不同。',
          '数字表示其所在区域的面积。',
        ],
        en: [
          'Divide the grid into regions along the dotted boundaries so that no two adjacent regions have the same size.',
          'A number gives the size of the region that contains it.',
        ],
      },
      exampleTitle: {
        'zh-CN': '例题（6×6）',
        en: 'Example (6×6)',
      },
      playableLabel: {
        'zh-CN': '可游玩例题',
        en: 'Playable example',
      },
      answerLabel: {
        'zh-CN': '正确答案',
        en: 'Answer',
      },
      example: {
        puzzleType: 'fillomino',
        width: 6,
        height: 6,
        cluesGrid: [
          [null, null, 4, null, null, null],
          [null, 5, 3, null, 2, null],
          [null, null, null, null, 5, 2],
          [3, 3, null, null, null, null],
          [null, 2, null, 1, 4, null],
          [null, null, null, 3, null, null],
        ],
        correctGrid: [
          [5, 5, 4, 4, 4, 4],
          [5, 5, 3, 2, 2, 1],
          [3, 5, 3, 3, 5, 2],
          [3, 3, 5, 5, 5, 2],
          [2, 2, 5, 1, 4, 4],
          [1, 3, 3, 3, 4, 4],
        ],
      },
    },
    renderBoard: ({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange }) => (
      <FillominoBoard
        puzzle={puzzle}
        startTime={startTime}
        resetToken={resetToken}
        onComplete={onComplete}
        initialSnapshot={initialSnapshot}
        onSnapshotChange={onSnapshotChange}
      />
    ),
    renderExample: (template, locale) => {
      const example = template.example;
      if (example.puzzleType !== 'fillomino') {
        throw new Error('Fillomino template example type mismatch.');
      }

      return (
        <FillominoExample
          width={example.width}
          height={example.height}
          cluesGrid={example.cluesGrid}
          correctGrid={example.correctGrid}
          playableLabel={template.playableLabel[locale]}
          answerLabel={template.answerLabel[locale]}
        />
      );
    },
  },
  yajilin: {
    parsePuzzLink: parseYajilinLink,
    template: {
      type: 'yajilin',
      name: {
        'zh-CN': '仙人指路',
        en: 'Yajilin',
      },
      rulesTitle: {
        'zh-CN': '游戏规则',
        en: 'Rules',
      },
      rules: {
        'zh-CN': [
          '涂黑一些空格，并画出一条经过所有其余非线索格子的单一回路。',
          '回路不能分叉或交叉，涂黑格之间不能正交相邻。',
          '带数字或问号的箭头格不能涂黑，也不属于回路的一部分。',
          '数字表示箭头方向上被涂黑的格子数，问号只给出方向不限定数量。',
        ],
        en: [
          'Shade some cells and draw a single loop through all remaining non-clue cells.',
          'The loop cannot branch or cross, and shaded cells cannot touch orthogonally.',
          'Arrow cells with a number or question mark cannot be shaded and are not part of the loop.',
          'A number gives the count of shaded cells in the arrow direction, while a question mark gives only the direction.',
        ],
      },
      exampleTitle: {
        'zh-CN': '例题（5×5）',
        en: 'Example (5×5)',
      },
      playableLabel: {
        'zh-CN': '可游玩例题',
        en: 'Playable example',
      },
      answerLabel: {
        'zh-CN': '正确答案',
        en: 'Answer',
      },
      example: {
        puzzleType: 'yajilin',
        width: 5,
        height: 5,
        clues: [
          { row: 0, col: 0, direction: 'right', value: 2 },
          { row: 3, col: 2, direction: 'left', value: 0 },
          { row: 4, col: 0, direction: 'up', value: 1 },
        ],
        shadedCells: [
          { row: 0, col: 1 },
          { row: 0, col: 4 },
          { row: 1, col: 0 },
          { row: 2, col: 2 },
        ],
        loopEdges: [
          { r1: 0, c1: 2, r2: 0, c2: 3 },
          { r1: 1, c1: 1, r2: 1, c2: 2 },
          { r1: 1, c1: 3, r2: 1, c2: 4 },
          { r1: 2, c1: 0, r2: 2, c2: 1 },
          { r1: 2, c1: 3, r2: 2, c2: 4 },
          { r1: 3, c1: 0, r2: 3, c2: 1 },
          { r1: 3, c1: 3, r2: 3, c2: 4 },
          { r1: 4, c1: 1, r2: 4, c2: 2 },
          { r1: 4, c1: 2, r2: 4, c2: 3 },
          { r1: 4, c1: 3, r2: 4, c2: 4 },
          { r1: 0, c1: 2, r2: 1, c2: 2 },
          { r1: 0, c1: 3, r2: 1, c2: 3 },
          { r1: 1, c1: 1, r2: 2, c2: 1 },
          { r1: 1, c1: 4, r2: 2, c2: 4 },
          { r1: 2, c1: 0, r2: 3, c2: 0 },
          { r1: 2, c1: 3, r2: 3, c2: 3 },
          { r1: 3, c1: 1, r2: 4, c2: 1 },
          { r1: 3, c1: 4, r2: 4, c2: 4 },
        ],
      },
    },
    renderBoard: ({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange }) => (
      <YajilinBoard
        puzzle={puzzle}
        startTime={startTime}
        resetToken={resetToken}
        onComplete={onComplete}
        initialSnapshot={initialSnapshot}
        onSnapshotChange={onSnapshotChange}
      />
    ),
    renderExample: (template, locale) => {
      const example = template.example;
      if (example.puzzleType !== 'yajilin') {
        throw new Error('Yajilin template example type mismatch.');
      }

      return (
        <YajilinExample
          width={example.width}
          height={example.height}
          clues={example.clues}
          shadedCells={example.shadedCells}
          loopEdges={example.loopEdges}
          crossedEdges={example.crossedEdges}
          playableLabel={template.playableLabel[locale]}
          answerLabel={template.answerLabel[locale]}
        />
      );
    },
  },
  starbattle: {
    parsePuzzLink: parseStarbattleLink,
    template: {
      type: 'starbattle',
      name: {
        'zh-CN': '星战',
        en: 'Star Battle',
      },
      rulesTitle: {
        'zh-CN': '游戏规则',
        en: 'Rules',
      },
      rules: {
        'zh-CN': [
          '在一些空格中放入星星，且任意两个星星不能横向、纵向或对角相邻。',
          '右上角的数字表示每一行、每一列和每一个粗边框区域中都必须恰好放入相同数量的星星。',
        ],
        en: [
          'Place stars in some cells so that no two stars touch horizontally, vertically, or diagonally.',
          'The number in the upper-right means each row, each column, and each bold-bordered region must contain exactly that many stars.',
        ],
      },
      exampleTitle: {
        'zh-CN': '例题（4×4）',
        en: 'Example (4×4)',
      },
      playableLabel: {
        'zh-CN': '可游玩例题',
        en: 'Playable example',
      },
      answerLabel: {
        'zh-CN': '正确答案',
        en: 'Answer',
      },
      example: {
        puzzleType: 'starbattle',
        width: 5,
        height: 5,
        starsPerUnit: 1,
        regionIds: [
          [0, 0, 0, 0, 1],
          [0, 0, 2, 2, 2],
          [3, 2, 2, 2, 2],
          [3, 2, 2, 4, 4],
          [3, 3, 4, 4, 4],
        ],
        starCells: [
          { row: 0, col: 4 },
          { row: 1, col: 1 },
          { row: 2, col: 3 },
          { row: 3, col: 0 },
          { row: 4, col: 2 },
        ],
      },
    },
    renderBoard: ({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange }) => (
      <StarbattleBoard
        puzzle={puzzle}
        startTime={startTime}
        resetToken={resetToken}
        onComplete={onComplete}
        initialSnapshot={initialSnapshot}
        onSnapshotChange={onSnapshotChange}
      />
    ),
    renderExample: (template, locale) => {
      const example = template.example;
      if (example.puzzleType !== 'starbattle') {
        throw new Error('Starbattle template example type mismatch.');
      }

      return (
        <StarbattleExample
          type="starbattle"
          width={example.width}
          height={example.height}
          starsPerUnit={example.starsPerUnit}
          regionIds={example.regionIds}
          starCells={example.starCells}
          playableLabel={template.playableLabel[locale]}
          answerLabel={template.answerLabel[locale]}
        />
      );
    },
  },
  heyawake: {
    parsePuzzLink: parseHeyawakeLink,
    template: {
      type: 'heyawake',
      name: {
        'zh-CN': '数间',
        en: 'Heyawake',
      },
      rulesTitle: {
        'zh-CN': '游戏规则',
        en: 'Rules',
      },
      rules: {
        'zh-CN': [
          '盘面被粗边框分成若干区域。涂黑一些格子，且任意两个黑格不能横向或纵向相邻。',
          '带数字的区域中，数字表示该区域内恰好要涂黑多少格。',
          '任意一段连续的横向或纵向留白线段，都不能穿过两个或以上的区域边界。',
          '所有留白格必须正交连成一个整体。',
        ],
        en: [
          'The board is divided into rooms. Shade some cells, and shaded cells cannot touch horizontally or vertically.',
          'In a numbered room, the number gives the total count of shaded cells in that room.',
          'No horizontal or vertical run of unshaded cells may pass through two or more room borders.',
          'All unshaded cells on the board must form one orthogonally connected area.',
        ],
      },
      exampleTitle: {
        'zh-CN': '例题（5×5）',
        en: 'Example (5×5)',
      },
      playableLabel: {
        'zh-CN': '可游玩例题',
        en: 'Playable example',
      },
      answerLabel: {
        'zh-CN': '正确答案',
        en: 'Answer',
      },
      example: {
        puzzleType: 'heyawake',
        width: 5,
        height: 5,
        regionIds: [
          [0, 0, 0, 1, 1],
          [2, 2, 3, 1, 1],
          [2, 2, 3, 1, 1],
          [2, 2, 3, 4, 4],
          [5, 5, 5, 4, 4],
        ],
        clues: [
          { row: 0, col: 0, value: 2 },
          { row: 1, col: 0, value: 0 },
          { row: 4, col: 0, value: 1 },
        ],
        correctSolution: [
          [1, 0, 1, 0, 0],
          [0, 0, 0, 1, 0],
          [0, 0, 1, 0, 0],
          [0, 0, 0, 1, 0],
          [0, 1, 0, 0, 0],
        ],
      },
    },
    renderBoard: ({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange }) => (
      <HeyawakeBoard
        puzzle={puzzle}
        startTime={startTime}
        resetToken={resetToken}
        onComplete={onComplete}
        initialSnapshot={initialSnapshot}
        onSnapshotChange={onSnapshotChange}
      />
    ),
    renderExample: (template, locale) => {
      const example = template.example;
      if (example.puzzleType !== 'heyawake') {
        throw new Error('Heyawake template example type mismatch.');
      }

      return (
        <HeyawakeExample
          width={example.width}
          height={example.height}
          regionIds={example.regionIds}
          clues={example.clues}
          correctSolution={example.correctSolution}
          playableLabel={template.playableLabel[locale]}
          answerLabel={template.answerLabel[locale]}
        />
      );
    },
  },
  aqre: {
    parsePuzzLink: parseAqreLink,
    template: {
      type: 'aqre',
      name: {
        'zh-CN': '黑白无四',
        en: 'Aqre',
      },
      rulesTitle: {
        'zh-CN': '游戏规则',
        en: 'Rules',
      },
      rules: {
        'zh-CN': [
          '盘面被粗边框分成若干区域。涂黑一些格子。',
          '带数字的区域中，数字表示该区域内恰好要涂黑多少格。',
          '横向或纵向都不能出现连续4格或以上同为黑格，或同为留白格。',
          '所有黑格必须正交连成一个整体。',
        ],
        en: [
          'The board is divided into rooms. Shade some cells on the board.',
          'In a numbered room, the number gives the total count of shaded cells in that room.',
          'There may not be a horizontal or vertical run of 4 or more consecutive shaded cells or 4 or more consecutive unshaded cells.',
          'All shaded cells on the board must form one orthogonally connected area.',
        ],
      },
      exampleTitle: {
        'zh-CN': '例题（5×5）',
        en: 'Example (5×5)',
      },
      playableLabel: {
        'zh-CN': '可游玩例题',
        en: 'Playable example',
      },
      answerLabel: {
        'zh-CN': '正确答案',
        en: 'Answer',
      },
      example: {
        puzzleType: 'aqre',
        width: 6,
        height: 6,
        regionIds: [
          [0, 1, 1, 1, 2, 2],
          [0, 0, 1, 1, 1, 3],
          [0, 0, 4, 4, 3, 3],
          [5, 0, 4, 4, 3, 3],
          [5, 6, 6, 6, 3, 7],
          [6, 6, 6, 8, 8, 8],
        ],
        clues: [
          { row: 0, col: 0, value: 6 },
          { row: 0, col: 1, value: 0 },
          { row: 1, col: 5, value: 4 },
          { row: 2, col: 2, value: 3 },
          { row: 4, col: 1, value: 4 },
          { row: 5, col: 3, value: 0 },
        ],
        correctSolution: [
          [1, 0, 0, 0, 1, 1],
          [1, 1, 0, 0, 0, 1],
          [1, 1, 0, 1, 1, 1],
          [0, 1, 1, 1, 0, 0],
          [0, 0, 1, 1, 1, 0],
          [0, 1, 1, 0, 0, 0],
        ],
      },
    },
    renderBoard: ({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange }) => (
      <AqreBoard
        puzzle={puzzle}
        startTime={startTime}
        resetToken={resetToken}
        onComplete={onComplete}
        initialSnapshot={initialSnapshot}
        onSnapshotChange={onSnapshotChange}
      />
    ),
    renderExample: (template, locale) => {
      const example = template.example;
      if (example.puzzleType !== 'aqre') {
        throw new Error('Aqre template example type mismatch.');
      }

      return (
        <AqreExample
          width={example.width}
          height={example.height}
          regionIds={example.regionIds}
          clues={example.clues}
          correctSolution={example.correctSolution}
          playableLabel={template.playableLabel[locale]}
          answerLabel={template.answerLabel[locale]}
        />
      );
    },
  },
  mintonette: {
    parsePuzzLink: parseMintonetteLink,
    template: {
      type: 'mintonette',
      name: {
        'zh-CN': '数弯',
        en: 'Mintonette',
      },
      rulesTitle: {
        'zh-CN': '游戏规则',
        en: 'Rules',
      },
      rules: {
        'zh-CN': [
          '在圆圈之间画线，把所有圆圈两两配对。',
          '线段之间不能交叉，也不能重叠。',
          '带数字的圆圈表示这条线到达另一端之前必须拐弯的次数；没有数字的圆圈可以配任意拐弯次数。',
          '盘面上的每一个格子都必须被某一条线使用。',
        ],
        en: [
          'Draw lines between circles to form pairs.',
          'Lines cannot cross or overlap each other.',
          'A number indicates the amount of turns the line must take before reaching the end. Circles without numbers can be used as any number.',
          'All cells must be used by a line.',
        ],
      },
      exampleTitle: {
        'zh-CN': '例题（4×4）',
        en: 'Example (4×4)',
      },
      playableLabel: {
        'zh-CN': '可游玩例题',
        en: 'Playable example',
      },
      answerLabel: {
        'zh-CN': '正确答案',
        en: 'Answer',
      },
      example: {
        puzzleType: 'mintonette',
        width: 5,
        height: 5,
        clues: [
          { row: 0, col: 0, value: 0 },
          { row: 0, col: 2, value: 0 },
          { row: 0, col: 4, value: null },
          { row: 1, col: 4, value: null },
          { row: 2, col: 3, value: 2 },
          { row: 2, col: 4, value: null },
          { row: 3, col: 2, value: 1 },
          { row: 4, col: 0, value: 3 },
          { row: 4, col: 3, value: 2 },
          { row: 4, col: 4, value: 1 },
        ],
        solutionEdges: [
          { r1: 0, c1: 0, r2: 0, c2: 1 },
          { r1: 0, c1: 1, r2: 0, c2: 2 },
          { r1: 0, c1: 3, r2: 0, c2: 4 },
          { r1: 1, c1: 0, r2: 1, c2: 1 },
          { r1: 1, c1: 1, r2: 1, c2: 2 },
          { r1: 1, c1: 2, r2: 1, c2: 3 },
          { r1: 2, c1: 1, r2: 2, c2: 2 },
          { r1: 2, c1: 2, r2: 2, c2: 3 },
          { r1: 3, c1: 2, r2: 3, c2: 3 },
          { r1: 0, c1: 3, r2: 1, c2: 3 },
          { r1: 1, c1: 0, r2: 2, c2: 0 },
          { r1: 1, c1: 4, r2: 2, c2: 4 },
          { r1: 2, c1: 0, r2: 3, c2: 0 },
          { r1: 2, c1: 1, r2: 3, c2: 1 },
          { r1: 3, c1: 0, r2: 4, c2: 0 },
          { r1: 3, c1: 1, r2: 4, c2: 1 },
          { r1: 3, c1: 3, r2: 3, c2: 4 },
          { r1: 4, c1: 1, r2: 4, c2: 2 },
          { r1: 4, c1: 2, r2: 4, c2: 3 },
          { r1: 3, c1: 4, r2: 4, c2: 4 },
        ],
      },
    },
    renderBoard: ({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange }) => (
      <MintonetteBoard
        puzzle={puzzle}
        startTime={startTime}
        resetToken={resetToken}
        onComplete={onComplete}
        initialSnapshot={initialSnapshot}
        onSnapshotChange={onSnapshotChange}
      />
    ),
    renderExample: (template, locale) => {
      const example = template.example;
      if (example.puzzleType !== 'mintonette') {
        throw new Error('Mintonette template example type mismatch.');
      }

      return (
        <MintonetteExample
          width={example.width}
          height={example.height}
          clues={example.clues}
          solutionEdges={example.solutionEdges}
          crossedEdges={example.crossedEdges}
          playableLabel={template.playableLabel[locale]}
          answerLabel={template.answerLabel[locale]}
        />
      );
    },
  },
  nikoji: {
    parsePuzzLink: parseNikojiLink,
    template: {
      type: 'nikoji',
      name: {
        'zh-CN': '异同分割',
        en: 'NIKOJI',
      },
      rulesTitle: {
        'zh-CN': '游戏规则',
        en: 'Rules',
      },
      rules: {
        'zh-CN': [
          '用边线把盘面分成若干区域，并且每个区域必须恰好包含一个字母。',
          '相同字母所在的区域必须形状和朝向都一致，而且字母在区域中的相对位置也一致。',
          '不同字母所在的区域必须是不同形状；旋转或镜像后仍算相同形状。',
        ],
        en: [
          'Divide the grid into regions, and each region must contain exactly one letter.',
          'Regions with the same letter must be identical in shape and orientation, and the letter must appear in the same relative position.',
          'Regions with different letters must have different shapes, even after rotation or reflection.',
        ],
      },
      exampleTitle: {
        'zh-CN': '例题（5×5）',
        en: 'Example (5×5)',
      },
      playableLabel: {
        'zh-CN': '可游玩例题',
        en: 'Playable example',
      },
      answerLabel: {
        'zh-CN': '正确答案',
        en: 'Answer',
      },
      example: {
        puzzleType: 'nikoji',
        width: 4,
        height: 4,
        letters: [
          [null, null, null, 'A'],
          ['B', null, 'A', null],
          ['C', null, null, null],
          ['C', 'B', null, 'D'],
        ],
        solutionRegionIds: [
          [0, 0, 1, 1],
          [0, 2, 2, 3],
          [4, 5, 5, 3],
          [6, 5, 3, 3],
        ],
      },
    },
    renderBoard: ({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange }) => (
      <NikojiBoard
        puzzle={puzzle}
        startTime={startTime}
        resetToken={resetToken}
        onComplete={onComplete}
        initialSnapshot={initialSnapshot}
        onSnapshotChange={onSnapshotChange}
      />
    ),
    renderExample: (template, locale) => {
      const example = template.example;
      if (example.puzzleType !== 'nikoji') {
        throw new Error('Nikoji template example type mismatch.');
      }

      return (
        <NikojiExample
          width={example.width}
          height={example.height}
          letters={example.letters}
          solutionRegionIds={example.solutionRegionIds}
          playableLabel={template.playableLabel[locale]}
          answerLabel={template.answerLabel[locale]}
        />
      );
    },
  },
  akari: {
    parsePuzzLink: parseAkariLink,
    template: {
      type: 'akari',
      name: {
        'zh-CN': '美术馆',
        en: 'Akari',
      },
      rulesTitle: {
        'zh-CN': '游戏规则',
        en: 'Rules',
      },
      rules: {
        'zh-CN': [
          '在一些空白格中放置灯泡，使所有非黑格都被照亮。灯泡会照亮自己所在的格子，以及在横向或纵向上直到被黑格阻挡前的所有格子。',
          '任意两个灯泡不能互相照亮。',
          '黑格中的数字表示其上下左右四个相邻格中恰好要放入多少个灯泡。',
        ],
        en: [
          'Place lights in some empty cells so that every non-black cell is illuminated. A light illuminates its own cell and all cells seen horizontally or vertically until blocked by a black cell.',
          'Lights may not illuminate each other.',
          'A number in a black cell gives the exact number of lights in the up to four orthogonally adjacent cells.',
        ],
      },
      exampleTitle: {
        'zh-CN': '例题（5×5）',
        en: 'Example (5×5)',
      },
      playableLabel: {
        'zh-CN': '可游玩例题',
        en: 'Playable example',
      },
      answerLabel: {
        'zh-CN': '正确答案',
        en: 'Answer',
      },
      example: {
        puzzleType: 'akari',
        width: 5,
        height: 5,
        cells: [
          [0, null, null, null, 2],
          [null, null, null, null, null],
          [null, 'black', null, null, 'black'],
          [3, null, 'black', null, null],
          [null, null, null, 1, null],
        ],
        bulbCells: [
          { row: 0, col: 3 },
          { row: 1, col: 4 },
          { row: 2, col: 0 },
          { row: 2, col: 2 },
          { row: 3, col: 1 },
          { row: 4, col: 0 },
          { row: 4, col: 4 },
        ],
      },
    },
    renderBoard: ({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange }) => (
      <AkariBoard
        puzzle={puzzle}
        startTime={startTime}
        resetToken={resetToken}
        onComplete={onComplete}
        initialSnapshot={initialSnapshot}
        onSnapshotChange={onSnapshotChange}
      />
    ),
    renderExample: (template, locale) => {
      const example = template.example;
      if (example.puzzleType !== 'akari') {
        throw new Error('Akari template example type mismatch.');
      }

      return (
        <AkariExample
          width={example.width}
          height={example.height}
          cells={example.cells}
          bulbCells={example.bulbCells}
          playableLabel={template.playableLabel[locale]}
          answerLabel={template.answerLabel[locale]}
        />
      );
    },
  },
};

export function getPuzzleTemplate(type: PuzzleType): PuzzleTemplate {
  return puzzleRegistry[type].template;
}

function getPuzzleTypeFromLink(link: string): PuzzleType | null {
  let dataPart = link.includes('?') ? link.split('?')[1] : link;
  if (dataPart.startsWith('p?')) dataPart = dataPart.slice(2);

  const type = dataPart.split('/')[0];
  if (type in puzzleRegistry) {
    return type as PuzzleType;
  }

  return null;
}

export function resolvePuzzleEntry(entry: PuzzleEntry): PuzzleData | null {
  const type = getPuzzleTypeFromLink(entry.puzzLink);
  if (!type) return null;
  return puzzleRegistry[type].parsePuzzLink(entry.puzzLink);
}

export function renderPuzzleBoard(
  puzzle: PuzzleData,
  startTime: number,
  resetToken: number,
  onComplete: (time: number) => void,
  initialSnapshot?: unknown,
  onSnapshotChange?: (snapshot: unknown) => void
): ReactElement {
  const entry = puzzleRegistry[puzzle.type] as PuzzleRegistryEntry<typeof puzzle>;
  return entry.renderBoard({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange });
}

export function renderPuzzleExample(template: PuzzleTemplate, locale: Locale): ReactElement {
  return puzzleRegistry[template.type].renderExample(template, locale);
}
