// src/puzzles/FillominoCheckerboard/utils.ts
import type { FillominoCheckerboardPuzzleData } from '../types';
import { parseFillominoLink } from '../Fillomino/utils';

/**
 * Parse a Fillomino Checkerboard puzzle link.  The encoding is identical to
 * a regular fillomino link; the genre is identified by the
 * `fillomino-checkerboard` prefix (plain `fillomino/` links stay regular
 * Fillomino puzzles).
 */
export function parseFillominoCheckerboardLink(link: string): FillominoCheckerboardPuzzleData | null {
  try {
    let dataPart = link.includes('?') ? link.split('?')[1] : link;
    if (dataPart.startsWith('p?')) dataPart = dataPart.slice(2);
    const parts = dataPart.split('/');
    if (parts[0] !== 'fillomino-checkerboard' || parts.length < 3) return null;

    const parsed = parseFillominoLink(`fillomino/${parts.slice(1).join('/')}`);
    if (!parsed) return null;
    return { type: 'fillomino-checkerboard', width: parsed.width, height: parsed.height, clues: parsed.clues };
  } catch {
    return null;
  }
}
