import { Badge } from './ui/badge';
import { useI18n } from '@/i18n/useI18n';
import { puzzleDifficultyLabels, type PuzzleDifficulty } from '@/puzzles/types';
import DifficultyStars from './DifficultyStars';

const DIFFICULTY_TONES: Record<PuzzleDifficulty, string> = {
  简单: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300',
  困难: 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300',
  极难: 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-300',
};

/** Icon-only badge for a puzzle difficulty; the full name is exposed as a tooltip/aria-label. */
export default function DifficultyBadge({ difficulty, className = '' }: { difficulty: PuzzleDifficulty; className?: string }) {
  const { locale } = useI18n();
  const label = puzzleDifficultyLabels[difficulty][locale];

  return (
    <Badge
      variant="outline"
      className={`px-2 ${DIFFICULTY_TONES[difficulty]} ${className}`}
      title={label}
      aria-label={label}
    >
      <DifficultyStars difficulty={difficulty} />
    </Badge>
  );
}
