import { useMemo, useState } from 'react';
import { ExternalLink, Play } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useI18n } from '@/i18n/useI18n';
import { getAllDatabasePuzzles, getPuzzleDateStr } from '@/puzzles/database';
import { normalizePuzzLinkDataPart } from '@/puzzles/gridUtils';
import { getPuzzleTemplate, renderPuzzleBoard } from '@/puzzles/registry';
import { puzzleDifficultyLabels } from '@/puzzles/types';

/**
 * Hidden link-only page: every parseable database puzzle, sorted by the date
 * it appears in the daily rotation (newest first), playable inline or
 * openable as a standalone puzzle page, with no daily-date restriction.
 * It is intentionally not linked from any navigation UI.
 */
export default function AllPuzzlesPage() {
  const { locale } = useI18n();
  const items = useMemo(
    () => getAllDatabasePuzzles().sort((left, right) => right.index - left.index),
    []
  );
  const [openIndexes, setOpenIndexes] = useState<Set<number>>(() => new Set());
  const [resetToken, setResetToken] = useState(0);
  const [startTime] = useState(() => Date.now());

  const togglePlay = (index: number) => {
    setOpenIndexes((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-background px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>
                {locale === 'zh-CN' ? '全部题库' : 'All Database Puzzles'}
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {locale === 'zh-CN'
                  ? `共 ${items.length} 道题目，按其在每日轮换中的日期排序（新日期在前）。本页面不参与每日轮换，仅可通过链接进入。`
                  : `${items.length} puzzles, sorted by their daily-rotation date (newest first). This page is outside the daily rotation and can only be opened by link.`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" onClick={() => setResetToken((value) => value + 1)}>
                {locale === 'zh-CN' ? '全部重置' : 'Reset all'}
              </Button>
              <Button asChild variant="outline">
                <a href="/">
                  {locale === 'zh-CN' ? '返回主页' : 'Back to home'}
                </a>
              </Button>
            </div>
          </CardHeader>
        </Card>

        <div className="grid min-w-0 max-w-full grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const template = getPuzzleTemplate(item.type);
            const open = openIndexes.has(item.index);
            const dataPath = normalizePuzzLinkDataPart(item.entry.puzzLink);
            const dateStr = getPuzzleDateStr(item.index);
            return (
              <Card key={item.index} className="w-full min-w-0 max-w-full overflow-hidden">
                <CardHeader className="min-w-0 gap-2 border-b bg-muted/20">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">
                      {template.name[locale]} #{item.index + 1}
                    </CardTitle>
                    <Badge variant="outline">{puzzleDifficultyLabels[item.entry.difficulty][locale]}</Badge>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                    <span>{dateStr}</span>
                    <span>{item.puzzle.width}×{item.puzzle.height} · {item.type}</span>
                  </div>
                </CardHeader>
                <CardContent className="w-full min-w-0 max-w-full p-3 sm:p-4">
                  {open ? (
                    <div className="w-full min-w-0 max-w-full">
                      {renderPuzzleBoard(
                        item.puzzle,
                        startTime,
                        resetToken,
                        () => {},
                      )}
                    </div>
                  ) : null}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant={open ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => togglePlay(item.index)}
                    >
                      <Play />
                      {locale === 'zh-CN' ? (open ? '收起' : '在此游玩') : (open ? 'Collapse' : 'Play here')}
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <a href={`/?${dataPath}`} target="_blank" rel="noreferrer">
                        <ExternalLink />
                        {locale === 'zh-CN' ? '独立页面打开' : 'Open standalone'}
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {items.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {locale === 'zh-CN' ? 'database 中暂无可解析题目。' : 'No parseable database puzzles found.'}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
