export interface NumberPlacementValidationResult { valid: boolean; message?: string; badCells: { row: number; col: number }[]; }
