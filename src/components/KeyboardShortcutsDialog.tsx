import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useI18n } from '@/i18n/useI18n';
import { getInteractionHints } from '@/puzzles/interactionHints';
import type { PuzzleType } from '@/puzzles/types';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface ShortcutItem {
  keys: string;
  label: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  puzzleType?: PuzzleType | null;
}

/** Keyboard shortcut reference opened with the `?` key. */
export default function KeyboardShortcutsDialog({ open, onClose, puzzleType }: Props) {
  const { locale, copy } = useI18n();

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  const hints = puzzleType ? getInteractionHints(puzzleType) : [];
  const items: ShortcutItem[] = [
    { keys: '?', label: copy.app.shortcutsToggle },
    { keys: 'Ctrl/Cmd + Z', label: copy.assistToolbar.undo },
    { keys: 'Ctrl/Cmd + Shift + Z / Ctrl/Cmd + Y', label: copy.assistToolbar.redo },
    { keys: '1 – 9', label: copy.app.shortcutsEnterNumber },
    { keys: 'Backspace / Delete', label: copy.app.shortcutsClearCell },
    { keys: 'Esc', label: copy.app.shortcutsClose },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-3"
      onClick={onClose}
    >
      <Card
        className="relative w-full max-w-md border-[#d7c7b4] bg-card p-5 dark:border-gray-700 dark:bg-card"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={copy.app.shortcutsTitle}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          className="absolute right-2 top-2"
          onClick={onClose}
          aria-label={copy.app.close}
          title={copy.app.close}
        >
          <X />
        </Button>
        <h2 className="text-center text-xl font-semibold leading-8 text-foreground">
          {copy.app.shortcutsTitle}
        </h2>
        <ul className="mt-4 space-y-2.5">
          {items.map((item) => (
            <li
              key={item.label}
              className="flex items-center justify-between gap-3 border-b border-border/60 pb-2.5 last:border-b-0 last:pb-0"
            >
              <span className="min-w-0 text-sm text-muted-foreground">{item.label}</span>
              <kbd className="shrink-0 rounded-md border border-border bg-muted px-2 py-1 font-mono text-xs text-foreground">
                {item.keys}
              </kbd>
            </li>
          ))}
        </ul>
        {hints.length > 0 && (
          <div className="mt-4 border-t border-border/60 pt-3">
            <h3 className="text-sm font-semibold text-foreground">
              {locale === 'zh-CN' ? '本题型操作' : 'This puzzle type'}
            </h3>
            <ul className="mt-2 space-y-2">
              {hints.map((hint) => (
                <li key={hint.label.en}>
                  <span className="text-sm font-medium text-foreground">{hint.label[locale]}</span>
                  <span className="block text-xs leading-5 text-muted-foreground">{hint.detail[locale]}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </div>
  );
}
