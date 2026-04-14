// src/App.tsx

import { useCallback } from 'react';
import RulesSection from './components/RulesSection';
import CompletionModal from './components/CompletionModal';
import { getBeijingDateStr } from './puzzles/database';
import { useDailyPuzzleSession } from './hooks/useDailyPuzzleSession';
import { renderPuzzleBoard } from './puzzles/registry';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';

function App() {
  const {
    daily,
    history,
    started,
    startTime,
    elapsedTime,
    completed,
    savedCompletion,
    showHistory,
    handleStart,
    handleComplete,
    handleViewResult,
    closeCompletion,
    openHistory,
    closeHistory,
    loadHistoryPuzzle,
  } = useDailyPuzzleSession();

  const renderBoard = useCallback(() => {
    if (!daily || !startTime) return null;
    return renderPuzzleBoard(daily.puzzle, startTime, handleComplete, `${daily.puzzle.type}-${daily.index}`);
  }, [daily, startTime, handleComplete]);

  if (!daily) return <div className="text-center py-12">加载每日谜题中...</div>;

  const { template } = daily;
  const isTodayCompleted = completed || !!savedCompletion;

  return (
    <div className="min-h-screen bg-[#f8f1e3] dark:bg-gray-950 py-8 font-serif">
      <div className="max-w-4xl mx-auto px-6">
        {/* 标题栏 */}
        <Card className="mb-8 p-6 text-center flex flex-col md:flex-row items-center justify-between gap-4 dark:bg-gray-900 dark:border-gray-700">
          <div>
            <h1 className="text-3xl font-bold text-[#3f2a1e] dark:text-gray-100">每日纸笔谜题</h1>
            <p className="text-lg text-muted-foreground dark:text-gray-400 mt-2">
              今日题型：{template.name}（{template.nameCn}）
            </p>
          </div>
          <Button
            variant="outline"
            onClick={openHistory}
            className="px-6"
          >
            查看历史题目
          </Button>
        </Card>

        {!started ? (
          <Card className="max-w-md mx-auto p-8 text-center dark:bg-gray-900 dark:border-gray-700">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-[#3f2a1e] dark:text-gray-100 mb-2">准备开始</h2>
              <p className="text-lg text-muted-foreground dark:text-gray-400">
                本次谜题：<span className="font-medium">{template.name}（{template.nameCn}）</span>
              </p>
              <p className="text-4xl font-bold text-[#3f2a1e] dark:text-gray-100 mt-6">
                第 {daily.index + 1} 题
              </p>
            </div>
            <Button onClick={handleStart} size="lg" className="px-10 py-6 text-lg font-medium">
              开始解题
            </Button>
            <p className="text-xs text-muted-foreground dark:text-gray-400 mt-8">
              计时将在您点击开始后启动
            </p>
          </Card>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6 px-2">
              <div className="text-lg font-medium text-[#3f2a1e] dark:text-gray-100">
                用时：{elapsedTime} 秒
              </div>
              <div className="text-sm text-muted-foreground dark:text-gray-400">
                {template.name} • 第 {daily.index + 1} 题
              </div>
            </div>
            <div className="flex justify-center mb-12">
              {renderBoard()}
            </div>
            {isTodayCompleted && (
              <div className="flex justify-center mb-8">
                <Button onClick={handleViewResult} variant="outline" size="lg">
                  📊 查看成绩
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
                <h2 className="text-2xl font-semibold text-[#3f2a1e] dark:text-gray-100">历史题目</h2>
                <Button variant="ghost" onClick={closeHistory}>
                  关闭
                </Button>
              </div>
              <div className="p-6 space-y-3">
                {history.length === 0 ? (
                  <p className="text-muted-foreground dark:text-gray-400 text-center py-8">暂无历史题目</p>
                ) : (
                  history.map((item) => (
                    <Button
                      key={item.index}
                      variant="outline"
                      className="w-full justify-start text-left h-auto py-4 dark:bg-gray-800"
                      onClick={() => loadHistoryPuzzle(item)}
                    >
                      <span className="font-medium">{item.template.name}（{item.template.nameCn}）</span>
                      <span className="ml-auto text-muted-foreground dark:text-gray-400">第 {item.index + 1} 题</span>
                    </Button>
                  ))
                )}
              </div>
            </Card>
          </div>
        )}

        <CompletionModal
          isOpen={completed}
          time={elapsedTime}
          onClose={closeCompletion}
          puzzleType={daily?.puzzle.type || 'nurikabe'}
          dateStr={getBeijingDateStr()} // ← 使用统一北京时间函数
        />
      </div>
    </div>
  );
}

export default App;
