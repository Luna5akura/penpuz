// src/App.tsx

import { useCallback } from 'react';
import RulesSection from './components/RulesSection';
import CompletionModal from './components/CompletionModal';
import { getBeijingDateStr } from './puzzles/database';
import { useDailyPuzzleSession } from './hooks/useDailyPuzzleSession';
import { renderPuzzleBoard } from './puzzles/registry';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { useI18n } from './i18n/useI18n';
import { puzzleDifficultyLabels } from './puzzles/types';

function App() {
  const { locale, copy, toggleLocale } = useI18n();
  const {
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
    handleStart,
    handleRestart,
    handleComplete,
    handleViewResult,
    closeCompletion,
    openHistory,
    closeHistory,
    loadHistoryPuzzle,
  } = useDailyPuzzleSession();

  const todayStr = getBeijingDateStr();

  const renderBoard = useCallback(() => {
    if (!daily || !startTime) return null;
    return renderPuzzleBoard(
      daily.puzzle,
      startTime,
      boardInstance,
      handleComplete
    );
  }, [boardInstance, daily, startTime, handleComplete]);

  if (!daily) return <div className="text-center py-12">{copy.app.loadingDailyPuzzle}</div>;

  const { template } = daily;
  const isTodayPuzzle = daily.dateStr === todayStr;
  const hasResult = attemptCompleted || !!savedCompletion;
  const puzzleName = template.name[locale];
  const difficultyText = puzzleDifficultyLabels[daily.difficulty][locale];

  return (
    <div className="min-h-screen bg-[#f8f1e3] dark:bg-gray-950 py-8 font-serif">
      <div className="max-w-4xl mx-auto px-6">
        {/* 标题栏 */}
        <Card className="mb-8 p-6 text-center flex flex-col md:flex-row items-center justify-between gap-4 dark:bg-gray-900 dark:border-gray-700">
          <div>
            <h1 className="text-3xl font-bold text-[#3f2a1e] dark:text-gray-100">{copy.app.siteTitle}</h1>
            <p className="text-lg text-muted-foreground dark:text-gray-400 mt-2">
              {isTodayPuzzle ? copy.app.todayPuzzleTypeLabel : copy.app.puzzleTypeLabel}：{puzzleName}
            </p>
            <div className="mt-3">
              <Badge
                variant="outline"
                className="border-[#8c6a45] bg-[#f6ead6] text-[#5a3d27] dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              >
                {copy.shared.difficultyLabel}：{difficultyText}
              </Badge>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              variant="outline"
              onClick={toggleLocale}
              className="px-4"
              aria-label={copy.app.languageButtonLabel}
              title={copy.app.languageButtonLabel}
            >
              {copy.app.languageButton}
            </Button>
            <Button
              variant="outline"
              onClick={openHistory}
              className="px-6"
            >
              {copy.app.viewHistory}
            </Button>
          </div>
        </Card>

        {!started ? (
          <Card className="max-w-md mx-auto p-8 text-center dark:bg-gray-900 dark:border-gray-700">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-[#3f2a1e] dark:text-gray-100 mb-2">{copy.app.readyToStart}</h2>
              <p className="text-lg text-muted-foreground dark:text-gray-400">
                {copy.app.currentPuzzle}：<span className="font-medium">{puzzleName}</span>
              </p>
              <div className="mt-3">
                <Badge
                  variant="outline"
                  className="border-[#8c6a45] bg-[#f6ead6] text-[#5a3d27] dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                >
                  {copy.shared.difficultyLabel}：{difficultyText}
                </Badge>
              </div>
              <p className="text-4xl font-bold text-[#3f2a1e] dark:text-gray-100 mt-6">
                {copy.app.puzzleNumber(daily.index + 1)}
              </p>
            </div>
            <Button onClick={handleStart} size="lg" className="px-10 py-6 text-lg font-medium">
              {copy.app.startPuzzle}
            </Button>
            <p className="text-xs text-muted-foreground dark:text-gray-400 mt-8">
              {copy.app.timerStartsAfterClick}
            </p>
          </Card>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6 px-2">
              <div className="text-lg font-medium text-[#3f2a1e] dark:text-gray-100">
                {copy.app.elapsedTime(elapsedTime)}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-muted-foreground dark:text-gray-400">
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
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <Card className="max-w-lg w-full max-h-[80vh] overflow-auto dark:bg-gray-900 dark:border-gray-700">
              <div className="p-6 border-b flex items-center justify-between dark:border-gray-700">
                <h2 className="text-2xl font-semibold text-[#3f2a1e] dark:text-gray-100">{copy.app.historyTitle}</h2>
                <Button variant="ghost" onClick={closeHistory}>
                  {copy.app.close}
                </Button>
              </div>
              <div className="p-6 space-y-3">
                {history.length === 0 ? (
                  <p className="text-muted-foreground dark:text-gray-400 text-center py-8">{copy.app.noHistory}</p>
                ) : (
                  history.map((item) => (
                    <Button
                      key={item.dateStr}
                      variant="outline"
                      className="w-full justify-start text-left h-auto py-4 dark:bg-gray-800"
                      onClick={() => loadHistoryPuzzle(item)}
                    >
                      <span className="font-medium">{item.template.name[locale]}</span>
                      <Badge
                        variant="outline"
                        className="ml-3 border-[#8c6a45] bg-[#f6ead6] text-[#5a3d27] dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                      >
                        {puzzleDifficultyLabels[item.difficulty][locale]}
                      </Badge>
                      <span className="ml-auto text-muted-foreground dark:text-gray-400">
                        {copy.app.historyEntry(item.dateStr, item.index + 1)}
                      </span>
                    </Button>
                  ))
                )}
              </div>
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
