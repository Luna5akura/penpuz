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
      className={`flex w-full flex-col items-center gap-3 border-2 px-4 py-4 transition-colors ${
        trialActive
          ? 'border-amber-500 bg-amber-50 dark:border-amber-400 dark:bg-amber-950/30'
          : 'border-[#bfa889] bg-[#fffdf8] dark:border-gray-700 dark:bg-gray-900/60'
      }`}
    >
      <div className={`flex flex-wrap items-center justify-center gap-3 ${trialActive ? 'w-full' : 'mx-auto'}`}>
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
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
          <span className="border border-amber-400 bg-amber-100 px-3 py-1.5 font-semibold text-amber-950 dark:border-amber-500 dark:bg-amber-900/60 dark:text-amber-100">
            {copy.assistToolbar.trialModeActive}
          </span>
          <span className="border border-sky-300 bg-sky-50 px-3 py-1.5 font-medium text-sky-900 dark:border-sky-700 dark:bg-sky-950/60 dark:text-sky-200">
            {copy.assistToolbar.checkpointCount(trialCheckpointCount)}
          </span>
        </div>
      )}
    </div>
  );
}
