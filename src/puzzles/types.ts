// src/puzzles/types.ts
export interface NurikabeClue {
  row: number;
  col: number;
  value: number | '?';
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

export type PuzzleData = NurikabePuzzleData | FillominoPuzzleData;

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
    };

export interface PuzzleTemplate {
  type: 'nurikabe' | 'fillomino';
  name: string;
  nameCn: string;
  rulesTitle: string;
  rules: string[];
  exampleTitle: string;
  playableLabel: string;
  answerLabel: string;
  example: PuzzleExample; // ← 核心新增
}

// 每日/历史谜题类型
export type DailyPuzzleData = {
  puzzle: PuzzleData;
  template: PuzzleTemplate;
  index: number;
  daysSinceStart: number;
};

export type HistoryPuzzleData = {
  puzzle: PuzzleData;
  template: PuzzleTemplate;
  index: number;
};