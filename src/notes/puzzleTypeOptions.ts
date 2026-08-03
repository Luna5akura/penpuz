import type { LocalizedText } from '@/i18n/types';
import { puzzleRegistry } from '@/puzzles/registry';
import type { PuzzleType } from '@/puzzles/types';

const notePuzzleTypes: PuzzleType[] = [
  'nurikabe',
  'fillomino',
  'yajilin',
  'starbattle',
  'heyawake',
  'aqre',
  'mintonette',
  'nikoji',
  'akari',
  'kurarin',
  'walkwalk',
  'slither',
  'lits',
  'lakes',
  'tapa',
  'magic-summer',
  'domino-search',
  'snail',
  'slovak-sums',
];

export const notePuzzleTypeOptions: { type: PuzzleType; name: LocalizedText }[] = notePuzzleTypes.map((type) => ({
  type,
  name: puzzleRegistry[type].template.name,
}));

export function getNotePuzzleTypeName(type: PuzzleType, locale: keyof LocalizedText) {
  return notePuzzleTypeOptions.find((option) => option.type === type)?.name[locale] ?? type;
}
