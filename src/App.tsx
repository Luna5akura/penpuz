// src/App.tsx

import { useCallback, useEffect, useMemo, useState } from 'react';
import RulesSection from './components/RulesSection';
import CompletionModal from './components/CompletionModal';
import { getBeijingDateStr } from './puzzles/database';
import {
  readSavedCompletion,
  readSavedProgress,
  useDailyPuzzleSession,
} from './hooks/useDailyPuzzleSession';
import { renderPuzzleBoard } from './puzzles/registry';
import { Button } from './components/ui/button';
// import { Card } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './components/ui/dialog';
import { useI18n } from './i18n/useI18n';
import { puzzleDifficultyLabels } from './puzzles/types';
import { formatMinutesSeconds } from './lib/formatDuration';
import { Card } from './components/ui/card';

const HISTORY_PAGE_SIZE = 5;

function App() {
  const [historyPage, setHistoryPage] = useState(1);
  const [restartDialogOpen, setRestartDialogOpen] = useState(false);
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
  } = useDailyPuzzleSession();

  const todayStr = getBeijingDateStr();
  const handleOpenHistory = useCallback(() => {
    setHistoryPage(1);
    openHistory();
  }, [openHistory]);
  const handleOpenRestartDialog = useCallback(() => {
    setRestartDialogOpen(true);
  }, []);
  const handleRestartWithTime = useCallback(() => {
    handleRestartPreserveTime();
    setRestartDialogOpen(false);
  }, [handleRestartPreserveTime]);
  const handleRestartFromZero = useCallback(() => {
    handleRestartResetTime();
    setRestartDialogOpen(false);
  }, [handleRestartResetTime]);

  const renderBoard = useCallback(() => {
    if (!daily || !startTime) return null;
    return renderPuzzleBoard(
      daily.puzzle,
      startTime,
      boardInstance,
      handleComplete,
      boardSnapshot,
      handleBoardProgress,
    );
  }, [boardInstance, boardSnapshot, daily, handleBoardProgress, handleComplete, startTime]);
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

  if (!daily) return <div className="text-center py-12">{copy.app.loadingDailyPuzzle}</div>;

  const { template } = daily;
  const isTodayPuzzle = daily.dateStr === todayStr;
  const hasResult = attemptCompleted || !!savedCompletion;
  const puzzleName = template.name[locale];
  const difficultyText = puzzleDifficultyLabels[daily.difficulty][locale];

  return (
    <div className="min-h-screen bg-background py-4 dark:bg-background">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* 标题栏 */}
        <Card className="mb-4 border-[#d7c7b4] bg-card p-4 dark:border-gray-700 dark:bg-card">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground sm:text-4xl">{copy.app.siteTitle}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-lg text-muted-foreground sm:text-xl">
                <span>
                  {isTodayPuzzle ? copy.app.todayPuzzleTypeLabel : copy.app.puzzleTypeLabel}：{puzzleName}
                </span>
                <Badge
                  variant="outline"
                  className="border-[#bca286] bg-secondary ml-3 text-sm text-[#5a3d27] dark:border-gray-600 dark:bg-muted dark:text-gray-100"
                >
                  {difficultyText}
                </Badge>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
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
                onClick={handleOpenHistory}
                className="min-w-32"
              >
                {copy.app.viewHistory}
              </Button>
            </div>
          </div>
        </Card>

        {!started ? (
          <Card className="mx-auto max-w-lg border-[#d7c7b4] bg-card p-5 dark:border-gray-700 dark:bg-card">
            <div className="space-y-3 text-center">
              <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">{copy.app.readyToStart}</h2>
              <p className="text-lg text-muted-foreground">
                {copy.app.currentPuzzle}：<span className="font-medium">{puzzleName}</span>
              </p>
              <div className="flex justify-center">
                <Badge
                  variant="outline"
                  className="border-[#bca286] bg-secondary text-sm text-[#5a3d27] dark:border-gray-600 dark:bg-muted dark:text-gray-100"
                >
                  {difficultyText}
                </Badge>
              </div>
              <p className="text-4xl font-bold text-foreground sm:text-5xl">
                {copy.app.puzzleNumber(daily.index + 1)}
              </p>
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
                {copy.app.elapsedTime(elapsedTime)}
              </div>
              <div className="text-base text-muted-foreground sm:text-center">
                {copy.app.puzzleSummary(puzzleName, daily.index + 1)}
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                {hasResult && (
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
                      const attempted = !!item.completion || !!item.progress;
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
                        <button
                          key={item.dateStr}
                          type="button"
                          className="w-full border-b px-2 py-3 text-left transition-colors hover:bg-muted/70 focus:outline-none focus:ring-2 focus:ring-ring/50 dark:border-gray-700 dark:hover:bg-muted/70"
                          onClick={() => loadHistoryPuzzle(item)}
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
                                {duration && (
                                  <div className="shrink-0 text-right font-mono text-sm text-muted-foreground dark:text-gray-300">
                                    {duration}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
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

        <CompletionModal
          isOpen={resultOpen}
          time={resultTime}
          onClose={closeCompletion}
          puzzleType={daily?.puzzle.type || 'nurikabe'}
          dateStr={daily.dateStr}
        />
        <Dialog open={restartDialogOpen} onOpenChange={setRestartDialogOpen}>
          <DialogContent className="max-w-sm border-[#d7c7b4] bg-card dark:border-gray-700 dark:bg-card">
            <DialogHeader>
              <DialogTitle>{copy.app.restartOptionsTitle}</DialogTitle>
              <DialogDescription>{copy.app.restartOptionsHint}</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <Button onClick={handleRestartWithTime}>{copy.app.restartKeepTime}</Button>
              <Button variant="outline" onClick={handleRestartFromZero}>
                {copy.app.restartResetTime}
              </Button>
              <Button variant="ghost" onClick={() => setRestartDialogOpen(false)}>
                {copy.shared.cancel}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default App;
