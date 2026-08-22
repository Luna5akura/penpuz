import { Waves } from 'lucide-react';
import { useI18n } from '@/i18n/useI18n';
import { boardClassNames, woodBoardTheme } from '../boardTheme';
import type { BattleshipSegment, BattleshipShipShape } from '../types';
import { getBattleshipShapeKey } from './utils';

interface NeighborConnections {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
}

function getSegmentConnections(
  segment: BattleshipSegment,
  neighbors?: NeighborConnections
): NeighborConnections {
  switch (segment) {
    case 'up': return { top: false, right: false, bottom: true, left: false };
    case 'down': return { top: true, right: false, bottom: false, left: false };
    case 'left': return { top: false, right: true, bottom: false, left: false };
    case 'right': return { top: false, right: false, bottom: false, left: true };
    case 'center': return neighbors ?? { top: true, right: false, bottom: true, left: false };
    case 'up-left': return { top: false, right: true, bottom: true, left: false };
    case 'up-right': return { top: false, right: false, bottom: true, left: true };
    case 'down-left': return { top: true, right: true, bottom: false, left: false };
    case 'down-right': return { top: true, right: false, bottom: false, left: true };
    default: return { top: false, right: false, bottom: false, left: false };
  }
}

export function BattleshipSegmentSymbol({
  segment,
  cellSize,
  neighbors,
  given = false,
  resolved = false,
}: {
  segment: BattleshipSegment;
  cellSize: number;
  neighbors?: NeighborConnections;
  given?: boolean;
  resolved?: boolean;
}) {
  const fill = segment === 'unknown'
    ? woodBoardTheme.neutralSoft
    : given
      ? woodBoardTheme.border
      : woodBoardTheme.ink;
  const connections = getSegmentConnections(segment, neighbors);
  const center = cellSize / 2;
  const padding = Math.max(2, cellSize * 0.08);
  const halfThickness = cellSize * 0.32;
  const thickness = halfThickness * 2;
  const connectionCount = Object.values(connections).filter(Boolean).length;
  const rounded = given || resolved;

  const renderEndpoint = () => {
    const capCenter = center;
    const circleProps = { r: halfThickness, fill };
    const renderDiamondCap = (cx: number, cy: number) => (
      <polygon
        points={`${cx},${cy - halfThickness} ${cx + halfThickness},${cy} ${cx},${cy + halfThickness} ${cx - halfThickness},${cy}`}
        fill={fill}
      />
    );

    if (connections.top) {
      return rounded ? (
        <>
          <rect x={center - halfThickness} y={0} width={thickness} height={capCenter} fill={fill} />
          <circle cx={center} cy={capCenter} {...circleProps} />
        </>
      ) : (
        <>
          <rect x={center - halfThickness} y={0} width={thickness} height={capCenter} fill={fill} />
          {renderDiamondCap(center, capCenter)}
        </>
      );
    }
    if (connections.right) {
      return rounded ? (
        <>
          <rect x={capCenter} y={center - halfThickness} width={cellSize - capCenter} height={thickness} fill={fill} />
          <circle cx={capCenter} cy={center} {...circleProps} />
        </>
      ) : (
        <>
          <rect x={capCenter} y={center - halfThickness} width={cellSize - capCenter} height={thickness} fill={fill} />
          {renderDiamondCap(capCenter, center)}
        </>
      );
    }
    if (connections.bottom) {
      return rounded ? (
        <>
          <rect x={center - halfThickness} y={capCenter} width={thickness} height={cellSize - capCenter} fill={fill} />
          <circle cx={center} cy={capCenter} {...circleProps} />
        </>
      ) : (
        <>
          <rect x={center - halfThickness} y={capCenter} width={thickness} height={cellSize - capCenter} fill={fill} />
          {renderDiamondCap(center, capCenter)}
        </>
      );
    }

    return rounded ? (
      <>
        <rect x={0} y={center - halfThickness} width={capCenter} height={thickness} fill={fill} />
        <circle cx={capCenter} cy={center} {...circleProps} />
      </>
    ) : (
      <>
        <rect x={0} y={center - halfThickness} width={capCenter} height={thickness} fill={fill} />
        {renderDiamondCap(capCenter, center)}
      </>
    );
  };

  return (
    <svg
      className="pointer-events-none absolute inset-0"
      width={cellSize}
      height={cellSize}
      viewBox={`0 0 ${cellSize} ${cellSize}`}
      aria-hidden="true"
    >
      {segment === 'unknown' || segment === 'center' && connectionCount === 0 ? (
        <rect
          x={padding}
          y={padding}
          width={cellSize - padding * 2}
          height={cellSize - padding * 2}
          fill={fill}
        />
      ) : connectionCount === 0 ? (
        rounded ? (
          <circle cx={center} cy={center} r={halfThickness} fill={fill} />
        ) : (
          <polygon
            points={`${center},${center - halfThickness} ${center + halfThickness},${center} ${center},${center + halfThickness} ${center - halfThickness},${center}`}
            fill={fill}
          />
        )
      ) : connectionCount === 1 ? (
        renderEndpoint()
      ) : (
        <>
          {connections.top ? (
            <rect x={center - halfThickness} y={0} width={thickness} height={center} fill={fill} />
          ) : null}
          {connections.right ? (
            <rect x={center} y={center - halfThickness} width={center} height={thickness} fill={fill} />
          ) : null}
          {connections.bottom ? (
            <rect x={center - halfThickness} y={center} width={thickness} height={center} fill={fill} />
          ) : null}
          {connections.left ? (
            <rect x={0} y={center - halfThickness} width={center} height={thickness} fill={fill} />
          ) : null}
          <rect
            x={center - halfThickness}
            y={center - halfThickness}
            width={thickness}
            height={thickness}
            fill={fill}
          />
        </>
      )}
    </svg>
  );
}

export function BattleshipWaterSymbol({ cellSize }: { cellSize: number }) {
  return (
    <Waves
      aria-hidden="true"
      size={Math.max(18, Math.floor(cellSize * 0.56))}
      strokeWidth={2.2}
      color={woodBoardTheme.neutralMid}
    />
  );
}

export function BattleshipShapePreview({
  shape,
  cellSize = 16,
}: {
  shape: BattleshipShipShape;
  cellSize?: number;
}) {
  return (
    <div
      className="grid shrink-0"
      style={{
        gridTemplateColumns: `repeat(${shape.width}, ${cellSize}px)`,
        width: `${shape.width * cellSize}px`,
        height: `${shape.height * cellSize}px`,
      }}
    >
      {shape.cells.flatMap((row, rowIndex) => row.map((occupied, colIndex) => {
        const top = shape.cells[rowIndex - 1]?.[colIndex] === true;
        const right = shape.cells[rowIndex]?.[colIndex + 1] === true;
        const bottom = shape.cells[rowIndex + 1]?.[colIndex] === true;
        const left = shape.cells[rowIndex]?.[colIndex - 1] === true;

        return (
          <span
            key={`${rowIndex}-${colIndex}`}
            style={{
              width: `${cellSize}px`,
              height: `${cellSize}px`,
              background: occupied ? woodBoardTheme.border : 'transparent',
              borderRadius: occupied
                ? `${top || left ? 0 : cellSize / 2}px ${top || right ? 0 : cellSize / 2}px ${bottom || right ? 0 : cellSize / 2}px ${bottom || left ? 0 : cellSize / 2}px`
                : undefined,
            }}
          />
        );
      }))}
    </div>
  );
}

export function BattleshipFleet({
  fleet,
  boardCellSize,
  compact = false,
}: {
  fleet: BattleshipShipShape[];
  boardCellSize: number;
  compact?: boolean;
}) {
  const { locale } = useI18n();
  const grouped = new Map<string, { shape: BattleshipShipShape; count: number }>();
  fleet.forEach((shape) => {
    const key = getBattleshipShapeKey(shape);
    const current = grouped.get(key);
    if (current) current.count += 1;
    else grouped.set(key, { shape, count: 1 });
  });
  const previewCellSize = Math.max(10, Math.min(compact ? 13 : 18, Math.floor(boardCellSize * 0.34)));

  return (
    <div className="flex max-w-full flex-col items-center gap-2">
      <div className="text-xs font-semibold text-muted-foreground">
        {locale === 'zh-CN' ? '舰队' : 'Fleet'}
      </div>
      <div className="flex max-w-full flex-wrap items-center justify-center gap-x-5 gap-y-3 px-2">
        {Array.from(grouped.values()).map(({ shape, count }) => (
          <div
            key={getBattleshipShapeKey(shape)}
            className={`flex min-h-7 items-center gap-2 text-sm text-muted-foreground ${boardClassNames.cellText}`}
          >
            <BattleshipShapePreview shape={shape} cellSize={previewCellSize} />
            {count > 1 ? <span>×{count}</span> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
