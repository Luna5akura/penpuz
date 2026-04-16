// src/components/CompletionModal.tsx
import { useState, useCallback, useEffect, useRef } from 'react';
import { useI18n } from '@/i18n/useI18n';
import { getPuzzleTemplate } from '@/puzzles/registry';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';

interface Props {
  isOpen: boolean;
  time: number;
  onClose: () => void;
  puzzleType: 'nurikabe' | 'fillomino' | 'yajilin' | 'starbattle';
  dateStr: string;
}

export default function CompletionModal({
  isOpen,
  time,
  onClose,
  puzzleType,
  dateStr,
}: Props) {
  const { locale, copy } = useI18n();
  const hiddenCopyRef = useRef<HTMLTextAreaElement | null>(null);
  const manualCopyRef = useRef<HTMLTextAreaElement | null>(null);
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  const puzzleName = getPuzzleTemplate(puzzleType).name[locale];
  const shareText = copy.completionModal.shareText(dateStr, puzzleName, minutes, seconds);

  const [copied, setCopied] = useState(false);
  const [showManualCopy, setShowManualCopy] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
      setShowManualCopy(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (showManualCopy) {
      manualCopyRef.current?.focus({ preventScroll: true });
      manualCopyRef.current?.select();
    }
  }, [showManualCopy]);

  const fallbackCopyText = useCallback((text: string) => {
    const textArea = hiddenCopyRef.current;
    if (!textArea) return false;

    const activeElement = document.activeElement as HTMLElement | null;
    const selection = window.getSelection();
    const previousRange =
      selection && selection.rangeCount > 0 ? selection.getRangeAt(0).cloneRange() : null;

    textArea.value = text;
    textArea.removeAttribute('readonly');
    textArea.focus({ preventScroll: true });
    textArea.select();
    textArea.setSelectionRange(0, textArea.value.length);

    let success = false;

    try {
      success = document.execCommand('copy');
    } catch (fallbackErr) {
      console.error('execCommand("copy") 执行失败:', fallbackErr);
    } finally {
      textArea.blur();
      textArea.value = '';
      textArea.setAttribute('readonly', '');

      if (selection) {
        selection.removeAllRanges();
        if (previousRange) selection.addRange(previousRange);
      }

      activeElement?.focus?.();
    }

    return success;
  }, []);

  const copyToClipboard = useCallback(async () => {
    let success = false;

    // 优先尝试现代 Clipboard API
    try {
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(shareText);
        success = true;
      }
    } catch (err) {
      console.warn('Clipboard API 失败，尝试 fallback:', err);
    }

    // 如果 Clipboard API 失败或不可用，回退到 execCommand 方案
    if (!success) {
      success = fallbackCopyText(shareText);
    }

    if (success) {
      setCopied(true);
      setShowManualCopy(false);
      setTimeout(() => setCopied(false), 2000);
    } else {
      // 完全失败时显示手动复制面板
      setShowManualCopy(true);
      console.error('复制操作完全失败，已提供手动复制方案');
    }
  }, [fallbackCopyText, shareText]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-md dark:bg-gray-900 dark:border-gray-700">
        {/* Keep the fallback textarea inside the dialog so Radix focus trapping doesn't block selection/copy. */}
        <textarea
          ref={hiddenCopyRef}
          readOnly
          aria-hidden="true"
          tabIndex={-1}
          className="pointer-events-none absolute left-4 top-4 h-px w-px opacity-0"
        />

        <DialogHeader>
          <DialogTitle className="text-2xl text-center text-[#3f2a1e] dark:text-gray-100">
            {copy.completionModal.title}
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            {copy.completionModal.subtitle}
          </DialogDescription>
        </DialogHeader>

        <div className="text-center py-6">
          <p className="text-6xl font-mono font-bold tracking-tighter text-[#3f2a1e] dark:text-gray-100 mb-2">
            {minutes}:{seconds < 10 ? '0' : ''}{seconds}
          </p>
          <p className="text-muted-foreground dark:text-gray-400">{copy.completionModal.elapsedLabel}</p>
        </div>

        {/* 复制按钮 */}
        <Button onClick={copyToClipboard} className="w-full" disabled={copied}>
          {copied ? copy.completionModal.copied : copy.completionModal.copyShare}
        </Button>

        {/* 手动复制备用方案 */}
        {showManualCopy && (
          <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border text-sm">
            <p className="text-muted-foreground mb-2 text-center">{copy.completionModal.manualCopyHint}</p>
            <textarea
              ref={manualCopyRef}
              readOnly
              value={shareText}
              className="min-h-28 w-full resize-none whitespace-pre-wrap break-all text-xs font-mono bg-white dark:bg-gray-900 p-3 rounded border"
              onFocus={(event) => event.currentTarget.select()}
              onClick={(event) => event.currentTarget.select()}
            />
          </div>
        )}

        <Button variant="outline" onClick={onClose} className="w-full">
          {copy.completionModal.backHome}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
