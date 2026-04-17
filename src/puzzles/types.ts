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

export type PuzzleData =
  | NurikabePuzzleData
  | FillominoPuzzleData
  | YajilinPuzzleData
  | StarbattlePuzzleData
  | HeyawakePuzzleData;
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
