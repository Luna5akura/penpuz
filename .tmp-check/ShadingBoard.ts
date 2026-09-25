export type ShadingCellState = 0 | 1 | 2;
export interface ShadingValidationResult { valid: boolean; message?: string; badCells: { row: number; col: number }[]; }
