// src/components/CompletionModal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
// import { useState } from 'react';

export default function CompletionModal({ isOpen, time, onClose }: { isOpen: boolean; time: number; onClose: () => void }) {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  const shareText = `我在每日纸笔谜题网站完成了今天的 Nurikabe！用时 ${minutes} 分 ${seconds} 秒\nhttps://penpuz.today`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareText).then(() => alert('已复制到剪贴板！'));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">🎉 谜题完成！</DialogTitle>
        </DialogHeader>
        <div className="text-center py-6">
          <p className="text-5xl font-mono mb-2">{minutes}:{seconds < 10 ? '0' : ''}{seconds}</p>
          <p className="text-muted-foreground">您的用时</p>
        </div>
        <Button onClick={copyToClipboard} className="w-full">一键复制分享</Button>
        <Button variant="outline" onClick={onClose} className="w-full">返回首页</Button>
      </DialogContent>
    </Dialog>
  );
}