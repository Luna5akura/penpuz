import type { NotePost } from './types';
import { isPuzzleData, isPuzzleType } from '@/puzzles/registry';

export function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' ? value as Record<string, unknown> : null;
}

export function isLocalizedText(value: unknown): value is { 'zh-CN': string; en: string } {
  const record = asRecord(value);
  return typeof record?.['zh-CN'] === 'string' && typeof record.en === 'string';
}

function isGridSize(value: unknown) {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= 100;
}

function isReplayMark(value: unknown) {
  const record = asRecord(value);
  return (
    typeof record?.row === 'number' && Number.isInteger(record.row) && record.row >= 0 &&
    typeof record.col === 'number' && Number.isInteger(record.col) && record.col >= 0 &&
    (record.kind === 'shade' || record.kind === 'star' || record.kind === 'path' || record.kind === 'label') &&
    (record.label === undefined || typeof record.label === 'string')
  );
}

function isReplayStep(value: unknown) {
  const record = asRecord(value);
  return (
    isLocalizedText(record?.title) &&
    isLocalizedText(record?.note) &&
    (record?.marks === undefined || (Array.isArray(record.marks) && record.marks.every(isReplayMark)))
  );
}

function isNoteBlock(value: unknown) {
  const record = asRecord(value);
  if (record?.type === 'text') return isLocalizedText(record.body);
  if (record?.type !== 'puzzle-replay') return false;

  const puzzle = asRecord(record.puzzle);
  return (
    isPuzzleType(record.puzzleType) &&
    isGridSize(record.width) &&
    isGridSize(record.height) &&
    (record.puzzleLink === undefined || typeof record.puzzleLink === 'string') &&
    (puzzle === null ||
      (isPuzzleData(puzzle) && puzzle.type === record.puzzleType &&
        puzzle.width === record.width && puzzle.height === record.height)) &&
    isLocalizedText(record.title) &&
    Array.isArray(record.steps) &&
    record.steps.every(isReplayStep)
  );
}

export function isNotePost(value: unknown): value is NotePost {
  const record = asRecord(value);
  return (
    typeof record?.id === 'string' &&
    isLocalizedText(record.title) &&
    isLocalizedText(record.summary) &&
    typeof record.author === 'string' &&
    typeof record.date === 'string' &&
    Array.isArray(record.blocks) &&
    record.blocks.every(isNoteBlock)
  );
}

export function extractNotePost(payload: unknown): NotePost | null {
  const record = asRecord(payload);
  if (!record) return null;

  if (record.schema === 'penpuz-note/v1' && isNotePost(record.post)) {
    return record.post;
  }

  return isNotePost(record) ? record : null;
}
