export type FourWindsDirection = 1 | 2 | 3 | 4;
export type FourWindsCellValue = FourWindsDirection | "cross" | null;
export interface FourWindsPuzzleData { type: "fourwinds"; width: number; height: number; clues: (number | null)[][]; }
