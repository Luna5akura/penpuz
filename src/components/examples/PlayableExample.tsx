import { useMemo, useState, type ReactNode } from 'react';
import ExampleAnswerReveal from '../ExampleAnswerReveal';
import { buildExamplePuzzleData } from '@/puzzles/examplePuzzleData';
import type { PuzzleData, PuzzleExample } from '@/puzzles/types';

interface Props {
  example: PuzzleExample;
  playableLabel: string;
  answerLabel: string;
  /** Fixed cell size forwarded to the board (keeps examples at rule-diagram size). */
  fixedCellSize?: number;
  /** Official answer diagram, shown automatically once the example is solved. */
  answer: ReactNode;
  /** Renders the type's regular board. Examples never persist snapshots. */
  renderBoard: (props: {
    puzzle: PuzzleData;
    startTime: number;
    onComplete: (time: number) => void;
    fixedCellSize?: number;
  }) => ReactNode;
}

/**
 * Shared playable-example layout: the type's normal board on the left and the
 * masked official answer on the right.  Solving the example reveals the answer
 * automatically; the board receives no snapshot callbacks, so example progress
 * is never persisted.
 */
export default function PlayableExample({ example, playableLabel, answerLabel, fixedCellSize, answer, renderBoard }: Props) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [startTime] = useState(() => Date.now());
  const puzzle = useMemo(() => buildExamplePuzzleData(example), [example]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="min-w-0">
        <div className="mb-4 text-center text-base font-medium text-muted-foreground">{playableLabel}</div>
        {renderBoard({
          puzzle,
          startTime,
          onComplete: () => setShowAnswer(true),
          fixedCellSize,
        })}
      </div>
      <div className="min-w-0">
        <div className="mb-4 text-center text-base font-medium text-muted-foreground">{answerLabel}</div>
        <ExampleAnswerReveal
          visible={showAnswer}
          onVisibleChange={setShowAnswer}
          ariaLabel={answerLabel}
          className="flex justify-center overflow-x-auto"
        >
          {answer}
        </ExampleAnswerReveal>
      </div>
    </div>
  );
}
