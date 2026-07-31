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
import KurarinBoard from './Kurarin/Kurarin';
import WalkwalkBoard from './Walkwalk/Walkwalk';
import SlitherlinkBoard from './Slitherlink/Slitherlink';
import LitsBoard from './Lits/Lits';
import LakesBoard from './Lakes/Lakes';
import DominoSearchBoard from './DominoSearch/DominoSearch';
import MagicSnailBoard from './MagicSnail/MagicSnail';
import SlovakSumsBoard from './SlovakSums/SlovakSums';
import NurikabeExample from '../components/examples/NurikabeExample';
import FillominoExample from '../components/examples/FillominoExample';
import YajilinExample from '../components/examples/YajilinExample';
import StarbattleExample from '../components/examples/StarbattleExample';
import HeyawakeExample from '../components/examples/HeyawakeExample';
import AqreExample from '../components/examples/AqreExample';
import MintonetteExample from '../components/examples/MintonetteExample';
import NikojiExample from '../components/examples/NikojiExample';
import AkariExample from '../components/examples/AkariExample';
import KurarinExample from '../components/examples/KurarinExample';
import WalkwalkExample from '../components/examples/WalkwalkExample';
import AdditionalPuzzleExample from '../components/examples/AdditionalPuzzleExample';
import { parsePuzzLink } from './Nurikabe/utils';
import { parseFillominoLink } from './Fillomino/utils';
import { parseYajilinLink } from './Yajilin/utils';
import { parseStarbattleLink } from './Starbattle/utils';
import { parseHeyawakeLink } from './Heyawake/utils';
import { parseAqreLink } from './Aqre/utils';
import { parseMintonetteLink } from './Mintonette/utils';
import { parseNikojiLink } from './Nikoji/utils';
import { parseAkariLink } from './Akari/utils';
import { parseKurarinLink } from './Kurarin/utils';
import { parseWalkwalkLink } from './Walkwalk/utils';
import { parseSlitherlinkLink } from './Slitherlink/utils';
import { parseLitsLink } from './Lits/utils';
import { parseLakesLink } from './Lakes/utils';
import { parseDominoSearchLink } from './DominoSearch/utils';
import { parseMagicSnailLink } from './MagicSnail/utils';
import { parseSlovakSumsLink } from './SlovakSums/utils';
import { normalizePuzzLinkDataPart } from './gridUtils';
import type {
  AqrePuzzleData,
  AkariPuzzleData,
  DominoSearchPuzzleData,
  FillominoPuzzleData,
  HeyawakePuzzleData,
  LakesPuzzleData,
  LitsPuzzleData,
  MagicSnailPuzzleData,
  MintonettePuzzleData,
  NikojiPuzzleData,
  NurikabePuzzleData,
  PuzzleData,
  PuzzleEntry,
  PuzzleTemplate,
  PuzzleType,
  StarbattlePuzzleData,
  KurarinPuzzleData,
  SlitherlinkPuzzleData,
  SlovakSumsPuzzleData,
  WalkwalkPuzzleData,
  YajilinPuzzleData,
} from './types';
import type { Locale } from '@/i18n/types';

const WALKWALK_EXAMPLE_LINK = 'https://luna5akura.github.io/Atol-Solver/p.html?walkwalk/5/5/8gh20v00l1g6m7l3g';
const walkwalkExamplePuzzle = parseWalkwalkLink(WALKWALK_EXAMPLE_LINK);

if (!walkwalkExamplePuzzle) {
  throw new Error('Failed to parse the built-in Walkwalk example puzzle.');
}

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
  kurarin: PuzzleRegistryEntry<KurarinPuzzleData>;
  walkwalk: PuzzleRegistryEntry<WalkwalkPuzzleData>;
  slither: PuzzleRegistryEntry<SlitherlinkPuzzleData>;
  lits: PuzzleRegistryEntry<LitsPuzzleData>;
  lakes: PuzzleRegistryEntry<LakesPuzzleData>;
  'domino-search': PuzzleRegistryEntry<DominoSearchPuzzleData>;
  snail: PuzzleRegistryEntry<MagicSnailPuzzleData>;
  'slovak-sums': PuzzleRegistryEntry<SlovakSumsPuzzleData>;
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
  kurarin: {
    parsePuzzLink: parseKurarinLink,
    template: {
      type: 'kurarin',
      name: {
        'zh-CN': '黑暗回路',
        en: 'Kurarin',
      },
      rulesTitle: {
        'zh-CN': '规则',
        en: 'Rules',
      },
      rules: {
        'zh-CN': [
          '在棋盘中涂黑一部分格子，并在所有未涂黑格子上画出一条单一回路。',
          '回路不能分叉，也不能自交。',
          '黑色圆圈重叠的涂黑格数量要多于未涂黑格。',
          '白色圆圈重叠的未涂黑格数量要多于涂黑格。',
          '灰色圆圈重叠的涂黑格与未涂黑格数量必须相等。',
        ],
        en: [
          'Shade some cells and draw a single loop through all remaining unshaded cells.',
          'The loop cannot branch or cross itself.',
          'A black circle overlaps more shaded cells than unshaded cells.',
          'A white circle overlaps more unshaded cells than shaded cells.',
          'A gray circle overlaps the same number of shaded and unshaded cells.',
        ],
      },
      exampleTitle: {
        'zh-CN': '例题（5×5）',
        en: 'Example (5×5)',
      },
      playableLabel: {
        'zh-CN': '可游玩示例',
        en: 'Playable example',
      },
      answerLabel: {
        'zh-CN': '答案',
        en: 'Answer',
      },
      example: {
        puzzleType: 'kurarin',
        width: 5,
        height: 5,
        clues: [
          { row: 1, col: 1, color: 'black' },
          { row: 1, col: 5, color: 'gray' },
          { row: 1, col: 8, color: 'black' },
          { row: 3, col: 7, color: 'white' },
          { row: 4, col: 3, color: 'gray' },
          { row: 6, col: 7, color: 'white' },
          { row: 7, col: 0, color: 'black' },
          { row: 7, col: 2, color: 'white' },
          { row: 8, col: 5, color: 'gray' },
        ],
        shadedCells: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 0, col: 2 },
          { row: 0, col: 3 },
          { row: 0, col: 4 },
          { row: 1, col: 0 },
          { row: 1, col: 4 },
          { row: 2, col: 0 },
          { row: 2, col: 2 },
          { row: 3, col: 0 },
          { row: 4, col: 0 },
          { row: 4, col: 3 },
          { row: 4, col: 4 },
        ],
        loopEdges: [
          { r1: 1, c1: 1, r2: 1, c2: 2 },
          { r1: 1, c1: 2, r2: 1, c2: 3 },
          { r1: 2, c1: 3, r2: 2, c2: 4 },
          { r1: 3, c1: 2, r2: 3, c2: 3 },
          { r1: 3, c1: 3, r2: 3, c2: 4 },
          { r1: 4, c1: 1, r2: 4, c2: 2 },
          { r1: 1, c1: 1, r2: 2, c2: 1 },
          { r1: 1, c1: 3, r2: 2, c2: 3 },
          { r1: 2, c1: 1, r2: 3, c2: 1 },
          { r1: 2, c1: 4, r2: 3, c2: 4 },
          { r1: 3, c1: 1, r2: 4, c2: 1 },
          { r1: 3, c1: 2, r2: 4, c2: 2 },
        ],
      },
    },
    renderBoard: ({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange }) => (
      <KurarinBoard
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
      if (example.puzzleType !== 'kurarin') {
        throw new Error('Kurarin template example type mismatch.');
      }

      return (
        <KurarinExample
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
  walkwalk: {
    parsePuzzLink: parseWalkwalkLink,
    template: {
      type: 'walkwalk',
      name: {
        'zh-CN': '数行',
        en: 'Walkwalk',
      },
      rulesTitle: {
        'zh-CN': '游戏规则',
        en: 'Rules',
      },
      rules: {
        'zh-CN': [
          '画出一条经过所有数字的单一回路。',
          '回路不能分叉，也不能自交；没有数字的格子可以经过，也可以不经过。',
          '数字表示经过该数字的那一段回路，在所属区域内连续经过的格子数量。',
        ],
        en: [
          'Draw a single loop that passes through every number.',
          'The loop cannot branch or cross itself. Non-numbered cells may be used or left unused.',
          'A number gives the amount of consecutive loop cells in that region on the segment passing through the clue.',
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
        puzzleType: 'walkwalk',
        width: walkwalkExamplePuzzle.width,
        height: walkwalkExamplePuzzle.height,
        regionIds: walkwalkExamplePuzzle.regionIds,
        clues: walkwalkExamplePuzzle.clues,
        solutionEdges: [
          { r1: 0, c1: 0, r2: 0, c2: 1 },
          { r1: 0, c1: 1, r2: 0, c2: 2 },
          { r1: 0, c1: 2, r2: 0, c2: 3 },
          { r1: 0, c1: 3, r2: 0, c2: 4 },
          { r1: 1, c1: 1, r2: 1, c2: 2 },
          { r1: 1, c1: 2, r2: 1, c2: 3 },
          { r1: 1, c1: 3, r2: 1, c2: 4 },
          { r1: 2, c1: 1, r2: 2, c2: 2 },
          { r1: 2, c1: 2, r2: 2, c2: 3 },
          { r1: 3, c1: 1, r2: 3, c2: 2 },
          { r1: 4, c1: 0, r2: 4, c2: 1 },
          { r1: 4, c1: 2, r2: 4, c2: 3 },
          { r1: 0, c1: 0, r2: 1, c2: 0 },
          { r1: 0, c1: 4, r2: 1, c2: 4 },
          { r1: 1, c1: 0, r2: 2, c2: 0 },
          { r1: 1, c1: 1, r2: 2, c2: 1 },
          { r1: 2, c1: 0, r2: 3, c2: 0 },
          { r1: 2, c1: 3, r2: 3, c2: 3 },
          { r1: 3, c1: 0, r2: 4, c2: 0 },
          { r1: 3, c1: 1, r2: 4, c2: 1 },
          { r1: 3, c1: 2, r2: 4, c2: 2 },
          { r1: 3, c1: 3, r2: 4, c2: 3 },
        ],
      },
    },
    renderBoard: ({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange }) => (
      <WalkwalkBoard
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
      if (example.puzzleType !== 'walkwalk') {
        throw new Error('Walkwalk template example type mismatch.');
      }

      return (
        <WalkwalkExample
          width={example.width}
          height={example.height}
          regionIds={example.regionIds}
          clues={example.clues}
          solutionEdges={example.solutionEdges}
          crossedEdges={example.crossedEdges}
          playableLabel={template.playableLabel[locale]}
          answerLabel={template.answerLabel[locale]}
        />
      );
    },
  },
  slither: {
    parsePuzzLink: parseSlitherlinkLink,
    template: {
      type: 'slither',
      name: {
        'zh-CN': '数回',
        en: 'Slitherlink',
      },
      rulesTitle: {
        'zh-CN': '游戏规则',
        en: 'Rules',
      },
      rules: {
        'zh-CN': [
          '沿格线画线，使所有线段连成一条单一回路。',
          '回路不能分叉，也不能自交。',
          '数字表示该格四条边中有多少条属于回路。',
        ],
        en: [
          'Draw lines along cell edges to form one single loop.',
          'The loop cannot branch or cross itself.',
          'A number gives how many of the four edges around that cell are used by the loop.',
        ],
      },
      exampleTitle: {
        'zh-CN': '例题（2×2）',
        en: 'Example (2×2)',
      },
      playableLabel: {
        'zh-CN': '题面',
        en: 'Puzzle',
      },
      answerLabel: {
        'zh-CN': '正确答案',
        en: 'Answer',
      },
      example: {
        puzzleType: 'slither',
        width: 2,
        height: 2,
        clues: [
          [2, 2],
          [2, 2],
        ],
        loopEdges: ['h-0-0', 'h-0-1', 'h-2-0', 'h-2-1', 'v-0-0', 'v-1-0', 'v-0-2', 'v-1-2'],
      },
    },
    renderBoard: ({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange }) => (
      <SlitherlinkBoard
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
      if (example.puzzleType !== 'slither') {
        throw new Error('Slitherlink template example type mismatch.');
      }

      return (
        <AdditionalPuzzleExample
          example={example}
          playableLabel={template.playableLabel[locale]}
          answerLabel={template.answerLabel[locale]}
        />
      );
    },
  },
  lits: {
    parsePuzzLink: parseLitsLink,
    template: {
      type: 'lits',
      name: {
        'zh-CN': 'LITS',
        en: 'LITS',
      },
      rulesTitle: {
        'zh-CN': '游戏规则',
        en: 'Rules',
      },
      rules: {
        'zh-CN': [
          '在每个粗边框区域内涂出一个由四个正交连通黑格组成的四连块。',
          '所有黑格必须正交连成一片，且不能出现全黑的 2×2 方块。',
          '两个共享边的四连块不能是相同形状；旋转或镜像后相同也算相同形状。',
        ],
        en: [
          'Place one tetromino, a connected block of four shaded cells, in every outlined region.',
          'All shaded cells must be orthogonally connected, and no 2×2 block may be fully shaded.',
          'Two edge-adjacent tetrominoes cannot have the same shape, counting rotations and reflections as the same.',
        ],
      },
      exampleTitle: {
        'zh-CN': '例题（4×4）',
        en: 'Example (4×4)',
      },
      playableLabel: {
        'zh-CN': '题面',
        en: 'Puzzle',
      },
      answerLabel: {
        'zh-CN': '正确答案',
        en: 'Answer',
      },
      example: {
        puzzleType: 'lits',
        width: 4,
        height: 4,
        regionIds: [
          [0, 0, 1, 1],
          [0, 0, 1, 2],
          [0, 1, 1, 2],
          [2, 2, 2, 2],
        ],
        correctSolution: [
          [1, 0, 1, 1],
          [1, 1, 1, 0],
          [1, 0, 1, 0],
          [1, 1, 1, 1],
        ],
      },
    },
    renderBoard: ({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange }) => (
      <LitsBoard
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
      if (example.puzzleType !== 'lits') {
        throw new Error('LITS template example type mismatch.');
      }

      return (
        <AdditionalPuzzleExample
          example={example}
          playableLabel={template.playableLabel[locale]}
          answerLabel={template.answerLabel[locale]}
        />
      );
    },
  },
  lakes: {
    parsePuzzLink: parseLakesLink,
    template: {
      type: 'lakes',
      name: {
        'zh-CN': '湖泊',
        en: 'Lakes',
      },
      rulesTitle: {
        'zh-CN': '游戏规则',
        en: 'Rules',
      },
      rules: {
        'zh-CN': [
          '涂黑一些格子，把其余白格分成若干个正交连通的湖区。',
          '每个湖区必须恰好包含一个线索格。',
          '数字表示其所在湖区的格数；问号表示大小未知。',
        ],
        en: [
          'Shade some cells so that the remaining white cells form orthogonally connected lake areas.',
          'Each lake area must contain exactly one clue cell.',
          'A number gives the size of its lake area; a question mark leaves the size unspecified.',
        ],
      },
      exampleTitle: {
        'zh-CN': '例题（5×5）',
        en: 'Example (5×5)',
      },
      playableLabel: {
        'zh-CN': '题面',
        en: 'Puzzle',
      },
      answerLabel: {
        'zh-CN': '正确答案',
        en: 'Answer',
      },
      example: {
        puzzleType: 'lakes',
        width: 5,
        height: 5,
        clues: [
          { row: 0, col: 0, value: 3 },
          { row: 2, col: 4, value: 6 },
          { row: 4, col: 0, value: 4 },
          { row: 4, col: 4, value: 1 },
        ],
        correctSolution: [
          [0, 0, 1, 0, 0],
          [0, 1, 1, 1, 0],
          [1, 1, 0, 0, 0],
          [0, 1, 1, 1, 1],
          [0, 0, 0, 1, 0],
        ],
      },
    },
    renderBoard: ({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange }) => (
      <LakesBoard
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
      if (example.puzzleType !== 'lakes') {
        throw new Error('Lakes template example type mismatch.');
      }

      return (
        <AdditionalPuzzleExample
          example={example}
          playableLabel={template.playableLabel[locale]}
          answerLabel={template.answerLabel[locale]}
        />
      );
    },
  },
  'domino-search': {
    parsePuzzLink: parseDominoSearchLink,
    template: {
      type: 'domino-search',
      name: {
        'zh-CN': '多米诺搜寻',
        en: 'Domino Search',
      },
      rulesTitle: {
        'zh-CN': '游戏规则',
        en: 'Rules',
      },
      rules: {
        'zh-CN': [
          '把盘面划分成若干个 1×2 或 2×1 的骨牌。',
          '每个格子必须恰好属于一张骨牌。',
          '每张骨牌覆盖的两个数字，必须与目标骨牌列表中的一个组合对应，且每个组合恰好使用一次。',
        ],
        en: [
          'Divide the grid into 1×2 or 2×1 dominoes.',
          'Every cell must belong to exactly one domino.',
          'The two numbers covered by each domino must match one target pair, and every target pair must be used exactly once.',
        ],
      },
      exampleTitle: {
        'zh-CN': '例题（4×4）',
        en: 'Example (4×4)',
      },
      playableLabel: {
        'zh-CN': '题面',
        en: 'Puzzle',
      },
      answerLabel: {
        'zh-CN': '正确答案',
        en: 'Answer',
      },
      example: {
        puzzleType: 'domino-search',
        width: 4,
        height: 4,
        numbers: [
          [0, 1, 2, 3],
          [0, 0, 1, 2],
          [3, 3, 0, 2],
          [1, 1, 0, 3],
        ],
        dominoes: [[0, 1], [2, 3], [0, 0], [1, 2], [3, 3], [0, 2], [1, 1], [0, 3]],
        solutionEdges: [
          { r1: 0, c1: 0, r2: 0, c2: 1 },
          { r1: 0, c1: 2, r2: 0, c2: 3 },
          { r1: 1, c1: 0, r2: 1, c2: 1 },
          { r1: 1, c1: 2, r2: 1, c2: 3 },
          { r1: 2, c1: 0, r2: 2, c2: 1 },
          { r1: 2, c1: 2, r2: 2, c2: 3 },
          { r1: 3, c1: 0, r2: 3, c2: 1 },
          { r1: 3, c1: 2, r2: 3, c2: 3 },
        ],
      },
    },
    renderBoard: ({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange }) => (
      <DominoSearchBoard
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
      if (example.puzzleType !== 'domino-search') {
        throw new Error('Domino Search template example type mismatch.');
      }

      return (
        <AdditionalPuzzleExample
          example={example}
          playableLabel={template.playableLabel[locale]}
          answerLabel={template.answerLabel[locale]}
        />
      );
    },
  },
  snail: {
    parsePuzzLink: parseMagicSnailLink,
    template: {
      type: 'snail',
      name: {
        'zh-CN': '魔法蜗牛',
        en: 'Magic Snail',
      },
      rulesTitle: {
        'zh-CN': '游戏规则',
        en: 'Rules',
      },
      rules: {
        'zh-CN': [
          '在可填格中填入给定数字列表中的数字。',
          '同一行或同一列中，任意数字都不能重复出现。',
          '按从外到内的螺旋顺序读取已填数字时，必须循环出现给定数字序列。',
        ],
        en: [
          'Fill available cells with numbers from the given list.',
          'No number may repeat in any row or column.',
          'Reading the filled cells along the outside-in spiral must repeat the given number sequence.',
        ],
      },
      exampleTitle: {
        'zh-CN': '例题（4×4）',
        en: 'Example (4×4)',
      },
      playableLabel: {
        'zh-CN': '题面',
        en: 'Puzzle',
      },
      answerLabel: {
        'zh-CN': '正确答案',
        en: 'Answer',
      },
      example: {
        puzzleType: 'snail',
        width: 4,
        height: 4,
        numbers: [1, 2, 3],
        cells: [
          [1, null, null, null],
          [null, null, null, null],
          [null, null, null, null],
          [null, null, null, null],
        ],
        correctGrid: [
          [1, 2, 3, null],
          [null, null, null, 1],
          [null, null, null, 2],
          [null, null, null, 3],
        ],
      },
    },
    renderBoard: ({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange }) => (
      <MagicSnailBoard
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
      if (example.puzzleType !== 'snail') {
        throw new Error('Magic Snail template example type mismatch.');
      }

      return (
        <AdditionalPuzzleExample
          example={example}
          playableLabel={template.playableLabel[locale]}
          answerLabel={template.answerLabel[locale]}
        />
      );
    },
  },
  'slovak-sums': {
    parsePuzzLink: parseSlovakSumsLink,
    template: {
      type: 'slovak-sums',
      name: {
        'zh-CN': '斯洛伐克和',
        en: 'Slovak Sums',
      },
      rulesTitle: {
        'zh-CN': '游戏规则',
        en: 'Rules',
      },
      rules: {
        'zh-CN': [
          '在白格中填入给定数字列表中的数字。',
          '每一行和每一列都必须恰好包含一次每个指定数字。',
          '黑格中的上方数字表示其正交相邻白格中已填数字的总和，下方数字表示这些相邻已填数字的数量。',
        ],
        en: [
          'Fill white cells with numbers from the given list.',
          'Each row and each column must contain each listed number exactly once.',
          'In a black clue cell, the upper number gives the sum of adjacent filled numbers, and the lower number gives how many adjacent filled numbers are used.',
        ],
      },
      exampleTitle: {
        'zh-CN': '例题（3×3）',
        en: 'Example (3×3)',
      },
      playableLabel: {
        'zh-CN': '题面',
        en: 'Puzzle',
      },
      answerLabel: {
        'zh-CN': '正确答案',
        en: 'Answer',
      },
      example: {
        puzzleType: 'slovak-sums',
        width: 3,
        height: 3,
        numbers: [1, 2],
        cells: [
          [null, null, { sum: 3, count: 2 }],
          [null, { sum: 6, count: 4 }, null],
          [{ sum: 3, count: 2 }, null, null],
        ],
        correctGrid: [
          [1, 2, null],
          [2, null, 1],
          [null, 1, 2],
        ],
      },
    },
    renderBoard: ({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange }) => (
      <SlovakSumsBoard
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
      if (example.puzzleType !== 'slovak-sums') {
        throw new Error('Slovak Sums template example type mismatch.');
      }

      return (
        <AdditionalPuzzleExample
          example={example}
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

export function getPuzzleTypeFromLink(link: string): PuzzleType | null {
  const dataPart = normalizePuzzLinkDataPart(link);
  const type = dataPart.split('/')[0];
  if (type in puzzleRegistry) {
    return type as PuzzleType;
  }

  const aliases: Record<string, PuzzleType> = {
    slitherlink: 'slither',
    'magic-snail': 'snail',
    slovaksums: 'slovak-sums',
  };
  if (type in aliases) {
    return aliases[type];
  }

  return null;
}

export function resolvePuzzleEntry(entry: PuzzleEntry): PuzzleData | null {
  return parsePuzzleLink(entry.puzzLink);
}

export function parsePuzzleLink(link: string): PuzzleData | null {
  const type = getPuzzleTypeFromLink(link);
  if (!type) return null;
  return puzzleRegistry[type].parsePuzzLink(link);
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
