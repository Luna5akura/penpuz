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
import { getBattleshipShapeKey, getSegmentConnections, type BattleshipNeighborConnections } from './utils';

export function BattleshipSegmentSymbol({
  segment,
  cellSize,
  neighbors,
  given = false,
  resolved = false,
  extended = false,
  color,
}: {
  segment: BattleshipSegment;
  cellSize: number;
  neighbors?: BattleshipNeighborConnections;
  given?: boolean;
  resolved?: boolean;
  /** True when the player drew an extension from a given clue in a new direction. */
  extended?: boolean;
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
  // A given clue's own caps stay round, but once the player extends it the
  // open directions become ordinary endpoints: round only when blocked,
  // otherwise a diamond head that shows the ship may still continue.
  // Given single and center cells follow that rule from the start, so a
  // lone cell is a diamond while its sides are unblocked.
  const rounded = resolved || (given && !extended && segment !== 'single' && segment !== 'center');

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
      {segment === 'unknown' && connectionCount === 0 ? (
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
  // The bank shows the ship shapes themselves, so a single-cell ship
  // previews as a small round dot (the board still draws lone cells as
  // diamonds until their sides are blocked).
  if (shape.width === 1 && shape.height === 1) {
    return (
      <span
        className="shrink-0 rounded-full"
        style={{
          width: `${cellSize}px`,
          height: `${cellSize}px`,
          background: used ? woodBoardTheme.neutralSoft : woodBoardTheme.battleshipShip,
        }}
      />
    );
  }
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
