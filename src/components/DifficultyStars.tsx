import { Star } from 'lucide-react';
import type { PuzzleDifficulty } from '@/puzzles/types';

const DIFFICULTY_STAR_COUNTS: Record<PuzzleDifficulty, number> = {
  简单: 1,
  困难: 2,
  极难: 3,
};

/**
 * Difficulty expressed as a 1-3 star rating: ★ easy, ★★ hard, ★★★ extreme.
 * Purely decorative; the surrounding badge/button owns the accessible label.
 */
export default function DifficultyStars({
  difficulty,
  className = '',
  starClassName = 'size-3',
}: {
  difficulty: PuzzleDifficulty;
  className?: string;
  starClassName?: string;
}) {
  const count = DIFFICULTY_STAR_COUNTS[difficulty];

  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <Star key={index} className={starClassName} fill="currentColor" strokeWidth={1.5} />
      ))}
    </span>
  );
}
