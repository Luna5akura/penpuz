import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link as LinkIcon, RotateCcw } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useI18n } from '@/i18n/useI18n';
import { getDatabasePuzzleSamples } from '@/puzzles/database';
import { getPuzzleTemplate, renderPuzzleBoard } from '@/puzzles/registry';
import { puzzleDifficultyLabels } from '@/puzzles/types';

function FitBoard({ children }: { children: ReactNode }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return undefined;
    const measure = () => {
      const available = viewport.clientWidth;
      const natural = content.scrollWidth;
      if (!available || !natural) return;
      setScale((current) => {
        const next = Math.min(1, available / natural);
        return Math.abs(next - current) < 0.01 ? current : next;
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={viewportRef} className="w-full min-w-0 max-w-full overflow-hidden">
      <div
        ref={contentRef}
        className="w-full min-w-0 origin-top-left"
        style={{ zoom: scale }}
      >
        {children}
      </div>
    </div>
  );
}

/** Internal smoke-test page: one real database puzzle for every registered type. */
export default function DatabasePuzzleTestPage() {
  const { locale } = useI18n();
  const samples = useMemo(() => getDatabasePuzzleSamples(), []);
  const [resetToken, setResetToken] = useState(0);
  const [desktopColumns, setDesktopColumns] = useState<1 | 2 | 3>(2);
  const [startTime] = useState(() => Date.now());
  const desktopGridClass = {
    1: 'lg:grid-cols-1',
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
  }[desktopColumns];

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-background px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>
                {locale === 'zh-CN' ? '题库题型测试页' : 'Database Puzzle Test'}
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {locale === 'zh-CN'
                  ? `当前展示 ${samples.length} 种题型，每种取 database 中第一道可解析题目。`
                  : `Showing ${samples.length} puzzle types, using the first parseable database entry for each.`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-md border bg-background p-1" role="group" aria-label={locale === 'zh-CN' ? '电脑端每行题目数' : 'Desktop columns'}>
                <span className="px-2 text-xs text-muted-foreground">
                  {locale === 'zh-CN' ? '电脑端每行' : 'Desktop'}
                </span>
                {([1, 2, 3] as const).map((columns) => (
                  <Button
                    key={columns}
                    type="button"
                    variant={desktopColumns === columns ? 'default' : 'ghost'}
                    size="sm"
                    className="h-8 min-w-8 px-2"
                    aria-pressed={desktopColumns === columns}
                    onClick={() => setDesktopColumns(columns)}
                  >
                    {columns}
                  </Button>
                ))}
              </div>
              <Button type="button" variant="outline" onClick={() => setResetToken((value) => value + 1)}>
                <RotateCcw />
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

        <div className={`grid min-w-0 max-w-full grid-cols-1 gap-5 overflow-hidden ${desktopGridClass}`}>
          {samples.map(({ type, entry, puzzle }) => {
            const template = getPuzzleTemplate(type);
            const title = template.name[locale];
            const difficulty = puzzleDifficultyLabels[entry.difficulty][locale];
            return (
              <Card key={type} className="w-full min-w-0 max-w-full overflow-hidden">
                <CardHeader className="min-w-0 gap-2 border-b bg-muted/20">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-lg">{title}</CardTitle>
                    <Badge variant="outline">{type}</Badge>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                    <span>{puzzle.width}×{puzzle.height}</span>
                    <span>{difficulty}</span>
                  </div>
                </CardHeader>
                <CardContent className="w-full min-w-0 max-w-full p-3 sm:p-4">
                  <FitBoard>
                    {renderPuzzleBoard(
                      puzzle,
                      startTime,
                      resetToken,
                      () => {},
                    )}
                  </FitBoard>
                  <a
                    className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:underline"
                    href={entry.puzzLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <LinkIcon className="size-3" />
                    {locale === 'zh-CN' ? '打开题目链接' : 'Open puzzle link'}
                  </a>
                </CardContent>
              </Card>
            );
          })}
        </div>
        {samples.length === 0 && (
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
