// src/components/CompletionModal.tsx
import { useState, useCallback, useEffect, useRef, useMemo, type CSSProperties } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import { useI18n } from '@/i18n/useI18n';
import { getPuzzleTemplate } from '@/puzzles/registry';
import type { PuzzleType } from '@/puzzles/types';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface Props {
  isOpen: boolean;
  time: number;
  onClose: () => void;
  puzzleType: PuzzleType;
  dateStr: string;
}

const CONFETTI_COLORS = ['#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#8b5cf6', '#f472b6', '#eab308'];

interface ConfettiPiece {
  id: string;
  left: number;
  width: number;
  height: number;
  background: string;
  borderRadius: string;
  animationDelay: string;
  animationDuration: string;
  drift: string;
}

function createConfettiPieces(seed: number): ConfettiPiece[] {
  let state = seed >>> 0 || 1;
  const rand = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };

  return Array.from({ length: 70 }, (_, index) => {
    const size = 6 + Math.floor(rand() * 6);
    return {
      id: `${seed}-${index}`,
      left: rand() * 100,
      width: size,
      height: size * (rand() > 0.5 ? 1 : 0.5),
      background: CONFETTI_COLORS[Math.floor(rand() * CONFETTI_COLORS.length)],
      borderRadius: rand() > 0.6 ? '50%' : '2px',
      animationDelay: `${(rand() * 0.6).toFixed(2)}s`,
      animationDuration: `${(2.4 + rand() * 1.8).toFixed(2)}s`,
      drift: `${Math.round((rand() - 0.5) * 240)}px`,
    };
  });
}

function wrapCanvasText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const lines: string[] = [];
  let current = '';

  for (const char of text) {
    const candidate = current + char;
    if (current && context.measureText(candidate).width > maxWidth) {
      lines.push(current);
      current = char;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function buildShareCanvas(dateStr: string, puzzleName: string, minutes: number, seconds: number): HTMLCanvasElement {
  const size = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) return canvas;

  const pad = (value: number) => String(value).padStart(2, '0');
  const fontFamily = '"Geist Variable", "Noto Sans SC", system-ui, sans-serif';

  context.fillStyle = '#f8f1e3';
  context.fillRect(0, 0, size, size);
  context.fillStyle = '#5a3d27';
  context.fillRect(0, 0, size, 14);

  context.textAlign = 'center';
  context.textBaseline = 'alphabetic';

  context.fillStyle = '#3f2a1e';
  context.font = `600 46px ${fontFamily}`;
  context.fillText('每日纸笔谜题 · Daily Logic Puzzles', size / 2, 190);

  context.fillStyle = '#2f241a';
  context.font = `700 84px ${fontFamily}`;
  const nameLines = wrapCanvasText(context, puzzleName, size - 160);
  nameLines.slice(0, 2).forEach((line, index) => {
    context.fillText(line, size / 2, 340 + index * 100);
  });

  context.fillStyle = '#8a6a4f';
  context.font = `500 44px ${fontFamily}`;
  context.fillText(dateStr, size / 2, 620);

  context.fillStyle = '#2f241a';
  context.font = `700 220px ui-monospace, SFMono-Regular, Menlo, monospace`;
  context.fillText(`${pad(minutes)}:${pad(seconds)}`, size / 2, 850);

  context.fillStyle = '#8a6a4f';
  context.font = `500 44px ${fontFamily}`;
  context.fillText('penpuz.today', size / 2, 980);

  return canvas;
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
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  const puzzleName = getPuzzleTemplate(puzzleType).name[locale];
  const shareText = copy.completionModal.shareText(dateStr, puzzleName, minutes, seconds);

  const [copied, setCopied] = useState(false);
  const [confettiSeed, setConfettiSeed] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
    } else {
      setConfettiSeed((current) => current + 1);
    }
  }, [isOpen]);

  const confettiPieces = useMemo(
    () => (isOpen ? createConfettiPieces(confettiSeed) : []),
    [confettiSeed, isOpen]
  );

  const fallbackCopyText = useCallback((text: string) => {
    const textArea = hiddenCopyRef.current;
    if (!textArea) return false;

    const activeElement = document.activeElement as HTMLElement | null;
    const selection = window.getSelection();
    const previousRange =
      selection && selection.rangeCount > 0 ? selection.getRangeAt(0).cloneRange() : null;

    textArea.value = text;
    textArea.readOnly = false;

    if (/iphone|ipad|ipod/i.test(window.navigator.userAgent)) {
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
      textArea.value = '';
      textArea.readOnly = true;
      textArea.contentEditable = 'false';

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

    if (!success) {
      try {
        if (navigator.clipboard?.writeText && window.isSecureContext) {
          await navigator.clipboard.writeText(shareText);
          success = true;
        }
      } catch (err) {
        console.warn('Clipboard API 失败，尝试 fallback:', err);
      }
    }

    if (!success) {
      success = fallbackCopyText(shareText);
    }

    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      console.error('复制操作完全失败');
    }
  }, [fallbackCopyText, shareText]);

  const downloadShareImage = useCallback(() => {
    const canvas = buildShareCanvas(dateStr, puzzleName, minutes, seconds);
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `penpuz-${dateStr}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [dateStr, minutes, puzzleName, seconds]);

  return (
    <>
      {confettiPieces.length > 0 && (
        <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden="true">
          {confettiPieces.map((piece) => (
            <span
              key={piece.id}
              className="confetti-piece"
              style={
                {
                  left: `${piece.left}%`,
                  width: `${piece.width}px`,
                  height: `${piece.height}px`,
                  backgroundColor: piece.background,
                  borderRadius: piece.borderRadius,
                  animationDelay: piece.animationDelay,
                  animationDuration: piece.animationDuration,
                  '--confetti-drift': piece.drift,
                } as CSSProperties
              }
            />
          ))}
        </div>
      )}

      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <DialogContent className="max-w-md border-[#d7c7b4] bg-[#fffdf9] p-4 dark:border-gray-700 dark:bg-gray-900">
          <textarea
            ref={hiddenCopyRef}
            readOnly
            aria-hidden="true"
            tabIndex={-1}
            className="pointer-events-none absolute left-4 top-4 h-px w-px opacity-0"
          />

          <DialogHeader>
            <DialogTitle className="text-center text-2xl text-[#2f241a] dark:text-gray-100">
              {copy.completionModal.title}
            </DialogTitle>
          </DialogHeader>

          <div className="py-2 text-center">
            <p className="mb-1 text-5xl font-mono font-bold tracking-tight text-[#2f241a] dark:text-gray-100 sm:text-6xl">
              {minutes}:{seconds < 10 ? '0' : ''}{seconds}
            </p>
          </div>

          {/* 复制按钮 */}
          <Button onClick={copyToClipboard} className="w-full" disabled={copied}>
            {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
            {copied ? copy.completionModal.copied : copy.completionModal.copyShare}
          </Button>

          <Button variant="outline" onClick={downloadShareImage} className="w-full">
            <Download aria-hidden="true" />
            {copy.completionModal.downloadShareImage}
          </Button>

          <Button variant="ghost" onClick={onClose} className="w-full">
            {copy.completionModal.backHome}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
