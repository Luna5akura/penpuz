// src/components/CompletionModal.tsx
import { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';

interface Props {
  isOpen: boolean;
  time: number;
  onClose: () => void;
  puzzleType: 'nurikabe' | 'fillomino' | 'yajilin';
  dateStr: string;
}

export default function CompletionModal({
  isOpen,
  time,
  onClose,
  puzzleType,
  dateStr,
}: Props) {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  const puzzleName =
    puzzleType === 'fillomino'
      ? 'Fillomino'
      : puzzleType === 'yajilin'
        ? 'Yajilin'
        : 'Nurikabe';

  const shareText = `我在每日纸笔谜题网站完成了 ${dateStr} 的 ${puzzleName} 谜题！用时 ${minutes} 分 ${seconds} 秒\nhttps://penpuz.today`;

  const [copied, setCopied] = useState(false);
  const [showManualCopy, setShowManualCopy] = useState(false);

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

    // 如果 Clipboard API 失败或不可用，执行增强版 textarea fallback
    if (!success) {
      const textArea = document.createElement('textarea');
      textArea.value = shareText;
      textArea.style.position = 'fixed';
      textArea.style.left = '-99999px';
      textArea.style.top = '-99999px';
      textArea.style.opacity = '0';
      textArea.style.pointerEvents = 'none';
      textArea.setAttribute('readonly', 'true');
      textArea.contentEditable = 'true';

      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, textArea.value.length); // 关键：确保全选

      try {
        success = document.execCommand('copy');
      } catch (fallbackErr) {
        console.error('execCommand("copy") 执行失败:', fallbackErr);
      } finally {
        document.body.removeChild(textArea);
      }
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
  }, [shareText]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-md dark:bg-gray-900 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center text-[#3f2a1e] dark:text-gray-100">
            🎉 谜题完成！
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            恭喜您完成今日谜题！
          </DialogDescription>
        </DialogHeader>

        <div className="text-center py-6">
          <p className="text-6xl font-mono font-bold tracking-tighter text-[#3f2a1e] dark:text-gray-100 mb-2">
            {minutes}:{seconds < 10 ? '0' : ''}{seconds}
          </p>
          <p className="text-muted-foreground dark:text-gray-400">您的用时</p>
        </div>

        {/* 复制按钮 */}
        <Button onClick={copyToClipboard} className="w-full" disabled={copied}>
          {copied ? '✅ 已复制！' : '一键复制分享'}
        </Button>

        {/* 手动复制备用方案 */}
        {showManualCopy && (
          <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border text-sm">
            <p className="text-muted-foreground mb-2 text-center">复制失败，请手动长按下方文本复制</p>
            <pre className="whitespace-pre-wrap break-all select-all text-xs font-mono bg-white dark:bg-gray-900 p-3 rounded border">
              {shareText}
            </pre>
          </div>
        )}

        <Button variant="outline" onClick={onClose} className="w-full">
          返回首页
        </Button>
      </DialogContent>
    </Dialog>
  );
}
