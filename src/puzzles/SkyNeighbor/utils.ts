import type {
  NeighborDigit,
  SkyNeighborClues,
  SkyNeighborOutsideGrayCells,
  SkyNeighborPuzzleData,
} from '../types';
import type { NumberPlacementValidationResult } from '../shared/NumberPlacementBoard';
import {
  decodeCustomPayload,
  isPositiveGridSize,
  parsePuzzLinkParts,
} from '../gridUtils';

export type SkyNeighborCellValue = NeighborDigit | null;

/** Values entered in the four outside answer rows/columns. */
export interface SkyNeighborOutsideValues {
  top: (number | null)[];
  right: (number | null)[];
  bottom: (number | null)[];
  left: (number | null)[];
}

type SkyNeighborPayload = {
  givens?: unknown;
  grid?: unknown;
  numbers?: unknown;
  grayCells?: unknown;
  outlinedCells?: unknown;
  gray?: unknown;
  grayMask?: unknown;
  outlined?: unknown;
  mask?: unknown;
  clues?: unknown;
  visibility?: unknown;
  skyscraperClues?: unknown;
  top?: unknown;
  right?: unknown;
  bottom?: unknown;
  left?: unknown;
  outsideGrayCells?: unknown;
  outsideMask?: unknown;
  outsideGray?: unknown;
  outerGrayCells?: unknown;
};

const SKY_NEIGHBOR_IDS = new Set([
  'sky-neighbor',
  'sky-neighbors',
  'sky-neighbours',
  'skyneighbor',
  'skyneighbors',
  'skyneighbours',
  'sky-neighbour',
  'skyneighbour',
]);

function isSkyNeighborDigit(value: unknown): value is NeighborDigit {
  return value === 1 || value === 2 || value === 3;
}

function emptyDigitGrid(width: number, height: number): (NeighborDigit | null)[][] {
  return Array.from({ length: height }, () => Array<NeighborDigit | null>(width).fill(null));
}

function emptyGrayGrid(width: number, height: number): boolean[][] {
  return Array.from({ length: height }, () => Array<boolean>(width).fill(false));
}

function emptyOutsideGrayCells(width: number, height: number): SkyNeighborOutsideGrayCells {
  return {
    top: Array<boolean>(width).fill(false),
    right: Array<boolean>(height).fill(false),
    bottom: Array<boolean>(width).fill(false),
    left: Array<boolean>(height).fill(false),
  };
}

function emptySkyNeighborClues(width = 9, height = 9): SkyNeighborClues {
  return {
    top: Array<number | null>(width).fill(null),
    right: Array<number | null>(height).fill(null),
    bottom: Array<number | null>(width).fill(null),
    left: Array<number | null>(height).fill(null),
  };
}

function hasMatrixShape(value: unknown, width: number, height: number): value is unknown[][] {
  return Array.isArray(value) && value.length === height && value.every(
    (row) => Array.isArray(row) && row.length === width
  );
}

function hasDigitGridShape(value: unknown, width: number, height: number): value is (NeighborDigit | null)[][] {
  return hasMatrixShape(value, width, height) && value.every((row) =>
    row.every((cell) => cell === null || isSkyNeighborDigit(cell))
  );
}

function hasGrayGridShape(value: unknown, width: number, height: number): value is boolean[][] {
  return hasMatrixShape(value, width, height) && value.every((row) =>
    row.every((cell) => typeof cell === 'boolean')
  );
}

function hasClueSideShape(value: unknown, length: number): value is (number | null)[] {
  return Array.isArray(value) && value.length === length && value.every((clue) =>
    clue === null || (Number.isInteger(clue) && clue >= 1 && clue <= 3)
  );
}

function hasCluesShape(value: unknown, width: number, height: number): value is SkyNeighborClues {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const clues = value as Record<string, unknown>;
  return hasClueSideShape(clues.top, width) &&
    hasClueSideShape(clues.bottom, width) &&
    hasClueSideShape(clues.left, height) &&
    hasClueSideShape(clues.right, height);
}

function hasOutsideGrayShape(
  value: unknown,
  width: number,
  height: number
): value is SkyNeighborOutsideGrayCells {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const outside = value as Record<string, unknown>;
  return hasMatrixShape([outside.top], width, 1) &&
    (outside.top as unknown[]).every((cell) => typeof cell === 'boolean') &&
    hasMatrixShape([outside.bottom], width, 1) &&
    (outside.bottom as unknown[]).every((cell) => typeof cell === 'boolean') &&
    hasMatrixShape([outside.left], height, 1) &&
    (outside.left as unknown[]).every((cell) => typeof cell === 'boolean') &&
    hasMatrixShape([outside.right], height, 1) &&
    (outside.right as unknown[]).every((cell) => typeof cell === 'boolean');
}

function hasOutsideValuesShape(
  value: unknown,
  width: number,
  height: number
): value is SkyNeighborOutsideValues {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const outside = value as Record<string, unknown>;
  const valid = (candidate: unknown, length: number) =>
    Array.isArray(candidate) && candidate.length === length && candidate.every((cell) =>
      cell === null || isSkyNeighborDigit(cell)
    );
  return valid(outside.top, width) && valid(outside.bottom, width) &&
    valid(outside.left, height) && valid(outside.right, height);
}

function decodePayloadString(encoded: string): unknown {
  const normalized = encoded.trim();
  if (!normalized) return null;

  try {
    const decodedText = decodeURIComponent(normalized);
    if (decodedText.startsWith('{') || decodedText.startsWith('[')) {
      return JSON.parse(decodedText) as unknown;
    }
  } catch {
    // Try the URL-safe base64 form below.
  }

  return decodeCustomPayload<unknown>(normalized);
}

function readRows(encoded: string, width: number, height: number): string[] | null {
  let decoded = encoded.trim();
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    // Keep malformed percent escapes as literal data and reject them below.
  }
  const normalized = decoded.replace(/\s+/gu, '');
  if (!normalized) return null;

  const separated = normalized.split(/[;,|]/u).filter(Boolean);
  if (separated.length === height && separated.every((row) => row.length === width)) {
    return separated;
  }
  if (normalized.length !== width * height) return null;
  return Array.from({ length: height }, (_, row) => normalized.slice(row * width, (row + 1) * width));
}

function parseGivens(value: unknown, width: number, height: number): (NeighborDigit | null)[][] | null {
  if (Array.isArray(value)) {
    if (value.length === height && value.every((row) => typeof row === 'string')) {
      return parseGivens((value as string[]).join(';'), width, height);
    }
    if (value.length === height && value.every((row) => Array.isArray(row) && row.length === width)) {
      const grid = emptyDigitGrid(width, height);
      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          const cell = (value[row] as unknown[])[col];
          if (
            cell === null || cell === undefined || cell === '' || cell === '.' ||
            cell === '-' || cell === '_' || cell === 0 || cell === '0'
          ) {
            continue;
          }
          if (isSkyNeighborDigit(cell)) {
            grid[row][col] = cell;
          } else if (typeof cell === 'string' && /^[123]$/u.test(cell)) {
            grid[row][col] = Number(cell) as NeighborDigit;
          } else {
            return null;
          }
        }
      }
      return grid;
    }
    if (value.length === width * height) {
      return parseGivens(
        Array.from({ length: height }, (_, row) => value.slice(row * width, (row + 1) * width)),
        width,
        height
      );
    }
    return null;
  }

  if (typeof value !== 'string') return null;
  const rows = readRows(value, width, height);
  if (!rows) return null;
  const grid = emptyDigitGrid(width, height);
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const cell = rows[row][col];
      if (cell === '.' || cell === '0' || cell === '-' || cell === '_') continue;
      if (!/^[123]$/u.test(cell)) return null;
      grid[row][col] = Number(cell) as NeighborDigit;
    }
  }
  return grid;
}

function parseBooleanCell(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (value === 1 || value === '1' || value === '#' || value === 'g' || value === 'G' || value === 'x' || value === 'X') {
    return true;
  }
  if (value === 0 || value === '0' || value === '.' || value === '-' || value === '_') return false;
  return null;
}

function parseGrayGrid(value: unknown, width: number, height: number): boolean[][] | null {
  if (Array.isArray(value)) {
    if (value.length === height && value.every((row) => typeof row === 'string')) {
      return parseGrayGrid((value as string[]).join(';'), width, height);
    }
    if (value.length === height && value.every((row) => Array.isArray(row) && row.length === width)) {
      const grid = emptyGrayGrid(width, height);
      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          const parsed = parseBooleanCell((value[row] as unknown[])[col]);
          if (parsed === null) return null;
          grid[row][col] = parsed;
        }
      }
      return grid;
    }
    if (value.length === width * height) {
      return parseGrayGrid(
        Array.from({ length: height }, (_, row) => value.slice(row * width, (row + 1) * width)),
        width,
        height
      );
    }
    return null;
  }

  if (typeof value !== 'string') return null;
  const rows = readRows(value, width, height);
  if (!rows) return null;
  const grid = emptyGrayGrid(width, height);
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const parsed = parseBooleanCell(rows[row][col]);
      if (parsed === null) return null;
      grid[row][col] = parsed;
    }
  }
  return grid;
}

function parseSideMask(value: unknown, length: number): boolean[] | null {
  if (Array.isArray(value)) {
    if (value.length !== length) return null;
    const result = value.map(parseBooleanCell);
    return result.every((item): item is boolean => item !== null) ? result : null;
  }
  if (typeof value !== 'string') return null;
  let normalized = value.trim();
  try {
    normalized = decodeURIComponent(normalized);
  } catch {
    // Keep literal data.
  }
  normalized = normalized.replace(/\s+/gu, '').replace(/[;,|]/gu, '');
  if (normalized.length !== length) return null;
  const result = Array<boolean>(length).fill(false);
  for (let index = 0; index < length; index++) {
    const parsed = parseBooleanCell(normalized[index]);
    if (parsed === null) return null;
    result[index] = parsed;
  }
  return result;
}

function parseClueSide(value: unknown, length: number): (number | null)[] | null {
  if (value === null || value === undefined) return Array<number | null>(length).fill(null);
  if (Array.isArray(value)) {
    if (value.length !== length) return null;
    const result: (number | null)[] = [];
    for (const item of value) {
      if (item === null || item === undefined || item === '' || item === '.' || item === '-') {
        result.push(null);
      } else if (typeof item === 'string' && /^\d+$/u.test(item.trim())) {
        result.push(Number(item));
      } else if (Number.isInteger(item) && (item as number) >= 0) {
        result.push(item as number);
      } else {
        return null;
      }
    }
    return result;
  }
  if (typeof value !== 'string') return null;
  let normalized = value.trim();
  try {
    normalized = decodeURIComponent(normalized);
  } catch {
    // Keep literal data.
  }
  normalized = normalized.replace(/\s+/gu, '');
  if (!normalized) return Array<number | null>(length).fill(null);
  const separated = normalized.split(/[,;|]/u);
  const tokens = separated.length === length ? separated : Array.from(normalized);
  if (tokens.length !== length) return null;
  const result: (number | null)[] = [];
  for (const token of tokens) {
    const item = token.trim();
    if (!item || item === '.' || item === '-') {
      result.push(null);
    } else if (/^\d+$/u.test(item)) {
      result.push(Number(item));
    } else {
      return null;
    }
  }
  return result;
}

function parseClues(value: unknown, width: number, height: number): SkyNeighborClues | null {
  // With only heights 1, 2 and 3, at most three buildings can become a new
  // strict maximum from any viewing direction.
  const validClue = (clue: number | null) => clue === null || (clue >= 1 && clue <= 3);
  const source = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
  if (source) {
    const top = parseClueSide(source.top, width);
    const right = parseClueSide(source.right, height);
    const bottom = parseClueSide(source.bottom, width);
    const left = parseClueSide(source.left, height);
    return top && right && bottom && left &&
      top.every(validClue) && right.every(validClue) && bottom.every(validClue) && left.every(validClue)
      ? { top, right, bottom, left }
      : null;
  }
  if (Array.isArray(value) && value.length === 4) {
    // Match the existing Skyscrapers data convention: top, bottom, left,
    // right. Object payloads remain preferred for readability.
    const top = parseClueSide(value[0], width);
    const bottom = parseClueSide(value[1], width);
    const left = parseClueSide(value[2], height);
    const right = parseClueSide(value[3], height);
    return top && right && bottom && left &&
      top.every(validClue) && right.every(validClue) && bottom.every(validClue) && left.every(validClue)
      ? { top, right, bottom, left }
      : null;
  }
  return null;
}

function parseOutsideGrayCells(value: unknown, width: number, height: number): SkyNeighborOutsideGrayCells | null {
  const source = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
  if (source) {
    const top = source.top === undefined ? Array<boolean>(width).fill(false) : parseSideMask(source.top, width);
    const right = source.right === undefined ? Array<boolean>(height).fill(false) : parseSideMask(source.right, height);
    const bottom = source.bottom === undefined ? Array<boolean>(width).fill(false) : parseSideMask(source.bottom, width);
    const left = source.left === undefined ? Array<boolean>(height).fill(false) : parseSideMask(source.left, height);
    return top && right && bottom && left ? { top, right, bottom, left } : null;
  }
  if (Array.isArray(value) && value.length === 4) {
    const top = parseSideMask(value[0], width);
    const bottom = parseSideMask(value[1], width);
    const left = parseSideMask(value[2], height);
    const right = parseSideMask(value[3], height);
    return top && right && bottom && left ? { top, right, bottom, left } : null;
  }
  return null;
}

/**
 * Parse the four-layer compact URL emitted by pzpr's Sky-neighbors encoder:
 *
 *   inner-givens / outside-givens / inner-gray / outside-gray
 *
 * The outside layers are flattened in side order (top, bottom, left, right),
 * nine cells per side.  This is distinct from the more readable six/ten-layer
 * importer format handled below, so identify it by the characteristic 81/36/
 * 81/36 layer lengths rather than by position alone.
 */
function parseCompactFourLayer(
  payloadParts: readonly string[],
  width: number,
  height: number
): Pick<SkyNeighborPuzzleData, 'givens' | 'grayCells' | 'clues' | 'outsideGrayCells'> | null {
  if (payloadParts.length !== 4) return null;

  const compact = (value: string) => {
    let decoded = value.trim();
    try {
      decoded = decodeURIComponent(decoded);
    } catch {
      // Leave malformed escapes for the normal character validation below.
    }
    return decoded.replace(/[\s;,|]/gu, '');
  };

  const innerEncoded = compact(payloadParts[0]);
  const outerEncoded = compact(payloadParts[1]);
  const innerGrayEncoded = compact(payloadParts[2]);
  const outerGrayEncoded = compact(payloadParts[3]);
  if (
    innerEncoded.length !== width * height ||
    outerEncoded.length !== (width + height) * 2 ||
    innerGrayEncoded.length !== width * height ||
    outerGrayEncoded.length !== (width + height) * 2
  ) return null;

  const givens = parseGivens(innerEncoded, width, height);
  const grayCells = parseGrayGrid(innerGrayEncoded, width, height);
  const sideStrings = [
    outerEncoded.slice(0, width),
    outerEncoded.slice(width, width * 2),
    outerEncoded.slice(width * 2, width * 2 + height),
    outerEncoded.slice(width * 2 + height),
  ];
  const graySideStrings = [
    outerGrayEncoded.slice(0, width),
    outerGrayEncoded.slice(width, width * 2),
    outerGrayEncoded.slice(width * 2, width * 2 + height),
    outerGrayEncoded.slice(width * 2 + height),
  ];
  const clues = parseClues(sideStrings, width, height);
  const outsideGrayCells = parseOutsideGrayCells(graySideStrings, width, height);
  return givens && grayCells && clues && outsideGrayCells
    ? { givens, grayCells, clues, outsideGrayCells }
    : null;
}

function parseFullMask(value: unknown, width: number, height: number) {
  const fullWidth = width + 2;
  const fullHeight = height + 2;
  let rows: unknown[] | null = null;
  if (Array.isArray(value) && value.length === fullHeight) {
    rows = value;
  } else if (Array.isArray(value) && value.length === fullWidth * fullHeight) {
    rows = Array.from({ length: fullHeight }, (_, row) => value.slice(row * fullWidth, (row + 1) * fullWidth));
  } else if (typeof value === 'string') {
    const parsedRows = readRows(value, fullWidth, fullHeight);
    rows = parsedRows;
  }
  if (!rows || rows.length !== fullHeight) return null;

  const inner = emptyGrayGrid(width, height);
  const outside = emptyOutsideGrayCells(width, height);
  for (let row = 0; row < fullHeight; row++) {
    const sourceRow = rows[row];
    const cells = typeof sourceRow === 'string' ? Array.from(sourceRow) : sourceRow;
    if (!Array.isArray(cells) || cells.length !== fullWidth) return null;
    for (let col = 0; col < fullWidth; col++) {
      const cell = cells[col];
      if (row === 0 && col > 0 && col < fullWidth - 1) {
        const parsed = parseBooleanCell(cell);
        if (parsed === null) return null;
        outside.top[col - 1] = parsed;
      } else if (row === fullHeight - 1 && col > 0 && col < fullWidth - 1) {
        const parsed = parseBooleanCell(cell);
        if (parsed === null) return null;
        outside.bottom[col - 1] = parsed;
      } else if (col === 0 && row > 0 && row < fullHeight - 1) {
        const parsed = parseBooleanCell(cell);
        if (parsed === null) return null;
        outside.left[row - 1] = parsed;
      } else if (col === fullWidth - 1 && row > 0 && row < fullHeight - 1) {
        const parsed = parseBooleanCell(cell);
        if (parsed === null) return null;
        outside.right[row - 1] = parsed;
      } else if (row > 0 && row < fullHeight - 1 && col > 0 && col < fullWidth - 1) {
        const parsed = parseBooleanCell(cell);
        if (parsed === null) return null;
        inner[row - 1][col - 1] = parsed;
      }
      // The four corners are intentionally absent cells. Any value there is
      // ignored so both `null` and a harmless placeholder are accepted.
    }
  }
  return { inner, outside };
}

function parsePayloadObject(payload: SkyNeighborPayload, width: number, height: number): SkyNeighborPuzzleData | null {
  const rawMask = payload.mask ?? payload.outlinedCells ?? payload.grayMask ?? payload.outlined ?? payload.gray;
  const fullMask = parseFullMask(rawMask, width, height);
  const givens = parseGivens(payload.givens ?? payload.grid ?? payload.numbers, width, height);
  const rawInnerGray = payload.grayCells ?? (fullMask ? fullMask.inner : rawMask);
  // As in pzpr, an omitted gray layer means that every cell is white.  An
  // explicit (but malformed) layer is still rejected by parseGrayGrid.
  const grayCells = rawInnerGray === undefined
    ? emptyGrayGrid(width, height)
    : parseGrayGrid(rawInnerGray, width, height);
  const rawClues = payload.clues ?? payload.visibility ?? payload.skyscraperClues;
  const hasDirectionalClues = [payload.top, payload.right, payload.bottom, payload.left]
    .some((value) => value !== undefined);
  const clues = rawClues !== undefined || hasDirectionalClues
    ? parseClues(rawClues ?? {
        top: payload.top,
        right: payload.right,
        bottom: payload.bottom,
        left: payload.left,
      }, width, height)
    : {
        top: Array<number | null>(width).fill(null),
        right: Array<number | null>(height).fill(null),
        bottom: Array<number | null>(width).fill(null),
        left: Array<number | null>(height).fill(null),
      };
  // An explicitly supplied outside mask must be valid. Silently replacing a
  // malformed mask with an all-white ring makes an imported puzzle subtly
  // different from its source. When no outside mask is present, use the
  // parsed full-mask ring (if any), otherwise default to white sides.
  const outsideFieldNames = ['outsideGrayCells', 'outsideMask', 'outsideGray', 'outerGrayCells'] as const;
  const explicitOutsideField = outsideFieldNames.find((name) => payload[name] !== undefined);
  const outsideGrayCells = explicitOutsideField !== undefined
    ? parseOutsideGrayCells(payload[explicitOutsideField], width, height)
    : fullMask?.outside ?? emptyOutsideGrayCells(width, height);
  if (!givens || !grayCells || !clues) return null;
  if (!outsideGrayCells) return null;
  return { type: 'sky-neighbor', width, height, givens, grayCells, clues, outsideGrayCells };
}

/**
 * Parse the local Sky-neighbors URL format:
 *
 *   sky-neighbor/9/9/<givens>/<gray>/<top>/<bottom>/<left>/<right>/<top-mask>/<bottom-mask>/<left-mask>/<right-mask>
 *
 * A single URL-encoded JSON or URL-safe base64 JSON segment is accepted too.
 * The parser deliberately accepts the common singular/plural spellings used
 * in imported notes, while keeping ordinary `neighbor` links separate.
 */
export function parseSkyNeighborLink(link: string): SkyNeighborPuzzleData | null {
  try {
    const parts = parsePuzzLinkParts(link);
    const id = parts[0]?.trim().toLowerCase();
    if (!id || !SKY_NEIGHBOR_IDS.has(id)) return null;

    const width = Number(parts[1]);
    const height = Number(parts[2]);
    if (!isPositiveGridSize(width, height) || width !== 9 || height !== 9) return null;

    // Preserve interior (and meaningful final) empty segments: an empty clue
    // segment represents an all-blank answer side.  Remove one trailing empty
    // segment only when it makes the payload length one of the recognised
    // formats; that empty segment is then just the conventional URL slash.
    const payloadParts = parts.slice(3).slice();
    const recognisedLengths = new Set([1, 2, 4, 6, 10]);
    if (
      payloadParts.length > 0 &&
      payloadParts[payloadParts.length - 1] === '' &&
      recognisedLengths.has(payloadParts.length - 1)
    ) {
      payloadParts.pop();
    }
    for (const encoded of [payloadParts[0], payloadParts.join('')]) {
      if (!encoded) continue;
      const decoded = decodePayloadString(encoded);
      if (decoded && typeof decoded === 'object' && !Array.isArray(decoded)) {
        const parsed = parsePayloadObject(decoded as SkyNeighborPayload, width, height);
        if (parsed) return parsed;
      }
    }

    // pzpr's historical URL encoder emits four compact layers.  Keep this
    // branch after structured payload detection so a future four-field JSON
    // representation cannot be mistaken for the compact form.
    const compactFourLayer = parseCompactFourLayer(payloadParts, width, height);
    if (compactFourLayer) {
      return { type: 'sky-neighbor', width, height, ...compactFourLayer };
    }

    if (payloadParts.length < 1) return null;
    const givens = parseGivens(payloadParts[0], width, height);
    const grayCells = payloadParts.length === 1
      ? emptyGrayGrid(width, height)
      : parseGrayGrid(payloadParts[1], width, height);
    if (!givens || !grayCells) return null;

    const cluesEmpty: SkyNeighborClues = {
      top: Array<number | null>(width).fill(null),
      right: Array<number | null>(height).fill(null),
      bottom: Array<number | null>(width).fill(null),
      left: Array<number | null>(height).fill(null),
    };
    let clues = cluesEmpty;
    let outsideGrayCells = emptyOutsideGrayCells(width, height);
    if (payloadParts.length === 1 || payloadParts.length === 2) {
      // No outside clues/masks: all gutter values are answer fields and all
      // gutter cells are white.
    } else if (payloadParts.length === 6 || payloadParts.length === 10) {
      const parsedClues = parseClues(payloadParts.slice(2, 6), width, height);
      if (!parsedClues) return null;
      clues = parsedClues;
      if (payloadParts.length === 10) {
        const parsedOutside = parseOutsideGrayCells(payloadParts.slice(6), width, height);
        if (!parsedOutside) return null;
        outsideGrayCells = parsedOutside;
      }
    } else {
      return null;
    }
    return { type: 'sky-neighbor', width, height, givens, grayCells, clues, outsideGrayCells };
  } catch {
    return null;
  }
}

export const parseSkyNeighborsLink = parseSkyNeighborLink;
export const parseSkyNeighbourLink = parseSkyNeighborLink;
export const parseSkyNeighboursLink = parseSkyNeighborLink;
// Short aliases mirror the Neighbors parser and make imports tolerant of the
// singular/plural and American/British spellings used by source material.
export const parseSkyNeighbor = parseSkyNeighborLink;
export const parseSkyNeighbors = parseSkyNeighborLink;
export const parseSkyNeighbour = parseSkyNeighborLink;
export const parseSkyNeighbours = parseSkyNeighborLink;

export function createEmptySkyNeighborGrid(width: number, height: number): (NeighborDigit | null)[][] {
  return emptyDigitGrid(width, height);
}

/** Return the number of skyscrapers visible in one direction. */
export function getVisibleSkyscrapers(values: readonly (number | null)[]): number | null {
  if (!Array.isArray(values)) return null;
  let tallest = 0;
  let visible = 0;
  for (const value of values) {
    if (!isSkyNeighborDigit(value)) return null;
    if (value > tallest) {
      tallest = value;
      visible += 1;
    }
  }
  return visible;
}

export const getSkyNeighborVisibility = getVisibleSkyscrapers;
export const getVisibility = getVisibleSkyscrapers;

/**
 * Calculate all four visibility lines for a completed Sky-neighbors grid.
 *
 * The returned object uses the same orientation as `SkyNeighborClues`:
 * `top`, `right`, `bottom`, `left`.  A partially filled grid returns `null`
 * because an outside answer cell cannot be determined until its whole row or
 * column is known.
 */
export function getSkyNeighborVisibilityClues(
  grid: readonly (readonly (number | null)[])[]
): SkyNeighborClues | null {
  if (!Array.isArray(grid) || grid.length !== 9 || grid.some((row) => !Array.isArray(row) || row.length !== 9)) return null;
  if (grid.some((row: readonly (number | null)[]) => row.some((value: number | null) => !isSkyNeighborDigit(value)))) return null;

  const top: number[] = [];
  const right: number[] = [];
  const bottom: number[] = [];
  const left: number[] = [];

  for (let col = 0; col < 9; col++) {
    const column = grid.map((row) => row[col] as number);
    top.push(getVisibleSkyscrapers(column) as number);
    bottom.push(getVisibleSkyscrapers([...column].reverse()) as number);
  }
  for (let row = 0; row < 9; row++) {
    const values = grid[row].map((value: number | null) => value as number);
    left.push(getVisibleSkyscrapers(values) as number);
    right.push(getVisibleSkyscrapers([...values].reverse()) as number);
  }

  return { top, right, bottom, left };
}

/** Compatibility aliases used by callers that prefer a verb-style name. */
export const calculateSkyNeighborClues = getSkyNeighborVisibilityClues;
export const getSkyNeighborClues = getSkyNeighborVisibilityClues;

function mergeVisibilityClues(
  calculated: SkyNeighborClues,
  supplied: SkyNeighborClues
): SkyNeighborClues {
  const merge = (actual: readonly (number | null)[], fixed: readonly (number | null)[]) =>
    actual.map((value, index) => fixed[index] ?? value);
  return {
    top: merge(calculated.top, supplied.top),
    right: merge(calculated.right, supplied.right),
    bottom: merge(calculated.bottom, supplied.bottom),
    left: merge(calculated.left, supplied.left),
  };
}

/**
 * Values suitable for drawing the outside answer cells.  Fixed imported
 * clues remain visible while a board is incomplete; blank (`null`) cells are
 * filled as soon as their visibility can be calculated.
 */
export function getSkyNeighborDisplayClues(
  grid: readonly (readonly (number | null)[])[],
  puzzle: SkyNeighborPuzzleData
): SkyNeighborClues {
  const candidate = puzzle as unknown as {
    width?: unknown;
    height?: unknown;
    clues?: unknown;
  } | null | undefined;
  const width = candidate?.width;
  const height = candidate?.height;
  const clues = hasCluesShape(
    candidate?.clues,
    typeof width === 'number' ? width : 0,
    typeof height === 'number' ? height : 0
  )
    ? candidate.clues
    : emptySkyNeighborClues(
        typeof width === 'number' && Number.isInteger(width) && width > 0 ? width : 9,
        typeof height === 'number' && Number.isInteger(height) && height > 0 ? height : 9
      );
  const fallback = (): SkyNeighborClues => ({
    top: [...clues.top],
    right: [...clues.right],
    bottom: [...clues.bottom],
    left: [...clues.left],
  });

  if (!Array.isArray(grid) || typeof width !== 'number' || typeof height !== 'number') {
    return fallback();
  }
  if (
    grid.length !== height ||
    grid.some((row) => !Array.isArray(row) || row.length !== width)
  ) return fallback();

  const calculate = (
    fixed: number | null | undefined,
    values: readonly (number | null)[]
  ) => fixed ?? getVisibleSkyscrapers(values);

  return {
    top: Array.from({ length: width }, (_, col) =>
      calculate(clues.top[col], grid.map((row) => row[col] ?? null))
    ),
    bottom: Array.from({ length: width }, (_, col) =>
      calculate(clues.bottom[col], grid.map((row) => row[col] ?? null).reverse())
    ),
    left: Array.from({ length: height }, (_, row) =>
      calculate(clues.left[row], grid[row])
    ),
    right: Array.from({ length: height }, (_, row) =>
      calculate(clues.right[row], [...grid[row]].reverse())
    ),
  };
}

function getOutsideGray(puzzle: SkyNeighborPuzzleData): SkyNeighborOutsideGrayCells {
  const candidate = puzzle as unknown as {
    width?: unknown;
    height?: unknown;
    outsideGrayCells?: unknown;
  } | null | undefined;
  const width = typeof candidate?.width === 'number' && Number.isInteger(candidate.width) && candidate.width > 0 ? candidate.width : 9;
  const height = typeof candidate?.height === 'number' && Number.isInteger(candidate.height) && candidate.height > 0 ? candidate.height : 9;
  return hasOutsideGrayShape(candidate?.outsideGrayCells, width, height)
    ? candidate.outsideGrayCells
    : emptyOutsideGrayCells(width, height);
}

interface FullCell {
  value: number;
  gray: boolean;
  row: number;
  col: number;
  innerRow: number | null;
  innerCol: number | null;
}

function getFullCells(
  grid: (number | null)[][],
  puzzle: SkyNeighborPuzzleData,
  clues: SkyNeighborClues,
  outsideOverride?: SkyNeighborOutsideGrayCells,
  outsideValues?: SkyNeighborOutsideValues
): FullCell[] {
  const { width, height } = puzzle;
  const outside = outsideOverride ?? getOutsideGray(puzzle);
  const cells: FullCell[] = [];
  const add = (row: number, col: number, value: number, gray: boolean, innerRow: number | null, innerCol: number | null) => {
    cells.push({ value, gray, row, col, innerRow, innerCol });
  };

  for (let col = 0; col < width; col++) {
    const top = outsideValues ? outsideValues.top[col] : clues.top[col];
    const bottom = outsideValues ? outsideValues.bottom[col] : clues.bottom[col];
    if (top !== null && top !== undefined) add(0, col + 1, top, outside.top[col] === true, null, null);
    if (bottom !== null && bottom !== undefined) add(height + 1, col + 1, bottom, outside.bottom[col] === true, null, null);
  }
  for (let row = 0; row < height; row++) {
    const left = outsideValues ? outsideValues.left[row] : clues.left[row];
    const right = outsideValues ? outsideValues.right[row] : clues.right[row];
    if (left !== null && left !== undefined) add(row + 1, 0, left, outside.left[row] === true, null, null);
    if (right !== null && right !== undefined) add(row + 1, width + 1, right, outside.right[row] === true, null, null);
  }
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const value = grid[row]?.[col];
      if (isSkyNeighborDigit(value)) {
        add(row + 1, col + 1, value, puzzle.grayCells[row]?.[col] === true, row, col);
      }
    }
  }
  return cells;
}

function addBadForFullCell(badCells: Set<string>, cell: FullCell, width: number, height: number) {
  if (cell.innerRow !== null && cell.innerCol !== null) {
    badCells.add(`${cell.innerRow},${cell.innerCol}`);
    return;
  }
  // An outside-cell error has no editable cell of its own. Mark each adjacent
  // playable cell so the UI still gives the user a useful highlight.
  const candidates = [
    [cell.row - 1, cell.col],
    [cell.row + 1, cell.col],
    [cell.row, cell.col - 1],
    [cell.row, cell.col + 1],
  ];
  for (const [fullRow, fullCol] of candidates) {
    const row = fullRow - 1;
    const col = fullCol - 1;
    if (row >= 0 && row < height && col >= 0 && col < width) badCells.add(`${row},${col}`);
  }
}

function addBadForOutsidePosition(
  badCells: Set<string>,
  side: keyof SkyNeighborOutsideValues,
  index: number,
  width: number,
  height: number
) {
  // Outside cells do not have their own row/column in the central snapshot.
  // Highlight the adjacent playable cell(s) instead, which is the most useful
  // feedback the central-grid board can provide for a gutter error.
  const candidates = side === 'top'
    ? [[0, index]]
    : side === 'bottom'
      ? [[height - 1, index]]
      : side === 'left'
        ? [[index, 0]]
        : [[index, width - 1]];
  for (const [row, col] of candidates) {
    if (row >= 0 && row < height && col >= 0 && col < width) {
      badCells.add(`${row},${col}`);
    }
  }
}

/** Validate the Latin-square, skyscraper visibility and full 11×11 adjacency rules. */
export function validateSkyNeighbor(
  grid: (number | null)[][],
  puzzle: SkyNeighborPuzzleData,
  outsideValues?: SkyNeighborOutsideValues
): NumberPlacementValidationResult {
  // Imported note data is untrusted at runtime. Check every nested shape
  // before dereferencing it so a malformed snapshot reports a validation
  // error instead of crashing the page.
  const candidate = puzzle as unknown as {
    width?: unknown;
    height?: unknown;
    givens?: unknown;
    grayCells?: unknown;
    clues?: unknown;
    outsideGrayCells?: unknown;
  } | null | undefined;
  const width = candidate?.width;
  const height = candidate?.height;
  const badCells = new Set<string>();
  let fixedError = false;
  let countError = false;
  let adjacencyError = false;
  let visibilityError = false;
  let centralComplete = true;
  const addBad = (row: number, col: number) => {
    if (typeof width === 'number' && typeof height === 'number' &&
      row >= 0 && row < height && col >= 0 && col < width) {
      badCells.add(`${row},${col}`);
    }
  };

  if (
    width !== 9 || height !== 9 ||
    !hasMatrixShape(grid, 9, 9) ||
    !hasDigitGridShape(candidate?.givens, 9, 9) ||
    !hasGrayGridShape(candidate?.grayCells, 9, 9) ||
    !hasCluesShape(candidate?.clues, 9, 9)
  ) {
    return { valid: false, message: '盘面数据尺寸不正确。', badCells: [] };
  }
  const givens = candidate.givens;
  const grayCells = candidate.grayCells;
  const clues = candidate.clues;
  const outside = candidate.outsideGrayCells === undefined
    ? emptyOutsideGrayCells(width, height)
    : candidate.outsideGrayCells;
  if (!hasOutsideGrayShape(outside, 9, 9)) {
    return { valid: false, message: '盘面数据尺寸不正确。', badCells: [] };
  }
  if (outsideValues !== undefined && !hasOutsideValuesShape(outsideValues, 9, 9)) {
    return { valid: false, message: '盘面外数据尺寸不正确。', badCells: [] };
  }

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const value = grid[row][col];
      if (!isSkyNeighborDigit(value)) {
        centralComplete = false;
        addBad(row, col);
      } else if (givens[row][col] !== null && value !== givens[row][col]) {
        fixedError = true;
        addBad(row, col);
      }
    }
  }

  // The editable gutter is supplied by the interactive board as a separate
  // snapshot field.  Keep this distinct from the legacy two-argument API,
  // where blank gutter values are derived from the completed central grid.
  let outsideComplete = true;
  let suppliedOutside: SkyNeighborOutsideValues | undefined;
  if (outsideValues !== undefined) {
    suppliedOutside = {
      top: [...outsideValues.top],
      right: [...outsideValues.right],
      bottom: [...outsideValues.bottom],
      left: [...outsideValues.left],
    };
    const sides: Array<keyof SkyNeighborOutsideValues> = ['top', 'right', 'bottom', 'left'];
    for (const side of sides) {
      for (let index = 0; index < suppliedOutside[side].length; index++) {
        const entered = suppliedOutside[side][index];
        const fixed = clues[side][index];
        if (entered !== null && fixed !== null && entered !== fixed) {
          fixedError = true;
          addBadForOutsidePosition(badCells, side, index, width, height);
        }
        if (entered === null) {
          outsideComplete = false;
          addBadForOutsidePosition(badCells, side, index, width, height);
        }
      }
    }
  }

  for (let row = 0; row < height; row++) {
    const counts = [0, 0, 0, 0];
    for (const value of grid[row]) if (isSkyNeighborDigit(value)) counts[value] += 1;
    if (counts[1] !== 3 || counts[2] !== 3 || counts[3] !== 3) {
      countError = true;
      for (let col = 0; col < width; col++) addBad(row, col);
    }
  }
  for (let col = 0; col < width; col++) {
    const counts = [0, 0, 0, 0];
    for (let row = 0; row < height; row++) {
      const value = grid[row]?.[col];
      if (isSkyNeighborDigit(value)) counts[value] += 1;
    }
    if (counts[1] !== 3 || counts[2] !== 3 || counts[3] !== 3) {
      countError = true;
      for (let row = 0; row < height; row++) addBad(row, col);
    }
  }

  if (!centralComplete || countError || !outsideComplete) {
    // While the outer values are still unknown, gray cells with an equal
    // central neighbour are already conclusively wrong. For white cells, only
    // report isolation when every central neighbour is filled and the cell is
    // not on the edge (an edge cell may ultimately pair with its gutter cell).
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const value = grid[row][col];
        if (!isSkyNeighborDigit(value)) continue;
        const neighbours = [
          row > 0 ? grid[row - 1][col] : null,
          row + 1 < height ? grid[row + 1][col] : null,
          col > 0 ? grid[row][col - 1] : null,
          col + 1 < width ? grid[row][col + 1] : null,
        ];
        const same = neighbours.filter((neighbour) => neighbour === value).length;
        const isGray = grayCells[row][col] === true;
        const isInnerCell = row > 0 && row + 1 < height && col > 0 && col + 1 < width;
        const centralNeighboursComplete = neighbours.every(isSkyNeighborDigit);
        const invalidGray = isGray && same > 0;
        const invalidWhite = !isGray && same === 0 && isInnerCell && centralNeighboursComplete;
        if (invalidGray || invalidWhite) {
          adjacencyError = true;
          addBad(row, col);
          if (same > 0) {
            if (row > 0 && grid[row - 1][col] === value) addBad(row - 1, col);
            if (row + 1 < height && grid[row + 1][col] === value) addBad(row + 1, col);
            if (col > 0 && grid[row][col - 1] === value) addBad(row, col - 1);
            if (col + 1 < width && grid[row][col + 1] === value) addBad(row, col + 1);
          }
        }
      }
    }
  }

  if (centralComplete && !countError) {
    const calculated = getSkyNeighborVisibilityClues(grid);
    if (!calculated) {
      centralComplete = false;
    } else {
      const checkVisibility = (
        actual: number,
        supplied: number | null | undefined,
        cells: Array<[number, number]>
      ) => {
        if (supplied === null || supplied === undefined) return;
        if (actual !== supplied) {
          visibilityError = true;
          cells.forEach(([row, col]) => addBad(row, col));
        }
      };

      let effectiveOutside: SkyNeighborOutsideValues | undefined;
      if (suppliedOutside !== undefined) {
        // Explicit gutter values are answer cells.  Compare every one with
        // the visibility calculated from its corresponding row/column.
        for (let col = 0; col < width; col++) {
          const top = suppliedOutside.top[col];
          const bottom = suppliedOutside.bottom[col];
          const columnCells = Array.from({ length: height }, (_, row) => [row, col] as [number, number]);
          if (top !== null) {
            checkVisibility(calculated.top[col] as number, top, columnCells);
            if (top !== calculated.top[col]) addBadForOutsidePosition(badCells, 'top', col, width, height);
          }
          if (bottom !== null) {
            checkVisibility(calculated.bottom[col] as number, bottom, columnCells);
            if (bottom !== calculated.bottom[col]) addBadForOutsidePosition(badCells, 'bottom', col, width, height);
          }
        }
        for (let row = 0; row < height; row++) {
          const left = suppliedOutside.left[row];
          const right = suppliedOutside.right[row];
          const rowCells = Array.from({ length: width }, (_, col) => [row, col] as [number, number]);
          if (left !== null) {
            checkVisibility(calculated.left[row] as number, left, rowCells);
            if (left !== calculated.left[row]) addBadForOutsidePosition(badCells, 'left', row, width, height);
          }
          if (right !== null) {
            checkVisibility(calculated.right[row] as number, right, rowCells);
            if (right !== calculated.right[row]) addBadForOutsidePosition(badCells, 'right', row, width, height);
          }
        }
        effectiveOutside = suppliedOutside;
      } else {
        // Two-argument callers use the historical compatibility behaviour:
        // blank gutter cells are derived automatically, while any imported
        // fixed clue is checked against the calculated visibility.
        for (let row = 0; row < height; row++) {
          const cells = Array.from({ length: width }, (_, col) => [row, col] as [number, number]);
          checkVisibility(calculated.left[row] as number, clues.left[row], cells);
          checkVisibility(calculated.right[row] as number, clues.right[row], cells);
        }
        for (let col = 0; col < width; col++) {
          const cells = Array.from({ length: height }, (_, row) => [row, col] as [number, number]);
          checkVisibility(calculated.top[col] as number, clues.top[col], cells);
          checkVisibility(calculated.bottom[col] as number, clues.bottom[col], cells);
        }
      }

      // Outside white/gray cells participate in the Neighbors rule.  Do not
      // run this pass until all outside answer cells are known; otherwise a
      // blank white edge cell could be reported as isolated prematurely.
      if (outsideComplete) {
        const effectiveClues = mergeVisibilityClues(calculated, clues);
        const fullCells = getFullCells(
          grid,
          puzzle,
          effectiveClues,
          outside,
          effectiveOutside
        );
        const byPosition = new Map(fullCells.map((cell) => [`${cell.row},${cell.col}`, cell]));
        for (const cell of fullCells) {
          const neighbours = [
            byPosition.get(`${cell.row - 1},${cell.col}`),
            byPosition.get(`${cell.row + 1},${cell.col}`),
            byPosition.get(`${cell.row},${cell.col - 1}`),
            byPosition.get(`${cell.row},${cell.col + 1}`),
          ].filter((item): item is FullCell => item !== undefined);
          const same = neighbours.filter((item) => item.value === cell.value);
          if ((cell.gray && same.length > 0) || (!cell.gray && same.length === 0)) {
            adjacencyError = true;
            addBadForFullCell(badCells, cell, width, height);
            same.forEach((item) => addBadForFullCell(badCells, item, width, height));
          }
        }
      }
    }
  }

  let message: string | undefined;
  if (fixedError) message = '固定数字不能被修改。';
  else if (countError || !centralComplete) message = '每行每列中，数字 1、2、3 都必须恰好出现三次。';
  else if (!outsideComplete) message = '盘面外的格子尚未填完。';
  else if (visibilityError) message = '盘面外的可见摩天楼数量不正确。';
  else if (adjacencyError) message = '白格必须接触同号格，灰格不能接触同号格。';

  return {
    valid: centralComplete && outsideComplete && !fixedError && !countError && !visibilityError && !adjacencyError,
    message,
    badCells: [...badCells].map((key) => {
      const [row, col] = key.split(',').map(Number);
      return { row, col };
    }),
  };
}

export const validateSkyNeighbors = validateSkyNeighbor;
export const validateSkyNeighbour = validateSkyNeighbor;
