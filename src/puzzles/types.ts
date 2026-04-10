// src/puzzles/types.ts
export interface NurikabeClue {
  row: number;
  col: number;
  value: number | '?';
}

export interface PuzzleData {
  type: 'nurikabe';
  width: number;
  height: number;
  clues: NurikabeClue[];
}