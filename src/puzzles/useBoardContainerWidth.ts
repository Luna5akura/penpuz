import { useEffect, useRef, useState } from 'react';

/** Track the width available to a board, rather than the browser window width. */
export function useBoardContainerWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(() =>
    typeof window === 'undefined' ? 1024 : window.innerWidth
  );

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    const update = () => {
      const measured = element.getBoundingClientRect().width;
      setWidth(measured > 0 ? measured : window.innerWidth);
    };
    update();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(update);
      observer.observe(element);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return [ref, width] as const;
}
