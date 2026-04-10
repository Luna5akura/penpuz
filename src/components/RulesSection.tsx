// src/components/RulesSection.tsx
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function RulesSection() {
  return (
    <Card className="mt-10 p-6 max-w-2xl mx-auto">
      <h3 className="text-xl font-bold mb-4">Nurikabe（数墙）规则</h3>
      <ul className="space-y-3 text-sm">
        <li><Badge>1</Badge> 每个数字所在“岛屿”面积必须等于该数字，且岛屿只能横向或纵向相连。</li>
        <li><Badge>2</Badge> 不同岛屿之间不能横向或纵向相邻（只能斜向接触）。</li>
        <li><Badge>3</Badge> 黑色“海域”必须全部连通，且任意 2×2 区域内不能全是黑色。</li>
        <li><Badge>4</Badge> 所有数字格均为岛屿的一部分，不可涂黑。</li>
      </ul>
      <div className="mt-6">
        <p className="text-xs uppercase tracking-widest mb-2">例题（已完成状态）</p>
        {/* 可在此放入一张静态例题图片或小型网格展示 */}
      </div>
    </Card>
  );
}