import { extractNotePost } from './validation';
import type { NotePost } from './types';

const noteFileModules = import.meta.glob('./posts/*.penpuz-note.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;

export const notePosts: NotePost[] = Object.entries(noteFileModules)
  .map(([, value]) => extractNotePost(value))
  .filter((post): post is NotePost => post !== null)
  .sort((left, right) => right.date.localeCompare(left.date) || left.id.localeCompare(right.id));
