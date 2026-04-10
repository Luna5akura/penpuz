// src/App.tsx
import { useState, useEffect } from 'react';
import NurikabeBoard from './puzzles/Nurikabe/Nurikabe';
import RulesSection from './components/RulesSection';
import CompletionModal from './components/CompletionModal';
import { Card } from '@/components/ui/card';
import { getDailyPuzzle } from './puzzles/database';

function App() {
  const [daily, setDaily] = useState<{ puzzle: any; index: number } | null>(null);
  const [completed, setCompleted] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const data = getDailyPuzzle();
    setDaily(data);
  }, []);

  const handleComplete = (time: number) => {
    setElapsedTime(time);
    setCompleted(true);
  };

  if (!daily) return <div className="text-center py-12">加载每日谜题中...</div>;

  return (
    <div className="min-h-screen bg-[#f8f1e3] py-8 font-serif">
      <div className="max-w-4xl mx-auto px-6">
        {/* 标题栏 + 今日序号 */}
        <Card className="mb-8 p-6 text-center">
          <h1 className="text-3xl font-bold text-[#3f2a1e]">每日纸笔谜题</h1>
          <p className="text-lg text-muted-foreground mt-2">
            今日题型：Nurikabe（数墙） • 第 {daily.index} 个
          </p>
        </Card>

        {/* 谜题主区域 */}
        <div className="flex justify-center mb-12">
          <NurikabeBoard puzzle={daily.puzzle} onComplete={handleComplete} />
        </div>

        <RulesSection />

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