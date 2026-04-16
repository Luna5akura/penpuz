import type { YajilinDirection } from '../types';
const MOBILE_CLUE_REFERENCE_SIZE = 44;

function getArrowFrameStyle(direction: YajilinDirection, cellSize: number) {
  const sideInset = cellSize >= MOBILE_CLUE_REFERENCE_SIZE ? 1 : 0;
  const horizontalTopInset = cellSize >= MOBILE_CLUE_REFERENCE_SIZE ? 1 : 0;
  const verticalWidth = Math.max(12, Math.round(cellSize * 0.26));
  const verticalHeight = Math.max(26, cellSize - 2);
  const horizontalWidth = Math.max(26, cellSize - 2);
  const horizontalHeight = Math.max(12, Math.round(cellSize * 0.26));

  if (direction === 'up') {
    return {
      left: `${sideInset}px`,
      top: '50%',
      transform: 'translateY(-50%)',
      width: `${verticalWidth}px`,
      height: `${verticalHeight}px`,
    };
  }
  if (direction === 'down') {
    return {
      left: `${sideInset}px`,
      top: '50%',
      transform: 'translateY(-50%)',
      width: `${verticalWidth}px`,
      height: `${verticalHeight}px`,
    };
  }
  if (direction === 'left') {
    return {
      left: '50%',
      top: `${horizontalTopInset}px`,
      transform: 'translateX(-50%)',
      width: `${horizontalWidth}px`,
      height: `${horizontalHeight}px`,
    };
  }
  return {
    left: '50%',
    top: `${horizontalTopInset}px`,
    transform: 'translateX(-50%)',
    width: `${horizontalWidth}px`,
    height: `${horizontalHeight}px`,
  };
}

export function ClueArrow({ direction, cellSize }: { direction: YajilinDirection; cellSize: number }) {
  const isVertical = direction === 'up' || direction === 'down';
  const strokeWidth = cellSize >= MOBILE_CLUE_REFERENCE_SIZE ? 2.8 : 2.4;
  const headSize = isVertical ? 7 : 6.5;

  const viewBox = isVertical ? '0 0 24 48' : '0 0 48 24';
  const line = isVertical
    ? direction === 'up'
      ? { x1: 12, y1: 46, x2: 12, y2: 4 }
      : { x1: 12, y1: 2, x2: 12, y2: 44 }
    : direction === 'left'
      ? { x1: 46, y1: 12, x2: 4, y2: 12 }
      : { x1: 2, y1: 12, x2: 44, y2: 12 };

  const arrowHead = isVertical
    ? direction === 'up'
      ? `12,2 ${12 - headSize},${2 + headSize} ${12 + headSize},${2 + headSize}`
      : `12,46 ${12 - headSize},${46 - headSize} ${12 + headSize},${46 - headSize}`
    : direction === 'left'
      ? `2,12 ${2 + headSize},${12 - headSize} ${2 + headSize},${12 + headSize}`
      : `46,12 ${46 - headSize},${12 - headSize} ${46 - headSize},${12 + headSize}`;

  return (
    <svg
      className="absolute overflow-visible"
      viewBox={viewBox}
      aria-hidden="true"
      focusable="false"
      style={getArrowFrameStyle(direction, cellSize)}
    >
      <line
        x1={line.x1}
        y1={line.y1}
        x2={line.x2}
        y2={line.y2}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <polygon points={arrowHead} fill="currentColor" />
    </svg>
  );
}
