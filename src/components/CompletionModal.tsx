// src/components/CompletionModal.tsx
import { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

export default function CompletionModal({ isOpen, time, onClose }: { isOpen: boolean; time: number; onClose: () => void }) {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  const shareText = `我在每日纸笔谜题网站完成了今天的 Nurikabe！用时 ${minutes} 分 ${seconds} 秒\nhttps://penpuz.today`;

  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      // 现代浏览器首选方式（手机端也支持）
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
    } catch {
      // 移动端 fallback（兼容旧版浏览器）
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

    // 2 秒后恢复按钮文字
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md dark:bg-gray-900 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center text-[#3f2a1e] dark:text-gray-100">🎉 谜题完成！</DialogTitle>
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