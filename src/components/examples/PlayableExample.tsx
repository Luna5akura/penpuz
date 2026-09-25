import { useMemo, useState, type ReactNode } from 'react';
import ExampleAnswerReveal from '../ExampleAnswerReveal';
import { ExampleCellSizeProvider } from './ExampleBoardChrome';
import { useResponsiveExampleCellSize } from './exampleCellSizeContext';
import { buildExamplePuzzleData } from '@/puzzles/examplePuzzleData';
import { boardLayoutMetrics } from '@/puzzles/boardTheme';
import type { PuzzleData, PuzzleExample } from '@/puzzles/types';

interface Props {
  example: PuzzleExample;
  playableLabel: string;
  answerLabel: string;
  /** Fixed cell size forwarded to the board (keeps examples at rule-diagram size). */
  fixedCellSize?: number;
  /** Number of horizontal outside-clue gutters the board reserves. */
  outsideClueSides?: number;
  /** Official answer diagram, shown automatically once the example is solved. */
  answer: ReactNode | ((cellSize: number) => ReactNode);
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
 *
 * The example cell size is capped at `fixedCellSize` (the rule-diagram size)
 * and shrinks with the available column width on narrow screens so examples
 * never overflow the viewport.
 */
export default function PlayableExample({ example, playableLabel, answerLabel, fixedCellSize, outsideClueSides = 0, answer, renderBoard }: Props) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [startTime] = useState(() => Date.now());
  const puzzle = useMemo(() => buildExamplePuzzleData(example), [example]);
  const { containerRef, cellSize } = useResponsiveExampleCellSize(
    example.width,
    outsideClueSides,
    fixedCellSize ?? boardLayoutMetrics.exampleCellSize
  );

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="min-w-0">
        <div className="mb-4 text-center text-base font-medium text-muted-foreground">{playableLabel}</div>
        <div ref={containerRef} className="w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain pb-1">
          <div className="flex w-full min-w-0 justify-center">
            {renderBoard({
              puzzle,
              startTime,
              onComplete: () => setShowAnswer(true),
              fixedCellSize: cellSize,
            })}
          </div>
        </div>
      </div>
      <div className="min-w-0">
        <div className="mb-4 text-center text-base font-medium text-muted-foreground">{answerLabel}</div>
        <ExampleAnswerReveal
          visible={showAnswer}
          onVisibleChange={setShowAnswer}
          ariaLabel={answerLabel}
          className="flex justify-center overflow-x-auto"
        >
          <ExampleCellSizeProvider cellSize={cellSize}>
            {typeof answer === 'function' ? answer(cellSize) : answer}
          </ExampleCellSizeProvider>
        </ExampleAnswerReveal>
      </div>
    </div>
  );
}
