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
import { Card } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { useI18n } from './i18n/useI18n';
import { puzzleDifficultyLabels } from './puzzles/types';
import { formatMinutesSeconds } from './lib/formatDuration';

const HISTORY_PAGE_SIZE = 8;

function App() {
  const [historyPage, setHistoryPage] = useState(1);
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
    handleRestart,
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
    <div className="min-h-screen bg-[#f5efe3] py-8 dark:bg-gray-950">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* 标题栏 */}
        <Card className="mb-8 border-[#bfa889] bg-[#fffdf8] p-6 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl font-bold text-[#2f241a] dark:text-gray-100 sm:text-5xl">{copy.app.siteTitle}</h1>
              <p className="mt-3 text-xl text-muted-foreground dark:text-gray-400 sm:text-2xl">
                {isTodayPuzzle ? copy.app.todayPuzzleTypeLabel : copy.app.puzzleTypeLabel}：{puzzleName}
              </p>
              <div className="mt-4">
                <Badge
                  variant="outline"
                  className="border-[#8c6a45] bg-[#f6ead6] px-3 py-1.5 text-base text-[#5a3d27] dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                >
                  {copy.shared.difficultyLabel}：{difficultyText}
                </Badge>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-end">
              <Button
                variant="outline"
                onClick={toggleLocale}
                className="min-w-28"
                aria-label={copy.app.languageButtonLabel}
                title={copy.app.languageButtonLabel}
              >
                {copy.app.languageButton}
              </Button>
              <Button
                variant="outline"
                onClick={handleOpenHistory}
                className="min-w-40"
              >
                {copy.app.viewHistory}
              </Button>
            </div>
          </div>
        </Card>

        {!started ? (
          <Card className="mx-auto max-w-xl border-[#bfa889] bg-[#fffdf8] p-8 text-center dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-8">
              <h2 className="mb-3 text-3xl font-semibold text-[#2f241a] dark:text-gray-100 sm:text-4xl">{copy.app.readyToStart}</h2>
              <p className="text-xl text-muted-foreground dark:text-gray-400">
                {copy.app.currentPuzzle}：<span className="font-medium">{puzzleName}</span>
              </p>
              <div className="mt-3">
                <Badge
                  variant="outline"
                  className="border-[#8c6a45] bg-[#f6ead6] px-3 py-1.5 text-base text-[#5a3d27] dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                >
                  {copy.shared.difficultyLabel}：{difficultyText}
                </Badge>
              </div>
              <p className="mt-7 text-5xl font-bold text-[#2f241a] dark:text-gray-100 sm:text-6xl">
                {copy.app.puzzleNumber(daily.index + 1)}
              </p>
            </div>
            <Button onClick={handleStart} size="lg" className="min-w-52">
              {copy.app.startPuzzle}
            </Button>
            <p className="mt-8 text-base text-muted-foreground dark:text-gray-400">
              {copy.app.timerStartsAfterClick}
            </p>
          </Card>
        ) : (
          <>
            <div className="mb-8 flex flex-col gap-4 border-2 border-[#bfa889] bg-[#fffdf8] px-4 py-4 dark:border-gray-700 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="text-2xl font-semibold text-[#2f241a] dark:text-gray-100">
                {copy.app.elapsedTime(elapsedTime)}
              </div>
              <div className="flex flex-col gap-3 sm:items-end">
                <div className="text-lg text-muted-foreground dark:text-gray-400">
                  {copy.app.puzzleSummary(puzzleName, daily.index + 1)}
                </div>
                <Button onClick={handleRestart} variant="outline" size="sm">
                  {copy.app.restart}
                </Button>
              </div>
            </div>
            <div className="flex justify-center mb-12">
              {renderBoard()}
            </div>
            {hasResult && (
              <div className="flex justify-center mb-8">
                <Button onClick={handleViewResult} variant="outline" size="lg">
                  {copy.app.viewResults}
                </Button>
              </div>
            )}
          </>
        )}

        <RulesSection template={template} />

        {/* 历史题目列表 Modal */}
        {showHistory && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
            onClick={closeHistory}
          >
            <Card
              className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden border-[#bfa889] bg-[#fffdf8] dark:border-gray-700 dark:bg-gray-900"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label={copy.app.historyTitle}
            >
              <div className="flex flex-col gap-3 border-b-2 border-[#d5c1a6] bg-[#f4e8d4] px-5 py-5 dark:border-gray-700 dark:bg-gray-900/90 sm:flex-row sm:items-start sm:justify-between sm:px-6">
                <div>
                  <h2 className="text-3xl font-semibold text-[#2f241a] dark:text-gray-100">{copy.app.historyTitle}</h2>
                  <p className="mt-1 text-base text-[#7a624b] dark:text-gray-400">{copy.app.historyHint}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-base text-[#6c533c] dark:text-gray-400">
                    {copy.app.historyPage(safeHistoryPage, totalHistoryPages)}
                  </span>
                  <Button variant="ghost" onClick={closeHistory}>
                    {copy.app.close}
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                {historyItems.length === 0 ? (
                  <p className="text-muted-foreground dark:text-gray-400 text-center py-8">{copy.app.noHistory}</p>
                ) : (
                  <div className="space-y-3">
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
                          className="w-full border-2 border-[#d9c4a6] bg-white p-4 text-left transition-colors hover:border-[#8c6a45] hover:bg-[#fcf7ee] focus:outline-none focus:ring-2 focus:ring-[#8c6a45] dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-500 dark:hover:bg-gray-800/80"
                          onClick={() => loadHistoryPuzzle(item)}
                        >
                          <div className="flex items-start gap-4">
                            <span className={`mt-1.5 h-4 w-4 shrink-0 border border-black/10 ${markerTone}`} />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2 text-sm">
                                <span className="font-medium tracking-wide text-[#6a5038] dark:text-gray-300">
                                  {copy.app.historyEntry(item.dateStr, item.index + 1)}
                                </span>
                                {item.isToday && (
                                  <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/70 dark:bg-sky-950/40 dark:text-sky-300">
                                    {copy.app.todayTag}
                                  </Badge>
                                )}
                                {item.isCurrent && (
                                  <Badge variant="outline" className="border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/70 dark:bg-violet-950/40 dark:text-violet-300">
                                    {copy.app.currentPuzzleTag}
                                  </Badge>
                                )}
                                {attempted && (
                                  <Badge variant="outline" className="border-[#d9c4a6] bg-[#fbf3e6] text-[#7a5a37] dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200">
                                    {copy.app.attemptedTag}
                                  </Badge>
                                )}
                              </div>
                              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0">
                                  <div className="truncate text-xl font-semibold text-[#2f2016] dark:text-gray-100">
                                    {item.template.name[locale]}
                                  </div>
                                  <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <Badge
                                      variant="outline"
                                      className="border-[#8c6a45] bg-[#f6ead6] px-3 py-1.5 text-base text-[#5a3d27] dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                                    >
                                      {puzzleDifficultyLabels[item.difficulty][locale]}
                                    </Badge>
                                    <Badge variant="outline" className={statusTone}>
                                      {statusLabel}
                                    </Badge>
                                  </div>
                                </div>
                                {duration && (
                                  <div className="shrink-0 text-right font-mono text-lg text-[#5d4330] dark:text-gray-200">
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
                <div className="flex items-center justify-between border-t-2 border-[#d5c1a6] bg-[#f4e8d4] px-5 py-4 dark:border-gray-700 dark:bg-gray-900/90 sm:px-6">
                  <Button
                    variant="outline"
                    onClick={() => setHistoryPage((page) => Math.max(1, page - 1))}
                    disabled={safeHistoryPage <= 1}
                  >
                    {copy.app.previousPage}
                  </Button>
                  <span className="text-base text-[#6c533c] dark:text-gray-400">
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
      </div>
    </div>
  );
}

export default App;
