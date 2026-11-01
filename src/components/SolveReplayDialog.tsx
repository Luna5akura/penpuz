import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, X } from 'lucide-react';
import { useI18n } from '@/i18n/useI18n';
import { renderPuzzleBoard } from '@/puzzles/registry';
import type { PuzzleData } from '@/puzzles/types';
import { Button } from './ui/button';
import { Card } from './ui/card';

export interface SolveTimelineEntry {
  t: number;
  snapshot: unknown;
}

interface Props {
  open: boolean;
  onClose: () => void;
  puzzle: PuzzleData;
  entries: SolveTimelineEntry[];
}

/**
 * Replays the recorded board snapshots of the current solving session.
 * Each step re-renders the regular board with the saved snapshot as its
 * initial state, so every puzzle type replays for free.
 */
export default function SolveReplayDialog({ open, onClose, puzzle, entries }: Props) {
  const { copy } = useI18n();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!open || !playing || entries.length < 2) return;

    const interval = window.setInterval(() => {
      setIndex((current) => {
        const next = current + 1;
        if (next >= entries.length - 1) {
          setPlaying(false);
          return entries.length - 1;
        }
        return next;
      });
    }, 900);

    return () => window.clearInterval(interval);
  }, [entries.length, open, playing]);

  if (!open) return null;

  const safeIndex = Math.max(0, Math.min(index, entries.length - 1));
  const entry = entries[safeIndex];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3"
      onClick={onClose}
    >
      <Card
        className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden border-[#d7c7b4] bg-card dark:border-gray-700 dark:bg-card"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={copy.app.replayTitle}
      >
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <h2 className="text-center text-xl font-semibold leading-8 text-foreground">
            {copy.app.replayTitle}
          </h2>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label={copy.app.close}
            title={copy.app.close}
          >
            <X />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-4">
          <div className="flex justify-center">
            {renderPuzzleBoard(puzzle, 0, safeIndex, () => {}, entry.snapshot)}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 border-t px-4 py-3">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setIndex((current) => Math.max(0, current - 1))}
            disabled={safeIndex <= 0}
            aria-label={copy.app.previousPage}
            title={copy.app.previousPage}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setPlaying((current) => !current)}
            disabled={safeIndex >= entries.length - 1}
            aria-label={playing ? copy.app.replayPause : copy.app.replayPlay}
            title={playing ? copy.app.replayPause : copy.app.replayPlay}
          >
            {playing ? <Pause /> : <Play />}
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setIndex((current) => Math.min(entries.length - 1, current + 1))}
            disabled={safeIndex >= entries.length - 1}
            aria-label={copy.app.nextPage}
            title={copy.app.nextPage}
          >
            <ChevronRight />
          </Button>
          <span className="min-w-36 text-center text-sm text-muted-foreground">
            {copy.app.replayStepLabel(safeIndex + 1, entries.length)} · {copy.app.elapsedTime(entry.t)}
          </span>
        </div>
      </Card>
    </div>
  );
}
