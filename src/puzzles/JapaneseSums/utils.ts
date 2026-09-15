import type { JapaneseSumsWithZeroesPuzzleData } from '../types';
import type { NumberPlacementValidationResult } from '../shared/NumberPlacementBoard';
import { decodeCustomPayload, getCellKey, isPositiveGridSize, parsePuzzLinkParts } from '../gridUtils';

type Payload = { clues?: { top?: unknown; right?: unknown; bottom?: unknown; left?: unknown } };
function side(value: unknown, length: number) {
  if (!Array.isArray(value) || value.length !== length) return null;
  const out = value.map((line) => Array.isArray(line) && line.every((n) => Number.isInteger(n) && n >= 0) ? line as number[] : null);
  return out.some((line) => line === null) ? null : out as number[][];
}
export function parseJapaneseSumsLink(link: string): JapaneseSumsWithZeroesPuzzleData | null {
  try {
    const parts = parsePuzzLinkParts(link); const id = parts[0]?.toLowerCase();
    if (id !== 'japanese-sums-with-zeroes' && id !== 'japanesesumswithzeroes' && id !== 'japanesesums') return null;
    const width = Number(parts[1]); const height = Number(parts[2]); const maxDigit = Number(parts[3]); if (!isPositiveGridSize(width, height) || !Number.isInteger(maxDigit) || maxDigit < 1 || maxDigit > 9) return null;
    const payload = decodeCustomPayload<Payload>(parts[3] ?? ''); const clues = payload?.clues;
    if (clues) {
      const top = side(clues.top, width); const bottom = side(clues.bottom, width); const left = side(clues.left, height); const right = side(clues.right, height);
      if (top && bottom && left && right) return { type: 'japanese-sums-with-zeroes', width, height, maxDigit, clues: { top, right, bottom, left } };
    }
    // Native WPF/PuzzLink links use a max-digit field followed by a compact
    // clue stream separated by hyphens. Decode the numeric symbols into the
    // four sides; exporters may omit sides that have no clues.
    const encoded = parts.slice(4).join('/');
    if (!encoded) return null;
    const topRows = Math.ceil(height / 2); const leftCols = Math.ceil(width / 2);
    const top = Array.from({ length: width }, () => [] as number[]);
    const left = Array.from({ length: height }, () => [] as number[]);
    let ec = 0;
    for (let i = 0; i < encoded.length && ec < width * topRows + height * leftCols; i++, ec++) {
      const ch = encoded[i]; let value: number | null = null;
      if (/^[0-9a-f]$/.test(ch)) value = parseInt(ch, 16);
      else if (ch === '-' && /^[0-9a-f]{2}$/.test(encoded.slice(i + 1, i + 3))) { value = parseInt(encoded.slice(i + 1, i + 3), 16); i += 2; }
      else if (ch === '.') value = null;
      else if (ch >= 'g' && ch <= 'z') { ec += parseInt(ch, 36) - 16; continue; }
      if (value !== null) {
        if (ec < width * topRows) top[Math.floor(ec / topRows)].push(value);
        else { const n = ec - width * topRows; left[Math.floor(n / leftCols)].push(value); }
      }
    }
    top.forEach((values) => values.reverse());
    left.forEach((values) => values.reverse());
    return { type: 'japanese-sums-with-zeroes', width, height, maxDigit, clues: { top, right: Array.from({ length: height }, () => []), bottom: Array.from({ length: width }, () => []), left } };
  } catch { return null; }
}
export function validateJapaneseSums(grid: (number | null)[][], puzzle: JapaneseSumsWithZeroesPuzzleData): NumberPlacementValidationResult {
  const bad = new Set<string>(); let message: string | undefined; const fail = (m: string) => { if (!message) message = m; };
  for (let r = 0; r < puzzle.height; r++) for (let c = 0; c < puzzle.width; c++) {
    const v = grid[r]?.[c];
    if (v !== null && (!Number.isInteger(v) || v < 0 || v > puzzle.maxDigit)) { bad.add(getCellKey(r, c)); fail(`只能填入 0 到 ${puzzle.maxDigit}`); }
  }
  const checkLine = (cells: number[], expected: number[]) => {
    const sums: number[] = []; let sum = 0; let active = false;
    for (const value of cells) { if (value === null) { if (active) sums.push(sum); sum = 0; active = false; } else { sum += value; active = true; } }
    if (active) sums.push(sum);
    return sums.length === expected.length && sums.every((v, i) => v === expected[i]);
  };
  const normalized = (v: unknown) => typeof v === 'number' ? v : null;
  for (let r = 0; r < puzzle.height; r++) { const expected = puzzle.clues.left[r].length ? puzzle.clues.left[r] : puzzle.clues.right[r]; if (!checkLine(grid[r].map(normalized), expected)) { fail('行外线索与连续数字组的和不符'); for (let c = 0; c < puzzle.width; c++) bad.add(getCellKey(r, c)); } }
  for (let c = 0; c < puzzle.width; c++) { const expected = puzzle.clues.top[c].length ? puzzle.clues.top[c] : puzzle.clues.bottom[c]; const line = Array.from({ length: puzzle.height }, (_, r) => normalized(grid[r]?.[c])); if (!checkLine(line, expected)) { fail('列外线索与连续数字组的和不符'); for (let r = 0; r < puzzle.height; r++) bad.add(getCellKey(r, c)); } }
  for (let r = 0; r < puzzle.height; r++) { const seen = new Set<number>(); for (const v of grid[r]) if (v !== null && seen.has(v)) { fail('每行不能重复数字'); } else if (v !== null) seen.add(v); }
  for (let c = 0; c < puzzle.width; c++) { const seen = new Set<number>(); for (let r = 0; r < puzzle.height; r++) { const v = grid[r]?.[c]; if (v !== null && seen.has(v)) fail('每列不能重复数字'); else if (v !== null) seen.add(v); } }
  return { valid: !message, message, badCells: Array.from(bad, (k) => { const [row, col] = k.split(',').map(Number); return { row, col }; }) };
}
