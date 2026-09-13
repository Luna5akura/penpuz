import type { LocalizedText } from '@/i18n/types';
import { puzzleRegistry } from '@/puzzles/registry';
import type { PuzzleType } from '@/puzzles/types';

// Keep the editor's choices in the same order and set as the puzzle registry.
// Adding a puzzle therefore cannot silently leave the notes editor behind.
const notePuzzleTypes = Object.keys(puzzleRegistry) as PuzzleType[];

export const notePuzzleTypeOptions: { type: PuzzleType; name: LocalizedText }[] = notePuzzleTypes.map((type) => ({
  type,
  name: puzzleRegistry[type].template.name,
}));

export function getNotePuzzleTypeName(type: PuzzleType, locale: keyof LocalizedText) {
  return notePuzzleTypeOptions.find((option) => option.type === type)?.name[locale] ?? type;
}
