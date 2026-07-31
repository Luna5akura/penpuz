import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, Edit3, Eye, FileDown, FileText, Link2, Plus, RotateCcw, Save, Trash2, Upload } from 'lucide-react';
import { useI18n } from '@/i18n/useI18n';
import { setDocumentMetadata } from '@/lib/documentMetadata';
import { cn } from '@/lib/utils';
import { notePosts } from '@/notes/posts';
import { getNotePuzzleTypeName, notePuzzleTypeOptions } from '@/notes/puzzleTypeOptions';
import type {
  DraftNotePostFile,
  NotePost,
  NotePostBlock,
  NoteReplayStep,
} from '@/notes/types';
import { getPuzzleMetadata } from '@/puzzles/puzzleMetadata';
import { parsePuzzleLink, renderPuzzleBoard } from '@/puzzles/registry';
import type { PuzzleData, PuzzleType } from '@/puzzles/types';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import NotePuzzleBoard from './NotePuzzleBoard';
import PuzzleReplayViewer from './PuzzleReplayViewer';

type NotesMode = 'read' | 'edit';

interface DraftTextBlock {
  id: string;
  type: 'text';
  bodyZh: string;
  bodyEn: string;
}

interface DraftReplayBlock {
  id: string;
  type: 'puzzle-replay';
  puzzleType: PuzzleType;
  puzzleLink: string;
  puzzle?: PuzzleData;
  importError?: string | null;
  titleZh: string;
  titleEn: string;
  width: number;
  height: number;
  stepNoteZh: string;
  stepNoteEn: string;
  boardSnapshot?: unknown;
  boardResetToken: number;
  boardStartTime: number;
  steps: NoteReplayStep[];
}

type DraftBlock = DraftTextBlock | DraftReplayBlock;

interface StoredNoteEditorDraft {
  version: 1;
  savedAt: string;
  mode: NotesMode;
  selectedPostId: string;
  draft: {
    id: string;
    titleZh: string;
    titleEn: string;
    summaryZh: string;
    summaryEn: string;
    author: string;
    date: string;
    blocks: DraftBlock[];
  };
}

const NOTE_EDITOR_DRAFT_STORAGE_KEY = 'penpuz:note-editor-draft:v1';

const noteCopy = {
  'zh-CN': {
    title: '笔记',
    readMode: '阅读',
    editMode: '编辑',
    editCurrent: '编辑当前',
    newNote: '新建',
    openFile: '打开文件',
    invalidNoteFile: '无法读取笔记文件',
    noPosts: '暂无笔记',
    copyLink: '复制链接',
    linkCopied: '已复制',
    byline: (author: string, date: string) => `${author} · ${date}`,
    titleZh: '标题',
    titleEn: '英文标题',
    summaryZh: '摘要',
    summaryEn: '英文摘要',
    bodyZh: '正文',
    bodyEn: '英文正文',
    author: '作者',
    date: '日期',
    puzzleLink: '题目链接',
    importPuzzle: '导入',
    invalidPuzzleLink: '无法识别链接',
    width: '宽',
    height: '高',
    addTextBlock: '文字',
    addReplayBlock: '过程',
    insertTextAbove: '上方文字',
    insertReplayAbove: '上方过程',
    insertTextBelow: '下方文字',
    insertReplayBelow: '下方过程',
    textBlock: '文字',
    replayBlock: '过程',
    moveUp: '上移',
    moveDown: '下移',
    deleteBlock: '删除',
    puzzleType: '题型',
    replayTitleZh: '过程标题',
    replayTitleEn: '英文过程标题',
    stepNoteZh: '步骤说明',
    stepNoteEn: '英文步骤说明',
    addStep: '添加步骤',
    removeStep: '撤回步骤',
    loadStep: '载入盘面',
    updateStep: '更新盘面',
    saveFile: '保存',
    autoSavedAt: (time: string) => `已自动保存 ${time}`,
    stepsCount: (count: number) => `步骤 ${count}`,
  },
  en: {
    title: 'Notes',
    readMode: 'Read',
    editMode: 'Edit',
    editCurrent: 'Edit current',
    newNote: 'New',
    openFile: 'Open file',
    invalidNoteFile: 'Could not read note file',
    noPosts: 'No notes',
    copyLink: 'Copy link',
    linkCopied: 'Copied',
    byline: (author: string, date: string) => `${author} · ${date}`,
    titleZh: 'Chinese title',
    titleEn: 'Title',
    summaryZh: 'Chinese summary',
    summaryEn: 'Summary',
    bodyZh: 'Chinese body',
    bodyEn: 'Body',
    author: 'Author',
    date: 'Date',
    puzzleLink: 'Puzzle link',
    importPuzzle: 'Import',
    invalidPuzzleLink: 'Invalid link',
    width: 'W',
    height: 'H',
    addTextBlock: 'Text',
    addReplayBlock: 'Process',
    insertTextAbove: 'Text above',
    insertReplayAbove: 'Process above',
    insertTextBelow: 'Text below',
    insertReplayBelow: 'Process below',
    textBlock: 'Text',
    replayBlock: 'Process',
    moveUp: 'Move up',
    moveDown: 'Move down',
    deleteBlock: 'Delete',
    puzzleType: 'Puzzle type',
    replayTitleZh: 'Chinese replay title',
    replayTitleEn: 'Replay title',
    stepNoteZh: 'Chinese step note',
    stepNoteEn: 'Step note',
    addStep: 'Add step',
    removeStep: 'Undo step',
    loadStep: 'Load board',
    updateStep: 'Update board',
    saveFile: 'Save',
    autoSavedAt: (time: string) => `Autosaved ${time}`,
    stepsCount: (count: number) => `Steps ${count}`,
  },
};

function makeBlockId() {
  return `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function makeLocalizedText(primary: string, secondary: string, fallbackZh = '未命名', fallbackEn = 'Untitled') {
  return {
    'zh-CN': primary.trim() || secondary.trim() || fallbackZh,
    en: secondary.trim() || primary.trim() || fallbackEn,
  };
}

function makeLocalizedBody(primary: string, secondary: string) {
  return {
    'zh-CN': primary.trim() || secondary.trim(),
    en: secondary.trim() || primary.trim(),
  };
}

function makeTextDraftBlock(bodyZh = '', bodyEn = ''): DraftTextBlock {
  return {
    id: makeBlockId(),
    type: 'text',
    bodyZh,
    bodyEn,
  };
}

function makeReplayDraftBlock(): DraftReplayBlock {
  return {
    id: makeBlockId(),
    type: 'puzzle-replay',
    puzzleType: 'nurikabe',
    puzzleLink: '',
    titleZh: '过程',
    titleEn: 'Process',
    width: 5,
    height: 5,
    stepNoteZh: '',
    stepNoteEn: '',
    boardResetToken: 0,
    boardStartTime: Date.now(),
    steps: [],
  };
}

function makeDraftBlock(type: DraftBlock['type']) {
  return type === 'text' ? makeTextDraftBlock() : makeReplayDraftBlock();
}

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function readNoteIdFromUrl() {
  if (typeof window === 'undefined') return null;
  const noteId = new URLSearchParams(window.location.search).get('note');
  return noteId?.trim() || null;
}

function findNotePostById(noteId: string | null) {
  if (!noteId) return null;
  return notePosts.find((post) => post.id === noteId) ?? null;
}

function getInitialSelectedPostId() {
  return findNotePostById(readNoteIdFromUrl())?.id ?? notePosts[0]?.id ?? '';
}

function buildNotePageUrl(postId: string) {
  const url = new URL(window.location.href);
  url.searchParams.delete('date');
  url.searchParams.delete('page');
  url.searchParams.set('note', postId);
  return url.toString();
}

function syncNotePageUrl(postId: string, mode: 'push' | 'replace') {
  if (typeof window === 'undefined') return;

  const nextUrl = buildNotePageUrl(postId);
  if (nextUrl === window.location.href) return;

  const method = mode === 'push' ? 'pushState' : 'replaceState';
  window.history[method](null, '', nextUrl);
}

async function copyTextToClipboard(text: string) {
  let copied = false;

  try {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      copied = true;
    }
  } catch {
    copied = false;
  }

  if (!copied) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', '');
    textArea.setAttribute('aria-hidden', 'true');
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '1px';
    textArea.style.height = '1px';
    textArea.style.opacity = '0.01';
    document.body.appendChild(textArea);

    try {
      textArea.focus({ preventScroll: true });
      textArea.select();
      textArea.setSelectionRange(0, textArea.value.length);
      copied = document.execCommand('copy');
    } finally {
      textArea.blur();
      document.body.removeChild(textArea);
    }
  }

  return copied;
}

function trimSteps(steps: NoteReplayStep[], width: number, height: number) {
  return steps.map((step) => ({
    ...step,
    snapshot: undefined,
    marks: (step.marks ?? []).filter((mark) => mark.row < height && mark.col < width),
  }));
}

function cloneUnknown<T>(value: T): T {
  if (value === undefined || value === null) return value;
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

function areUnknownEqual(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function makePostId(title: string) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return slug || `note-${Date.now()}`;
}

function getLocalizedValue(text: { 'zh-CN'?: string; en?: string } | undefined, key: 'zh-CN' | 'en', fallback = '') {
  if (!text) return fallback;
  const alternate = key === 'zh-CN' ? 'en' : 'zh-CN';
  return text[key] ?? text[alternate] ?? fallback;
}

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

function extractNotePost(payload: unknown): NotePost | null {
  const record = asRecord(payload);
  if (!record) return null;

  if (record.schema === 'penpuz-note/v1' && isNotePost(record.post)) {
    return record.post;
  }

  return isNotePost(record) ? record : null;
}

function getLatestStepSnapshot(steps: NoteReplayStep[]) {
  for (let index = steps.length - 1; index >= 0; index--) {
    if (steps[index].snapshot !== undefined) return steps[index].snapshot;
  }

  return undefined;
}

function postBlockToDraftBlock(block: NotePostBlock): DraftBlock {
  if (block.type === 'text') {
    return makeTextDraftBlock(
      getLocalizedValue(block.body, 'zh-CN'),
      getLocalizedValue(block.body, 'en')
    );
  }

  const parsedPuzzle = block.puzzle ?? (block.puzzleLink ? parsePuzzleLink(block.puzzleLink) ?? undefined : undefined);
  const steps = cloneUnknown(block.steps);

  return {
    id: makeBlockId(),
    type: 'puzzle-replay',
    puzzleType: parsedPuzzle?.type ?? block.puzzleType,
    puzzleLink: block.puzzleLink ?? '',
    puzzle: parsedPuzzle,
    titleZh: getLocalizedValue(block.title, 'zh-CN', '过程'),
    titleEn: getLocalizedValue(block.title, 'en', 'Process'),
    width: parsedPuzzle?.width ?? block.width,
    height: parsedPuzzle?.height ?? block.height,
    stepNoteZh: '',
    stepNoteEn: '',
    boardSnapshot: cloneUnknown(getLatestStepSnapshot(steps)),
    boardResetToken: 0,
    boardStartTime: Date.now(),
    steps,
  };
}

function getRecordString(record: Record<string, unknown>, key: string, fallback = '') {
  const value = record[key];
  return typeof value === 'string' ? value : fallback;
}

function getRecordNumber(record: Record<string, unknown>, key: string, fallback: number) {
  const value = record[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function normalizeLocalizedText(value: unknown, fallbackZh: string, fallbackEn: string) {
  const record = asRecord(value);
  return {
    'zh-CN': typeof record?.['zh-CN'] === 'string' ? record['zh-CN'] : fallbackZh,
    en: typeof record?.en === 'string' ? record.en : fallbackEn,
  };
}

function isSerializablePuzzleData(value: unknown): value is PuzzleData {
  const record = asRecord(value);
  return (
    typeof record?.type === 'string' &&
    typeof record.width === 'number' &&
    typeof record.height === 'number'
  );
}

function normalizeReplayStep(value: unknown, index: number): NoteReplayStep | null {
  const record = asRecord(value);
  if (!record) return null;

  const title = normalizeLocalizedText(record.title, `步骤 ${index + 1}`, `Step ${index + 1}`);
  const note = normalizeLocalizedText(record.note, '', '');
  return {
    title,
    note,
    ...(record.snapshot !== undefined ? { snapshot: record.snapshot } : {}),
    ...(Array.isArray(record.marks) ? { marks: record.marks as NoteReplayStep['marks'] } : {}),
  };
}

function normalizeStoredDraftBlock(value: unknown): DraftBlock | null {
  const record = asRecord(value);
  if (!record) return null;

  const type = record.type;
  if (type === 'text') {
    return {
      id: getRecordString(record, 'id') || makeBlockId(),
      type: 'text',
      bodyZh: getRecordString(record, 'bodyZh'),
      bodyEn: getRecordString(record, 'bodyEn'),
    };
  }

  if (type !== 'puzzle-replay') return null;

  const puzzleLink = getRecordString(record, 'puzzleLink');
  const linkedPuzzle = puzzleLink ? parsePuzzleLink(puzzleLink) ?? undefined : undefined;
  const storedPuzzle = isSerializablePuzzleData(record.puzzle) ? record.puzzle : undefined;
  const puzzle = storedPuzzle ?? linkedPuzzle;
  const width = Math.min(12, Math.max(3, Math.floor(getRecordNumber(record, 'width', puzzle?.width ?? 5))));
  const height = Math.min(12, Math.max(3, Math.floor(getRecordNumber(record, 'height', puzzle?.height ?? 5))));
  const rawSteps = Array.isArray(record.steps) ? record.steps : [];
  const steps = rawSteps
    .map((step, index) => normalizeReplayStep(step, index))
    .filter((step): step is NoteReplayStep => step !== null);

  return {
    id: getRecordString(record, 'id') || makeBlockId(),
    type: 'puzzle-replay',
    puzzleType: (typeof record.puzzleType === 'string' ? record.puzzleType : puzzle?.type ?? 'nurikabe') as PuzzleType,
    puzzleLink,
    ...(puzzle ? { puzzle } : {}),
    importError: typeof record.importError === 'string' ? record.importError : null,
    titleZh: getRecordString(record, 'titleZh', '过程'),
    titleEn: getRecordString(record, 'titleEn', 'Process'),
    width,
    height,
    stepNoteZh: getRecordString(record, 'stepNoteZh'),
    stepNoteEn: getRecordString(record, 'stepNoteEn'),
    ...(record.boardSnapshot !== undefined ? { boardSnapshot: record.boardSnapshot } : {}),
    boardResetToken: getRecordNumber(record, 'boardResetToken', 0),
    boardStartTime: getRecordNumber(record, 'boardStartTime', Date.now()),
    steps: trimSteps(steps, width, height),
  };
}

function normalizeStoredNoteEditorDraft(value: unknown): StoredNoteEditorDraft | null {
  const record = asRecord(value);
  const draft = asRecord(record?.draft);
  if (!record || !draft || record.version !== 1) return null;

  const rawBlocks = Array.isArray(draft.blocks) ? draft.blocks : [];
  const blocks = rawBlocks
    .map(normalizeStoredDraftBlock)
    .filter((block): block is DraftBlock => block !== null);

  return {
    version: 1,
    savedAt: getRecordString(record, 'savedAt', new Date().toISOString()),
    mode: record.mode === 'edit' ? 'edit' : 'read',
    selectedPostId: getRecordString(record, 'selectedPostId'),
    draft: {
      id: getRecordString(draft, 'id'),
      titleZh: getRecordString(draft, 'titleZh', '新的解题笔记'),
      titleEn: getRecordString(draft, 'titleEn', 'New solving note'),
      summaryZh: getRecordString(draft, 'summaryZh', '记录一个题型的关键推进过程。'),
      summaryEn: getRecordString(draft, 'summaryEn', 'A note about a key solving process.'),
      author: getRecordString(draft, 'author', 'penpuz'),
      date: getRecordString(draft, 'date', getTodayIsoDate()),
      blocks: blocks.length > 0 ? blocks : [
        makeTextDraftBlock('写下你的观察、定式或关键分歧。', ''),
        makeReplayDraftBlock(),
      ],
    },
  };
}

function readStoredNoteEditorDraft() {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(NOTE_EDITOR_DRAFT_STORAGE_KEY);
    if (!raw) return null;

    const draft = normalizeStoredNoteEditorDraft(JSON.parse(raw) as unknown);
    if (!draft) {
      window.localStorage.removeItem(NOTE_EDITOR_DRAFT_STORAGE_KEY);
      return null;
    }

    return draft;
  } catch {
    window.localStorage.removeItem(NOTE_EDITOR_DRAFT_STORAGE_KEY);
    return null;
  }
}

function writeStoredNoteEditorDraft(draft: StoredNoteEditorDraft) {
  if (typeof window === 'undefined') return false;

  try {
    window.localStorage.setItem(NOTE_EDITOR_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

function formatAutosaveTime(value: string, locale: 'zh-CN' | 'en') {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat(locale === 'zh-CN' ? 'zh-CN' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

function shouldReplaceReplayTitle(value: string, fallback: string) {
  const title = value.trim();
  return title === '' || title === fallback;
}

function downloadPostFile(post: NotePost) {
  const payload: DraftNotePostFile = {
    schema: 'penpuz-note/v1',
    post,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `${post.id}.penpuz-note.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function draftBlockToPostBlock(block: DraftBlock): NotePostBlock {
  if (block.type === 'text') {
    return {
      type: 'text',
      body: makeLocalizedBody(block.bodyZh, block.bodyEn),
    };
  }

  return {
    type: 'puzzle-replay',
    puzzleType: block.puzzleType,
    ...(block.puzzleLink.trim() ? { puzzleLink: block.puzzleLink.trim() } : {}),
    ...(block.puzzle ? { puzzle: block.puzzle } : {}),
    title: makeLocalizedText(block.titleZh, block.titleEn),
    width: block.width,
    height: block.height,
    steps: block.steps,
  };
}

function renderPost(
  post: NotePost,
  locale: 'zh-CN' | 'en',
  labels: (typeof noteCopy)['zh-CN'],
  actions?: ReactNode
) {
  return (
    <article className="border bg-card">
      <header className="border-b px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">{post.title[locale]}</h2>
            <p className="mt-2 text-muted-foreground">{post.summary[locale]}</p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 text-sm text-muted-foreground sm:items-end sm:text-right">
            <div>{labels.byline(post.author, post.date)}</div>
            {actions}
          </div>
        </div>
      </header>

      <div className="space-y-4 px-4 py-4 sm:px-5">
        {post.blocks.map((block, index) => {
          if (block.type === 'text') {
            return (
              <section key={`text-${index}`} className="space-y-3">
                {block.body[locale].split(/\n{2,}/).map((paragraph, paragraphIndex) => (
                  <p key={paragraphIndex} className="text-base leading-8 text-foreground">
                    {paragraph}
                  </p>
                ))}
              </section>
            );
          }

          return (
            <section key={`replay-${index}`} className="space-y-3">
              <PuzzleReplayViewer replay={block} locale={locale} />
            </section>
          );
        })}
      </div>
    </article>
  );
}

function ReplayBoardEditor({
  blockId,
  puzzle,
  startTime,
  resetToken,
  initialSnapshot,
  onSnapshotChange,
  onComplete,
}: {
  blockId: string;
  puzzle: PuzzleData;
  startTime: number;
  resetToken: number;
  initialSnapshot?: unknown;
  onSnapshotChange: (id: string, snapshot: unknown) => void;
  onComplete: (time: number) => void;
}) {
  const [frozenInitialSnapshot] = useState(initialSnapshot);
  const handleSnapshotChange = useCallback(
    (snapshot: unknown) => onSnapshotChange(blockId, snapshot),
    [blockId, onSnapshotChange]
  );

  return renderPuzzleBoard(
    puzzle,
    startTime,
    resetToken,
    onComplete,
    frozenInitialSnapshot,
    handleSnapshotChange
  );
}

function NotesPage() {
  const { locale } = useI18n();
  const labels = noteCopy[locale];
  const restoredEditorDraft = useMemo(() => readStoredNoteEditorDraft(), []);
  const shouldRestoreEditorMode = restoredEditorDraft?.mode === 'edit';
  const [mode, setMode] = useState<NotesMode>(() => restoredEditorDraft?.mode ?? 'read');
  const [selectedPostId, setSelectedPostId] = useState(() => {
    const restoredPostId = restoredEditorDraft?.selectedPostId;
    return restoredPostId && notePosts.some((post) => post.id === restoredPostId)
      ? restoredPostId
      : getInitialSelectedPostId();
  });
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState<string | null>(() => restoredEditorDraft?.savedAt ?? null);
  const [draftId, setDraftId] = useState(() => restoredEditorDraft?.draft.id ?? '');
  const [draftTitleZh, setDraftTitleZh] = useState(() => restoredEditorDraft?.draft.titleZh ?? '新的解题笔记');
  const [draftTitleEn, setDraftTitleEn] = useState(() => restoredEditorDraft?.draft.titleEn ?? 'New solving note');
  const [draftSummaryZh, setDraftSummaryZh] = useState(() =>
    restoredEditorDraft?.draft.summaryZh ?? '记录一个题型的关键推进过程。'
  );
  const [draftSummaryEn, setDraftSummaryEn] = useState(() =>
    restoredEditorDraft?.draft.summaryEn ?? 'A note about a key solving process.'
  );
  const [draftAuthor, setDraftAuthor] = useState(() => restoredEditorDraft?.draft.author ?? 'penpuz');
  const [draftDate, setDraftDate] = useState(() => restoredEditorDraft?.draft.date ?? getTodayIsoDate());
  const [noteFileError, setNoteFileError] = useState<string | null>(null);
  const [draftBlocks, setDraftBlocks] = useState<DraftBlock[]>(() =>
    restoredEditorDraft?.draft.blocks ?? [
      makeTextDraftBlock('写下你的观察、定式或关键分歧。', ''),
      makeReplayDraftBlock(),
    ]
  );

  const selectedPost = notePosts.find((post) => post.id === selectedPostId) ?? notePosts[0];
  const autoSaveText = useMemo(() => {
    if (!lastAutoSavedAt) return null;
    const formatted = formatAutosaveTime(lastAutoSavedAt, locale);
    return formatted ? labels.autoSavedAt(formatted) : null;
  }, [labels, lastAutoSavedAt, locale]);
  const editorDraftSnapshot = useMemo<StoredNoteEditorDraft>(() => ({
    version: 1,
    savedAt: new Date().toISOString(),
    mode,
    selectedPostId,
    draft: {
      id: draftId,
      titleZh: draftTitleZh,
      titleEn: draftTitleEn,
      summaryZh: draftSummaryZh,
      summaryEn: draftSummaryEn,
      author: draftAuthor,
      date: draftDate,
      blocks: draftBlocks,
    },
  }), [
    draftAuthor,
    draftBlocks,
    draftDate,
    draftId,
    draftSummaryEn,
    draftSummaryZh,
    draftTitleEn,
    draftTitleZh,
    mode,
    selectedPostId,
  ]);
  const draftPost = useMemo<NotePost>(() => {
    const postTitle = makeLocalizedText(draftTitleZh, draftTitleEn);
    return {
      id: draftId.trim() || makePostId(postTitle.en || postTitle['zh-CN']),
      title: postTitle,
      summary: makeLocalizedText(draftSummaryZh, draftSummaryEn, '', ''),
      author: draftAuthor.trim() || 'penpuz',
      date: draftDate || getTodayIsoDate(),
      blocks: draftBlocks.map(draftBlockToPostBlock),
    };
  }, [draftAuthor, draftBlocks, draftDate, draftId, draftSummaryEn, draftSummaryZh, draftTitleEn, draftTitleZh]);

  const loadPostIntoDraft = useCallback((post: NotePost) => {
    setDraftId(post.id);
    setDraftTitleZh(getLocalizedValue(post.title, 'zh-CN'));
    setDraftTitleEn(getLocalizedValue(post.title, 'en'));
    setDraftSummaryZh(getLocalizedValue(post.summary, 'zh-CN'));
    setDraftSummaryEn(getLocalizedValue(post.summary, 'en'));
    setDraftAuthor(post.author);
    setDraftDate(post.date || getTodayIsoDate());
    setDraftBlocks(post.blocks.map(postBlockToDraftBlock));
    setNoteFileError(null);
    setMode('edit');
  }, []);

  const resetDraft = useCallback(() => {
    setDraftId('');
    setDraftTitleZh('新的解题笔记');
    setDraftTitleEn('New solving note');
    setDraftSummaryZh('记录一个题型的关键推进过程。');
    setDraftSummaryEn('A note about a key solving process.');
    setDraftAuthor('penpuz');
    setDraftDate(getTodayIsoDate());
    setDraftBlocks([
      makeTextDraftBlock('写下你的观察、定式或关键分歧。', ''),
      makeReplayDraftBlock(),
    ]);
    setNoteFileError(null);
  }, []);

  const openNoteFile = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const payload = JSON.parse(await file.text()) as unknown;
      const post = extractNotePost(payload);
      if (!post) throw new Error('Invalid note file');
      loadPostIntoDraft(post);
    } catch {
      setNoteFileError(labels.invalidNoteFile);
    }
  }, [labels.invalidNoteFile, loadPostIntoDraft]);

  const updateBlock = useCallback((id: string, updater: (block: DraftBlock) => DraftBlock) => {
    setDraftBlocks((current) => {
      let changed = false;
      const next = current.map((block) => {
        if (block.id !== id) return block;

        const updated = updater(block);
        if (updated !== block) changed = true;
        return updated;
      });

      return changed ? next : current;
    });
  }, []);
  const updateTextBlock = (id: string, patch: Partial<Pick<DraftTextBlock, 'bodyZh' | 'bodyEn'>>) => {
    updateBlock(id, (block) => (block.type === 'text' ? { ...block, ...patch } : block));
  };
  const updateReplayBlock = useCallback((id: string, updater: (block: DraftReplayBlock) => DraftReplayBlock) => {
    updateBlock(id, (block) => (block.type === 'puzzle-replay' ? updater(block) : block));
  }, [updateBlock]);
  const addBlock = (type: DraftBlock['type']) => {
    setDraftBlocks((current) => [...current, makeDraftBlock(type)]);
  };
  const insertBlock = (targetIndex: number, placement: 'before' | 'after', type: DraftBlock['type']) => {
    setDraftBlocks((current) => {
      const insertIndex = placement === 'before' ? targetIndex : targetIndex + 1;
      const safeIndex = Math.min(Math.max(insertIndex, 0), current.length);
      return [
        ...current.slice(0, safeIndex),
        makeDraftBlock(type),
        ...current.slice(safeIndex),
      ];
    });
  };
  const removeBlock = (id: string) => {
    setDraftBlocks((current) => current.filter((block) => block.id !== id));
  };
  const moveBlock = (id: string, direction: -1 | 1) => {
    setDraftBlocks((current) => {
      const index = current.findIndex((block) => block.id === id);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;

      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  };
  const updateReplaySize = (id: string, dimension: 'width' | 'height', value: number) => {
    updateReplayBlock(id, (block) => {
      const nextValue = Math.min(12, Math.max(3, value || 3));
      const width = dimension === 'width' ? nextValue : block.width;
      const height = dimension === 'height' ? nextValue : block.height;

      return {
        ...block,
        width,
        height,
        puzzleLink: '',
        puzzle: undefined,
        importError: null,
        boardSnapshot: undefined,
        boardResetToken: block.boardResetToken + 1,
        boardStartTime: Date.now(),
        steps: trimSteps(block.steps, width, height),
      };
    });
  };
  const updateReplayType = (id: string, puzzleType: PuzzleType) => {
    updateReplayBlock(id, (block) => ({
      ...block,
      puzzleType,
      puzzleLink: '',
      puzzle: undefined,
      importError: null,
      boardSnapshot: undefined,
      boardResetToken: block.boardResetToken + 1,
      boardStartTime: Date.now(),
    }));
  };
  const updateReplayPuzzleLink = (id: string, puzzleLink: string) => {
    updateReplayBlock(id, (block) => ({
      ...block,
      puzzleLink,
      importError: null,
    }));
  };
  const importReplayPuzzle = (id: string) => {
    updateReplayBlock(id, (block) => {
      const puzzleLink = block.puzzleLink.trim();
      const puzzle = parsePuzzleLink(puzzleLink);
      if (!puzzle) {
        return {
          ...block,
          importError: labels.invalidPuzzleLink,
        };
      }

      const metadataZh = getPuzzleMetadata(puzzle, 'zh-CN');
      const metadataEn = getPuzzleMetadata(puzzle, 'en');
      return {
        ...block,
        puzzleType: puzzle.type,
        puzzleLink,
        puzzle,
        importError: null,
        titleZh: shouldReplaceReplayTitle(block.titleZh, '过程') ? metadataZh.title : block.titleZh,
        titleEn: shouldReplaceReplayTitle(block.titleEn, 'Process') ? metadataEn.title : block.titleEn,
        width: puzzle.width,
        height: puzzle.height,
        boardSnapshot: undefined,
        boardResetToken: block.boardResetToken + 1,
        boardStartTime: Date.now(),
        steps: trimSteps(block.steps, puzzle.width, puzzle.height),
      };
    });
  };
  const handleReplaySnapshotChange = useCallback((id: string, snapshot: unknown) => {
    updateReplayBlock(id, (block) => {
      if (areUnknownEqual(block.boardSnapshot, snapshot)) return block;
      return {
        ...block,
        boardSnapshot: cloneUnknown(snapshot),
      };
    });
  }, [updateReplayBlock]);
  const handleReplayComplete = useCallback(() => undefined, []);
  const updateReplayStepNote = (
    blockId: string,
    stepIndex: number,
    localeKey: 'zh-CN' | 'en',
    value: string
  ) => {
    updateReplayBlock(blockId, (block) => ({
      ...block,
      steps: block.steps.map((step, index) =>
        index === stepIndex
          ? {
              ...step,
              note: {
                ...step.note,
                [localeKey]: value,
              },
            }
          : step
      ),
    }));
  };
  const removeReplayStep = (blockId: string, stepIndex: number) => {
    updateReplayBlock(blockId, (block) => ({
      ...block,
      steps: block.steps.filter((_, index) => index !== stepIndex),
    }));
  };
  const moveReplayStep = (blockId: string, stepIndex: number, direction: -1 | 1) => {
    updateReplayBlock(blockId, (block) => {
      const nextIndex = stepIndex + direction;
      if (nextIndex < 0 || nextIndex >= block.steps.length) return block;

      const steps = [...block.steps];
      [steps[stepIndex], steps[nextIndex]] = [steps[nextIndex], steps[stepIndex]];
      return {
        ...block,
        steps,
      };
    });
  };
  const loadReplayStepSnapshot = (blockId: string, stepIndex: number) => {
    updateReplayBlock(blockId, (block) => {
      const step = block.steps[stepIndex];
      if (!step) return block;

      return {
        ...block,
        boardSnapshot: cloneUnknown(step.snapshot),
        boardResetToken: block.boardResetToken + 1,
        boardStartTime: Date.now(),
      };
    });
  };
  const updateReplayStepSnapshot = (blockId: string, stepIndex: number) => {
    updateReplayBlock(blockId, (block) => ({
      ...block,
      steps: block.steps.map((step, index) =>
        index === stepIndex
          ? {
              ...step,
              snapshot: cloneUnknown(block.boardSnapshot),
              marks: [],
            }
          : step
      ),
    }));
  };
  const addReplayStep = (id: string) => {
    updateReplayBlock(id, (block) => {
      if (!block.puzzle) return block;

      const nextIndex = block.steps.length + 1;
      const step: NoteReplayStep = {
        title: {
          'zh-CN': `步骤 ${nextIndex}`,
          en: `Step ${nextIndex}`,
        },
        note: makeLocalizedBody(block.stepNoteZh, block.stepNoteEn),
        snapshot: cloneUnknown(block.boardSnapshot),
        marks: [],
      };

      return {
        ...block,
        steps: [...block.steps, step],
        stepNoteZh: '',
        stepNoteEn: '',
      };
    });
  };
  const copyNoteLink = useCallback(async (postId: string) => {
    const copied = await copyTextToClipboard(buildNotePageUrl(postId));
    if (!copied) return;

    setCopiedNoteId(postId);
    window.setTimeout(() => {
      setCopiedNoteId((current) => (current === postId ? null : current));
    }, 2000);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const writeDraft = (updateStatus: boolean) => {
      const savedAt = new Date().toISOString();
      const saved = writeStoredNoteEditorDraft({
        ...editorDraftSnapshot,
        savedAt,
      });
      if (saved && updateStatus) {
        setLastAutoSavedAt(savedAt);
      }
    };

    const timeoutId = window.setTimeout(() => writeDraft(true), 350);
    const handleBeforeUnload = () => writeDraft(false);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        writeDraft(false);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [editorDraftSnapshot]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const syncSelectedPostFromUrl = (preserveMode = false) => {
      const nextPost = findNotePostById(readNoteIdFromUrl());
      if (!nextPost) return;

      if (!preserveMode) {
        setMode('read');
      }
      setSelectedPostId((current) => (current === nextPost.id ? current : nextPost.id));
    };

    syncSelectedPostFromUrl(shouldRestoreEditorMode);
    const handlePopState = () => syncSelectedPostFromUrl(false);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [shouldRestoreEditorMode]);

  useEffect(() => {
    const siteTitle = locale === 'zh-CN' ? '每日纸笔谜题' : 'Daily Logic Puzzles';

    if (mode === 'read' && selectedPost) {
      setDocumentMetadata({
        title: `${selectedPost.title[locale]} | ${labels.title} | ${siteTitle}`,
        description: selectedPost.summary[locale] || labels.byline(selectedPost.author, selectedPost.date),
        url: window.location.href,
        type: 'article',
      });
      return;
    }

    if (mode === 'edit') {
      setDocumentMetadata({
        title: `${draftPost.title[locale]} | ${labels.editMode} | ${siteTitle}`,
        description: draftPost.summary[locale] || labels.byline(draftPost.author, draftPost.date),
        url: window.location.href,
        type: 'article',
      });
      return;
    }

    setDocumentMetadata({
      title: `${labels.title} | ${siteTitle}`,
      description: locale === 'zh-CN'
        ? '阅读和编辑纸笔谜题解题笔记。'
        : 'Read and edit pencil puzzle solving notes.',
      url: window.location.href,
      type: 'article',
    });
  }, [draftPost, labels, locale, mode, selectedPost]);

  useEffect(() => {
    if (mode !== 'read' || !selectedPost) return;
    syncNotePageUrl(selectedPost.id, 'replace');
  }, [mode, selectedPost]);

  return (
    <main className="space-y-4">
      <section className="border bg-card px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">{labels.title}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {mode === 'read' && selectedPost ? (
              <Button variant="outline" onClick={() => loadPostIntoDraft(selectedPost)}>
                <Edit3 />
                {labels.editCurrent}
              </Button>
            ) : null}
            <Button variant={mode === 'read' ? 'default' : 'outline'} onClick={() => setMode('read')}>
              <Eye />
              {labels.readMode}
            </Button>
            <Button variant={mode === 'edit' ? 'default' : 'outline'} onClick={() => setMode('edit')}>
              <Edit3 />
              {labels.editMode}
            </Button>
          </div>
        </div>
      </section>

      {mode === 'read' && selectedPost && (
        <section className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <aside className="border bg-card">
            <div className="divide-y">
              {notePosts.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  className={`block w-full px-4 py-3 text-left transition-colors hover:bg-muted ${
                    post.id === selectedPost.id ? 'bg-muted' : ''
                  }`}
                  onClick={() => {
                    setMode('read');
                    setSelectedPostId(post.id);
                    syncNotePageUrl(post.id, 'push');
                  }}
                >
                  <div className="font-semibold text-foreground">{post.title[locale]}</div>
                  <div className="mt-1 text-sm leading-5 text-muted-foreground">{post.summary[locale]}</div>
                </button>
              ))}
            </div>
          </aside>
          {renderPost(
            selectedPost,
            locale,
            labels,
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => copyNoteLink(selectedPost.id)}
            >
              <Link2 />
              {copiedNoteId === selectedPost.id ? labels.linkCopied : labels.copyLink}
            </Button>
          )}
        </section>
      )}

      {mode === 'read' && !selectedPost ? (
        <section className="border bg-card px-4 py-8 text-center text-muted-foreground sm:px-5">
          {labels.noPosts}
        </section>
      ) : null}

      {mode === 'edit' && (
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(24rem,0.9fr)]">
          <div className="space-y-4 border bg-card px-4 py-4 sm:px-5">
            <div className="-mx-4 -mt-4 border-b bg-muted/35 px-4 py-3 sm:-mx-5 sm:px-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-h-5 text-xs text-muted-foreground">{autoSaveText}</div>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button type="button" variant="outline" onClick={resetDraft}>
                    <Plus />
                    {labels.newNote}
                  </Button>
                  <Button asChild variant="outline">
                    <label>
                      <Upload />
                      {labels.openFile}
                      <input
                        type="file"
                        accept=".json,.penpuz-note.json,application/json"
                        className="sr-only"
                        onChange={openNoteFile}
                      />
                    </label>
                  </Button>
                  <Button onClick={() => downloadPostFile(draftPost)}>
                    <FileDown />
                    {labels.saveFile}
                  </Button>
                </div>
              </div>
            </div>
            {noteFileError ? <p className="text-sm text-destructive">{noteFileError}</p> : null}

            <div className="grid gap-3 border bg-background p-3 shadow-sm sm:grid-cols-2">
              <Input
                aria-label={labels.titleZh}
                placeholder={labels.titleZh}
                value={draftTitleZh}
                className="bg-card"
                onChange={(event) => setDraftTitleZh(event.target.value)}
              />
              <Input
                aria-label={labels.titleEn}
                placeholder={labels.titleEn}
                value={draftTitleEn}
                className="bg-card"
                onChange={(event) => setDraftTitleEn(event.target.value)}
              />
              <Input
                aria-label={labels.summaryZh}
                placeholder={labels.summaryZh}
                value={draftSummaryZh}
                className="bg-card"
                onChange={(event) => setDraftSummaryZh(event.target.value)}
              />
              <Input
                aria-label={labels.summaryEn}
                placeholder={labels.summaryEn}
                value={draftSummaryEn}
                className="bg-card"
                onChange={(event) => setDraftSummaryEn(event.target.value)}
              />
              <Input
                aria-label={labels.author}
                placeholder={labels.author}
                value={draftAuthor}
                className="bg-card"
                onChange={(event) => setDraftAuthor(event.target.value)}
              />
              <Input
                aria-label={labels.date}
                placeholder={labels.date}
                type="date"
                value={draftDate}
                className="bg-card"
                onChange={(event) => setDraftDate(event.target.value)}
              />
            </div>

            <div className="space-y-3 border-t pt-4">
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addBlock('text')}
                >
                  <FileText />
                  {labels.addTextBlock}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addBlock('puzzle-replay')}
                >
                  <Plus />
                  {labels.addReplayBlock}
                </Button>
              </div>

              {draftBlocks.map((block, index) => {
                const isReplayBlock = block.type === 'puzzle-replay';
                const blockShellClass = isReplayBlock
                  ? 'border-2 bg-muted/30'
                  : 'border bg-background';
                const blockHeaderClass = isReplayBlock
                  ? 'bg-muted/60'
                  : 'bg-muted/25';
                const blockBadgeClass = isReplayBlock
                  ? 'bg-muted text-foreground'
                  : 'bg-card text-foreground';

                return (
                  <section key={block.id} className={cn('space-y-3 overflow-hidden border p-3', blockShellClass)}>
                    <div
                      className={cn(
                        '-m-3 mb-3 flex flex-col gap-3 border-b px-3 py-3 sm:flex-row sm:items-start sm:justify-between',
                        blockHeaderClass
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <Badge variant="outline" className={blockBadgeClass}>
                          {isReplayBlock ? labels.replayBlock : labels.textBlock}
                        </Badge>
                        {isReplayBlock && (
                          <>
                            <Badge variant="outline">{getNotePuzzleTypeName(block.puzzleType, locale)}</Badge>
                            <Badge variant="outline">
                              {block.width} x {block.height}
                            </Badge>
                          </>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 sm:items-end">
                        <div className="grid grid-cols-2 gap-1 sm:flex sm:flex-wrap sm:justify-end">
                          <Button
                            type="button"
                            size="xs"
                            variant="outline"
                            className="bg-background"
                            onClick={() => insertBlock(index, 'before', 'text')}
                          >
                            <FileText />
                            {labels.insertTextAbove}
                          </Button>
                          <Button
                            type="button"
                            size="xs"
                            variant="outline"
                            className="bg-muted/60 hover:bg-muted"
                            onClick={() => insertBlock(index, 'before', 'puzzle-replay')}
                          >
                            <Plus />
                            {labels.insertReplayAbove}
                          </Button>
                          <Button
                            type="button"
                            size="xs"
                            variant="outline"
                            className="bg-background"
                            onClick={() => insertBlock(index, 'after', 'text')}
                          >
                            <FileText />
                            {labels.insertTextBelow}
                          </Button>
                          <Button
                            type="button"
                            size="xs"
                            variant="outline"
                            className="bg-muted/60 hover:bg-muted"
                            onClick={() => insertBlock(index, 'after', 'puzzle-replay')}
                          >
                            <Plus />
                            {labels.insertReplayBelow}
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-1 sm:justify-end">
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            disabled={index === 0}
                            onClick={() => moveBlock(block.id, -1)}
                            aria-label={labels.moveUp}
                            title={labels.moveUp}
                          >
                            <ArrowUp />
                          </Button>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            disabled={index === draftBlocks.length - 1}
                            onClick={() => moveBlock(block.id, 1)}
                            aria-label={labels.moveDown}
                            title={labels.moveDown}
                          >
                            <ArrowDown />
                          </Button>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => removeBlock(block.id)}
                            aria-label={labels.deleteBlock}
                            title={labels.deleteBlock}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {block.type === 'text' ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <textarea
                          aria-label={labels.bodyZh}
                          placeholder={labels.bodyZh}
                          value={block.bodyZh}
                          onChange={(event) => updateTextBlock(block.id, { bodyZh: event.target.value })}
                          className="min-h-32 w-full border-2 border-input bg-card px-3 py-2 text-base leading-7 outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
                        />
                        <textarea
                          aria-label={labels.bodyEn}
                          placeholder={labels.bodyEn}
                          value={block.bodyEn}
                          onChange={(event) => updateTextBlock(block.id, { bodyEn: event.target.value })}
                          className="min-h-32 w-full border-2 border-input bg-card px-3 py-2 text-base leading-7 outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
                        />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Input
                            aria-label={labels.replayTitleZh}
                            placeholder={labels.replayTitleZh}
                            value={block.titleZh}
                            className="bg-card"
                            onChange={(event) =>
                              updateReplayBlock(block.id, (current) => ({ ...current, titleZh: event.target.value }))
                            }
                          />
                          <Input
                            aria-label={labels.replayTitleEn}
                            placeholder={labels.replayTitleEn}
                            value={block.titleEn}
                            className="bg-card"
                            onChange={(event) =>
                              updateReplayBlock(block.id, (current) => ({ ...current, titleEn: event.target.value }))
                            }
                          />
                          <select
                            aria-label={labels.puzzleType}
                            value={block.puzzleType}
                            onChange={(event) => updateReplayType(block.id, event.target.value as PuzzleType)}
                            className="min-h-11 w-full border-2 border-input bg-card px-3 py-2 text-base"
                          >
                            {notePuzzleTypeOptions.map((option) => (
                              <option key={option.type} value={option.type}>
                                {option.name[locale]}
                              </option>
                            ))}
                          </select>
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              aria-label={labels.width}
                              placeholder={labels.width}
                              type="number"
                              min={3}
                              max={12}
                              value={block.width}
                              className="bg-card"
                              onChange={(event) => updateReplaySize(block.id, 'width', Number(event.target.value))}
                            />
                            <Input
                              aria-label={labels.height}
                              placeholder={labels.height}
                              type="number"
                              min={3}
                              max={12}
                              value={block.height}
                              className="bg-card"
                              onChange={(event) => updateReplaySize(block.id, 'height', Number(event.target.value))}
                            />
                          </div>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                          <Input
                            aria-label={labels.puzzleLink}
                            placeholder={labels.puzzleLink}
                            value={block.puzzleLink}
                            className="bg-card"
                            onChange={(event) => updateReplayPuzzleLink(block.id, event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key !== 'Enter') return;
                              event.preventDefault();
                              importReplayPuzzle(block.id);
                            }}
                          />
                          <Button type="button" variant="outline" onClick={() => importReplayPuzzle(block.id)}>
                            {labels.importPuzzle}
                          </Button>
                          {block.importError ? (
                            <p className="text-sm text-destructive sm:col-span-2">{block.importError}</p>
                          ) : null}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <textarea
                            aria-label={labels.stepNoteZh}
                            placeholder={labels.stepNoteZh}
                            value={block.stepNoteZh}
                            onChange={(event) =>
                              updateReplayBlock(block.id, (current) => ({
                                ...current,
                                stepNoteZh: event.target.value,
                              }))
                            }
                            className="min-h-24 w-full border-2 border-input bg-card px-3 py-2 text-base leading-7 outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
                          />
                          <textarea
                            aria-label={labels.stepNoteEn}
                            placeholder={labels.stepNoteEn}
                            value={block.stepNoteEn}
                            onChange={(event) =>
                              updateReplayBlock(block.id, (current) => ({
                                ...current,
                                stepNoteEn: event.target.value,
                              }))
                            }
                            className="min-h-24 w-full border-2 border-input bg-card px-3 py-2 text-base leading-7 outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
                          />
                        </div>

                        {block.puzzle ? (
                          <div className="overflow-x-auto border bg-[#f6efe4] p-3 dark:bg-gray-950">
                            <ReplayBoardEditor
                              key={`${block.id}-${block.boardResetToken}`}
                              blockId={block.id}
                              puzzle={block.puzzle}
                              startTime={block.boardStartTime}
                              resetToken={block.boardResetToken}
                              initialSnapshot={block.boardSnapshot}
                              onComplete={handleReplayComplete}
                              onSnapshotChange={handleReplaySnapshotChange}
                            />
                          </div>
                        ) : null}

                        <div className="flex flex-wrap items-center gap-2">
                          <Button type="button" disabled={!block.puzzle} onClick={() => addReplayStep(block.id)}>
                            <Plus />
                            {labels.addStep}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            disabled={block.steps.length === 0}
                            onClick={() =>
                              updateReplayBlock(block.id, (current) => ({
                                ...current,
                                steps: current.steps.slice(0, -1),
                              }))
                            }
                          >
                            <Trash2 />
                            {labels.removeStep}
                          </Button>
                          <Badge variant="outline">{labels.stepsCount(block.steps.length)}</Badge>
                        </div>

                        {block.steps.length > 0 ? (
                          <div className="grid gap-3">
                            {block.steps.map((step, stepIndex) => {
                              const stepNoteZh = getLocalizedValue(step.note, 'zh-CN');
                              const stepNoteEn = getLocalizedValue(step.note, 'en');

                              return (
                                <section
                                  key={`${block.id}-step-${stepIndex}`}
                                  className="grid gap-3 border bg-background p-3 shadow-sm"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <Badge variant="outline">{stepIndex + 1}</Badge>
                                    <div className="flex flex-wrap gap-1">
                                      <Button
                                        type="button"
                                        size="icon-sm"
                                        variant="ghost"
                                        disabled={stepIndex === 0}
                                        onClick={() => moveReplayStep(block.id, stepIndex, -1)}
                                        aria-label={labels.moveUp}
                                        title={labels.moveUp}
                                      >
                                        <ArrowUp />
                                      </Button>
                                      <Button
                                        type="button"
                                        size="icon-sm"
                                        variant="ghost"
                                        disabled={stepIndex === block.steps.length - 1}
                                        onClick={() => moveReplayStep(block.id, stepIndex, 1)}
                                        aria-label={labels.moveDown}
                                        title={labels.moveDown}
                                      >
                                        <ArrowDown />
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        disabled={!block.puzzle || step.snapshot === undefined}
                                        onClick={() => loadReplayStepSnapshot(block.id, stepIndex)}
                                      >
                                        <RotateCcw />
                                        {labels.loadStep}
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        disabled={!block.puzzle}
                                        onClick={() => updateReplayStepSnapshot(block.id, stepIndex)}
                                      >
                                        <Save />
                                        {labels.updateStep}
                                      </Button>
                                      <Button
                                        type="button"
                                        size="icon-sm"
                                        variant="ghost"
                                        onClick={() => removeReplayStep(block.id, stepIndex)}
                                        aria-label={labels.deleteBlock}
                                        title={labels.deleteBlock}
                                      >
                                        <Trash2 />
                                      </Button>
                                    </div>
                                  </div>

                                  <div className="grid gap-3 sm:grid-cols-2">
                                    <textarea
                                      aria-label={labels.stepNoteZh}
                                      placeholder={labels.stepNoteZh}
                                      value={stepNoteZh}
                                      onChange={(event) =>
                                        updateReplayStepNote(block.id, stepIndex, 'zh-CN', event.target.value)
                                      }
                                      className="min-h-24 w-full border-2 border-input bg-card px-3 py-2 text-base leading-7 outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
                                    />
                                    <textarea
                                      aria-label={labels.stepNoteEn}
                                      placeholder={labels.stepNoteEn}
                                      value={stepNoteEn}
                                      onChange={(event) =>
                                        updateReplayStepNote(block.id, stepIndex, 'en', event.target.value)
                                      }
                                      className="min-h-24 w-full border-2 border-input bg-card px-3 py-2 text-base leading-7 outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
                                    />
                                  </div>

                                  <div className="overflow-x-auto">
                                    <NotePuzzleBoard
                                      puzzle={block.puzzle}
                                      puzzleType={block.puzzleType}
                                      width={block.width}
                                      height={block.height}
                                      snapshot={step.snapshot}
                                      marks={step.marks}
                                      cellSize={30}
                                      ariaLabel={step.title[locale]}
                                    />
                                  </div>
                                </section>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          </div>

          <div className="border bg-muted/25 p-3">
            {renderPost(draftPost, locale, labels)}
          </div>
        </section>
      )}
    </main>
  );
}

export default NotesPage;
