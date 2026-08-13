import type { LocalizedText, LocalizedTextList } from '@/i18n/types';

// src/puzzles/types.ts
export interface NurikabeClue {
  row: number;
  col: number;
  value: number | '?';
}

export type YajilinDirection = 'up' | 'right' | 'down' | 'left';

export interface YajilinClue {
  row: number;
  col: number;
  direction: YajilinDirection;
  value: number | '?';
}

export interface YajilinSolutionEdge {
  r1: number;
  c1: number;
  r2: number;
  c2: number;
}

export interface NurikabePuzzleData {
  type: 'nurikabe';
  width: number;
  height: number;
  clues: NurikabeClue[];
}

export interface FillominoPuzzleData {
  type: 'fillomino';
  width: number;
  height: number;
  clues: (number | null)[][];
}

export interface YajilinPuzzleData {
  type: 'yajilin';
  width: number;
  height: number;
  clues: YajilinClue[];
}

export interface StarbattlePuzzleData {
  type: 'starbattle';
  width: number;
  height: number;
  starsPerUnit: number;
  regionIds: number[][];
}

export interface HeyawakeClue {
  row: number;
  col: number;
  value: number;
}

export interface HeyawakePuzzleData {
  type: 'heyawake';
  width: number;
  height: number;
  regionIds: number[][];
  clues: HeyawakeClue[];
}

export interface AqreClue {
  row: number;
  col: number;
  value: number;
}

export interface AqrePuzzleData {
  type: 'aqre';
  width: number;
  height: number;
  regionIds: number[][];
  clues: AqreClue[];
}

export interface MintonetteClue {
  row: number;
  col: number;
  value: number | null;
}

export interface MintonetteSolutionEdge {
  r1: number;
  c1: number;
  r2: number;
  c2: number;
}

export interface MintonettePuzzleData {
  type: 'mintonette';
  width: number;
  height: number;
  clues: MintonetteClue[];
}

export interface NikojiPuzzleData {
  type: 'nikoji';
  width: number;
  height: number;
  letters: (string | null)[][];
}

export type AkariCell = number | 'black' | null;

export interface AkariPuzzleData {
  type: 'akari';
  width: number;
  height: number;
  cells: AkariCell[][];
}

export type KurarinClueColor = 'black' | 'white' | 'gray';

export interface KurarinClue {
  row: number;
  col: number;
  color: KurarinClueColor;
}

export interface KurarinPuzzleData {
  type: 'kurarin';
  width: number;
  height: number;
  clues: KurarinClue[];
}

export interface WalkwalkClue {
  row: number;
  col: number;
  value: number;
}

export interface WalkwalkPuzzleData {
  type: 'walkwalk';
  width: number;
  height: number;
  regionIds: number[][];
  clues: WalkwalkClue[];
}

export interface SlitherlinkPuzzleData {
  type: 'slither';
  width: number;
  height: number;
  clues: (number | null)[][];
}

export interface LitsPuzzleData {
  type: 'lits';
  width: number;
  height: number;
  regionIds: number[][];
}

export interface LakesPuzzleData {
  type: 'lakes';
  width: number;
  height: number;
  clues: NurikabeClue[];
}

export type TapaClueValue = number | '?';
export type TapaClue = TapaClueValue[];

export interface TapaPuzzleData {
  type: 'tapa';
  width: number;
  height: number;
  clues: (TapaClue | null)[][];
}

export type MagicSummerCell = number | 'block' | null;

export interface MagicSummerPuzzleData {
  type: 'magic-summer';
  width: number;
  height: number;
  numbers: number[];
  rowSums: (number | null)[];
  columnSums: (number | null)[];
  cells: MagicSummerCell[][];
}

export interface SkyscrapersClues {
  top: (number | null)[];
  bottom: (number | null)[];
  left: (number | null)[];
  right: (number | null)[];
}

export interface SkyscrapersPuzzleData {
  type: 'skyscrapers';
  width: number;
  height: number;
  numbers: number[];
  clues: SkyscrapersClues;
  givens: (number | null)[][];
}

export interface DominoSearchPuzzleData {
  type: 'domino-search';
  width: number;
  height: number;
  numbers: (number | null)[][];
  dominoes: Array<[number, number]>;
}

export type MagicSnailCell = number | 'block' | null;

export interface MagicSnailPuzzleData {
  type: 'snail';
  width: number;
  height: number;
  numbers: number[];
  cells: MagicSnailCell[][];
  start?: {
    row: number;
    col: number;
  };
}

export interface SlovakSumsClueCell {
  sum: number | null;
  count: number;
}

export type SlovakSumsCell = SlovakSumsClueCell | null;

export interface SlovakSumsPuzzleData {
  type: 'slovak-sums';
  width: number;
  height: number;
  numbers: number[];
  cells: SlovakSumsCell[][];
}

export type PuzzleData =
  | NurikabePuzzleData
  | FillominoPuzzleData
  | YajilinPuzzleData
  | StarbattlePuzzleData
  | HeyawakePuzzleData
  | AqrePuzzleData
  | MintonettePuzzleData
  | NikojiPuzzleData
  | AkariPuzzleData
  | KurarinPuzzleData
  | WalkwalkPuzzleData
  | SlitherlinkPuzzleData
  | LitsPuzzleData
  | LakesPuzzleData
  | TapaPuzzleData
  | MagicSummerPuzzleData
  | SkyscrapersPuzzleData
  | DominoSearchPuzzleData
  | MagicSnailPuzzleData
  | SlovakSumsPuzzleData;
export type PuzzleType = PuzzleData['type'];
export type PuzzleDifficulty = '简单' | '困难' | '极难';

export const puzzleDifficultyLabels: Record<PuzzleDifficulty, LocalizedText> = {
  简单: {
    'zh-CN': '简单',
    en: 'Easy',
  },
  困难: {
    'zh-CN': '困难',
    en: 'Hard',
  },
  极难: {
    'zh-CN': '极难',
    en: 'Extreme',
  },
};

export interface PuzzleEntry {
  puzzLink: string;
  difficulty: PuzzleDifficulty;
}

export type PuzzleExample =
  | {
      puzzleType: 'nurikabe';
      width: number;
      height: number;
      clues: NurikabeClue[];
      correctSolution: (0 | 1)[][]; // 0=白格, 1=黑格
    }
  | {
      puzzleType: 'fillomino';
      width: number;
      height: number;
      cluesGrid: (number | null)[][]; // 初始线索
      correctGrid: (number | null)[][]; // 正确答案
    }
  | {
      puzzleType: 'yajilin';
      width: number;
      height: number;
      clues: YajilinClue[];
      shadedCells: { row: number; col: number }[];
      loopEdges: YajilinSolutionEdge[];
      crossedEdges?: YajilinSolutionEdge[];
    }
  | {
      puzzleType: 'starbattle';
      width: number;
      height: number;
      starsPerUnit: number;
      regionIds: number[][];
      starCells: { row: number; col: number }[];
    }
  | {
      puzzleType: 'heyawake';
      width: number;
      height: number;
      regionIds: number[][];
      clues: HeyawakeClue[];
      correctSolution: (0 | 1)[][];
    }
  | {
      puzzleType: 'aqre';
      width: number;
      height: number;
      regionIds: number[][];
      clues: AqreClue[];
      correctSolution: (0 | 1)[][];
    }
  | {
      puzzleType: 'mintonette';
      width: number;
      height: number;
      clues: MintonetteClue[];
      solutionEdges: MintonetteSolutionEdge[];
      crossedEdges?: MintonetteSolutionEdge[];
    }
  | {
      puzzleType: 'nikoji';
      width: number;
      height: number;
      letters: (string | null)[][];
      solutionRegionIds: number[][];
    }
  | {
      puzzleType: 'akari';
      width: number;
      height: number;
      cells: AkariCell[][];
      bulbCells: { row: number; col: number }[];
    }
  | {
      puzzleType: 'kurarin';
      width: number;
      height: number;
      clues: KurarinClue[];
      shadedCells: { row: number; col: number }[];
      loopEdges: YajilinSolutionEdge[];
      crossedEdges?: YajilinSolutionEdge[];
    }
  | {
      puzzleType: 'walkwalk';
      width: number;
      height: number;
      regionIds: number[][];
      clues: WalkwalkClue[];
      solutionEdges: YajilinSolutionEdge[];
      crossedEdges?: YajilinSolutionEdge[];
    }
  | {
      puzzleType: 'slither';
      width: number;
      height: number;
      clues: (number | null)[][];
      loopEdges: string[];
      crossedEdges?: string[];
    }
  | {
      puzzleType: 'lits';
      width: number;
      height: number;
      regionIds: number[][];
      correctSolution: (0 | 1)[][];
    }
  | {
      puzzleType: 'lakes';
      width: number;
      height: number;
      clues: NurikabeClue[];
      correctSolution: (0 | 1)[][];
    }
  | {
      puzzleType: 'tapa';
      width: number;
      height: number;
      clues: (TapaClue | null)[][];
      correctSolution: (0 | 1)[][];
    }
  | {
      puzzleType: 'magic-summer';
      width: number;
      height: number;
      numbers: number[];
      rowSums: (number | null)[];
      columnSums: (number | null)[];
      cells: MagicSummerCell[][];
      correctGrid: (number | null)[][];
    }
  | {
      puzzleType: 'skyscrapers';
      width: number;
      height: number;
      numbers: number[];
      clues: SkyscrapersClues;
      correctGrid: number[][];
    }
  | {
      puzzleType: 'domino-search';
      width: number;
      height: number;
      numbers: number[][];
      dominoes: Array<[number, number]>;
      solutionEdges: YajilinSolutionEdge[];
    }
  | {
      puzzleType: 'snail';
      width: number;
      height: number;
      numbers: number[];
      cells: MagicSnailCell[][];
      start?: {
        row: number;
        col: number;
      };
      correctGrid: (number | null)[][];
    }
  | {
      puzzleType: 'slovak-sums';
      width: number;
      height: number;
      numbers: number[];
      cells: SlovakSumsCell[][];
      correctGrid: (number | null)[][];
    };

export interface PuzzleTemplate {
  type: PuzzleType;
  name: LocalizedText;
  rulesTitle: LocalizedText;
  rules: LocalizedTextList;
  exampleTitle: LocalizedText;
  playableLabel: LocalizedText;
  answerLabel: LocalizedText;
  example: PuzzleExample;
}

// 每日/历史谜题类型
export type DailyPuzzleData = {
  puzzle: PuzzleData;
  template: PuzzleTemplate;
  difficulty: PuzzleDifficulty;
  index: number;
  daysSinceStart: number;
  dateStr: string;
};

export type HistoryPuzzleData = {
  puzzle: PuzzleData;
  template: PuzzleTemplate;
  difficulty: PuzzleDifficulty;
  index: number;
  dateStr: string;
  daysSinceStart: number;
};
