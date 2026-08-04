import type { Locale } from '@/i18n/types';
import type { NotePuzzleReplayBlock } from '@/notes/types';
import { getNotePuzzleTypeName } from '@/notes/puzzleTypeOptions';
import { parsePuzzleLink } from '@/puzzles/registry';
import { Badge } from '../ui/badge';
import NotePuzzleBoard from './NotePuzzleBoard';

interface PuzzleReplayViewerProps {
  replay: NotePuzzleReplayBlock;
  locale: Locale;
}

function PuzzleReplayViewer({ replay, locale }: PuzzleReplayViewerProps) {
  const puzzle = replay.puzzle ?? (replay.puzzleLink ? parsePuzzleLink(replay.puzzleLink) ?? undefined : undefined);

  return (
    <div className="min-w-0 border-y border-border/70 py-5">
      <div className="flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-2xl font-semibold text-foreground">{replay.title[locale]}</h3>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Badge variant="outline">{getNotePuzzleTypeName(replay.puzzleType, locale)}</Badge>
            <Badge variant="outline">
              {replay.width} x {replay.height}
            </Badge>
          </div>
        </div>
      </div>

      <div className="divide-y divide-border">
        {replay.steps.map((step, index) => {
          const note = step.note[locale].trim();

          return (
            <section
              key={`${step.title[locale]}-${index}`}
              className={`grid min-w-0 gap-4 py-5 first:pt-4 last:pb-4 ${
                note ? 'md:grid-cols-[minmax(12rem,0.72fr)_minmax(0,1.28fr)] md:items-start' : ''
              }`}
            >
              {note ? (
                <p className="break-words text-base leading-7 text-muted-foreground [overflow-wrap:anywhere]">
                  {note}
                </p>
              ) : null}
              <div>
                <NotePuzzleBoard
                  puzzle={puzzle}
                  puzzleType={replay.puzzleType}
                  width={replay.width}
                  height={replay.height}
                  snapshot={step.snapshot}
                  marks={step.marks}
                  cellSize={34}
                  ariaLabel={step.title[locale]}
                />
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

export default PuzzleReplayViewer;
