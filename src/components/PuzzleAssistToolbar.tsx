import { useEffect } from 'react';
import { Bookmark, BookmarkPlus, Check, GitBranch, Redo2, Rewind, RotateCcw, Undo2, X } from 'lucide-react';
import { useI18n } from '@/i18n/useI18n';
import { Button } from './ui/button';
import { useRestartAction } from './RestartActionContext';

interface Props {
  canUndo: boolean;
  canRedo: boolean;
  trialActive: boolean;
  trialCheckpointCount: number;
  canUndoTrialCheckpoint: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onAddTrialCheckpoint: () => void;
  onUndoTrialCheckpoint: () => void;
  onStartTrial: () => void;
  onDiscardTrial: () => void;
  onCommitTrial: () => void;
}

export default function PuzzleAssistToolbar({
  canUndo,
  canRedo,
  trialActive,
  trialCheckpointCount,
  canUndoTrialCheckpoint,
  onUndo,
  onRedo,
  onAddTrialCheckpoint,
  onUndoTrialCheckpoint,
  onStartTrial,
  onDiscardTrial,
  onCommitTrial,
}: Props) {
  const { copy } = useI18n();
  const onRestart = useRestartAction();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditable =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        !!target?.isContentEditable;

      if (isEditable || (!event.metaKey && !event.ctrlKey)) return;

      const key = event.key.toLowerCase();
      if (key === 'z') {
        event.preventDefault();
        if (event.shiftKey) {
          if (canRedo) onRedo();
        } else if (canUndo) {
          onUndo();
        }
        return;
      }

      if (key === 'y' && canRedo) {
        event.preventDefault();
        onRedo();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [canRedo, canUndo, onRedo, onUndo]);

  return (
    <div
      className={`flex w-full flex-col items-center gap-2 border px-3 py-2 transition-colors ${
        trialActive
          ? 'border-amber-400 bg-amber-50/80 dark:border-amber-700 dark:bg-amber-950/25'
          : 'border-[#d3c3ae] bg-[#fffdf9] dark:border-gray-700 dark:bg-gray-900'
      }`}
    >
      <div className={`flex flex-wrap items-center justify-center gap-1.5 ${trialActive ? 'w-full' : 'mx-auto'}`}>
        {onRestart && (
          <>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={onRestart}
              aria-label={copy.app.restart}
              title={copy.app.restart}
            >
              <RotateCcw />
            </Button>
            <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />
          </>
        )}
        <Button
          variant="outline"
          size="icon-sm"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label={copy.assistToolbar.undo}
          title={`${copy.assistToolbar.undo} (Ctrl/Cmd + Z)`}
        >
          <Undo2 />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={onRedo}
          disabled={!canRedo}
          aria-label={copy.assistToolbar.redo}
          title={`${copy.assistToolbar.redo} (Ctrl/Cmd + Shift + Z / Ctrl/Cmd + Y)`}
        >
          <Redo2 />
        </Button>

        <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />

        {!trialActive ? (
          <Button
            variant="outline"
            size="icon-sm"
            onClick={onStartTrial}
            aria-label={copy.assistToolbar.startTrial}
            title={copy.assistToolbar.startTrial}
          >
            <GitBranch />
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={onAddTrialCheckpoint}
              aria-label={copy.assistToolbar.addCheckpoint}
              title={copy.assistToolbar.addCheckpoint}
            >
              <BookmarkPlus />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={onUndoTrialCheckpoint}
              disabled={!canUndoTrialCheckpoint}
              aria-label={copy.assistToolbar.undoCheckpoint}
              title={copy.assistToolbar.undoCheckpoint}
            >
              <Rewind />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={onDiscardTrial}
              aria-label={copy.assistToolbar.discardTrial}
              title={copy.assistToolbar.discardTrial}
            >
              <X />
            </Button>
            <Button
              size="icon-sm"
              onClick={onCommitTrial}
              aria-label={copy.assistToolbar.commitTrial}
              title={copy.assistToolbar.commitTrial}
            >
              <Check />
            </Button>
          </>
        )}
      </div>
      {trialActive && (
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 px-1 py-0.5 font-medium text-amber-900 dark:text-amber-200">
            <GitBranch className="size-3.5" />
            {copy.assistToolbar.trialModeActive}
          </span>
          <span className="inline-flex items-center gap-1 px-1 py-0.5 text-sky-800 dark:text-sky-200">
            <Bookmark className="size-3.5" />
            {copy.assistToolbar.checkpointCount(trialCheckpointCount)}
          </span>
        </div>
      )}
    </div>
  );
}
