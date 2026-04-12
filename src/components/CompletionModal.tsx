// src/components/CompletionModal.tsx
import { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';

export default function CompletionModal({
  isOpen,
  time,
  onClose,
}: {
  isOpen: boolean;
  time: number;
  onClose: () => void;
}) {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  const shareText = `我在每日纸笔谜题网站完成了今天的 ${time >= 0 ? '谜题' : 'Nurikabe'}！用时 ${minutes} 分 ${seconds} 秒\nhttps://penpuz.today`;

  const [copied, setCopied] = useState(false);

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
    } catch {
      // 移动端 fallback
      const textArea = document.createElement('textarea');
      textArea.value = shareText;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
      } finally {
        document.body.removeChild(textArea);
      }
    }
    setTimeout(() => setCopied(false), 2000);
  }, [shareText]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose(); // 只在关闭时调用 onClose，避免循环
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

        <Button onClick={copyToClipboard} className="w-full" disabled={copied}>
          {copied ? '✅ 已复制！' : '一键复制分享'}
        </Button>

        <Button variant="outline" onClick={onClose} className="w-full">
          返回首页
        </Button>
      </DialogContent>
    </Dialog>
  );
}