import type { LocalizedText, LocalizedTextList } from '@/i18n/types';

// src/puzzles/types.ts
export interface NurikabeClue {
  row: number;
  col: number;
  value: number | '?';
}

export type YajilinDirection = 'up' | 'right' | 'down' | 'left';

export interface YajilinClue {
  row: number;
  col: number;
  direction: YajilinDirection;
  value: number | '?';
}

export interface YajilinSolutionEdge {
  r1: number;
  c1: number;
  r2: number;
  c2: number;
}

export interface NurikabePuzzleData {
  type: 'nurikabe';
  width: number;
  height: number;
  clues: NurikabeClue[];
}

export interface FillominoPuzzleData {
  type: 'fillomino';
  width: number;
  height: number;
  clues: (number | null)[][];
}

export interface YajilinPuzzleData {
  type: 'yajilin';
  width: number;
  height: number;
  clues: YajilinClue[];
}

/** Koburin (仙人指邻) clue. */
export interface KoburinClue {
  row: number;
  col: number;
  value: number | '?';
}

export interface KoburinPuzzleData {
  type: 'koburin';
  width: number;
  height: number;
  clues: KoburinClue[];
  /** PuzzLink's optional `m` flag counts diagonal neighbours too. */
  minesweeper?: boolean;
}

export type NeighborDigit = 1 | 2 | 3;

/**
 * Neighbors (WPF Puzzle GP 2015, round 4) puzzle data.
 *
 * `givens` contains the digits printed in the puzzle; `null` is an empty
 * cell. `grayCells` identifies the outlined/gray cells. Every cell remains
 * playable, including gray cells.
 */
export interface NeighborPuzzleData {
  type: 'neighbor';
  width: number;
  height: number;
  givens: (NeighborDigit | null)[][];
  grayCells: boolean[][];
}

/**
 * The four outside visibility lines used by a Sky-neighbors puzzle.
 *
 * A non-null value is an imported/fixed visibility clue.  `null` represents
 * the blank answer cell used by the WPF booklet; the value is derived from
 * the completed 9×9 grid by the interactive board and validator.
 */
export interface SkyNeighborClues {
  top: (number | null)[];
  right: (number | null)[];
  bottom: (number | null)[];
  left: (number | null)[];
}

/** Gray/outlined cells in the four one-cell-wide clue gutters. */
export interface SkyNeighborOutsideGrayCells {
  top: boolean[];
  right: boolean[];
  bottom: boolean[];
  left: boolean[];
}

/**
 * Sky-neighbors (WPF Puzzle GP 2015, round 4) puzzle data.
 *
 * The playable area is always a 9×9 Latin square of the digits 1, 2 and 3.
 * The four one-cell-wide gutters are answer cells: their values are the
 * skyscraper visibility counts.  `clues` may contain fixed values for
 * imported puzzles, while `null` entries are blank answer cells.  Gutter
 * cells participate in the white/gray neighbour rule but the four corners do
 * not exist.  `outsideGrayCells` is optional; absent sides are white.
 */
export interface SkyNeighborPuzzleData {
  type: 'sky-neighbor';
  width: number;
  height: number;
  givens: (NeighborDigit | null)[][];
  grayCells: boolean[][];
  clues: SkyNeighborClues;
  outsideGrayCells?: SkyNeighborOutsideGrayCells;
}

export interface StarbattlePuzzleData {
  type: 'starbattle';
  width: number;
  height: number;
  starsPerUnit: number;
  regionIds: number[][];
}

export interface HeyawakeClue {
  row: number;
  col: number;
  value: number;
}

export interface HeyawakePuzzleData {
  type: 'heyawake';
  width: number;
  height: number;
  regionIds: number[][];
  clues: HeyawakeClue[];
}

export interface AqreClue {
  row: number;
  col: number;
  value: number;
}

export interface AqrePuzzleData {
  type: 'aqre';
  width: number;
  height: number;
  regionIds: number[][];
  clues: AqreClue[];
}

export interface MintonetteClue {
  row: number;
  col: number;
  value: number | null;
}

export interface MintonetteSolutionEdge {
  r1: number;
  c1: number;
  r2: number;
  c2: number;
}

export interface MintonettePuzzleData {
  type: 'mintonette';
  width: number;
  height: number;
  clues: MintonetteClue[];
}

export interface NikojiPuzzleData {
  type: 'nikoji';
  width: number;
  height: number;
  letters: (string | null)[][];
}

export type AkariCell = number | 'black' | null;

export interface AkariPuzzleData {
  type: 'akari';
  width: number;
  height: number;
  cells: AkariCell[][];
}

export type KurarinClueColor = 'black' | 'white' | 'gray';

export interface KurarinClue {
  row: number;
  col: number;
  color: KurarinClueColor;
}

export interface KurarinPuzzleData {
  type: 'kurarin';
  width: number;
  height: number;
  clues: KurarinClue[];
}

export interface WalkwalkClue {
  row: number;
  col: number;
  value: number;
}

export interface WalkwalkPuzzleData {
  type: 'walkwalk';
  width: number;
  height: number;
  regionIds: number[][];
  clues: WalkwalkClue[];
}

export interface SlitherlinkPuzzleData {
  type: 'slither';
  width: number;
  height: number;
  clues: (number | null)[][];
}

export interface LitsPuzzleData {
  type: 'lits';
  width: number;
  height: number;
  regionIds: number[][];
}

export interface LakesPuzzleData {
  type: 'lakes';
  width: number;
  height: number;
  clues: NurikabeClue[];
}

export type TapaClueValue = number | '?';
export type TapaClue = TapaClueValue[];

export interface TapaPuzzleData {
  type: 'tapa';
  width: number;
  height: number;
  clues: (TapaClue | null)[][];
}

export type MagicSummerCell = number | 'block' | null;

export interface MagicSummerClues {
  top: (number | null)[];
  bottom: (number | null)[];
  left: (number | null)[];
  right: (number | null)[];
}

export interface MagicSummerPuzzleData {
  type: 'magic-summer';
  width: number;
  height: number;
  numbers: number[];
  rowSums: (number | null)[];
  columnSums: (number | null)[];
  clues?: MagicSummerClues;
  cells: MagicSummerCell[][];
}

export interface SkyscrapersClues {
  top: (number | null)[];
  bottom: (number | null)[];
  left: (number | null)[];
  right: (number | null)[];
}

export interface SkyscrapersPuzzleData {
  type: 'skyscrapers';
  width: number;
  height: number;
  numbers: number[];
  clues: SkyscrapersClues;
  givens: (number | null)[][];
}

export type BattleshipSegment =
  | 'unknown'
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'center'
  | 'single'
  | 'up-left'
  | 'up-right'
  | 'down-left'
  | 'down-right';

export interface BattleshipCellClue {
  row: number;
  col: number;
  kind: 'water' | 'ship';
  segment?: BattleshipSegment;
}

export interface BattleshipShipShape {
  width: number;
  height: number;
  cells: boolean[][];
}

export interface BattleshipPuzzleData {
  type: 'battleship';
  width: number;
  height: number;
  columnClues: (number | null)[];
  rowClues: (number | null)[];
  cellClues: BattleshipCellClue[];
  fleet: BattleshipShipShape[];
}

export interface DominoSearchPuzzleData {
  type: 'domino-search';
  width: number;
  height: number;
  numbers: (number | null)[][];
  dominoes: Array<[number, number]>;
}

export type MagicSnailCell = number | 'block' | null;

export interface MagicSnailPuzzleData {
  type: 'snail';
  width: number;
  height: number;
  numbers: number[];
  cells: MagicSnailCell[][];
  start?: {
    row: number;
    col: number;
  };
}

export interface SlovakSumsClueCell {
  sum: number | null;
  count: number;
}

export type SlovakSumsCell = SlovakSumsClueCell | null;

export interface SlovakSumsPuzzleData {
  type: 'slovak-sums';
  width: number;
  height: number;
  numbers: number[];
  cells: SlovakSumsCell[][];
}

/** A black Kakuro clue cell. `right` and `down` are the two optional runs. */
export interface KakuroClueCell {
  right: number | null;
  down: number | null;
}

/** `null` is a playable white cell; an object is a black clue cell. */
export type KakuroCell = KakuroClueCell | null;

export interface KakuroPuzzleData {
  type: 'kakuro';
  width: number;
  height: number;
  cells: KakuroCell[][];
  /** Legacy edge-clue storage retained for hand-authored data; parsed links promote these into cells. */
  topClues: (number | null)[];
  /** Legacy edge-clue storage retained for hand-authored data; parsed links promote these into cells. */
  leftClues: (number | null)[];
}

export type WolvesAndSheepClue = number | 'sheep' | 'wolf' | null;

/** Wolves and Sheep Fences (`wolvesandsheepfences` in PuzzLink). */
export interface WolvesAndSheepPuzzleData {
  type: 'wolvesandsheepfences';
  width: number;
  height: number;
  clues: WolvesAndSheepClue[][];
}

/** One polyomino from a Shape Minesweeper bank. */
export interface ShapeMinesweeperShape {
  /** A short identifier printed inside the source shape (for example T or L). */
  label: string;
  /** A trimmed rectangular mask; true cells make up the polyomino. */
  cells: boolean[][];
}

export interface ShapeMinesweeperPuzzleData {
  type: 'shape-minesweeper';
  width: number;
  height: number;
  clues: (number | null)[][];
  shapes: ShapeMinesweeperShape[];
}

export interface CavePuzzleData {
  type: 'cave';
  width: number;
  height: number;
  clues: (number | null)[][];
}

export type JapaneseArrowDirection = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';
export interface JapaneseArrowsPuzzleData {
  type: 'japanese-arrows';
  width: number;
  height: number;
  arrows: JapaneseArrowDirection[][];
  clues: (number | null)[][];
}

export type FourWindsWithParksDirection = 0 | 1 | 2 | 3 | 4; // Park/circle, N, E, S, W
export type FourWindsWithParksCellValue = FourWindsWithParksDirection | 'circle' | 'cross' | null;
export interface FourWindsWithParksPuzzleData {
  type: 'four-winds-with-parks';
  width: number;
  height: number;
  clues: (number | null)[][];
}

export interface ConsecutiveKakuroPuzzleData extends Omit<KakuroPuzzleData, 'type'> {
  type: 'consecutive-kakuro';
  horizontalBars: boolean[][];
  verticalBars: boolean[][];
}

export type JapaneseSumsSide = Array<Array<number>>;
export interface JapaneseSumsWithZeroesPuzzleData {
  type: 'japanese-sums-with-zeroes';
  width: number;
  height: number;
  maxDigit: number;
  clues: { top: JapaneseSumsSide; right: JapaneseSumsSide; bottom: JapaneseSumsSide; left: JapaneseSumsSide };
}

export type ABCBoxSymbol = number | 'A' | 'B' | 'C' | '?';
export interface ABCBoxPuzzleData {
  type: 'abc-box';
  width: number;
  height: number;
  givens: (('A' | 'B' | 'C') | null)[][];
  clues: { top: ABCBoxSymbol[][]; right: ABCBoxSymbol[][]; bottom: ABCBoxSymbol[][]; left: ABCBoxSymbol[][] };
}

export type MagnetsPole = '+' | '-';
export interface MagnetsPuzzleData {
  type: 'magnets';
  width: number;
  height: number;
  /** Domino regions; each entry is a pair of orthogonally adjacent cells. */
  regions: Array<Array<{ row: number; col: number }>>;
  /** '+' count per column, farther top strip (null = no constraint). */
  topClues: (number | null)[];
  /** '−' count per column, nearer top strip (null = no constraint). */
  topMinusClues: (number | null)[];
  /** '−' count per row, nearer left strip (null = no constraint). */
  leftClues: (number | null)[];
  /** '+' count per row, farther left strip (null = no constraint). */
  leftPlusClues: (number | null)[];
  /** Pre-given poles. */
  givens: (MagnetsPole | null)[][];
}

export interface PillsPuzzleData {
  type: 'pills';
  width: number;
  height: number;
  /** Given dot counts per cell; dots outside any pill are decorative. */
  dots: number[][];
  /** Number of dots inside pills per column (null = no constraint). */
  topClues: (number | null)[];
  /** Number of dots inside pills per row (null = no constraint). */
  leftClues: (number | null)[];
  /** The pill values indicated to the right of the grid (one per pill). */
  pillValues: number[];
}

export type PuzzleData =
  | NurikabePuzzleData
  | FillominoPuzzleData
  | YajilinPuzzleData
  | KoburinPuzzleData
  | NeighborPuzzleData
  | SkyNeighborPuzzleData
  | StarbattlePuzzleData
  | HeyawakePuzzleData
  | AqrePuzzleData
  | MintonettePuzzleData
  | NikojiPuzzleData
  | AkariPuzzleData
  | KurarinPuzzleData
  | WalkwalkPuzzleData
  | SlitherlinkPuzzleData
  | LitsPuzzleData
  | LakesPuzzleData
  | TapaPuzzleData
  | MagicSummerPuzzleData
  | SkyscrapersPuzzleData
  | BattleshipPuzzleData
  | DominoSearchPuzzleData
  | MagicSnailPuzzleData
  | SlovakSumsPuzzleData
  | KakuroPuzzleData
  | WolvesAndSheepPuzzleData
  | ShapeMinesweeperPuzzleData
  | CavePuzzleData
  | JapaneseArrowsPuzzleData
  | FourWindsWithParksPuzzleData
  | ConsecutiveKakuroPuzzleData
  | JapaneseSumsWithZeroesPuzzleData
  | ABCBoxPuzzleData
  | MagnetsPuzzleData
  | PillsPuzzleData;
export type PuzzleType = PuzzleData['type'];
export type PuzzleDifficulty = '简单' | '困难' | '极难';

export const puzzleDifficultyLabels: Record<PuzzleDifficulty, LocalizedText> = {
  简单: {
    'zh-CN': '简单',
    en: 'Easy',
  },
  困难: {
    'zh-CN': '困难',
    en: 'Hard',
  },
  极难: {
    'zh-CN': '极难',
    en: 'Extreme',
  },
};

export interface PuzzleEntry {
  puzzLink: string;
  difficulty: PuzzleDifficulty;
}

export type PuzzleExample =
  | {
      puzzleType: 'nurikabe';
      width: number;
      height: number;
      clues: NurikabeClue[];
      correctSolution: (0 | 1)[][]; // 0=白格, 1=黑格
    }
  | {
      puzzleType: 'fillomino';
      width: number;
      height: number;
      cluesGrid: (number | null)[][]; // 初始线索
      correctGrid: (number | null)[][]; // 正确答案
    }
  | {
      puzzleType: 'yajilin';
      width: number;
      height: number;
      clues: YajilinClue[];
      shadedCells: { row: number; col: number }[];
      loopEdges: YajilinSolutionEdge[];
      crossedEdges?: YajilinSolutionEdge[];
    }
  | {
      puzzleType: 'koburin';
      width: number;
      height: number;
      clues: KoburinClue[];
      shadedCells: { row: number; col: number }[];
      loopEdges: YajilinSolutionEdge[];
      crossedEdges?: YajilinSolutionEdge[];
    }
  | {
      puzzleType: 'neighbor';
      width: number;
      height: number;
      givens: (NeighborDigit | null)[][];
      grayCells: boolean[][];
      correctGrid: NeighborDigit[][];
    }
  | {
      puzzleType: 'sky-neighbor';
      width: number;
      height: number;
      givens: (NeighborDigit | null)[][];
      grayCells: boolean[][];
      clues: SkyNeighborClues;
      outsideGrayCells?: SkyNeighborOutsideGrayCells;
      correctGrid: NeighborDigit[][];
    }
  | {
      puzzleType: 'starbattle';
      width: number;
      height: number;
      starsPerUnit: number;
      regionIds: number[][];
      starCells: { row: number; col: number }[];
    }
  | {
      puzzleType: 'heyawake';
      width: number;
      height: number;
      regionIds: number[][];
      clues: HeyawakeClue[];
      correctSolution: (0 | 1)[][];
    }
  | {
      puzzleType: 'aqre';
      width: number;
      height: number;
      regionIds: number[][];
      clues: AqreClue[];
      correctSolution: (0 | 1)[][];
    }
  | {
      puzzleType: 'mintonette';
      width: number;
      height: number;
      clues: MintonetteClue[];
      solutionEdges: MintonetteSolutionEdge[];
      crossedEdges?: MintonetteSolutionEdge[];
    }
  | {
      puzzleType: 'nikoji';
      width: number;
      height: number;
      letters: (string | null)[][];
      solutionRegionIds: number[][];
    }
  | {
      puzzleType: 'akari';
      width: number;
      height: number;
      cells: AkariCell[][];
      bulbCells: { row: number; col: number }[];
    }
  | {
      puzzleType: 'kurarin';
      width: number;
      height: number;
      clues: KurarinClue[];
      shadedCells: { row: number; col: number }[];
      loopEdges: YajilinSolutionEdge[];
      crossedEdges?: YajilinSolutionEdge[];
    }
  | {
      puzzleType: 'walkwalk';
      width: number;
      height: number;
      regionIds: number[][];
      clues: WalkwalkClue[];
      solutionEdges: YajilinSolutionEdge[];
      crossedEdges?: YajilinSolutionEdge[];
    }
  | {
      puzzleType: 'slither';
      width: number;
      height: number;
      clues: (number | null)[][];
      loopEdges: string[];
      crossedEdges?: string[];
    }
  | {
      puzzleType: 'lits';
      width: number;
      height: number;
      regionIds: number[][];
      correctSolution: (0 | 1)[][];
    }
  | {
      puzzleType: 'lakes';
      width: number;
      height: number;
      clues: NurikabeClue[];
      correctSolution: (0 | 1)[][];
    }
  | {
      puzzleType: 'tapa';
      width: number;
      height: number;
      clues: (TapaClue | null)[][];
      correctSolution: (0 | 1)[][];
    }
  | {
      puzzleType: 'magic-summer';
      width: number;
      height: number;
      numbers: number[];
      rowSums: (number | null)[];
      columnSums: (number | null)[];
      clues?: MagicSummerClues;
      cells: MagicSummerCell[][];
      correctGrid: (number | null)[][];
    }
  | {
      puzzleType: 'skyscrapers';
      width: number;
      height: number;
      numbers: number[];
      clues: SkyscrapersClues;
      correctGrid: number[][];
    }
  | {
      puzzleType: 'battleship';
      width: number;
      height: number;
      columnClues: (number | null)[];
      rowClues: (number | null)[];
      cellClues: BattleshipCellClue[];
      fleet: BattleshipShipShape[];
      correctSolution: (0 | 1)[][];
    }
  | {
      puzzleType: 'domino-search';
      width: number;
      height: number;
      numbers: number[][];
      dominoes: Array<[number, number]>;
      solutionEdges: YajilinSolutionEdge[];
    }
  | {
      puzzleType: 'snail';
      width: number;
      height: number;
      numbers: number[];
      cells: MagicSnailCell[][];
      start?: {
        row: number;
        col: number;
      };
      correctGrid: (number | null)[][];
    }
  | {
      puzzleType: 'slovak-sums';
      width: number;
      height: number;
      numbers: number[];
      cells: SlovakSumsCell[][];
      correctGrid: (number | null)[][];
    }
  | {
      puzzleType: 'kakuro';
      width: number;
      height: number;
      cells: KakuroCell[][];
      topClues: (number | null)[];
      leftClues: (number | null)[];
      correctGrid: (number | null)[][];
    }
  | {
      puzzleType: 'wolvesandsheepfences';
      width: number;
      height: number;
      clues: WolvesAndSheepClue[][];
      loopEdges: string[];
      crossedEdges?: string[];
    }
  | {
      puzzleType: 'shape-minesweeper';
      width: number;
      height: number;
      clues: (number | null)[][];
      shapes: ShapeMinesweeperShape[];
      correctSolution: (0 | 1)[][];
    }
  | {
      puzzleType: 'cave';
      width: number;
      height: number;
      clues: (number | null)[][];
      correctSolution: (0 | 1)[][];
    }
  | {
      puzzleType: 'japanese-arrows';
      width: number;
      height: number;
      arrows: JapaneseArrowDirection[][];
      clues: (number | null)[][];
      correctGrid: number[][];
    }
  | {
      puzzleType: 'four-winds-with-parks';
      width: number;
      height: number;
      clues: (number | null)[][];
      correctGrid: FourWindsWithParksDirection[][];
    }
  | {
      puzzleType: 'consecutive-kakuro';
      width: number;
      height: number;
      cells: KakuroCell[][];
      topClues: (number | null)[];
      leftClues: (number | null)[];
      horizontalBars: boolean[][];
      verticalBars: boolean[][];
      correctGrid: (number | null)[][];
    }
  | { puzzleType: 'japanese-sums-with-zeroes'; width: number; height: number; clues: JapaneseSumsWithZeroesPuzzleData['clues']; correctGrid: (number | null)[][]; }
  | { puzzleType: 'abc-box'; width: number; height: number; givens: ABCBoxPuzzleData['givens']; clues: ABCBoxPuzzleData['clues']; correctGrid: string[][]; }
  | { puzzleType: 'magnets'; width: number; height: number; regions: MagnetsPuzzleData['regions']; topClues: MagnetsPuzzleData['topClues']; topMinusClues: MagnetsPuzzleData['topMinusClues']; leftClues: MagnetsPuzzleData['leftClues']; leftPlusClues: MagnetsPuzzleData['leftPlusClues']; givens: MagnetsPuzzleData['givens']; correctGrid: (number | null)[][]; }
  | { puzzleType: 'pills'; width: number; height: number; dots: PillsPuzzleData['dots']; topClues: PillsPuzzleData['topClues']; leftClues: PillsPuzzleData['leftClues']; pillValues: PillsPuzzleData['pillValues']; correctGrid: (0 | 1)[][]; };

export interface PuzzleTemplate {
  type: PuzzleType;
  name: LocalizedText;
  rulesTitle: LocalizedText;
  rules: LocalizedTextList;
  exampleTitle: LocalizedText;
  playableLabel: LocalizedText;
  answerLabel: LocalizedText;
  example: PuzzleExample;
}

// 每日/历史谜题类型
export type DailyPuzzleData = {
  puzzle: PuzzleData;
  template: PuzzleTemplate;
  difficulty: PuzzleDifficulty;
  /** Continuous zero-based public puzzle number (parseable entries only). */
  index: number;
  daysSinceStart: number;
  dateStr: string;
};

export type HistoryPuzzleData = {
  puzzle: PuzzleData;
  template: PuzzleTemplate;
  difficulty: PuzzleDifficulty;
  /** Continuous zero-based public puzzle number (parseable entries only). */
  index: number;
  dateStr: string;
  daysSinceStart: number;
};
