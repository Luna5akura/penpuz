// src/App.tsx
import { useState, useEffect, useCallback } from 'react';
import NurikabeBoard from './puzzles/Nurikabe/Nurikabe';
import FillominoBoard from './puzzles/Fillomino/Fillomino';
import RulesSection from './components/RulesSection';
import CompletionModal from './components/CompletionModal';
import { getDailyPuzzle, getHistoryPuzzles } from './puzzles/database';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';
import type { DailyPuzzleData, HistoryPuzzleData } from './puzzles/types';

function App() {
  const [daily, setDaily] = useState<DailyPuzzleData | null>(null);
  const [started, setStarted] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [history, setHistory] = useState<HistoryPuzzleData[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [savedCompletion, setSavedCompletion] = useState<{ time: number } | null>(null);

  const getStorageKey = (dateStr: string) => `puzzle-completion-${dateStr}`;

  const loadSavedCompletion = useCallback((dateStr: string) => {
    const key = getStorageKey(dateStr);
    const saved = localStorage.getItem(key);
    if (saved) {
      const data = JSON.parse(saved);
      setSavedCompletion(data);
      setCompleted(true);
      setElapsedTime(data.time);
      return true;
    }
    return false;
  }, []);

  const saveCompletion = useCallback((time: number) => {
    if (!daily) return;
    const todayStr = new Date().toISOString().slice(0, 10);
    const key = getStorageKey(todayStr);
    localStorage.setItem(key, JSON.stringify({ time }));
    setSavedCompletion({ time });
  }, [daily]);

  useEffect(() => {
    const data = getDailyPuzzle();
    if (!data) return;
    setDaily(data);
    setHistory(getHistoryPuzzles(data.daysSinceStart));
    const todayStr = new Date().toISOString().slice(0, 10);
    const alreadyCompleted = loadSavedCompletion(todayStr);
    if (alreadyCompleted) {
      setStarted(true);
    }
  }, [loadSavedCompletion]);

  // ==================== 计时逻辑（完成时立即停止） ====================
  useEffect(() => {
    if (!started || !startTime || completed) return;

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [started, startTime, completed]);

  const handleStart = useCallback(() => {
    setStarted(true);
    setStartTime(Date.now());
    setElapsedTime(0);
    setCompleted(false);
    setSavedCompletion(null);
  }, []);

  // ==================== 关键修改：完成时立即停止计时 ====================
  const handleComplete = useCallback((finalTime: number) => {
    setElapsedTime(finalTime);
    setCompleted(true);
    setStartTime(null);          // ← 新增：立即让计时器停止
    saveCompletion(finalTime);
  }, [saveCompletion]);

  const handleViewResult = useCallback(() => {
    setCompleted(true);
  }, []);

  const loadHistoryPuzzle = useCallback((item: HistoryPuzzleData) => {
    setDaily({
      puzzle: item.puzzle,
      template: item.template,
      index: item.index,
      daysSinceStart: 0,
    });
    setStarted(false);
    setCompleted(false);
    setElapsedTime(0);
    setSavedCompletion(null);
    setShowHistory(false);
  }, []);

  const renderBoard = useCallback(() => {
    if (!daily) return null;
    const { puzzle } = daily;
    if (puzzle.type === 'nurikabe') {
      return (
        <NurikabeBoard
          puzzle={puzzle}
          startTime={startTime!}
          onComplete={handleComplete}
        />
      );
    } else if (puzzle.type === 'fillomino') {
      return (
        <FillominoBoard
          puzzle={puzzle}
          startTime={startTime!}
          onComplete={handleComplete}
        />
      );
    }
    return null;
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
            onClick={() => setShowHistory(true)}
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
                <Button variant="ghost" onClick={() => setShowHistory(false)}>
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
          onClose={() => setCompleted(false)}
          puzzleType={daily?.puzzle.type || 'fillomino'}
          dateStr={new Date().toISOString().slice(0, 10)}
        />
      </div>
    </div>
  );
}

export default App;