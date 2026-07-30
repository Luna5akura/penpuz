import type { DraftNotePostFile, NotePost } from './types';

const noteFileModules = import.meta.glob('./posts/*.penpuz-note.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' ? value as Record<string, unknown> : null;
}

function isLocalizedText(value: unknown): value is { 'zh-CN': string; en: string } {
  const record = asRecord(value);
  return typeof record?.['zh-CN'] === 'string' && typeof record.en === 'string';
}

function isNotePost(value: unknown): value is NotePost {
  const record = asRecord(value);
  return (
    typeof record?.id === 'string' &&
    isLocalizedText(record.title) &&
    isLocalizedText(record.summary) &&
    typeof record.author === 'string' &&
    typeof record.date === 'string' &&
    Array.isArray(record.blocks)
  );
}

function extractNotePost(value: unknown): NotePost | null {
  const record = asRecord(value);
  if (!record) return null;

  if (record.schema === 'penpuz-note/v1') {
    const wrapped = record as Partial<DraftNotePostFile>;
    return isNotePost(wrapped.post) ? wrapped.post : null;
  }

  return isNotePost(value) ? value : null;
}

export const notePosts: NotePost[] = Object.entries(noteFileModules)
  .map(([, value]) => extractNotePost(value))
  .filter((post): post is NotePost => post !== null)
  .sort((left, right) => right.date.localeCompare(left.date) || left.id.localeCompare(right.id));
