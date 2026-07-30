import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Search, X } from 'lucide-react';
import { ruleQuickReferenceItems, type RuleQuickReferenceItem } from '@/puzzles/ruleQuickReference';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';

interface RuleQuickReferenceLabels {
  title: string;
  searchPlaceholder: string;
  resultCount: (filtered: number, total: number) => string;
  noMatches: string;
  close: string;
  chineseRules: string;
  englishRules: string;
  pzprSource: string;
  translatedSource: string;
  appSource: string;
}

interface RuleQuickReferenceDialogProps {
  isOpen: boolean;
  labels: RuleQuickReferenceLabels;
  onClose: () => void;
}

function normalizeSearchText(value: string) {
  return value.trim().toLocaleLowerCase();
}

function getSearchText(item: RuleQuickReferenceItem) {
  return [
    item.refName,
    item.englishName,
    item.chineseName,
    item.chineseAlias,
    item.category,
    item.ruleTags,
    item.chineseRules,
    item.englishRules,
  ]
    .join(' ')
    .toLocaleLowerCase();
}

function RuleQuickReferenceDialog({ isOpen, labels, onClose }: RuleQuickReferenceDialogProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key !== 'Escape') return;

      event.preventDefault();
      onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery) return ruleQuickReferenceItems;

    return ruleQuickReferenceItems.filter((item) => getSearchText(item).includes(normalizedQuery));
  }, [query]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden border border-[#d7c7b4] bg-card text-card-foreground shadow-xl dark:border-gray-700"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={labels.title}
      >
        <div className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-semibold text-foreground">{labels.title}</h2>
            <Badge variant="outline" className="text-sm">
              {labels.resultCount(filteredItems.length, ruleQuickReferenceItems.length)}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label={labels.close}
            title={labels.close}
          >
            <X />
          </Button>
        </div>

        <div className="border-b px-4 py-3">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={labels.searchPlaceholder}
              className="pl-9"
              autoFocus
            />
          </label>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredItems.length === 0 ? (
            <p className="px-4 py-10 text-center text-muted-foreground">{labels.noMatches}</p>
          ) : (
            <div>
              {filteredItems.map((item) => {
                const englishSourceLabel = {
                  'puzz.link/pzpr': labels.pzprSource,
                  'translated-from-xlsx': labels.translatedSource,
                  'app-registry': labels.appSource,
                }[item.englishSource];

                return (
                  <article key={item.id} className="border-b px-4 py-4 last:border-b-0">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <h3 className="text-xl font-semibold text-foreground">
                          <span className="font-mono text-base text-muted-foreground">{item.order}.</span>{' '}
                          {item.englishName}
                          <span className="text-muted-foreground"> / {item.chineseName}</span>
                        </h3>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <Badge variant="outline">{item.category}</Badge>
                          <Badge variant="outline">{item.refName}</Badge>
                          {item.ruleTags && <Badge variant="outline">{item.ruleTags}</Badge>}
                          {item.chineseAlias && item.chineseAlias !== item.chineseName && (
                            <Badge variant="outline">{item.chineseAlias}</Badge>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 space-y-1 text-xs text-muted-foreground lg:text-right">
                        {item.tableRuleSource && <div>{item.tableRuleSource}</div>}
                        <div>
                          {item.sourceUrl ? (
                            <a
                              href={item.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-foreground"
                            >
                              {englishSourceLabel}
                              <ExternalLink className="size-3" />
                            </a>
                          ) : (
                            englishSourceLabel
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 lg:grid-cols-2">
                      <section className="border bg-muted/30 p-3">
                        <h4 className="mb-2 text-sm font-semibold text-muted-foreground">{labels.chineseRules}</h4>
                        <p className="text-sm leading-6 text-foreground">{item.chineseRules}</p>
                      </section>
                      <section className="border bg-muted/30 p-3">
                        <h4 className="mb-2 text-sm font-semibold text-muted-foreground">{labels.englishRules}</h4>
                        <p className="whitespace-pre-line text-sm leading-6 text-foreground">{item.englishRules}</p>
                      </section>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RuleQuickReferenceDialog;
