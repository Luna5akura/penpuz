export type FourWindsWithParksDirection = 1 | 2 | 3 | 4;
export type FourWindsWithParksCellValue = FourWindsWithParksDirection | 'circle' | 'cross' | null;
export interface FourWindsWithParksPuzzleData { type: 'four-winds-with-parks'; width: number; height: number; clues: (number | null)[][]; }
