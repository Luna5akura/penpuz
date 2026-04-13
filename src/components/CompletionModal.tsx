// src/components/CompletionModal.tsx
import { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';

interface Props {
  isOpen: boolean;
  time: number;
  onClose: () => void;
  puzzleType: 'nurikabe' | 'fillomino';   // 新增：题目类型
  dateStr: string;                        // 新增：日期字符串（如 "2026-04-13"）
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

  // 新增：题目名称映射（中文显示）
  const puzzleName = puzzleType === 'fillomino' ? 'Fillomino' : 'Nurikabe';

  // 更新后的分享文本（包含题目类型和日期）
  const shareText = `我在每日纸笔谜题网站完成了 ${dateStr} 的 ${puzzleName} 谜题！用时 ${minutes} 分 ${seconds} 秒\nhttps://penpuz.today`;

  const [copied, setCopied] = useState(false);

  const copyToClipboard = useCallback(async () => {
    let success = false;

    try {
      // 优先使用现代 Clipboard API（要求安全上下文）
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(shareText);
        success = true;
      } else {
        throw new Error('Clipboard API not supported or insecure context');
      }
    } catch (err) {
      console.warn('Clipboard API 失败，尝试增强版 fallback:', err);

      // 增强版移动端 fallback（兼容 iOS Safari 与 Android）
      const textArea = document.createElement('textarea');
      textArea.value = shareText;

      // 关键优化样式
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '-9999px';
      textArea.style.opacity = '0';
      textArea.style.pointerEvents = 'none';
      textArea.style.zIndex = '-1';

      // iOS 必需属性
      textArea.setAttribute('readonly', 'true');
      textArea.contentEditable = 'true';

      document.body.appendChild(textArea);

      // 确保文本被正确选中（移动端关键）
      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, textArea.value.length);

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
      setTimeout(() => setCopied(false), 2000);
    } else {
      console.error('复制操作未能成功');
      // 未来可在此处集成 Toast 组件提示用户“复制失败，请手动长按分享文本”
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