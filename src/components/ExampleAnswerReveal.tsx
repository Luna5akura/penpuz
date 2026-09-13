import { useState, type KeyboardEvent, type ReactNode } from 'react';
import ExampleAnswerOverlay from './ExampleAnswerOverlay';
import ExampleAnswerRevealDialog from './ExampleAnswerRevealDialog';

interface ExampleAnswerRevealProps {
  /** The solved board is visible when true (for example after auto-completion). */
  visible: boolean;
  /** Called after the user confirms that the answer may be shown. */
  onVisibleChange: (visible: boolean) => void;
  /** Accessible name for the masked answer board. */
  ariaLabel?: string;
  /** Optional extra classes for the answer-board container. */
  className?: string;
  /** Match the rounded treatment used by a board with rounded corners. */
  rounded?: boolean;
  children: ReactNode;
}

/**
 * Shared answer masking/reveal interaction for every example board.
 *
 * Keeping the confirmation state here prevents each example from subtly
 * diverging in keyboard handling, focus semantics, or spoiler behaviour.
 */
export default function ExampleAnswerReveal({
  visible,
  onVisibleChange,
  ariaLabel,
  className = '',
  rounded = false,
  children,
}: ExampleAnswerRevealProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const requestReveal = () => {
    if (!visible) setConfirmOpen(true);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (visible || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    requestReveal();
  };

  return (
    <>
      <div
        className={`relative isolate ${!visible ? 'cursor-pointer hover:opacity-90' : ''} ${className}`.trim()}
        role={visible ? undefined : 'button'}
        tabIndex={visible ? -1 : 0}
        aria-label={ariaLabel}
        aria-expanded={visible ? undefined : false}
        onClick={requestReveal}
        onKeyDown={handleKeyDown}
      >
        <div aria-hidden={!visible}>
          {children}
        </div>
        {!visible ? <ExampleAnswerOverlay rounded={rounded} /> : null}
      </div>

      <ExampleAnswerRevealDialog
        open={confirmOpen && !visible}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          onVisibleChange(true);
          setConfirmOpen(false);
        }}
      />
    </>
  );
}
