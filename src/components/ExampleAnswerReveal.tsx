import { useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
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
  const frameRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentSize, setContentSize] = useState<{
    width: number;
    height: number;
    visible: boolean;
  } | null>(null);

  // Examples intentionally use different board renderers (SVG, fixed grids,
  // and responsive board wrappers). Measure the rendered content itself so
  // the spoiler frame never falls back to the surrounding card's width or to
  // a clipped overflow box.
  useLayoutEffect(() => {
    const frame = frameRef.current;
    const content = contentRef.current;
    if (!frame || !content) return undefined;

    let scheduled = false;
    let cancelScheduled: (() => void) | null = null;
    const measure = () => {
      if (scheduled) return;
      scheduled = true;
      const flush = () => {
        scheduled = false;
        cancelScheduled = null;
        const rect = content.getBoundingClientRect();
        const width = Math.max(
          content.offsetWidth,
          content.scrollWidth,
          Math.ceil(rect.width)
        );
        const height = Math.max(
          content.offsetHeight,
          content.scrollHeight,
          Math.ceil(rect.height)
        );
        setContentSize((current) => (
          current?.visible === visible && current.width === width && current.height === height
            ? current
            : { width, height, visible }
        ));
      };

      if (typeof window.requestAnimationFrame === 'function') {
        const id = window.requestAnimationFrame(flush);
        cancelScheduled = () => {
          if (typeof window.cancelAnimationFrame === 'function') {
            window.cancelAnimationFrame(id);
          }
        };
      } else {
        const id = window.setTimeout(flush, 0);
        cancelScheduled = () => window.clearTimeout(id);
      }
    };

    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(frame);
    observer?.observe(content);
    window.addEventListener('resize', measure);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
      cancelScheduled?.();
      scheduled = false;
    };
  }, [visible]);

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
        className={`relative isolate w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain ${!visible ? 'cursor-pointer hover:opacity-90' : ''} ${className}`.trim()}
        // Some legacy call sites still pass `flex justify-center`.  A flex
        // container can center an oversized child at a negative scroll
        // origin, hiding its left edge.  Keep this shared viewport block-level
        // so `mx-auto` centers fitting boards and wide boards remain fully
        // reachable from both scroll directions.
        style={{
          // Keep the viewport contract here even when an older call site
          // passes a conflicting flex/overflow utility in `className`.
          display: 'block',
          width: '100%',
          minWidth: 0,
          maxWidth: '100%',
          overflowX: 'auto',
          overscrollBehaviorX: 'contain',
        }}
        role={visible ? undefined : 'button'}
        tabIndex={visible ? -1 : 0}
        aria-label={ariaLabel}
        aria-expanded={visible ? undefined : false}
        onClick={requestReveal}
        onKeyDown={handleKeyDown}
      >
        <div
          ref={frameRef}
          className="relative mx-auto w-max shrink-0"
          style={contentSize?.visible === visible
            ? { width: `${contentSize.width}px`, height: `${contentSize.height}px` }
            : undefined}
        >
          <div ref={contentRef} className="w-max max-w-none" aria-hidden={!visible}>
            {children}
          </div>
          {!visible ? <ExampleAnswerOverlay rounded={rounded} /> : null}
        </div>
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
