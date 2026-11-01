// src/App.tsx

import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Check, ChevronLeft, ChevronRight, Flame, History, Languages, LayoutGrid, ListVideo, Moon, NotebookText, Pause, Play, Puzzle, Share2, Sun, Timer, Trophy, UserPen, X } from 'lucide-react';
import RulesSection from './components/RulesSection';
import CompletionModal from './components/CompletionModal';
import KeyboardShortcutsDialog from './components/KeyboardShortcutsDialog';
import SolveReplayDialog, { type SolveTimelineEntry } from './components/SolveReplayDialog';
import {
  readSavedCompletion,
  readSavedProgress,
  useDailyPuzzleSession,
} from './hooks/useDailyPuzzleSession';
import { getPuzzleTemplate, parsePuzzleLink, renderPuzzleBoard } from './puzzles/registry';
import DifficultyBadge from './components/DifficultyBadge';
import DifficultyStars from './components/DifficultyStars';
import { RestartActionContext } from './components/RestartActionContext';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { useI18n } from './i18n/useI18n';
import { setDocumentMetadata } from './lib/documentMetadata';
import { getPuzzleMetadata } from './puzzles/puzzleMetadata';
import {
  puzzleDifficultyLabels,
  type PuzzleData,
  type PuzzleDifficulty,
  type PuzzleType,
} from './puzzles/types';
import { formatMinutesSeconds } from './lib/formatDuration';
import { Card } from './components/ui/card';
import { useTheme } from './hooks/useTheme';
import { isKeyboardInputTarget } from './lib/keyboard';
import { getBeijingDateStr } from './puzzles/database';
import { readLocalStorage, removeLocalStorage, writeLocalStorage } from './lib/safeStorage';

const HISTORY_PAGE_SIZE = 5;
const RuleQuickReferenceDialog = lazy(() => import('./components/RuleQuickReferenceDialog'));
const NotesPage = lazy(() => import('./components/notes/NotesPage'));
const DatabasePuzzleTestPage = lazy(() => import('./components/DatabasePuzzleTestPage'));
// Hidden page: only reachable through the `?page=all-puzzles` link and
// intentionally absent from every navigation UI.
const AllPuzzlesPage = lazy(() => import('./components/AllPuzzlesPage'));

type ActivePage = 'puzzle' | 'notes' | 'database-test' | 'all-puzzles';

function getPreviousDateStr(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const previous = new Date(Date.UTC(year, month - 1, day - 1));
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${previous.getUTCFullYear()}-${pad(previous.getUTCMonth() + 1)}-${pad(previous.getUTCDate())}`;
}

const SOLVE_TIMELINE_MAX_ENTRIES = 400;
const SOLVE_TIMELINE_MIN_INTERVAL_MS = 1500;

function getSolveTimelineKey(dateStr: string) {
  return `puzzle-timeline-${dateStr}`;
}

function readSolveTimeline(dateStr: string): SolveTimelineEntry[] {
  try {
    const raw = readLocalStorage(getSolveTimelineKey(dateStr));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return [];
    const entries = (parsed as { version?: unknown; entries?: unknown }).entries;
    if (!Array.isArray(entries)) return [];
    return entries.filter(
      (entry): entry is SolveTimelineEntry =>
        !!entry &&
        typeof entry === 'object' &&
        typeof (entry as SolveTimelineEntry).t === 'number' &&
        (entry as SolveTimelineEntry).snapshot !== undefined
    );
  } catch {
    return [];
  }
}

function persistSolveTimeline(dateStr: string, entries: SolveTimelineEntry[]) {
  try {
    writeLocalStorage(getSolveTimelineKey(dateStr), JSON.stringify({ version: 1, entries }));
  } catch {
    // Timeline capture is best-effort.
  }
}

function clearSolveTimeline(dateStr: string) {
  try {
    removeLocalStorage(getSolveTimelineKey(dateStr));
  } catch {
    // ignore
  }
}

function readActivePageFromUrl(): ActivePage {
  if (typeof window === 'undefined') return 'puzzle';
  const params = new URLSearchParams(window.location.search);
  if (params.get('page') === 'all-puzzles') return 'all-puzzles';
  if (params.get('page') === 'database-test' || params.get('page') === 'test') return 'database-test';
  return params.has('note') || params.get('page') === 'notes' ? 'notes' : 'puzzle';
}

function pushAppPageUrl(page: ActivePage, currentDateStr?: string, todayDateStr?: string) {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  if (page === 'puzzle') {
    url.searchParams.delete('note');
    url.searchParams.delete('page');
    if (currentDateStr && todayDateStr) {
      if (currentDateStr === todayDateStr) {
        url.searchParams.delete('date');
      } else {
        url.searchParams.set('date', currentDateStr);
      }
    }
  } else if (page === 'notes') {
    url.searchParams.delete('date');
    if (url.searchParams.has('note')) {
      url.searchParams.delete('page');
    } else {
      url.searchParams.set('page', 'notes');
    }
  } else {
    url.searchParams.delete('date');
    url.searchParams.delete('note');
    url.searchParams.set('page', 'database-test');
  }

  const nextUrl = url.toString();
  if (nextUrl !== window.location.href) {
    window.history.pushState(null, '', nextUrl);
  }
}

function readPuzzleLinkFromUrl() {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);
  if (params.has('date') || params.has('note') || params.get('page') === 'notes') return null;

  return parsePuzzleLink(window.location.href);
}

function App() {
  const [activePage, setActivePage] = useState<ActivePage>(() => readActivePageFromUrl());
  const [urlVersion, setUrlVersion] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTypeFilter, setHistoryTypeFilter] = useState<PuzzleType | 'all'>('all');
  const [historyDifficultyFilter, setHistoryDifficultyFilter] = useState<PuzzleDifficulty | 'all'>('all');
  const [restartDialogOpen, setRestartDialogOpen] = useState(false);
  const [timerPaused, setTimerPaused] = useState(false);
  const [replayOpen, setReplayOpen] = useState(false);
  const [replaySessionId, setReplaySessionId] = useState(0);
  const [replayEntries, setReplayEntries] = useState<SolveTimelineEntry[]>([]);
  const [timelineCount, setTimelineCount] = useState(0);
  const solveTimelineRef = useRef<SolveTimelineEntry[]>([]);
  const lastTimelineRecordAtRef = useRef(0);
  const [ruleReferenceOpen, setRuleReferenceOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [copiedHistoryDate, setCopiedHistoryDate] = useState<string | null>(null);
  const [directBoardInstance, setDirectBoardInstance] = useState(0);
  const [directStartTime, setDirectStartTime] = useState(() => Date.now());
  const [directElapsedTime, setDirectElapsedTime] = useState(0);
  const [directAttemptCompleted, setDirectAttemptCompleted] = useState(false);
  const [directBoardSnapshot, setDirectBoardSnapshot] = useState<unknown>(null);
  const { locale, copy, toggleLocale } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const {
    todayDaily,
    daily,
    history,
    boardInstance,
    started,
    startTime,
    elapsedTime,
    attemptCompleted,
    resultTime,
    resultOpen,
    savedCompletion,
    showHistory,
    boardSnapshot,
    handleStart,
    handleRestartPreserveTime,
    handleRestartResetTime,
    handleComplete,
    handleViewResult,
    handleBoardProgress,
    closeCompletion,
    openHistory,
    closeHistory,
    loadHistoryPuzzle,
    buildHistoryShareUrl,
  } = useDailyPuzzleSession(timerPaused);
  const linkedPuzzle = useMemo(
    () => {
      void urlVersion;
      return activePage === 'puzzle' ? readPuzzleLinkFromUrl() : null;
    },
    [activePage, urlVersion]
  );
  const linkedPuzzleKey = linkedPuzzle && typeof window !== 'undefined' ? window.location.href : null;
  const isDirectPuzzle = !!linkedPuzzle;

  const handleOpenHistory = useCallback(() => {
    setHistoryPage(1);
    setHistoryTypeFilter('all');
    setHistoryDifficultyFilter('all');
    openHistory();
  }, [openHistory]);
  const handleOpenRestartDialog = useCallback(() => {
    setRestartDialogOpen(true);
  }, []);
  const handleDirectComplete = useCallback((finalTime: number) => {
    setDirectElapsedTime(finalTime);
    setDirectAttemptCompleted(true);
  }, []);
  const handleDirectBoardProgress = useCallback((snapshot: unknown) => {
    setDirectBoardSnapshot(snapshot);
  }, []);
  const restartDirectPuzzle = useCallback((nextElapsedTime: number) => {
    setDirectStartTime(Date.now() - nextElapsedTime * 1000);
    setDirectElapsedTime(nextElapsedTime);
    setDirectAttemptCompleted(false);
    setDirectBoardSnapshot(null);
    setDirectBoardInstance((value) => value + 1);
  }, []);
  useEffect(() => {
    if (!daily || isDirectPuzzle) return;
    const entries = readSolveTimeline(daily.dateStr);
    solveTimelineRef.current = entries;
    lastTimelineRecordAtRef.current = 0;
    setTimelineCount(entries.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daily?.dateStr, isDirectPuzzle]);

  const handleBoardProgressWithTimeline = useCallback((snapshot: unknown) => {
    if (isDirectPuzzle) {
      handleDirectBoardProgress(snapshot);
      return;
    }
    handleBoardProgress(snapshot);
    if (!daily) return;

    const now = Date.now();
    if (now - lastTimelineRecordAtRef.current < SOLVE_TIMELINE_MIN_INTERVAL_MS) return;
    lastTimelineRecordAtRef.current = now;

    const entries = solveTimelineRef.current;
    if (entries.length >= SOLVE_TIMELINE_MAX_ENTRIES) entries.shift();
    entries.push({ t: elapsedTime, snapshot });
    persistSolveTimeline(daily.dateStr, entries);
    setTimelineCount(entries.length);
  }, [daily, elapsedTime, handleBoardProgress, handleDirectBoardProgress, isDirectPuzzle]);

  const resetSolveTimeline = useCallback(() => {
    solveTimelineRef.current = [];
    lastTimelineRecordAtRef.current = 0;
    setTimelineCount(0);
    if (daily) clearSolveTimeline(daily.dateStr);
  }, [daily]);

  const openReplay = useCallback(() => {
    if (!daily) return;
    const entries = readSolveTimeline(daily.dateStr);
    if (entries.length < 2) return;
    setReplayEntries(entries);
    setReplaySessionId((current) => current + 1);
    setReplayOpen(true);
  }, [daily]);

  const handleRestartWithTime = useCallback(() => {
    setTimerPaused(false);
    resetSolveTimeline();
    if (isDirectPuzzle) {
      restartDirectPuzzle(directElapsedTime);
    } else {
      handleRestartPreserveTime();
    }
    setRestartDialogOpen(false);
  }, [directElapsedTime, handleRestartPreserveTime, isDirectPuzzle, resetSolveTimeline, restartDirectPuzzle]);
  const handleRestartFromZero = useCallback(() => {
    setTimerPaused(false);
    resetSolveTimeline();
    if (isDirectPuzzle) {
      restartDirectPuzzle(0);
    } else {
      handleRestartResetTime();
    }
    setRestartDialogOpen(false);
  }, [handleRestartResetTime, isDirectPuzzle, resetSolveTimeline, restartDirectPuzzle]);
  const handleOpenPuzzlePage = useCallback(() => {
    closeHistory();
    setActivePage('puzzle');
    pushAppPageUrl('puzzle', daily?.dateStr, todayDaily?.dateStr);
  }, [closeHistory, daily?.dateStr, todayDaily?.dateStr]);
  const handleOpenNotesPage = useCallback(() => {
    closeHistory();
    setActivePage('notes');
    pushAppPageUrl('notes');
  }, [closeHistory]);

  const copyHistoryLink = useCallback(async (url: string, dateStr: string) => {
    let copied = false;

    try {
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        copied = true;
      }
    } catch {
      copied = false;
    }

    if (!copied) {
      const textArea = document.createElement('textarea');
      textArea.value = url;
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

    if (copied) {
      setCopiedHistoryDate(dateStr);
      window.setTimeout(() => {
        setCopiedHistoryDate((current) => (current === dateStr ? null : current));
      }, 2000);
    }
  }, []);

  const renderBoard = useCallback(() => {
    const activePuzzle: PuzzleData | undefined = linkedPuzzle ?? daily?.puzzle;
    const activeStartTime = linkedPuzzle ? directStartTime : startTime;
    if (!activePuzzle || !activeStartTime) return null;

    return renderPuzzleBoard(
      activePuzzle,
      activeStartTime,
      linkedPuzzle ? directBoardInstance : boardInstance,
      linkedPuzzle ? handleDirectComplete : handleComplete,
      linkedPuzzle ? directBoardSnapshot : boardSnapshot,
      handleBoardProgressWithTimeline,
    );
  }, [
    boardInstance,
    boardSnapshot,
    daily?.puzzle,
    directBoardInstance,
    directBoardSnapshot,
    directStartTime,
    handleBoardProgressWithTimeline,
    handleComplete,
    handleDirectComplete,
    linkedPuzzle,
    startTime,
  ]);
  const historyItems = useMemo(() => {
    if (!todayDaily || !daily) return [];

    const allItems = [todayDaily, daily, ...history];
    const byDate = new Map(allItems.map((item) => [item.dateStr, item]));

    return Array.from(byDate.values())
      .sort((left, right) => right.dateStr.localeCompare(left.dateStr))
      .map((item) => {
        const completion = readSavedCompletion(item.dateStr);
        const progress = completion ? null : readSavedProgress(item.dateStr);

        return {
          ...item,
          completion,
          progress,
          isCurrent: item.dateStr === daily.dateStr,
          isToday: item.dateStr === todayDaily.dateStr,
        };
      });
  }, [daily, history, todayDaily]);
  const historyTypes = useMemo(() => {
    const types = Array.from(new Set(historyItems.map((item) => item.puzzle.type)));
    return types.sort((left, right) =>
      getPuzzleTemplate(left).name[locale].localeCompare(getPuzzleTemplate(right).name[locale], locale)
    );
  }, [historyItems, locale]);
  const filteredHistoryItems = useMemo(() => {
    return historyItems.filter((item) => {
      const typeMatches = historyTypeFilter === 'all' || item.puzzle.type === historyTypeFilter;
      const difficultyMatches =
        historyDifficultyFilter === 'all' || item.difficulty === historyDifficultyFilter;
      return typeMatches && difficultyMatches;
    });
  }, [historyDifficultyFilter, historyItems, historyTypeFilter]);
  const totalHistoryPages = Math.max(1, Math.ceil(filteredHistoryItems.length / HISTORY_PAGE_SIZE));
  const safeHistoryPage = Math.min(historyPage, totalHistoryPages);
  const pagedHistoryItems = useMemo(() => {
    const startIndex = (safeHistoryPage - 1) * HISTORY_PAGE_SIZE;
    return filteredHistoryItems.slice(startIndex, startIndex + HISTORY_PAGE_SIZE);
  }, [filteredHistoryItems, safeHistoryPage]);
  const historyPlaceholderCount = Math.max(0, HISTORY_PAGE_SIZE - pagedHistoryItems.length);

  useEffect(() => {
    setHistoryPage(1);
  }, [historyDifficultyFilter, historyTypeFilter]);

  useEffect(() => {
    if (!showHistory) return;

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [showHistory]);

  useEffect(() => {
    if (!showHistory) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;

      const shouldClose =
        event.key === 'Escape' ||
        event.key === 'Backspace' ||
        event.key === 'Enter' ||
        event.code === 'Space';

      if (!shouldClose) return;

      event.preventDefault();
      closeHistory();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeHistory, showHistory]);

  useEffect(() => {
    const syncPageFromUrl = () => {
      setActivePage(readActivePageFromUrl());
      setUrlVersion((value) => value + 1);
    };
    window.addEventListener('popstate', syncPageFromUrl);
    return () => window.removeEventListener('popstate', syncPageFromUrl);
  }, []);

  // `?` opens the keyboard shortcut panel.
  useEffect(() => {
    const handleShortcutKeyDown = (event: KeyboardEvent) => {
      if (event.key !== '?') return;
      const target = event.target as HTMLElement | null;
      if (isKeyboardInputTarget(target)) return;
      event.preventDefault();
      setShortcutsOpen((current) => !current);
    };
    document.addEventListener('keydown', handleShortcutKeyDown);
    return () => document.removeEventListener('keydown', handleShortcutKeyDown);
  }, []);

  useEffect(() => {
    if (!linkedPuzzleKey) return;

    setDirectStartTime(Date.now());
    setDirectElapsedTime(0);
    setDirectAttemptCompleted(false);
    setDirectBoardSnapshot(null);
    setDirectBoardInstance((value) => value + 1);
  }, [linkedPuzzleKey]);

  useEffect(() => {
    if (!linkedPuzzleKey || directAttemptCompleted || timerPaused) return;

    const interval = window.setInterval(() => {
      setDirectElapsedTime(Math.floor((Date.now() - directStartTime) / 1000));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [directAttemptCompleted, directStartTime, linkedPuzzleKey, timerPaused]);

  // Rebasing the direct start time on resume prevents the timer jumping.
  useEffect(() => {
    if (timerPaused) return;
    setDirectStartTime(Date.now() - directElapsedTime * 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerPaused]);

  useEffect(() => {
    if (!daily || activePage !== 'puzzle') return;

    const puzzle = linkedPuzzle ?? daily.puzzle;
    const metadata = getPuzzleMetadata(puzzle, locale);

    if (linkedPuzzle) {
      setDocumentMetadata({
        title: `${metadata.title} | ${copy.app.siteTitle}`,
        description: locale === 'zh-CN'
          ? `在线查看和游玩这道 ${metadata.description}`
          : `View and solve this ${metadata.description}`,
        url: window.location.href,
      });
      return;
    }

    const difficultyText = puzzleDifficultyLabels[daily.difficulty][locale];
    setDocumentMetadata({
      title: `${daily.dateStr} ${metadata.title} | ${copy.app.siteTitle}`,
      description: locale === 'zh-CN'
        ? `${daily.dateStr} 第 ${daily.index + 1} 题，难度 ${difficultyText}。${metadata.description}`
        : `${daily.dateStr} puzzle ${daily.index + 1}, ${difficultyText}. ${metadata.description}`,
      url: window.location.href,
    });
  }, [activePage, copy.app.siteTitle, daily, linkedPuzzle, locale]);

  if (activePage === 'database-test') {
    return (
      <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading…</div>}>
        <DatabasePuzzleTestPage />
      </Suspense>
    );
  }

  if (activePage === 'all-puzzles') {
    return (
      <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading…</div>}>
        <AllPuzzlesPage />
      </Suspense>
    );
  }

  if (!daily) return <div className="text-center py-12">{copy.app.loadingDailyPuzzle}</div>;

  const activePuzzle = linkedPuzzle ?? daily.puzzle;
  const template = linkedPuzzle ? getPuzzleTemplate(linkedPuzzle.type) : daily.template;
  const metadata = getPuzzleMetadata(activePuzzle, locale);
  const hasResult = isDirectPuzzle ? directAttemptCompleted : attemptCompleted || !!savedCompletion;
  const activeStarted = isDirectPuzzle || started;
  const activeElapsedTime = isDirectPuzzle ? directElapsedTime : elapsedTime;
  const puzzleName = template.name[locale];
  const authorText = isDirectPuzzle ? null : daily.author;
  const isPuzzlePage = activePage === 'puzzle';

  const [startYear, startMonth, startDay] = daily.dateStr.split('-').map(Number);
  const startCardDate = {
    dateText: new Intl.DateTimeFormat(locale === 'zh-CN' ? 'zh-CN' : 'en-US', {
      timeZone: 'UTC',
      month: 'long',
      day: 'numeric',
    }).format(new Date(Date.UTC(startYear, startMonth - 1, startDay))),
    weekday: new Intl.DateTimeFormat(locale === 'zh-CN' ? 'zh-CN' : 'en-US', {
      timeZone: 'UTC',
      weekday: 'long',
    }).format(new Date(Date.UTC(startYear, startMonth - 1, startDay))),
  };

  const streakCount = (() => {
    let cursor = getBeijingDateStr();
    let count = 0;
    if (!readSavedCompletion(cursor)) {
      cursor = getPreviousDateStr(cursor);
    }
    while (readSavedCompletion(cursor)) {
      count += 1;
      cursor = getPreviousDateStr(cursor);
    }
    return count;
  })();

  return (
    <div className="min-h-screen bg-background py-4 dark:bg-background">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* 标题栏 */}
        <Card className="mb-4 border-[#d7c7b4] bg-card p-4 dark:border-gray-700 dark:bg-card">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="flex items-center gap-2.5 text-3xl font-bold text-foreground sm:text-4xl">
                <Puzzle className="size-7 shrink-0 text-primary sm:size-8" aria-hidden="true" />
                {copy.app.siteTitle}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <Button
                variant={isPuzzlePage ? 'default' : 'outline'}
                size="icon"
                onClick={handleOpenPuzzlePage}
                aria-label={copy.app.puzzleTab}
                title={copy.app.puzzleTab}
              >
                <Puzzle />
              </Button>
              <Button
                variant={activePage === 'notes' ? 'default' : 'outline'}
                size="icon"
                onClick={handleOpenNotesPage}
                aria-label={copy.app.notesTab}
                title={copy.app.notesTab}
              >
                <NotebookText />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleLocale}
                aria-label={copy.app.languageButtonLabel}
                title={copy.app.languageButtonLabel}
              >
                <Languages />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setRuleReferenceOpen(true)}
                aria-label={copy.app.rulesReference}
                title={copy.app.rulesReference}
              >
                <BookOpen />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleOpenHistory}
                disabled={!isPuzzlePage || isDirectPuzzle}
                aria-label={copy.app.viewHistory}
                title={copy.app.viewHistory}
              >
                <History />
              </Button>
            </div>
          </div>
        </Card>

        {isPuzzlePage ? (
          <>
            {!activeStarted ? (
              <Card className="mx-auto max-w-lg border-[#d7c7b4] bg-card p-5 dark:border-gray-700 dark:bg-card">
                <div className="space-y-3 text-center">
                  <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">{puzzleName}</h2>
                  <div className="text-sm font-medium text-muted-foreground">
                    {startCardDate.dateText} · {startCardDate.weekday}
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {!isDirectPuzzle && <DifficultyBadge difficulty={daily.difficulty} />}
                    {authorText && (
                      <Badge
                        variant="outline"
                        className="border-[#bca286] bg-secondary text-sm text-[#5a3d27] dark:border-gray-600 dark:bg-muted dark:text-gray-100"
                      >
                        <UserPen className="size-3.5" aria-hidden="true" />
                        {authorText}
                      </Badge>
                    )}
                    <span className="text-sm font-medium text-muted-foreground">
                      {copy.app.puzzleNumber(daily.index + 1)}
                    </span>
                    {streakCount > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-orange-300 bg-orange-50 px-2.5 py-0.5 text-sm font-medium text-orange-700 dark:border-orange-900/70 dark:bg-orange-950/40 dark:text-orange-300">
                        <Flame className="size-3.5" aria-hidden="true" />
                        {copy.app.streak(streakCount)}
                      </span>
                    )}
                  </div>
                  <div className="pt-1">
                    <Button
                      onClick={() => {
                        setTimerPaused(false);
                        resetSolveTimeline();
                        handleStart();
                      }}
                      size="icon-lg"
                      className="size-14 rounded-full shadow-sm"
                      aria-label={copy.app.startPuzzle}
                      title={copy.app.startPuzzle}
                    >
                      <Play className="size-6" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <>
                <div className="mb-4 grid gap-2 border-b px-1 pb-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
                  <div className="flex items-center gap-2 text-xl font-semibold text-foreground sm:text-left sm:text-2xl">
                    <Timer className="size-5 shrink-0 text-muted-foreground sm:size-6" aria-hidden="true" />
                    {copy.app.elapsedTime(activeElapsedTime)}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setTimerPaused((current) => !current)}
                      aria-label={timerPaused ? copy.app.resumeTimer : copy.app.pauseTimer}
                      title={timerPaused ? copy.app.resumeTimer : copy.app.pauseTimer}
                    >
                      {timerPaused ? <Play /> : <Pause />}
                    </Button>
                  </div>
                  <div className="text-base text-muted-foreground sm:text-center">
                    {isDirectPuzzle ? metadata.title : copy.app.puzzleSummary(puzzleName, daily.index + 1)}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    {!isDirectPuzzle && authorText && (
                      <Badge
                        variant="outline"
                        className="border-[#bca286] bg-secondary text-sm text-[#5a3d27] dark:border-gray-600 dark:bg-muted dark:text-gray-100"
                      >
                        <UserPen className="size-3.5" aria-hidden="true" />
                        {authorText}
                      </Badge>
                    )}
                    {!isDirectPuzzle && hasResult && (
                      <Button
                        onClick={handleViewResult}
                        variant="ghost"
                        size="icon-sm"
                        aria-label={copy.app.viewResults}
                        title={copy.app.viewResults}
                      >
                        <Trophy />
                      </Button>
                    )}
                    {!isDirectPuzzle && timelineCount >= 2 && (
                      <Button
                        onClick={openReplay}
                        variant="ghost"
                        size="icon-sm"
                        aria-label={copy.app.replayTitle}
                        title={copy.app.replayTitle}
                      >
                        <ListVideo />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="mb-12 flex w-full min-w-0 justify-center">
                  <RestartActionContext.Provider value={handleOpenRestartDialog}>
                    <div className="relative w-full min-w-0">
                      {renderBoard()}
                      {timerPaused ? (
                        <button
                          type="button"
                          onClick={() => setTimerPaused(false)}
                          aria-label={copy.app.resumeTimer}
                          title={copy.app.resumeTimer}
                          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-xl bg-background/70 backdrop-blur-md"
                        >
                          <span className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                            <Play className="size-7" aria-hidden="true" />
                          </span>
                        </button>
                      ) : null}
                    </div>
                  </RestartActionContext.Provider>
                </div>
              </>
            )}

            <RulesSection template={template} />
          </>
        ) : (
          <Suspense fallback={<div className="border bg-card p-6 text-muted-foreground">{copy.app.loadingDailyPuzzle}</div>}>
            <NotesPage />
          </Suspense>
        )}

        {ruleReferenceOpen && (
          <Suspense fallback={null}>
            <RuleQuickReferenceDialog
              isOpen={ruleReferenceOpen}
              onClose={() => setRuleReferenceOpen(false)}
              labels={{
                title: copy.app.rulesReferenceTitle,
                searchPlaceholder: copy.app.rulesReferenceSearchPlaceholder,
                resultCount: copy.app.rulesReferenceResultCount,
                noMatches: copy.app.rulesReferenceNoMatches,
                close: copy.app.close,
                chineseRules: copy.app.rulesReferenceChineseRules,
                englishRules: copy.app.rulesReferenceEnglishRules,
                pzprSource: copy.app.rulesReferencePzprSource,
                translatedSource: copy.app.rulesReferenceTranslatedSource,
                appSource: copy.app.rulesReferenceAppSource,
              }}
            />
          </Suspense>
        )}

        <KeyboardShortcutsDialog
          open={shortcutsOpen}
          onClose={() => setShortcutsOpen(false)}
          puzzleType={activePuzzle?.type ?? null}
        />

        <SolveReplayDialog
          key={replaySessionId}
          open={replayOpen}
          onClose={() => setReplayOpen(false)}
          puzzle={activePuzzle}
          entries={replayEntries}
        />

        {/* 历史题目列表 Modal */}
        {showHistory && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3"
            onClick={closeHistory}
          >
            <Card
              className="flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden border-[#d7c7b4] bg-card dark:border-gray-700 dark:bg-card"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label={copy.app.historyTitle}
            >
              <div className="flex flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground">{copy.app.historyTitle}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {copy.app.historyPage(safeHistoryPage, totalHistoryPages)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={closeHistory}
                    aria-label={copy.app.close}
                    title={copy.app.close}
                  >
                    <X />
                  </Button>
                </div>
              </div>
              <div className="flex min-h-0 flex-1 flex-col md:flex-row">
                <aside className="max-h-[34vh] shrink-0 overflow-y-auto border-b bg-muted/20 px-4 py-3 dark:bg-muted/10 md:max-h-none md:w-64 md:border-b-0 md:border-r md:px-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{copy.app.historyTypeFilter}</h3>
                    {(historyTypeFilter !== 'all' || historyDifficultyFilter !== 'all') && (
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => {
                          setHistoryTypeFilter('all');
                          setHistoryDifficultyFilter('all');
                        }}
                      >
                        {copy.app.clearHistoryFilters}
                      </Button>
                    )}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    <Button
                      variant={historyTypeFilter === 'all' ? 'secondary' : 'outline'}
                      size="xs"
                      className="w-full justify-start truncate"
                      aria-pressed={historyTypeFilter === 'all'}
                      onClick={() => setHistoryTypeFilter('all')}
                    >
                      {copy.app.allHistoryTypes}
                    </Button>
                    {historyTypes.map((type) => (
                      <Button
                        key={type}
                        variant={historyTypeFilter === type ? 'secondary' : 'outline'}
                        size="xs"
                        className="w-full justify-start truncate"
                        aria-pressed={historyTypeFilter === type}
                        onClick={() => setHistoryTypeFilter(type)}
                        title={getPuzzleTemplate(type).name[locale]}
                      >
                        {getPuzzleTemplate(type).name[locale]}
                      </Button>
                    ))}
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-foreground">{copy.app.historyDifficultyFilter}</h3>
                  <div className="mt-2 grid grid-cols-4 gap-1.5">
                    <Button
                      variant={historyDifficultyFilter === 'all' ? 'secondary' : 'outline'}
                      size="icon-sm"
                      aria-pressed={historyDifficultyFilter === 'all'}
                      onClick={() => setHistoryDifficultyFilter('all')}
                      aria-label={copy.app.allHistoryDifficulties}
                      title={copy.app.allHistoryDifficulties}
                    >
                      <LayoutGrid />
                    </Button>
                    {(Object.keys(puzzleDifficultyLabels) as PuzzleDifficulty[]).map((difficulty) => (
                      <Button
                        key={difficulty}
                        variant={historyDifficultyFilter === difficulty ? 'secondary' : 'outline'}
                        size="icon-sm"
                        aria-pressed={historyDifficultyFilter === difficulty}
                        onClick={() => setHistoryDifficultyFilter(difficulty)}
                        aria-label={puzzleDifficultyLabels[difficulty][locale]}
                        title={puzzleDifficultyLabels[difficulty][locale]}
                      >
                        <DifficultyStars difficulty={difficulty} starClassName="size-2.5" />
                      </Button>
                    ))}
                  </div>
                </aside>
                <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                  <div className="flex-1 overflow-y-auto px-4 py-3">
                {historyItems.length === 0 ? (
                  <p className="text-muted-foreground dark:text-gray-400 text-center py-8">{copy.app.noHistory}</p>
                ) : filteredHistoryItems.length === 0 ? (
                  <p className="text-muted-foreground dark:text-gray-400 text-center py-8">
                    {copy.app.noHistoryMatch}
                  </p>
                ) : (
                  <div className="space-y-1">
                    {pagedHistoryItems.map((item) => {
                      const statusLabel = item.completion
                        ? copy.app.completedTag
                        : item.progress
                          ? copy.app.inProgressTag
                          : copy.app.untouchedTag;
                      const statusTone = item.completion
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : item.progress
                          ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300'
                          : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300';
                      const markerTone = item.completion
                        ? 'bg-emerald-500'
                        : item.progress
                          ? 'bg-amber-500'
                          : 'bg-slate-300 dark:bg-slate-600';
                      const duration = item.completion
                        ? formatMinutesSeconds(item.completion.time)
                        : item.progress
                          ? formatMinutesSeconds(item.progress.elapsedTime)
                          : null;

                      return (
                        <div
                          key={item.dateStr}
                          role="button"
                          tabIndex={0}
                          className="w-full border-b px-2 py-3 text-left transition-colors hover:bg-muted/70 focus:outline-none focus:ring-2 focus:ring-ring/50 dark:border-gray-700 dark:hover:bg-muted/70"
                          onClick={() => loadHistoryPuzzle(item)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              loadHistoryPuzzle(item);
                            }
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <span className={`mt-1 h-2.5 w-2.5 shrink-0 ${markerTone}`} />
                            <div className="min-w-0 flex-1">
                              <div className="mt-1 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="truncate text-lg font-semibold text-foreground">
                                      {item.template.name[locale]}
                                    </span>
                                    <DifficultyBadge difficulty={item.difficulty} />
                                    <Badge variant="outline" className={statusTone}>
                                      {statusLabel}
                                    </Badge>
                                    {item.isToday && (
                                      <Badge variant="outline" className="border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300">
                                        {copy.app.todayTag}
                                      </Badge>
                                    )}
                                    {item.isCurrent && (
                                      <Badge variant="outline" className="border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300">
                                        {copy.app.currentPuzzleTag}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                                    <span className="font-medium tracking-wide text-muted-foreground">
                                      {copy.app.historyEntry(item.dateStr, item.index + 1)}
                                    </span>
                                  </div>
                                </div>
                                <div className="shrink-0 text-right">
                                  <div className="h-5 font-mono text-sm text-muted-foreground dark:text-gray-300">
                                    {duration ?? '\u00a0'}
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="icon-sm"
                                    className="mt-2"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      copyHistoryLink(buildHistoryShareUrl(item), item.dateStr);
                                    }}
                                    aria-label={copiedHistoryDate === item.dateStr
                                      ? copy.app.historyLinkCopied
                                      : copy.app.shareHistoryLink}
                                    title={copiedHistoryDate === item.dateStr
                                      ? copy.app.historyLinkCopied
                                      : copy.app.shareHistoryLink}
                                  >
                                    {copiedHistoryDate === item.dateStr ? <Check /> : <Share2 />}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {Array.from({ length: historyPlaceholderCount }, (_, index) => (
                      <div
                        key={`history-placeholder-${safeHistoryPage}-${index}`}
                        aria-hidden="true"
                        className="border-b px-2 py-3 opacity-0 pointer-events-none select-none dark:border-gray-700"
                      >
                        <div className="flex items-start gap-3">
                          <span className="mt-1 h-2.5 w-2.5 shrink-0 bg-transparent" />
                          <div className="min-w-0 flex-1">
                            <div className="mt-1 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="text-lg font-semibold">placeholder</span>
                                  <span className="h-6 w-14 rounded-md border" />
                                  <span className="h-6 w-16 rounded-md border" />
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                                  <span className="font-medium tracking-wide">placeholder</span>
                                </div>
                              </div>
                              <div className="shrink-0 text-right">
                                <div className="font-mono text-sm">00:00</div>
                                <div className="mt-2 h-9 w-24 rounded-md border" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {filteredHistoryItems.length > HISTORY_PAGE_SIZE && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setHistoryPage((page) => Math.max(1, page - 1))}
                    disabled={safeHistoryPage <= 1}
                    aria-label={copy.app.previousPage}
                    title={copy.app.previousPage}
                  >
                    <ChevronLeft />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {copy.app.historyPage(safeHistoryPage, totalHistoryPages)}
                  </span>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setHistoryPage((page) => Math.min(totalHistoryPages, page + 1))}
                    disabled={safeHistoryPage >= totalHistoryPages}
                    aria-label={copy.app.nextPage}
                    title={copy.app.nextPage}
                  >
                    <ChevronRight />
                  </Button>
                </div>
              )}
                </div>
              </div>
            </Card>
          </div>
        )}

        {!isDirectPuzzle && (
          <CompletionModal
            isOpen={resultOpen}
            time={resultTime}
            onClose={closeCompletion}
            puzzleType={daily?.puzzle.type || 'nurikabe'}
            dateStr={daily.dateStr}
          />
        )}
        {/* 浮动日夜切换：不占顶部栏，全站随时可用 */}
        <Button
          variant="outline"
          size="icon-lg"
          className="fixed bottom-24 right-4 z-40 rounded-full border-border bg-background/90 shadow-lg backdrop-blur transition-colors hover:bg-muted md:bottom-4"
          onClick={toggleTheme}
          aria-label={copy.app.themeToggle}
          title={copy.app.themeToggle}
        >
          {theme === 'dark' ? <Sun /> : <Moon />}
        </Button>

        {restartDialogOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-3"
            onClick={() => setRestartDialogOpen(false)}
          >
            <Card
              className="relative w-full max-w-sm border-[#d7c7b4] bg-card p-5 dark:border-gray-700 dark:bg-card"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label={copy.app.restartOptionsTitle}
            >
              <Button
                variant="ghost"
                size="icon-sm"
                className="absolute right-2 top-2"
                onClick={() => setRestartDialogOpen(false)}
                aria-label={copy.app.close}
                title={copy.app.close}
              >
                <X />
              </Button>
              <h2 className="text-center text-xl font-semibold leading-8 text-foreground">
                {copy.app.restartOptionsTitle}
              </h2>
              <div className="mt-4 flex flex-col gap-2">
                <Button onClick={handleRestartWithTime}>{copy.app.restartKeepTime}</Button>
                <Button variant="outline" onClick={handleRestartFromZero}>
                  {copy.app.restartResetTime}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
