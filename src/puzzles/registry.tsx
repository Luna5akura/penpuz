import type { ReactElement } from 'react';
import NurikabeBoard from './Nurikabe/Nurikabe';
import FillominoBoard from './Fillomino/Fillomino';
import YajilinBoard from './Yajilin/Yajilin';
import StarbattleBoard from './Starbattle/Starbattle';
import NurikabeExample from '../components/examples/NurikabeExample';
import FillominoExample from '../components/examples/FillominoExample';
import YajilinExample from '../components/examples/YajilinExample';
import StarbattleExample from '../components/examples/StarbattleExample';
import { parsePuzzLink } from './Nurikabe/utils';
import { parseFillominoLink } from './Fillomino/utils';
import { parseYajilinLink } from './Yajilin/utils';
import { parseStarbattleLink } from './Starbattle/utils';
import type {
  FillominoPuzzleData,
  NurikabePuzzleData,
  PuzzleData,
  PuzzleEntry,
  PuzzleTemplate,
  PuzzleType,
  StarbattlePuzzleData,
  YajilinPuzzleData,
} from './types';

interface PuzzleBoardProps<TPuzzle extends PuzzleData> {
  puzzle: TPuzzle;
  startTime: number;
  resetToken: number;
  onComplete: (time: number) => void;
}

interface PuzzleRegistryEntry<TPuzzle extends PuzzleData> {
  parsePuzzLink: (link: string) => TPuzzle | null;
  template: PuzzleTemplate;
  renderBoard: (props: PuzzleBoardProps<TPuzzle>) => ReactElement;
  renderExample: (template: PuzzleTemplate) => ReactElement;
}

type PuzzleRegistry = {
  nurikabe: PuzzleRegistryEntry<NurikabePuzzleData>;
  fillomino: PuzzleRegistryEntry<FillominoPuzzleData>;
  yajilin: PuzzleRegistryEntry<YajilinPuzzleData>;
  starbattle: PuzzleRegistryEntry<StarbattlePuzzleData>;
};

export const puzzleRegistry: PuzzleRegistry = {
  nurikabe: {
    parsePuzzLink,
    template: {
      type: 'nurikabe',
      name: 'Nurikabe',
      nameCn: '数墙',
      rulesTitle: '游戏规则',
      rules: [
        '涂黑一些空格，使得所有涂黑的格子连通成一个整体，且没有全部涂黑的2×2结构。',
        '每一组连通的留白格必须恰好包含一个数字。',
        '数字表示其所在的留白的连通组格数。',
      ],
      exampleTitle: '例题（5×5）',
      playableLabel: '可游玩例题',
      answerLabel: '正确答案',
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
    renderBoard: ({ puzzle, startTime, resetToken, onComplete }) => (
      <NurikabeBoard puzzle={puzzle} startTime={startTime} resetToken={resetToken} onComplete={onComplete} />
    ),
    renderExample: (template) => {
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
          playableLabel={template.playableLabel}
          answerLabel={template.answerLabel}
        />
      );
    },
  },
  fillomino: {
    parsePuzzLink: (link) => parseFillominoLink(link),
    template: {
      type: 'fillomino',
      name: 'Fillomino',
      nameCn: '码牌',
      rulesTitle: '游戏规则',
      rules: [
        '沿虚格线把盘面分成若干个区域，使得任意两个相邻的区域面积都不同。',
        '数字表示其所在区域的面积。',
      ],
      exampleTitle: '例题（6×6）',
      playableLabel: '可游玩例题',
      answerLabel: '正确答案',
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
    renderBoard: ({ puzzle, startTime, resetToken, onComplete }) => (
      <FillominoBoard puzzle={puzzle} startTime={startTime} resetToken={resetToken} onComplete={onComplete} />
    ),
    renderExample: (template) => {
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
          playableLabel={template.playableLabel}
          answerLabel={template.answerLabel}
        />
      );
    },
  },
  yajilin: {
    parsePuzzLink: parseYajilinLink,
    template: {
      type: 'yajilin',
      name: 'Yajilin',
      nameCn: '仙人指路',
      rulesTitle: '游戏规则',
      rules: [
        '涂黑一些空格，并画出一条经过所有其余非线索格子的单一回路。',
        '回路不能分叉或交叉，涂黑格之间不能正交相邻。',
        '带数字或问号的箭头格不能涂黑，也不属于回路的一部分。',
        '数字表示箭头方向上被涂黑的格子数，问号只给出方向不限定数量。',
      ],
      exampleTitle: '例题（5×5）',
      playableLabel: '可游玩例题',
      answerLabel: '正确答案',
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
    renderBoard: ({ puzzle, startTime, resetToken, onComplete }) => (
      <YajilinBoard puzzle={puzzle} startTime={startTime} resetToken={resetToken} onComplete={onComplete} />
    ),
    renderExample: (template) => {
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
          playableLabel={template.playableLabel}
          answerLabel={template.answerLabel}
        />
      );
    },
  },
  starbattle: {
    parsePuzzLink: parseStarbattleLink,
    template: {
      type: 'starbattle',
      name: 'Star Battle',
      nameCn: '星战',
      rulesTitle: '游戏规则',
      rules: [
        '在一些空格中放入星星，且任意两个星星不能横向、纵向或对角相邻。',
        '右上角的数字表示每一行、每一列和每一个粗边框区域中都必须恰好放入相同数量的星星。',
      ],
      exampleTitle: '例题（5×5）',
      playableLabel: '可游玩例题',
      answerLabel: '正确答案',
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
    renderBoard: ({ puzzle, startTime, resetToken, onComplete }) => (
      <StarbattleBoard puzzle={puzzle} startTime={startTime} resetToken={resetToken} onComplete={onComplete} />
    ),
    renderExample: (template) => {
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
          playableLabel={template.playableLabel}
          answerLabel={template.answerLabel}
        />
      );
    },
  },
};

export function getPuzzleTemplate(type: PuzzleType): PuzzleTemplate {
  return puzzleRegistry[type].template;
}

export function resolvePuzzleEntry(entry: PuzzleEntry): PuzzleData | null {
  return puzzleRegistry[entry.type].parsePuzzLink(entry.puzzLink);
}

export function renderPuzzleBoard(
  puzzle: PuzzleData,
  startTime: number,
  resetToken: number,
  onComplete: (time: number) => void
): ReactElement {
  const entry = puzzleRegistry[puzzle.type] as PuzzleRegistryEntry<typeof puzzle>;
  return entry.renderBoard({ puzzle, startTime, resetToken, onComplete });
}

export function renderPuzzleExample(template: PuzzleTemplate): ReactElement {
  return puzzleRegistry[template.type].renderExample(template);
}
