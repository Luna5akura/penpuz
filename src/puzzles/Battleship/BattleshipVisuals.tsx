import { Waves } from 'lucide-react';
import { useI18n } from '@/i18n/useI18n';
import {
  boardLayoutMetrics,
  getBoardIconSize,
  getBoardIconStrokeWidth,
  getBoardPreviewCellSize,
  woodBoardTheme,
} from '../boardTheme';
import type { BattleshipSegment, BattleshipShipShape } from '../types';
import { getBattleshipShapeKey, type BattleshipNeighborConnections } from './utils';

function getSegmentConnections(
  segment: BattleshipSegment,
  neighbors?: BattleshipNeighborConnections
): BattleshipNeighborConnections {
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
  color,
}: {
  segment: BattleshipSegment;
  cellSize: number;
  neighbors?: BattleshipNeighborConnections;
  given?: boolean;
  resolved?: boolean;
  /** Optional trial/annotation color for a resolved ship segment. */
  color?: string;
}) {
  const fill = segment === 'unknown'
    ? woodBoardTheme.battleshipUnknownShip
    : color ?? woodBoardTheme.battleshipShip;
  const connections = getSegmentConnections(segment, neighbors);
  const center = cellSize / 2;
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
      {segment === 'unknown' || (segment === 'center' && connectionCount === 0) ? (
        <rect
          x={center - halfThickness}
          y={center - halfThickness}
          width={thickness}
          height={thickness}
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
      size={getBoardIconSize(cellSize)}
      strokeWidth={getBoardIconStrokeWidth()}
      color={woodBoardTheme.neutralMid}
    />
  );
}

export function BattleshipShapePreview({
  shape,
  cellSize = boardLayoutMetrics.shipPreviewCellSize,
  used = false,
}: {
  shape: BattleshipShipShape;
  cellSize?: number;
  used?: boolean;
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
              background: occupied ? (used ? woodBoardTheme.neutralSoft : woodBoardTheme.battleshipShip) : 'transparent',
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
  usedCounts,
}: {
  fleet: BattleshipShipShape[];
  boardCellSize: number;
  compact?: boolean;
  usedCounts?: ReadonlyMap<string, number>;
}) {
  const { locale } = useI18n();
  const previewCellSize = getBoardPreviewCellSize(boardCellSize, compact);
  // Gray one listed ship per completed ship of that shape on the board, so
  // the remaining (ungrayed) entries show exactly which ships are left.
  const remaining = new Map<string, number>();
  for (const [key, count] of usedCounts ?? []) remaining.set(key, count);

  return (
    <div className="flex max-w-full flex-col items-center gap-2">
      <div className="text-xs font-semibold text-muted-foreground">
        {locale === 'zh-CN' ? '舰队' : 'Fleet'}
      </div>
      <div className="flex max-w-full flex-wrap items-center justify-center gap-x-4 gap-y-3 px-2">
        {fleet.map((shape, index) => {
          const key = getBattleshipShapeKey(shape);
          const used = (remaining.get(key) ?? 0) > 0;
          if (used) remaining.set(key, (remaining.get(key) ?? 0) - 1);
          return (
            <div
              key={`${key}-${index}`}
              className="flex min-h-7 items-center gap-2 text-sm text-muted-foreground"
            >
              <BattleshipShapePreview shape={shape} cellSize={previewCellSize} used={used} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
