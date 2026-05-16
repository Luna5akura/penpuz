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
  puzzleType: 'nurikabe' | 'fillomino' | 'yajilin' | 'starbattle' | 'heyawake' | 'aqre' | 'mintonette' | 'nikoji' | 'akari' | 'kurarin' | 'walkwalk';
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
    const activeElement = document.activeElement as HTMLElement | null;
    const selection = window.getSelection();
    const previousRange =
      selection && selection.rangeCount > 0 ? selection.getRangeAt(0).cloneRange() : null;
    const textArea = document.createElement('textarea');

    textArea.value = text;
    textArea.setAttribute('readonly', '');
    textArea.setAttribute('aria-hidden', 'true');
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '1px';
    textArea.style.height = '1px';
    textArea.style.padding = '0';
    textArea.style.border = '0';
    textArea.style.outline = '0';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    textArea.style.opacity = '0.01';
    textArea.style.fontSize = '16px';
    textArea.style.pointerEvents = 'none';
    textArea.style.zIndex = '-1';
    document.body.appendChild(textArea);

    if (/iphone|ipad|ipod/i.test(window.navigator.userAgent)) {
      textArea.removeAttribute('readonly');
      textArea.contentEditable = 'true';
    }

    let success = false;

    try {
      textArea.focus({ preventScroll: true });
      textArea.select();
      textArea.setSelectionRange(0, textArea.value.length);
      success = document.execCommand('copy');
    } catch (fallbackErr) {
      console.error('execCommand("copy") 执行失败:', fallbackErr);
    } finally {
      textArea.blur();
      document.body.removeChild(textArea);

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
    let shareCancelled = false;

    try {
      if (navigator.share) {
        await navigator.share({
          title: copy.app.siteTitle,
          text: shareText,
          url: 'https://penpuz.today',
        });
        success = true;
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        shareCancelled = true;
      } else {
        console.warn('Web Share API 失败，尝试复制:', err);
      }
    }

    if (!success && !shareCancelled) {
      try {
        if (navigator.clipboard?.writeText && window.isSecureContext) {
          await navigator.clipboard.writeText(shareText);
          success = true;
        }
      } catch (err) {
        console.warn('Clipboard API 失败，尝试 fallback:', err);
      }
    }

    if (!success && !shareCancelled) {
      success = fallbackCopyText(shareText);
    }

    if (success) {
      setCopied(true);
      setShowManualCopy(false);
      setTimeout(() => setCopied(false), 2000);
    } else if (!shareCancelled) {
      setShowManualCopy(true);
      console.error('复制操作完全失败，已提供手动复制方案');
    }
  }, [copy.app.siteTitle, fallbackCopyText, shareText]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-md border-[#d7c7b4] bg-[#fffdf9] p-4 dark:border-gray-700 dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl text-[#2f241a] dark:text-gray-100">
            {copy.completionModal.title}
          </DialogTitle>
          <DialogDescription className="text-center text-base text-muted-foreground">
            {copy.completionModal.subtitle}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 text-center">
          <p className="mb-1 text-5xl font-mono font-bold tracking-tight text-[#2f241a] dark:text-gray-100 sm:text-6xl">
            {minutes}:{seconds < 10 ? '0' : ''}{seconds}
          </p>
          <p className="text-sm text-muted-foreground dark:text-gray-400">{copy.completionModal.elapsedLabel}</p>
        </div>

        {/* 复制按钮 */}
        <Button onClick={copyToClipboard} className="w-full" disabled={copied}>
          {copied ? copy.completionModal.copied : copy.completionModal.copyShare}
        </Button>

        {/* 手动复制备用方案 */}
        {showManualCopy && (
          <div className="border bg-muted/60 p-3 text-sm dark:bg-gray-800">
            <p className="mb-2 text-center text-sm text-muted-foreground">{copy.completionModal.manualCopyHint}</p>
            <textarea
              ref={manualCopyRef}
              readOnly
              value={shareText}
              className="min-h-28 w-full resize-none whitespace-pre-wrap break-all border bg-white p-2.5 text-xs font-mono dark:bg-gray-900"
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
