import type { LocalizedText } from '@/i18n/types';
import type { PuzzleData, PuzzleType } from '@/puzzles/types';

export type NoteReplayMarkKind = 'shade' | 'star' | 'path' | 'label';

export interface NoteReplayCellMark {
  row: number;
  col: number;
  kind: NoteReplayMarkKind;
  label?: string;
}

export interface NoteReplayStep {
  title: LocalizedText;
  note: LocalizedText;
  snapshot?: unknown;
  marks?: NoteReplayCellMark[];
}

export interface NotePuzzleReplayBlock {
  type: 'puzzle-replay';
  puzzleType: PuzzleType;
  puzzleLink?: string;
  puzzle?: PuzzleData;
  title: LocalizedText;
  width: number;
  height: number;
  steps: NoteReplayStep[];
}

export interface NoteTextBlock {
  type: 'text';
  body: LocalizedText;
}

export type NotePostBlock = NoteTextBlock | NotePuzzleReplayBlock;

export interface NotePost {
  id: string;
  title: LocalizedText;
  summary: LocalizedText;
  author: string;
  date: string;
  blocks: NotePostBlock[];
}

export interface DraftNotePostFile {
  schema: 'penpuz-note/v1';
  post: NotePost;
}
