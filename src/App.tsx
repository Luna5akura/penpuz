import { useState, useEffect } from 'react';
import NurikabeBoard from './puzzles/Nurikabe/Nurikabe';
import RulesSection from './components/RulesSection';
import CompletionModal from './components/CompletionModal';
import { getDailyPuzzle, getHistoryPuzzles } from './puzzles/database';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';

function App() {
  const [daily, setDaily] = useState<{ puzzle: any; index: number } | null>(null);
  const [started, setStarted] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [history, setHistory] = useState<{ puzzle: any; index: number }[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const data = getDailyPuzzle();
    setDaily(data);
    if (data) setHistory(getHistoryPuzzles(data.index));
  }, []);

  // 实时计时器
  useEffect(() => {
    if (!started || !startTime || completed) return;
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [started, startTime, completed]);

  const handleStart = () => {
    setStarted(true);
    setStartTime(Date.now());
    setElapsedTime(0);
  };

  const handleComplete = (finalTime: number) => {
    setElapsedTime(finalTime);
    setCompleted(true);
  };

  // 加载历史题目
  const loadHistoryPuzzle = (item: { puzzle: any; index: number }) => {
    setDaily(item);
    setStarted(false);
    setCompleted(false);
    setElapsedTime(0);
    setShowHistory(false);
  };

  if (!daily) return <div className="text-center py-12">加载每日谜题中...</div>;

  return (
    <div className="min-h-screen bg-[#f8f1e3] py-8 font-serif">
      <div className="max-w-4xl mx-auto px-6">
        {/* 标题栏 + 今日序号 + 历史按钮 */}
        <Card className="mb-8 p-6 text-center flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#3f2a1e]">每日纸笔谜题</h1>
            <p className="text-lg text-muted-foreground mt-2">
              今日题型：Nurikabe（数墙） • 第 {daily.index} 个
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
          /* 开始界面（保持不变） */
          <Card className="max-w-md mx-auto p-8 text-center">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-[#3f2a1e] mb-2">准备开始</h2>
              <p className="text-lg text-muted-foreground">
                本次谜题：<span className="font-medium">Nurikabe（数墙）</span>
              </p>
              <p className="text-4xl font-bold text-[#3f2a1e] mt-6">
                第 {daily.index} 题
              </p>
            </div>
            <Button onClick={handleStart} size="lg" className="px-10 py-6 text-lg font-medium">
              开始解题
            </Button>
            <p className="text-xs text-muted-foreground mt-8">
              计时将在您点击开始后启动
            </p>
          </Card>
        ) : (
          /* 谜题主区域 + 实时计时（保持不变） */
          <>
            <div className="flex justify-between items-center mb-6 px-2">
              <div className="text-lg font-medium text-[#3f2a1e]">
                用时：{elapsedTime} 秒
              </div>
              <div className="text-sm text-muted-foreground">
                Nurikabe • 第 {daily.index} 题
              </div>
            </div>
            <div className="flex justify-center mb-12">
              <NurikabeBoard
                puzzle={daily.puzzle}
                startTime={startTime!}
                onComplete={handleComplete}
              />
            </div>
          </>
        )}

        <RulesSection />

        {/* 历史题目列表 Modal */}
        {showHistory && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <Card className="max-w-lg w-full max-h-[80vh] overflow-auto">
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-[#3f2a1e]">历史题目</h2>
                <Button variant="ghost" onClick={() => setShowHistory(false)}>
                  关闭
                </Button>
              </div>
              <div className="p-6 space-y-3">
                {history.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">暂无历史题目</p>
                ) : (
                  history.map((item) => (
                    <Button
                      key={item.index}
                      variant="outline"
                      className="w-full justify-start text-left h-auto py-4"
                      onClick={() => loadHistoryPuzzle(item)}
                    >
                      <span className="font-medium">Nurikabe（数墙）</span>
                      <span className="ml-auto text-muted-foreground">第 {item.index} 题</span>
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
        />
      </div>
    </div>
  );
}

export default App;