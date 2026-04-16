import { useEffect } from 'react';
import { useI18n } from '@/i18n/useI18n';
import { Button } from './ui/button';

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
      className={`flex flex-col items-center gap-2 rounded-xl border px-4 py-3 transition-colors ${
        trialActive
          ? 'border-amber-500 bg-amber-50/90 dark:border-amber-400 dark:bg-amber-950/30'
          : 'border-[#d2b48c] bg-white/60 dark:border-gray-700 dark:bg-gray-900/50'
      }`}
    >
      <div className={`flex flex-wrap items-center justify-center gap-2 ${trialActive ? 'w-full' : 'mx-auto'}`}>
        <Button variant="outline" size="sm" onClick={onUndo} disabled={!canUndo} title="Ctrl/Cmd + Z">
          {copy.assistToolbar.undo}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onRedo}
          disabled={!canRedo}
          title="Ctrl/Cmd + Shift + Z / Ctrl/Cmd + Y"
        >
          {copy.assistToolbar.redo}
        </Button>
        {!trialActive ? (
          <Button variant="outline" size="sm" onClick={onStartTrial}>
            {copy.assistToolbar.startTrial}
          </Button>
        ) : (
          <>
            <Button variant="outline" size="sm" onClick={onAddTrialCheckpoint}>
              {copy.assistToolbar.addCheckpoint}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onUndoTrialCheckpoint}
              disabled={!canUndoTrialCheckpoint}
            >
              {copy.assistToolbar.undoCheckpoint}
            </Button>
            <Button variant="outline" size="sm" onClick={onDiscardTrial}>
              {copy.assistToolbar.discardTrial}
            </Button>
            <Button size="sm" onClick={onCommitTrial}>
              {copy.assistToolbar.commitTrial}
            </Button>
          </>
        )}
      </div>
      {trialActive && (
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="rounded-full bg-amber-200 px-2 py-1 font-medium text-amber-900 dark:bg-amber-900/60 dark:text-amber-100">
            {copy.assistToolbar.trialModeActive}
          </span>
          <span className="rounded-full bg-sky-100 px-2 py-1 text-sky-800 dark:bg-sky-950/60 dark:text-sky-200">
            {copy.assistToolbar.checkpointCount(trialCheckpointCount)}
          </span>
        </div>
      )}
    </div>
  );
}
