export type TapaClue = (number | '?')[];
export interface TapaPuzzleData { type: 'tapa'; width: number; height: number; clues: (TapaClue | null)[][]; }
