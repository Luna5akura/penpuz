export type BattleshipShipShape = { cells: boolean[][]; width: number; height: number };
export interface BattleshipCellClue { kind: 'ship' | 'water'; row: number; col: number; segment?: number; }
export interface BattleshipPuzzleData { type: 'battleship'; width: number; height: number; fleet: BattleshipShipShape[]; cellClues: BattleshipCellClue[]; columnClues: (number|null)[]; rowClues: (number|null)[]; }
