import type { ABCBoxPuzzleData } from '../types';
import type { NumberPlacementValidationResult } from '../shared/NumberPlacementBoard';
import { decodeCustomPayload, getCellKey, isPositiveGridSize, parsePuzzLinkParts } from '../gridUtils';
export function parseABCBoxLink(link: string): ABCBoxPuzzleData | null {
  try { const p = parsePuzzLinkParts(link); const id = p[0]?.toLowerCase(); if (id !== 'abc-box' && id !== 'abcbox') return null; const width = Number(p[1]); const height = Number(p[2]); if (!isPositiveGridSize(width, height)) return null; const x = decodeCustomPayload<Partial<ABCBoxPuzzleData>>(p[3] ?? ''); if (!x || !Array.isArray(x.givens) || x.givens.length !== height || !x.clues) return null; return { type: 'abc-box', width, height, givens: x.givens, clues: x.clues }; } catch { return null; }
}
export function validateABCBox(grid: (number | null)[][], puzzle: ABCBoxPuzzleData): NumberPlacementValidationResult {
  const bad = new Set<string>(); let message: string | undefined; const fail = (m: string) => { if (!message) message = m; };
  for (let r = 0; r < puzzle.height; r++) for (let c = 0; c < puzzle.width; c++) { const v = grid[r]?.[c]; if (v !== 1 && v !== 2 && v !== 3) { bad.add(getCellKey(r, c)); fail('每个格子必须填入 A、B 或 C'); } }
  return { valid: !message, message, badCells: Array.from(bad, (k) => { const [row, col] = k.split(',').map(Number); return { row, col }; }) };
}
