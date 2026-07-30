import type { Locale } from '@/i18n/types';
import type { NotePuzzleReplayBlock } from '@/notes/types';
import { getNotePuzzleTypeName } from '@/notes/puzzleTypeOptions';
import { Badge } from '../ui/badge';
import NotePuzzleBoard from './NotePuzzleBoard';

interface PuzzleReplayViewerProps {
  replay: NotePuzzleReplayBlock;
  locale: Locale;
}

function PuzzleReplayViewer({ replay, locale }: PuzzleReplayViewerProps) {
  return (
    <div className="border bg-[#fffdf9] p-3 dark:bg-gray-950">
      <div className="flex flex-col gap-2 border-b pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-foreground">{replay.title[locale]}</h3>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Badge variant="outline">{getNotePuzzleTypeName(replay.puzzleType, locale)}</Badge>
            <Badge variant="outline">
              {replay.width} x {replay.height}
            </Badge>
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-3">
        {replay.steps.map((step, index) => {
          const note = step.note[locale].trim();

          return (
            <section key={`${step.title[locale]}-${index}`} className="border bg-card p-3">
              {note ? <p className="text-sm leading-6 text-muted-foreground">{note}</p> : null}
              <div className={note ? 'mt-3' : undefined}>
                <NotePuzzleBoard
                  puzzle={replay.puzzle}
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
