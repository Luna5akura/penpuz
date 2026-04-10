// src/components/RulesSection.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function RulesSection() {
  return (
    <Card className="max-w-4xl mx-auto mt-12">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-[#3f2a1e] text-center">
          游戏规则
        </CardTitle>
      </CardHeader>
      <CardContent className="prose text-[#3f2a1e] leading-relaxed px-8">
        {/* 规则文字：每句独立 + 序号 */}
        <div className="space-y-6 mb-12">
          <div className="flex gap-4 items-start">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#3f2a1e] text-white flex items-center justify-center font-bold text-lg">1</span>
            <p className="text-lg pt-1">
              涂黑一些空格，使得所有涂黑的格子连通成一个整体，且没有全部涂黑的2×2结构。
            </p>
          </div>
          
          <div className="flex gap-4 items-start">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#3f2a1e] text-white flex items-center justify-center font-bold text-lg">2</span>
            <p className="text-lg pt-1">
              每一组连通的留白格必须恰好包含一个数字。
            </p>
          </div>
          
          <div className="flex gap-4 items-start">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#3f2a1e] text-white flex items-center justify-center font-bold text-lg">3</span>
            <p className="text-lg pt-1">
              数字表示其所在的留白的连通组格数。
            </p>
          </div>
        </div>

        {/* 例题区域：标题居中 + 左右例题完全居中对齐 */}
        <div className="mt-10">
          <h3 className="text-2xl font-semibold mb-8 text-center text-[#3f2a1e]">
            例题（5×5）
          </h3>
          
          <div className="flex flex-col lg:flex-row gap-10 justify-center">
            
            {/* 左侧：线索网格 */}
            <div className="flex flex-col items-center">
              <p className="text-base font-medium text-muted-foreground mb-4">线索网格</p>
              <div
                className="inline-grid gap-[1px] bg-[#d2b48c] p-3 border-4 border-[#3f2a1e]"
                style={{ gridTemplateColumns: 'repeat(5, 44px)' }}
              >
                {[
                  [null, null, null, 3, null],
                  [2, null, null, null, null],
                  [null, null, null, null, null],
                  [null, "?", null, null, 1],
                  [null, null, null, null, null],
                ].flatMap((row, r) =>
                  row.map((value, c) => (
                    <div
                      key={`${r}-${c}`}
                      className={`w-[44px] h-[44px] flex items-center justify-center text-2xl font-bold border-0
                        ${value !== null
                          ? 'bg-[#f8f1e3] text-[#3f2a1e]'
                          : 'bg-[#f8f1e3]'}`}
                    >
                      {value ?? ''}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 右侧：正确解法示例 */}
            <div className="flex flex-col items-center">
              <p className="text-base font-medium text-muted-foreground mb-4">正确解法示例</p>
              <div
                className="inline-grid gap-[1px] bg-[#d2b48c] p-3 border-4 border-[#3f2a1e]"
                style={{ gridTemplateColumns: 'repeat(5, 44px)' }}
              >
                {[
                  [1, 1, 1, 0, 0],
                  [0, 0, 1, 1, 0],
                  [1, 1, 0, 1, 1],
                  [1, 0, 0, 1, 0],
                  [1, 1, 1, 1, 1],
                ].flatMap((row, r) =>
                  row.map((isBlack, c) => (
                    <div
                      key={`${r}-${c}`}
                      className={`w-[44px] h-[44px] flex items-center justify-center text-2xl font-bold border-0
                        ${isBlack
                          ? 'bg-[#3f2a1e] text-white'
                          : 'bg-[#f8f1e3] text-[#3f2a1e]'}`}
                    >
                      {(r === 1 && c === 0) ? '2' :
                       (r === 0 && c === 3) ? '3' :
                       (r === 3 && c === 1) ? '?' :
                       (r === 3 && c === 4) ? '1' : ''}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-10 text-center">
            ※ 例题仅供参考，实际每日谜题规模更大
          </p>
        </div>
      </CardContent>
    </Card>
  );
}