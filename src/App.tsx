// src/App.tsx

import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, CalendarDays, NotebookText } from 'lucide-react';
import RulesSection from './components/RulesSection';
import CompletionModal from './components/CompletionModal';
import {
  readSavedCompletion,
  readSavedProgress,
  useDailyPuzzleSession,
} from './hooks/useDailyPuzzleSession';
import { getPuzzleTemplate, parsePuzzleLink, renderPuzzleBoard } from './puzzles/registry';
import { Button } from './components/ui/button';
// import { Card } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { useI18n } from './i18n/useI18n';
import { setDocumentMetadata } from './lib/documentMetadata';
import { getPuzzleMetadata } from './puzzles/puzzleMetadata';
import { puzzleDifficultyLabels, type PuzzleData } from './puzzles/types';
import { formatMinutesSeconds } from './lib/formatDuration';
import { Card } from './components/ui/card';

const HISTORY_PAGE_SIZE = 5;
const RuleQuickReferenceDialog = lazy(() => import('./components/RuleQuickReferenceDialog'));
const NotesPage = lazy(() => import('./components/notes/NotesPage'));

type ActivePage = 'puzzle' | 'notes';

function readActivePageFromUrl(): ActivePage {
  if (typeof window === 'undefined') return 'puzzle';
  const params = new URLSearchParams(window.location.search);
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
  } else {
    url.searchParams.delete('date');
    if (url.searchParams.has('note')) {
      url.searchParams.delete('page');
    } else {
      url.searchParams.set('page', 'notes');
    }
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
  const [restartDialogOpen, setRestartDialogOpen] = useState(false);
  const [ruleReferenceOpen, setRuleReferenceOpen] = useState(false);
  const [copiedHistoryDate, setCopiedHistoryDate] = useState<string | null>(null);
  const [directBoardInstance, setDirectBoardInstance] = useState(0);
  const [directStartTime, setDirectStartTime] = useState(() => Date.now());
  const [directElapsedTime, setDirectElapsedTime] = useState(0);
  const [directAttemptCompleted, setDirectAttemptCompleted] = useState(false);
  const [directBoardSnapshot, setDirectBoardSnapshot] = useState<unknown>(null);
  const { locale, copy, toggleLocale } = useI18n();
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
  } = useDailyPuzzleSession();
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
  const handleRestartWithTime = useCallback(() => {
    if (isDirectPuzzle) {
      restartDirectPuzzle(directElapsedTime);
    } else {
      handleRestartPreserveTime();
    }
    setRestartDialogOpen(false);
  }, [directElapsedTime, handleRestartPreserveTime, isDirectPuzzle, restartDirectPuzzle]);
  const handleRestartFromZero = useCallback(() => {
    if (isDirectPuzzle) {
      restartDirectPuzzle(0);
    } else {
      handleRestartResetTime();
    }
    setRestartDialogOpen(false);
  }, [handleRestartResetTime, isDirectPuzzle, restartDirectPuzzle]);
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
      linkedPuzzle ? handleDirectBoardProgress : handleBoardProgress,
    );
  }, [
    boardInstance,
    boardSnapshot,
    daily?.puzzle,
    directBoardInstance,
    directBoardSnapshot,
    directStartTime,
    handleBoardProgress,
    handleComplete,
    handleDirectBoardProgress,
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
  const totalHistoryPages = Math.max(1, Math.ceil(historyItems.length / HISTORY_PAGE_SIZE));
  const safeHistoryPage = Math.min(historyPage, totalHistoryPages);
  const pagedHistoryItems = useMemo(() => {
    const startIndex = (safeHistoryPage - 1) * HISTORY_PAGE_SIZE;
    return historyItems.slice(startIndex, startIndex + HISTORY_PAGE_SIZE);
  }, [historyItems, safeHistoryPage]);
  const historyPlaceholderCount = Math.max(0, HISTORY_PAGE_SIZE - pagedHistoryItems.length);

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

  useEffect(() => {
    if (!linkedPuzzleKey) return;

    setDirectStartTime(Date.now());
    setDirectElapsedTime(0);
    setDirectAttemptCompleted(false);
    setDirectBoardSnapshot(null);
    setDirectBoardInstance((value) => value + 1);
  }, [linkedPuzzleKey]);

  useEffect(() => {
    if (!linkedPuzzleKey || directAttemptCompleted) return;

    const interval = window.setInterval(() => {
      setDirectElapsedTime(Math.floor((Date.now() - directStartTime) / 1000));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [directAttemptCompleted, directStartTime, linkedPuzzleKey]);

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

  if (!daily) return <div className="text-center py-12">{copy.app.loadingDailyPuzzle}</div>;

  const activePuzzle = linkedPuzzle ?? daily.puzzle;
  const template = linkedPuzzle ? getPuzzleTemplate(linkedPuzzle.type) : daily.template;
  const metadata = getPuzzleMetadata(activePuzzle, locale);
  const hasResult = isDirectPuzzle ? directAttemptCompleted : attemptCompleted || !!savedCompletion;
  const activeStarted = isDirectPuzzle || started;
  const activeElapsedTime = isDirectPuzzle ? directElapsedTime : elapsedTime;
  const puzzleName = template.name[locale];
  const difficultyText = isDirectPuzzle ? null : puzzleDifficultyLabels[daily.difficulty][locale];
  const isPuzzlePage = activePage === 'puzzle';

  return (
    <div className="min-h-screen bg-background py-4 dark:bg-background">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* 标题栏 */}
        <Card className="mb-4 border-[#d7c7b4] bg-card p-4 dark:border-gray-700 dark:bg-card">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground sm:text-4xl">{copy.app.siteTitle}</h1>
              {isPuzzlePage && (
                <div className="mt-1 flex flex-wrap items-center gap-2 text-lg text-muted-foreground sm:text-xl">
                  <span>{metadata.title}</span>
                  {difficultyText && (
                    <Badge
                      variant="outline"
                      className="border-[#bca286] bg-secondary text-sm text-[#5a3d27] dark:border-gray-600 dark:bg-muted dark:text-gray-100"
                    >
                      {difficultyText}
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <Button
                variant={isPuzzlePage ? 'default' : 'outline'}
                onClick={handleOpenPuzzlePage}
                className="min-w-32"
              >
                <CalendarDays />
                {copy.app.puzzleTab}
              </Button>
              <Button
                variant={!isPuzzlePage ? 'default' : 'outline'}
                onClick={handleOpenNotesPage}
                className="min-w-24"
              >
                <NotebookText />
                {copy.app.notesTab}
              </Button>
              <Button
                variant="outline"
                onClick={toggleLocale}
                className="min-w-24"
                aria-label={copy.app.languageButtonLabel}
                title={copy.app.languageButtonLabel}
              >
                {copy.app.languageButton}
              </Button>
              <Button
                variant="outline"
                onClick={() => setRuleReferenceOpen(true)}
                className="min-w-28"
              >
                <BookOpen />
                {copy.app.rulesReference}
              </Button>
              <Button
                variant="outline"
                onClick={handleOpenHistory}
                className="min-w-32"
                disabled={!isPuzzlePage || isDirectPuzzle}
              >
                {copy.app.viewHistory}
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
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {difficultyText && (
                      <Badge
                        variant="outline"
                        className="border-[#bca286] bg-secondary text-sm text-[#5a3d27] dark:border-gray-600 dark:bg-muted dark:text-gray-100"
                      >
                        {difficultyText}
                      </Badge>
                    )}
                    <span className="text-sm font-medium text-muted-foreground">
                      {copy.app.puzzleNumber(daily.index + 1)}
                    </span>
                  </div>
                  <div className="pt-1">
                    <Button onClick={handleStart} size="lg" className="min-w-44">
                      {copy.app.startPuzzle}
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <>
                <div className="mb-4 grid gap-2 border-b px-1 pb-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
                  <div className="text-xl font-semibold text-foreground sm:text-left sm:text-2xl">
                    {copy.app.elapsedTime(activeElapsedTime)}
                  </div>
                  <div className="text-base text-muted-foreground sm:text-center">
                    {isDirectPuzzle ? metadata.title : copy.app.puzzleSummary(puzzleName, daily.index + 1)}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    {!isDirectPuzzle && hasResult && (
                      <Button onClick={handleViewResult} variant="ghost" size="sm">
                        {copy.app.viewResults}
                      </Button>
                    )}
                    <Button onClick={handleOpenRestartDialog} variant="outline" size="sm">
                      {copy.app.restart}
                    </Button>
                  </div>
                </div>
                <div className="flex justify-center mb-12">
                  {renderBoard()}
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

        {/* 历史题目列表 Modal */}
        {showHistory && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3"
            onClick={closeHistory}
          >
            <Card
              className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden border-[#d7c7b4] bg-card dark:border-gray-700 dark:bg-card"
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
                  <Button variant="ghost" onClick={closeHistory}>
                    {copy.app.close}
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-3">
                {historyItems.length === 0 ? (
                  <p className="text-muted-foreground dark:text-gray-400 text-center py-8">{copy.app.noHistory}</p>
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
                                    <Badge
                                      variant="outline"
                                      className="border-[#bca286] bg-secondary text-[#5a3d27] dark:border-gray-600 dark:bg-muted dark:text-gray-100"
                                    >
                                      {puzzleDifficultyLabels[item.difficulty][locale]}
                                    </Badge>
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
                                  {duration && (
                                    <div className="font-mono text-sm text-muted-foreground dark:text-gray-300">
                                      {duration}
                                    </div>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-2"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      copyHistoryLink(buildHistoryShareUrl(item), item.dateStr);
                                    }}
                                  >
                                    {copiedHistoryDate === item.dateStr
                                      ? copy.app.historyLinkCopied
                                      : copy.app.shareHistoryLink}
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
              {historyItems.length > HISTORY_PAGE_SIZE && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <Button
                    variant="outline"
                    onClick={() => setHistoryPage((page) => Math.max(1, page - 1))}
                    disabled={safeHistoryPage <= 1}
                  >
                    {copy.app.previousPage}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {copy.app.historyPage(safeHistoryPage, totalHistoryPages)}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setHistoryPage((page) => Math.min(totalHistoryPages, page + 1))}
                    disabled={safeHistoryPage >= totalHistoryPages}
                  >
                    {copy.app.nextPage}
                  </Button>
                </div>
              )}
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
        {restartDialogOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-3"
            onClick={() => setRestartDialogOpen(false)}
          >
            <Card
              className="w-full max-w-sm border-[#d7c7b4] bg-card p-5 dark:border-gray-700 dark:bg-card"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label={copy.app.restartOptionsTitle}
            >
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">{copy.app.restartOptionsTitle}</h2>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <Button onClick={handleRestartWithTime}>{copy.app.restartKeepTime}</Button>
                <Button variant="outline" onClick={handleRestartFromZero}>
                  {copy.app.restartResetTime}
                </Button>
                <Button variant="ghost" onClick={() => setRestartDialogOpen(false)}>
                  {copy.shared.cancel}
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
