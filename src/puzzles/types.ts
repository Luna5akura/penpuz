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

export type PuzzleData = NurikabePuzzleData | FillominoPuzzleData | YajilinPuzzleData;
export type PuzzleType = PuzzleData['type'];

export type PuzzleEntry =
  | {
      type: 'nurikabe';
      puzzLink: string;
    }
  | {
      type: 'fillomino';
      puzzLink: string;
    }
  | {
      type: 'yajilin';
      puzzLink: string;
    }
  | {
      type: 'yajilin';
      puzzle: YajilinPuzzleData;
    };

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
    };

export interface PuzzleTemplate {
  type: PuzzleType;
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
  dateStr: string;
};

export type HistoryPuzzleData = {
  puzzle: PuzzleData;
  template: PuzzleTemplate;
  index: number;
  dateStr: string;
  daysSinceStart: number;
};
