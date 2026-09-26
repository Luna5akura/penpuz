import type { ReactElement } from 'react';
import NurikabeBoard from './Nurikabe/Nurikabe';
import FillominoBoard from './Fillomino/Fillomino';
import YajilinBoard from './Yajilin/Yajilin';
import KoburinBoard from './Koburin/Koburin';
import NeighborBoard from './Neighbor/Neighbor';
import SkyNeighborBoard from './SkyNeighbor/SkyNeighbor';
import StarbattleBoard from './Starbattle/Starbattle';
import HeyawakeBoard from './Heyawake/Heyawake';
import AqreBoard from './Aqre/Aqre';
import MintonetteBoard from './Mintonette/Mintonette';
import NikojiBoard from './Nikoji/Nikoji';
import AkariBoard from './Akari/Akari';
import KurarinBoard from './Kurarin/Kurarin';
import WalkwalkBoard from './Walkwalk/Walkwalk';
import SlitherlinkBoard from './Slitherlink/Slitherlink';
import LitsBoard from './Lits/Lits';
import LakesBoard from './Lakes/Lakes';
import TapaBoard from './Tapa/Tapa';
import YinYangBoard from './YinYang/YinYang';
import KropkiBoard from './Kropki/Kropki';
import MagicSummerBoard from './MagicSummer/MagicSummer';
import SkyscrapersBoard from './Skyscrapers/Skyscrapers';
import BattleshipBoard from './Battleship/Battleship';
import DominoSearchBoard from './DominoSearch/DominoSearch';
import MagicSnailBoard from './MagicSnail/MagicSnail';
import SlovakSumsBoard from './SlovakSums/SlovakSums';
import KakuroBoard from './Kakuro/Kakuro';
import WolvesAndSheepBoard from './WolvesAndSheep/WolvesAndSheep';
import ShapeMinesweeperBoard from './ShapeMinesweeper/ShapeMinesweeper';
import CaveBoard from './Cave/Cave';
import JapaneseArrowsBoard from './JapaneseArrows/JapaneseArrows';
import FourWindsWithParksBoard from './FourWindsWithParks/FourWindsWithParks';
import FourWindsBoard from './FourWinds/FourWinds';
import ConsecutiveKakuroBoard from './ConsecutiveKakuro/ConsecutiveKakuro';
import JapaneseSumsBoard from './JapaneseSums/JapaneseSums';
import ABCBoxBoard from './ABCBox/ABCBox';
import ABCBoxExample from '../components/examples/ABCBoxExample';
import MagnetsBoard from './Magnets/Magnets';
import PillsBoard from './Pills/Pills';
import PlaceByProductBoard from './PlaceByProduct/PlaceByProduct';
import MasyuBoard from './Masyu/Masyu';
import MasyuExample from '../components/examples/MasyuExample';
import PlaceByProductExample from '../components/examples/PlaceByProductExample';
import NurikabeExample from '../components/examples/NurikabeExample';
import FillominoExample from '../components/examples/FillominoExample';
import YajilinExample from '../components/examples/YajilinExample';
import KoburinExample from '../components/examples/KoburinExample';
import NeighborExample from '../components/examples/NeighborExample';
import SkyNeighborExample from '../components/examples/SkyNeighborExample';
import StarbattleExample from '../components/examples/StarbattleExample';
import HeyawakeExample from '../components/examples/HeyawakeExample';
import AqreExample from '../components/examples/AqreExample';
import MintonetteExample from '../components/examples/MintonetteExample';
import NikojiExample from '../components/examples/NikojiExample';
import AkariExample from '../components/examples/AkariExample';
import KurarinExample from '../components/examples/KurarinExample';
import WalkwalkExample from '../components/examples/WalkwalkExample';
import AdditionalPuzzleExample from '../components/examples/AdditionalPuzzleExample';
import PlayableExample from '../components/examples/PlayableExample';
import SkyscrapersExample from '../components/examples/SkyscrapersExample';
import BattleshipExample from '../components/examples/BattleshipExample';
import { parsePuzzLink } from './Nurikabe/utils';
import { parseFillominoLink } from './Fillomino/utils';
import { parseYajilinLink } from './Yajilin/utils';
import { parseStarbattleLink } from './Starbattle/utils';
import { parseHeyawakeLink } from './Heyawake/utils';
import { parseAqreLink } from './Aqre/utils';
import { parseMintonetteLink } from './Mintonette/utils';
import { parseNikojiLink } from './Nikoji/utils';
import { parseAkariLink } from './Akari/utils';
import { parseKurarinLink } from './Kurarin/utils';
import { parseWalkwalkLink } from './Walkwalk/utils';
import { parseSlitherlinkLink } from './Slitherlink/utils';
import { parseLitsLink } from './Lits/utils';
import { parseLakesLink } from './Lakes/utils';
import { parseTapaLink } from './Tapa/utils';
import { parseYinYangLink } from './YinYang/utils';
import { parseKropkiLink } from './Kropki/utils';
import { parseMagicSummerLink } from './MagicSummer/utils';
import { parseSkyscrapersLink } from './Skyscrapers/utils';
import { parseBattleshipLink } from './Battleship/utils';
import { parseDominoSearchLink } from './DominoSearch/utils';
import { parseMagicSnailLink } from './MagicSnail/utils';
import { parseSlovakSumsLink } from './SlovakSums/utils';
import { normalizePuzzLinkDataPart } from './gridUtils';
import { boardLayoutMetrics } from './boardTheme';
import type {
  AqrePuzzleData,
  AkariPuzzleData,
  BattleshipPuzzleData,
  DominoSearchPuzzleData,
  FillominoPuzzleData,
  HeyawakePuzzleData,
  LakesPuzzleData,
  LitsPuzzleData,
  MagicSnailPuzzleData,
  MintonettePuzzleData,
  NikojiPuzzleData,
  NurikabePuzzleData,
  PuzzleData,
  PuzzleEntry,
  PuzzleTemplate,
  PuzzleType,
  StarbattlePuzzleData,
  KurarinPuzzleData,
  SlitherlinkPuzzleData,
  SlovakSumsPuzzleData,
  MagicSummerPuzzleData,
  SkyscrapersPuzzleData,
  TapaPuzzleData,
  WalkwalkPuzzleData,
  YajilinPuzzleData,
  KoburinPuzzleData,
  NeighborPuzzleData,
  NeighborDigit,
  SkyNeighborPuzzleData,
  KakuroPuzzleData,
  WolvesAndSheepPuzzleData,
  ShapeMinesweeperPuzzleData,
  CavePuzzleData,
  JapaneseArrowsPuzzleData,
  FourWindsWithParksPuzzleData,
  FourWindsPuzzleData,
  ConsecutiveKakuroPuzzleData,
  JapaneseSumsWithZeroesPuzzleData,
  ABCBoxPuzzleData,
  MagnetsPole,
  MagnetsPuzzleData,
  PillsPuzzleData,
  PlaceByProductPuzzleData,
  MasyuPuzzleData,
  YinYangPuzzleData,
  KropkiPuzzleData,
} from './types';
import type { Locale } from '@/i18n/types';
import TapaExample from '../components/examples/TapaExample';
import YinYangExample from '../components/examples/YinYangExample';
import KropkiExample from '../components/examples/KropkiExample';
import MagicSummerExample from '../components/examples/MagicSummerExample';
import KakuroExample from '../components/examples/KakuroExample';
import ShadingPuzzleExample from '../components/examples/ShadingPuzzleExample';
import { parseKakuroLink } from './Kakuro/utils';
import { parseWolvesAndSheepLink } from './WolvesAndSheep/utils';
import { parseKoburinLink } from './Koburin/utils';
import { parseNeighborLink, validateNeighbor } from './Neighbor/utils';
import {
  getSkyNeighborVisibilityClues,
  parseSkyNeighborLink,
  validateSkyNeighbor,
} from './SkyNeighbor/utils';
import { parseShapeMinesweeperLink, validateShapeMinesweeper } from './ShapeMinesweeper/utils';
import { parseCaveLink, validateCave } from './Cave/utils';
import { parseJapaneseArrowsLink } from './JapaneseArrows/utils';
import { parseFourWindsWithParksLink } from './FourWindsWithParks/utils';
import { parseFourWindsLink } from './FourWinds/utils';
import { parseConsecutiveKakuroLink } from './ConsecutiveKakuro/utils';
import { parseJapaneseSumsLink } from './JapaneseSums/utils';
import { parseABCBoxLink } from './ABCBox/utils';
import { parseMagnetsLink } from './Magnets/utils';
import { parsePillsLink } from './Pills/utils';
import { parsePlaceByProductLink } from './PlaceByProduct/utils';
import { parseMasyuLink } from './Masyu/utils';

const WALKWALK_EXAMPLE_LINK = 'https://luna5akura.github.io/Atol-Solver/p.html?walkwalk/5/5/8gh20v00l1g6m7l3g';
const walkwalkExamplePuzzle = parseWalkwalkLink(WALKWALK_EXAMPLE_LINK);

if (!walkwalkExamplePuzzle) {
  throw new Error('Failed to parse the built-in Walkwalk example puzzle.');
}

const MAGIC_SNAIL_EXAMPLE_LINK = 'https://luna5akura.github.io/Atol-Solver/p.html?magic-snail/5/5/3/zh.m2i1m3h';
const MAGIC_SNAIL_EXAMPLE_ANSWER_LINK =
  'https://luna5akura.github.io/Atol-Solver/p.html?magic-snail/5/5/3/z12.g33g12g2h31g321h13g2';
const magicSnailExamplePuzzle = parseMagicSnailLink(MAGIC_SNAIL_EXAMPLE_LINK);
const magicSnailExampleAnswer = parseMagicSnailLink(MAGIC_SNAIL_EXAMPLE_ANSWER_LINK);

if (!magicSnailExamplePuzzle || !magicSnailExampleAnswer) {
  throw new Error('Failed to parse the built-in Magic Snail example puzzle.');
}

const magicSnailExampleCorrectGrid = magicSnailExampleAnswer.cells.map((row) =>
  row.map((cell) => (typeof cell === 'number' ? cell : null))
);

const TAPA_EXAMPLE_LINK = 'http://localhost:8080/p.html?tapa/5/5/j1hbqoabh.j';
const tapaExamplePuzzle = parseTapaLink(TAPA_EXAMPLE_LINK);

if (!tapaExamplePuzzle) {
  throw new Error('Failed to parse the built-in Tapa example puzzle.');
}

const tapaExampleCorrectSolution: (0 | 1)[][] = [
  [1, 1, 1, 0, 0],
  [1, 0, 0, 1, 0],
  [1, 1, 0, 1, 1],
  [0, 1, 0, 0, 1],
  [0, 1, 1, 1, 1],
];

const yinYangExamplePuzzle: YinYangPuzzleData = {
  type: 'yinyang',
  width: 7,
  height: 7,
  givens: [
    [null, null, null, null, 1, null, null],
    [null, 1, null, 1, null, null, null],
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, 1, null],
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
  ],
};

const yinYangExampleCorrectSolution: (0 | 1)[][] = [
  [0, 0, 0, 0, 1, 0, 0],
  [0, 1, 0, 1, 1, 1, 0],
  [0, 1, 0, 0, 0, 1, 0],
  [0, 1, 0, 1, 0, 1, 0],
  [0, 1, 0, 1, 0, 1, 0],
  [0, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 0],
];

const kropkiExamplePuzzle: KropkiPuzzleData = {
  type: 'kropki',
  width: 4,
  height: 4,
  givens: [
    [1, null, null, null],
    [null, 2, null, null],
    [null, null, null, 3],
    [null, null, 2, null],
  ],
  verticalDots: [
    [null, 'white', 'white'],
    ['white', 'black', null],
    ['white', null, 'white'],
    ['white', 'white', 'white'],
  ],
  horizontalDots: [
    [null, 'black', null, 'black'],
    ['white', 'white', null, 'white'],
    ['black', null, 'black', null],
  ],
};

const kropkiExampleCorrectSolution: number[][] = [
  [1, 4, 3, 2],
  [3, 2, 1, 4],
  [2, 1, 4, 3],
  [4, 3, 2, 1],
];

const MAGIC_SUMMER_EXAMPLE_LINK =
  'http://localhost:8080/p.html?magic-summer/5/5/3/f-186f-7bk-18-21-21f-84k';
const magicSummerExamplePuzzle = parseMagicSummerLink(MAGIC_SUMMER_EXAMPLE_LINK);

if (!magicSummerExamplePuzzle) {
  throw new Error('Failed to parse the built-in Magic Summer example puzzle.');
}

const magicSummerExampleCorrectGrid: (number | null)[][] = [
  [1, null, 2, 3, null],
  [3, 2, null, null, 1],
  [null, 3, 1, null, 2],
  [2, null, null, 1, 3],
  [null, 1, 3, 2, null],
];

const SKYSCRAPERS_EXAMPLE_LINK = 'https://puzz.link/p?skyscrapers/4/4/k13h4j3g';
const skyscrapersExamplePuzzle = parseSkyscrapersLink(SKYSCRAPERS_EXAMPLE_LINK);

if (!skyscrapersExamplePuzzle) {
  throw new Error('Failed to parse the built-in Skyscrapers example puzzle.');
}

const skyscrapersExampleCorrectGrid = [
  [2, 1, 4, 3],
  [1, 2, 3, 4],
  [4, 3, 1, 2],
  [3, 4, 2, 1],
];

const BATTLESHIP_EXAMPLE_LINK = 'https://pzprxs.vercel.app/p?battleship/6/6/g12h2g30g3gk0r3w//c';
const battleshipExamplePuzzle = parseBattleshipLink(BATTLESHIP_EXAMPLE_LINK);

if (!battleshipExamplePuzzle) {
  throw new Error('Failed to parse the built-in Battleship example puzzle.');
}

const battleshipExampleCorrectSolution: (0 | 1)[][] = [
  [0, 0, 1, 0, 0, 0],
  [1, 0, 1, 0, 0, 1],
  [0, 0, 0, 0, 0, 0],
  [1, 1, 0, 0, 0, 0],
  [0, 0, 0, 1, 1, 1],
  [1, 0, 0, 0, 0, 0],
];

const kakuroExamplePuzzle: KakuroPuzzleData = {
  type: 'kakuro',
  width: 6,
  height: 6,
  cells: [
    [{ right: null, down: null }, { right: null, down: 7 }, { right: null, down: 13 }, { right: null, down: 16 }, { right: null, down: null }, { right: null, down: null }],
    [{ right: 10, down: null }, null, null, null, { right: null, down: 29 }, { right: null, down: null }],
    [{ right: 28, down: null }, null, null, null, null, { right: null, down: 6 }],
    [{ right: 4, down: null }, null, null, { right: 12, down: 4 }, null, null],
    [{ right: null, down: null }, { right: 11, down: null }, null, null, null, null],
    [{ right: null, down: null }, { right: null, down: null }, { right: 10, down: null }, null, null, null],
  ],
  topClues: [null, null, null, null, null, null],
  leftClues: [null, null, null, null, null, null],
};

const kakuroExampleCorrectGrid: (number | null)[][] = [
  [null, null, null, null, null, null],
  [null, 2, 1, 7, null, null],
  [null, 4, 7, 9, 8, null],
  [null, 1, 3, null, 9, 3],
  [null, null, 2, 3, 5, 1],
  [null, null, null, 1, 7, 2],
];

const wolvesAndSheepExamplePuzzle: WolvesAndSheepPuzzleData = {
  type: 'wolvesandsheepfences',
  width: 4,
  height: 4,
  clues: [
    [null, 1, null, 3],
    [null, 'sheep', 'wolf', null],
    [null, null, 0, null],
    [2, null, null, null],
  ],
};

// WPF Puzzle GP 2015 Round 4, puzzles 19 and 20. The competition PDF uses
// outlined gray cells and a small set of fixed digits; the compact links keep
// those source puzzles reproducible without depending on a remote service.
const NEIGHBOR_19_LINK =
  'neighbor/9/9/' +
  '............3.......2.......1...3.......2.......1...3.......2.......1............' +
  '/111111101001110001011110001110111111110000101101111001100001111110101001000110000';
const NEIGHBOR_20_LINK =
  'neighbor/9/9/' +
  '..........1.1...........2...1...........2...........3...2...........3.3..........' +
  '/110100100110111101001001100110000101110001100111101110110011001000111010100011100';
const neighbor19Puzzle = parseNeighborLink(NEIGHBOR_19_LINK);
const neighbor20Puzzle = parseNeighborLink(NEIGHBOR_20_LINK);

if (!neighbor19Puzzle || !neighbor20Puzzle) {
  throw new Error('Failed to parse the built-in Neighbor example puzzles.');
}

const neighbor19CorrectGrid: NeighborDigit[][] = [
  [1, 3, 2, 1, 3, 2, 1, 2, 3],
  [2, 2, 1, 3, 1, 3, 3, 2, 1],
  [2, 3, 2, 1, 3, 1, 1, 2, 3],
  [3, 1, 3, 2, 1, 3, 2, 1, 2],
  [1, 2, 3, 3, 2, 2, 1, 3, 1],
  [2, 1, 2, 1, 3, 1, 3, 3, 2],
  [3, 1, 1, 2, 2, 3, 2, 1, 3],
  [1, 2, 1, 3, 2, 1, 3, 3, 2],
  [3, 3, 3, 2, 1, 2, 2, 1, 1],
];

// Keep the built-in answer synchronized with the source PDF's rules.  This
// is intentionally evaluated when the registry is created so an accidental
// edit to the example cannot silently ship an impossible answer diagram.
if (!validateNeighbor(neighbor19CorrectGrid, neighbor19Puzzle).valid) {
  throw new Error('Built-in Neighbors example answer does not satisfy the PDF rules.');
}

// WPF Puzzle GP 2015 Round 4, puzzle 22 (Sky-neighbors). The outside clue
// cells are represented explicitly because they participate in the same
// white/gray adjacency rule as the 9×9 playable area.
const SKY_NEIGHBOR_22_LINK =
  'sky-neighbor/9/9/' +
  '..........1.............................2.............................3..........' +
  '/.G..GG.GG;GGGG.G...;.G.G...GG;.G..G..G.;.GG....G.;.G.G....G;.G.GGGG.G;GGG....GG;.G.G.GGGG/' +
  // The booklet leaves all 36 outside answer cells blank.  Visibility values
  // are calculated after the central grid is completed.
  '........./........./........./........./' +
  '010001111/010001111/011100010/001001111';
const skyNeighbor22Puzzle = parseSkyNeighborLink(SKY_NEIGHBOR_22_LINK);

if (!skyNeighbor22Puzzle) {
  throw new Error('Failed to parse the built-in Sky-neighbors example puzzle.');
}

const skyNeighbor22CorrectGrid: NeighborDigit[][] = [
  [2, 3, 2, 2, 1, 3, 1, 3, 1],
  [3, 1, 3, 1, 3, 2, 1, 2, 2],
  [1, 2, 1, 2, 3, 3, 2, 1, 3],
  [1, 3, 1, 3, 1, 2, 2, 3, 2],
  [3, 1, 2, 3, 2, 1, 3, 1, 2],
  [3, 2, 3, 1, 2, 1, 3, 2, 1],
  [2, 1, 3, 2, 1, 3, 1, 2, 3],
  [1, 2, 1, 3, 3, 2, 2, 3, 1],
  [2, 3, 2, 1, 2, 1, 3, 1, 3],
];

const skyNeighbor22Visibility = getSkyNeighborVisibilityClues(skyNeighbor22CorrectGrid);
if (!skyNeighbor22Visibility || !validateSkyNeighbor(
  skyNeighbor22CorrectGrid,
  skyNeighbor22Puzzle,
  skyNeighbor22Visibility
).valid) {
  throw new Error('Built-in Sky-neighbors example answer does not satisfy the PDF rules.');
}


const wolvesAndSheepExampleLoopEdges = [
  'h-0-0', 'h-0-1', 'h-0-2', 'h-0-3',
  'h-1-2', 'h-1-3',
  'h-2-1',
  'h-3-1',
  'h-4-0', 'h-4-1',
  'v-0-0', 'v-0-4',
  'v-1-0', 'v-1-2',
  'v-2-0', 'v-2-1',
  'v-3-0', 'v-3-2',
];

// WPF Puzzle GP 2015 Round 5 (PDF p. 9), Shape Minesweeper example bank.
const roundFiveShapes = [
  { label: 'T', cells: [[true, true, true], [false, true, false]] },
  { label: 'I', cells: [[true], [true], [true], [true]] },
  { label: 'O', cells: [[true, true], [true, true]] },
  { label: 'L', cells: [[true, false], [true, false], [true, true]] },
  { label: 'S', cells: [[false, true, true], [true, true, false]] },
] satisfies ShapeMinesweeperPuzzleData['shapes'];

const shapeMinesweeperExamplePuzzle: ShapeMinesweeperPuzzleData = {
  type: 'shape-minesweeper',
  width: 8,
  height: 8,
  clues: [
    [null, null, null, 0, null, null, null, null],
    [null, null, null, null, null, null, 4, null],
    [null, null, 2, null, null, null, null, null],
    [0, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, 2],
    [null, null, null, null, null, 0, null, null],
    [null, 3, null, null, null, null, null, null],
    [null, null, null, null, 0, null, null, null],
  ],
  shapes: roundFiveShapes,
};

const shapeMinesweeperExampleSolution: (0 | 1)[][] = [
  [1, 1, 0, 0, 0, 0, 0, 1],
  [1, 1, 0, 0, 0, 0, 0, 1],
  [0, 0, 0, 0, 1, 1, 0, 1],
  [0, 0, 0, 1, 1, 0, 0, 1],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 0, 0, 0, 1],
  [0, 0, 1, 0, 0, 0, 0, 1],
  [0, 0, 0, 0, 0, 0, 1, 1],
];

if (!validateShapeMinesweeper(
  shapeMinesweeperExampleSolution,
  shapeMinesweeperExamplePuzzle
).valid) {
  throw new Error('Built-in Shape Minesweeper example answer does not satisfy the PDF rules.');
}

const caveExamplePuzzle: CavePuzzleData = {
  type: 'cave',
  width: 5,
  height: 5,
  clues: [
    [null, 5, null, null, null],
    [null, null, null, null, 3],
    [null, null, 3, null, null],
    [7, null, null, null, null],
    [null, null, null, 3, null],
  ],
};

const caveExampleSolution: (0 | 1)[][] = [
  [0, 0, 0, 0, 0],
  [0, 1, 1, 1, 0],
  [0, 1, 0, 1, 0],
  [0, 0, 0, 1, 1],
  [0, 1, 0, 0, 0],
];

if (!validateCave(
  caveExampleSolution,
  caveExamplePuzzle,
).valid) {
  throw new Error('Built-in Cave example answer does not satisfy the Cave rules.');
}

interface PuzzleBoardProps<TPuzzle extends PuzzleData> {
  puzzle: TPuzzle;
  startTime: number;
  resetToken: number;
  onComplete: (time: number) => void;
  initialSnapshot?: unknown;
  onSnapshotChange?: (snapshot: unknown) => void;
}

interface PuzzleRegistryEntry<TPuzzle extends PuzzleData> {
  parsePuzzLink: (link: string) => TPuzzle | null;
  template: PuzzleTemplate;
  renderBoard: (props: PuzzleBoardProps<TPuzzle>) => ReactElement;
  renderExample: (template: PuzzleTemplate, locale: Locale) => ReactElement;
}

type PuzzleRegistry = {
  nurikabe: PuzzleRegistryEntry<NurikabePuzzleData>;
  fillomino: PuzzleRegistryEntry<FillominoPuzzleData>;
  yajilin: PuzzleRegistryEntry<YajilinPuzzleData>;
  koburin: PuzzleRegistryEntry<KoburinPuzzleData>;
  neighbor: PuzzleRegistryEntry<NeighborPuzzleData>;
  'sky-neighbor': PuzzleRegistryEntry<SkyNeighborPuzzleData>;
  starbattle: PuzzleRegistryEntry<StarbattlePuzzleData>;
  heyawake: PuzzleRegistryEntry<HeyawakePuzzleData>;
  aqre: PuzzleRegistryEntry<AqrePuzzleData>;
  mintonette: PuzzleRegistryEntry<MintonettePuzzleData>;
  nikoji: PuzzleRegistryEntry<NikojiPuzzleData>;
  akari: PuzzleRegistryEntry<AkariPuzzleData>;
  kurarin: PuzzleRegistryEntry<KurarinPuzzleData>;
  walkwalk: PuzzleRegistryEntry<WalkwalkPuzzleData>;
  slither: PuzzleRegistryEntry<SlitherlinkPuzzleData>;
  lits: PuzzleRegistryEntry<LitsPuzzleData>;
  lakes: PuzzleRegistryEntry<LakesPuzzleData>;
  tapa: PuzzleRegistryEntry<TapaPuzzleData>;
  'magic-summer': PuzzleRegistryEntry<MagicSummerPuzzleData>;
  skyscrapers: PuzzleRegistryEntry<SkyscrapersPuzzleData>;
  battleship: PuzzleRegistryEntry<BattleshipPuzzleData>;
  'domino-search': PuzzleRegistryEntry<DominoSearchPuzzleData>;
  snail: PuzzleRegistryEntry<MagicSnailPuzzleData>;
  'slovak-sums': PuzzleRegistryEntry<SlovakSumsPuzzleData>;
  kakuro: PuzzleRegistryEntry<KakuroPuzzleData>;
  wolvesandsheepfences: PuzzleRegistryEntry<WolvesAndSheepPuzzleData>;
  'shape-minesweeper': PuzzleRegistryEntry<ShapeMinesweeperPuzzleData>;
  cave: PuzzleRegistryEntry<CavePuzzleData>;
  'japanese-arrows': PuzzleRegistryEntry<JapaneseArrowsPuzzleData>;
  'four-winds-with-parks': PuzzleRegistryEntry<FourWindsWithParksPuzzleData>;
  fourwinds: PuzzleRegistryEntry<FourWindsPuzzleData>;
  'consecutive-kakuro': PuzzleRegistryEntry<ConsecutiveKakuroPuzzleData>;
  'japanese-sums-with-zeroes': PuzzleRegistryEntry<JapaneseSumsWithZeroesPuzzleData>;
  'abc-box': PuzzleRegistryEntry<ABCBoxPuzzleData>;
  magnets: PuzzleRegistryEntry<MagnetsPuzzleData>;
  pills: PuzzleRegistryEntry<PillsPuzzleData>;
  'place-by-product': PuzzleRegistryEntry<PlaceByProductPuzzleData>;
  masyu: PuzzleRegistryEntry<MasyuPuzzleData>;
  yinyang: PuzzleRegistryEntry<YinYangPuzzleData>;
  kropki: PuzzleRegistryEntry<KropkiPuzzleData>;
};

export const puzzleRegistry: PuzzleRegistry = {
  nurikabe: {
    parsePuzzLink,
    template: {
      type: 'nurikabe',
      name: {
        'zh-CN': '数墙',
        en: 'Nurikabe',
      },
      rulesTitle: {
        'zh-CN': '规则',
        en: 'Rules',
      },
      rules: {
        'zh-CN': [
          '涂黑一些空格，使得所有涂黑的格子连通成一个整体，且没有全部涂黑的2×2结构。',
          '每一组连通的留白格必须恰好包含一个数字。',
          '数字表示其所在的留白的连通组格数。',
        ],
        en: [
          'Shade some cells so that all shaded cells form one connected area, and no 2×2 block is fully shaded.',
          'Each orthogonally connected white area must contain exactly one number.',
          'A number gives the size of the white area that contains it.',
        ],
      },
      exampleTitle: {
        'zh-CN': '例题（5×5）',
        en: 'Example (5×5)',
      },
      playableLabel: {
        'zh-CN': '题面',
        en: 'Puzzle',
      },
      answerLabel: {
        'zh-CN': '正确答案',
        en: 'Answer',
      },
      example: {
        puzzleType: 'nurikabe',
        width: 5,
        height: 5,
        clues: [
          { row: 0, col: 0, value: '?' },
          { row: 2, col: 0, value: 3 },
          { row: 4, col: 1, value: 1 },
          { row: 3, col: 4, value: 5 },
        ],
        correctSolution: [
          [0, 0, 0, 1, 1],
          [1, 1, 1, 1, 0],
          [0, 0, 0, 1, 0],
          [1, 1, 1, 1, 0],
          [1, 0, 1, 0, 0],
        ],
      },
    },
    renderBoard: ({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange }) => (
      <NurikabeBoard
        puzzle={puzzle}
        startTime={startTime}
        resetToken={resetToken}
        onComplete={onComplete}
        initialSnapshot={initialSnapshot}
        onSnapshotChange={onSnapshotChange}
      />
    ),
    renderExample: (template, locale) => {
      const example = template.example;
      if (example.puzzleType !== 'nurikabe') {
        throw new Error('Nurikabe template example type mismatch.');
      }

      return (
        <PlayableExample
          example={example}
          playableLabel={template.playableLabel[locale]}
          answerLabel={template.answerLabel[locale]}
          fixedCellSize={boardLayoutMetrics.exampleCellSize}
          answer={<NurikabeExample width={example.width} height={example.height} clues={example.clues} correctSolution={example.correctSolution} />}
          renderBoard={({ puzzle, startTime, onComplete }) => (
            <NurikabeBoard puzzle={puzzle as NurikabePuzzleData} startTime={startTime} resetToken={0} onComplete={onComplete} />
          )}
        />
      );
    },
  },
  fillomino: {
    parsePuzzLink: (link) => parseFillominoLink(link),
    template: {
      type: 'fillomino',
      name: {
        'zh-CN': '码牌',
        en: 'Fillomino',
      },
      rulesTitle: {
        'zh-CN': '规则',
        en: 'Rules',
      },
      rules: {
        'zh-CN': [
          '沿虚格线把盘面分成若干个区域，使得任意两个相邻的区域面积都不同。',
          '数字表示其所在区域的面积。',
        ],
        en: [
          'Divide the grid into regions along the dotted boundaries so that no two adjacent regions have the same size.',
          'A number gives the size of the region that contains it.',
        ],
      },
      exampleTitle: {
        'zh-CN': '例题（6×6）',
        en: 'Example (6×6)',
      },
      playableLabel: {
        'zh-CN': '题面',
        en: 'Puzzle',
      },
      answerLabel: {
        'zh-CN': '正确答案',
        en: 'Answer',
      },
      example: {
        puzzleType: 'fillomino',
        width: 6,
        height: 6,
        cluesGrid: [
          [null, null, 4, null, null, null],
          [null, 5, 3, null, 2, null],
          [null, null, null, null, 5, 2],
          [3, 3, null, null, null, null],
          [null, 2, null, 1, 4, null],
          [null, null, null, 3, null, null],
        ],
        correctGrid: [
          [5, 5, 4, 4, 4, 4],
          [5, 5, 3, 2, 2, 1],
          [3, 5, 3, 3, 5, 2],
          [3, 3, 5, 5, 5, 2],
          [2, 2, 5, 1, 4, 4],
          [1, 3, 3, 3, 4, 4],
        ],
      },
    },
    renderBoard: ({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange }) => (
      <FillominoBoard
        puzzle={puzzle}
        startTime={startTime}
        resetToken={resetToken}
        onComplete={onComplete}
        initialSnapshot={initialSnapshot}
        onSnapshotChange={onSnapshotChange}
      />
    ),
    renderExample: (template, locale) => {
      const example = template.example;
      if (example.puzzleType !== 'fillomino') {
        throw new Error('Fillomino template example type mismatch.');
      }

      return (
        <PlayableExample
          example={example}
          playableLabel={template.playableLabel[locale]}
          answerLabel={template.answerLabel[locale]}
          fixedCellSize={boardLayoutMetrics.exampleCellSize}
          answer={<FillominoExample width={example.width} height={example.height} cluesGrid={example.cluesGrid} correctGrid={example.correctGrid} />}
          renderBoard={({ puzzle, startTime, onComplete, fixedCellSize }) => (
            <FillominoBoard puzzle={puzzle as FillominoPuzzleData} startTime={startTime} resetToken={0} onComplete={onComplete} fixedCellSize={fixedCellSize} />
          )}
        />
      );
    },
  },
  yajilin: {
    parsePuzzLink: parseYajilinLink,
    template: {
      type: 'yajilin',
      name: {
        'zh-CN': '仙人指路',
        en: 'Yajilin',
      },
      rulesTitle: {
        'zh-CN': '规则',
        en: 'Rules',
      },
      rules: {
        'zh-CN': [
          '涂黑一些空格，并在其余所有非线索格中画一条回路。',
          '回路不能分叉或交叉，涂黑的格子不能相邻。',
          '带数字或问号的箭头格不能被涂黑，也不属于回路。',
          '数字表示箭头方向上涂黑格的个数；问号只表示方向。',
        ],
        en: [
          'Shade some cells and draw a single loop through all remaining non-clue cells.',
          'The loop cannot branch or cross, and shaded cells cannot touch orthogonally.',
          'Arrow cells with a number or question mark cannot be shaded and are not part of the loop.',
          'A number gives the count of shaded cells in the arrow direction, while a question mark gives only the direction.',
        ],
      },
      exampleTitle: {
        'zh-CN': '例题（5×5）',
        en: 'Example (5×5)',
      },
      playableLabel: {
        'zh-CN': '题面',
        en: 'Puzzle',
      },
      answerLabel: {
        'zh-CN': '正确答案',
        en: 'Answer',
      },
      example: {
        puzzleType: 'yajilin',
        width: 5,
        height: 5,
        clues: [
          { row: 0, col: 0, direction: 'right', value: 2 },
          { row: 3, col: 2, direction: 'left', value: 0 },
          { row: 4, col: 0, direction: 'up', value: 1 },
        ],
        shadedCells: [
          { row: 0, col: 1 },
          { row: 0, col: 4 },
          { row: 1, col: 0 },
          { row: 2, col: 2 },
        ],
        loopEdges: [
          { r1: 0, c1: 2, r2: 0, c2: 3 },
          { r1: 1, c1: 1, r2: 1, c2: 2 },
          { r1: 1, c1: 3, r2: 1, c2: 4 },
          { r1: 2, c1: 0, r2: 2, c2: 1 },
          { r1: 2, c1: 3, r2: 2, c2: 4 },
          { r1: 3, c1: 0, r2: 3, c2: 1 },
          { r1: 3, c1: 3, r2: 3, c2: 4 },
          { r1: 4, c1: 1, r2: 4, c2: 2 },
          { r1: 4, c1: 2, r2: 4, c2: 3 },
          { r1: 4, c1: 3, r2: 4, c2: 4 },
          { r1: 0, c1: 2, r2: 1, c2: 2 },
          { r1: 0, c1: 3, r2: 1, c2: 3 },
          { r1: 1, c1: 1, r2: 2, c2: 1 },
          { r1: 1, c1: 4, r2: 2, c2: 4 },
          { r1: 2, c1: 0, r2: 3, c2: 0 },
          { r1: 2, c1: 3, r2: 3, c2: 3 },
          { r1: 3, c1: 1, r2: 4, c2: 1 },
          { r1: 3, c1: 4, r2: 4, c2: 4 },
        ],
      },
    },
    renderBoard: ({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange }) => (
      <YajilinBoard
        puzzle={puzzle}
        startTime={startTime}
        resetToken={resetToken}
        onComplete={onComplete}
        initialSnapshot={initialSnapshot}
        onSnapshotChange={onSnapshotChange}
      />
    ),
    renderExample: (template, locale) => {
      const example = template.example;
      if (example.puzzleType !== 'yajilin') {
        throw new Error('Yajilin template example type mismatch.');
      }

      return (
        <YajilinExample
          width={example.width}
          height={example.height}
          clues={example.clues}
          shadedCells={example.shadedCells}
          loopEdges={example.loopEdges}
          crossedEdges={example.crossedEdges}
          playableLabel={template.playableLabel[locale]}
          answerLabel={template.answerLabel[locale]}
        />
      );
    },
  },
  koburin: {
    parsePuzzLink: parseKoburinLink,
    template: {
      type: 'koburin',
      name: {
        'zh-CN': '仙人指邻',
        en: 'Koburin',
      },
      rulesTitle: {
        'zh-CN': '规则',
        en: 'Rules',
      },
      rules: {
        'zh-CN': [
          '画一条横平竖直地经过一些空格中心且不和自身交叉的单一回路，并把未经过的空格涂黑。',
          '涂黑的格子不能正交相邻；带数字或问号的格子不能涂黑，也不属于回路。',
          '数字表示与此格正交相邻的黑格数量；问号表示数量未知。',
        ],
        en: [
          'Shade some cells and draw one non-branching, non-crossing loop through every remaining non-clue cell.',
          'Shaded cells cannot be orthogonally adjacent. Numbered and question-mark cells are neither shaded nor part of the loop.',
          'A number gives the count of shaded orthogonal neighbours; a question mark leaves that count unknown.',
        ],
      },
      exampleTitle: {
        'zh-CN': '例题（9×9）',
        en: 'Example (9×9)',
      },
      playableLabel: {
        'zh-CN': '题面',
        en: 'Puzzle',
      },
      answerLabel: {
        'zh-CN': '正确答案',
        en: 'Answer',
      },
      example: {
        puzzleType: 'koburin',
        width: 9,
        height: 9,
        clues: [
          { row: 1, col: 2, value: 3 }, { row: 1, col: 4, value: 3 }, { row: 1, col: 6, value: 3 },
          { row: 2, col: 1, value: 3 }, { row: 2, col: 3, value: 4 }, { row: 2, col: 5, value: 4 }, { row: 2, col: 7, value: 3 },
          { row: 3, col: 2, value: 4 }, { row: 3, col: 4, value: 4 }, { row: 3, col: 6, value: 4 },
          { row: 4, col: 1, value: 3 }, { row: 4, col: 3, value: 4 }, { row: 4, col: 5, value: 4 }, { row: 4, col: 7, value: 3 },
          { row: 5, col: 2, value: 4 }, { row: 5, col: 4, value: 4 }, { row: 5, col: 6, value: 4 },
          { row: 6, col: 1, value: 3 }, { row: 6, col: 3, value: 4 }, { row: 6, col: 5, value: 4 }, { row: 6, col: 7, value: 3 },
          { row: 7, col: 2, value: 3 }, { row: 7, col: 4, value: 3 }, { row: 7, col: 6, value: 3 },
        ],
        shadedCells: [
          { row: 1, col: 1 }, { row: 1, col: 3 }, { row: 1, col: 5 }, { row: 1, col: 7 },
          { row: 2, col: 2 }, { row: 2, col: 4 }, { row: 2, col: 6 },
          { row: 3, col: 1 }, { row: 3, col: 3 }, { row: 3, col: 5 }, { row: 3, col: 7 },
          { row: 4, col: 2 }, { row: 4, col: 4 }, { row: 4, col: 6 },
          { row: 5, col: 1 }, { row: 5, col: 3 }, { row: 5, col: 5 }, { row: 5, col: 7 },
          { row: 6, col: 2 }, { row: 6, col: 4 }, { row: 6, col: 6 },
          { row: 7, col: 1 }, { row: 7, col: 3 }, { row: 7, col: 5 }, { row: 7, col: 7 },
        ],
        loopEdges: [
          { r1: 0, c1: 0, r2: 0, c2: 1 }, { r1: 0, c1: 1, r2: 0, c2: 2 },
          { r1: 0, c1: 2, r2: 0, c2: 3 }, { r1: 0, c1: 3, r2: 0, c2: 4 },
          { r1: 0, c1: 4, r2: 0, c2: 5 }, { r1: 0, c1: 5, r2: 0, c2: 6 },
          { r1: 0, c1: 6, r2: 0, c2: 7 }, { r1: 0, c1: 7, r2: 0, c2: 8 },
          { r1: 0, c1: 8, r2: 1, c2: 8 }, { r1: 1, c1: 8, r2: 2, c2: 8 },
          { r1: 2, c1: 8, r2: 3, c2: 8 }, { r1: 3, c1: 8, r2: 4, c2: 8 },
          { r1: 4, c1: 8, r2: 5, c2: 8 }, { r1: 5, c1: 8, r2: 6, c2: 8 },
          { r1: 6, c1: 8, r2: 7, c2: 8 }, { r1: 7, c1: 8, r2: 8, c2: 8 },
          { r1: 8, c1: 8, r2: 8, c2: 7 }, { r1: 8, c1: 7, r2: 8, c2: 6 },
          { r1: 8, c1: 6, r2: 8, c2: 5 }, { r1: 8, c1: 5, r2: 8, c2: 4 },
          { r1: 8, c1: 4, r2: 8, c2: 3 }, { r1: 8, c1: 3, r2: 8, c2: 2 },
          { r1: 8, c1: 2, r2: 8, c2: 1 }, { r1: 8, c1: 1, r2: 8, c2: 0 },
          { r1: 8, c1: 0, r2: 7, c2: 0 }, { r1: 7, c1: 0, r2: 6, c2: 0 },
          { r1: 6, c1: 0, r2: 5, c2: 0 }, { r1: 5, c1: 0, r2: 4, c2: 0 },
          { r1: 4, c1: 0, r2: 3, c2: 0 }, { r1: 3, c1: 0, r2: 2, c2: 0 },
          { r1: 2, c1: 0, r2: 1, c2: 0 }, { r1: 1, c1: 0, r2: 0, c2: 0 },
        ],
      },
    },
    renderBoard: ({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange }) => (
      <KoburinBoard
        puzzle={puzzle}
        startTime={startTime}
        resetToken={resetToken}
        onComplete={onComplete}
        initialSnapshot={initialSnapshot}
        onSnapshotChange={onSnapshotChange}
      />
    ),
    renderExample: (template, locale) => {
      const example = template.example;
      if (example.puzzleType !== 'koburin') {
        throw new Error('Koburin template example type mismatch.');
      }

      return (
        <KoburinExample
          width={example.width}
          height={example.height}
          clues={example.clues}
          shadedCells={example.shadedCells}
          loopEdges={example.loopEdges}
          crossedEdges={example.crossedEdges}
          playableLabel={template.playableLabel[locale]}
          answerLabel={template.answerLabel[locale]}
        />
      );
    },
  },
  neighbor: {
    parsePuzzLink: parseNeighborLink,
    template: {
      type: 'neighbor',
      name: {
        'zh-CN': '邻居',
        en: 'Neighbors',
      },
      rulesTitle: {
        'zh-CN': '规则',
        en: 'Rules',
      },
      rules: {
        'zh-CN': [
          '在每个格子中填入 1、2 或 3，每格一个数字，使每行、每列中每个数字恰好出现三次。部分数字已预先给出。',
          '填完后，每个白格必须沿边至少接触一个与自身数字相同的格子。',
          '每个灰色（带框）格子沿边不能接触任何与自身数字相同的格子。',
        ],
        en: [
          'Place one of the digits 1, 2, or 3 into every cell. Each digit must appear exactly three times in every row and column; some digits are given.',
          'Every white cell must touch at least one orthogonally adjacent cell containing the same digit.',
          'A gray (outlined) cell may not touch any orthogonally adjacent cell containing the same digit.',
        ],
      },
      exampleTitle: {
        'zh-CN': '例题',
        en: 'Example (9×9, WPF Puzzle GP 2015 Round 4)',
      },
      playableLabel: {
        'zh-CN': '题面',
        en: 'Puzzle',
      },
      answerLabel: {
        'zh-CN': '正确答案',
        en: 'Answer',
      },
      example: {
        puzzleType: 'neighbor',
        width: neighbor19Puzzle.width,
        height: neighbor19Puzzle.height,
        givens: neighbor19Puzzle.givens,
        grayCells: neighbor19Puzzle.grayCells,
        correctGrid: neighbor19CorrectGrid,
      },
    },
    renderBoard: ({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange }) => (
      <NeighborBoard
        puzzle={puzzle}
        startTime={startTime}
        resetToken={resetToken}
        onComplete={onComplete}
        initialSnapshot={initialSnapshot}
        onSnapshotChange={onSnapshotChange}
      />
    ),
    renderExample: (template, locale) => {
      const example = template.example;
      if (example.puzzleType !== 'neighbor') {
        throw new Error('Neighbor template example type mismatch.');
      }

      return (
        <NeighborExample
          width={example.width}
          height={example.height}
          givens={example.givens}
          grayCells={example.grayCells}
          correctGrid={example.correctGrid}
          playableLabel={template.playableLabel[locale]}
          answerLabel={template.answerLabel[locale]}
        />
      );
    },
  },
  'sky-neighbor': {
    parsePuzzLink: parseSkyNeighborLink,
    template: {
      type: 'sky-neighbor',
      name: {
        'zh-CN': '摩天邻居',
        en: 'Sky-neighbors',
      },
      rulesTitle: {
        'zh-CN': '规则',
        en: 'Rules',
      },
      rules: {
        'zh-CN': [
          '在 9×9 大盘的每个格子中填入 1、2 或 3，使每行、每列中每个数字恰好出现三次。部分数字已预先给出。',
          '每个白格必须沿边至少接触一个与自身数字相同的格子；每个灰色（带框）格子沿边不能接触同号格。外围格也遵守这条邻接规则。',
          '9×9 大盘中的数字代表高度为 1、2、3 的摩天楼；盘面外四边的格子填写从对应方向看到的楼数，等高或更矮的楼会被前面的楼遮挡。',
        ],
        en: [
          'Place one of the digits 1, 2, or 3 into every cell of the large 9×9 box. Each digit appears exactly three times in every row and column; some digits are given.',
          'Every white cell, including an outside cell, must touch an orthogonally adjacent cell with the same number. A gray (outlined) cell may not touch an orthogonally adjacent cell with the same number.',
          'The digits in the large box are skyscraper heights. Fill the outside cells with the number of skyscrapers visible from that direction; a skyscraper hides equal or shorter skyscrapers behind it.',
        ],
      },
      exampleTitle: {
        'zh-CN': '例题（9×9）',
        en: 'Example (9×9 Sky-neighbors, WPF Puzzle GP 2015 Round 4)',
      },
      playableLabel: {
        'zh-CN': '题面',
        en: 'Puzzle',
      },
      answerLabel: {
        'zh-CN': '正确答案',
        en: 'Answer',
      },
      example: {
        puzzleType: 'sky-neighbor',
        width: skyNeighbor22Puzzle.width,
        height: skyNeighbor22Puzzle.height,
        givens: skyNeighbor22Puzzle.givens,
        grayCells: skyNeighbor22Puzzle.grayCells,
        clues: skyNeighbor22Puzzle.clues,
        outsideGrayCells: skyNeighbor22Puzzle.outsideGrayCells,
        correctGrid: skyNeighbor22CorrectGrid,
      },
    },
    renderBoard: ({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange }) => (
      <SkyNeighborBoard
        puzzle={puzzle}
        startTime={startTime}
        resetToken={resetToken}
        onComplete={onComplete}
        initialSnapshot={initialSnapshot}
        onSnapshotChange={onSnapshotChange}
      />
    ),
    renderExample: (template, locale) => {
      const example = template.example;
      if (example.puzzleType !== 'sky-neighbor') {
        throw new Error('Sky-neighbors template example type mismatch.');
      }

      return (
        <SkyNeighborExample
          width={example.width}
          height={example.height}
          givens={example.givens}
          grayCells={example.grayCells}
          clues={example.clues}
          outsideGrayCells={example.outsideGrayCells}
          correctGrid={example.correctGrid}
          playableLabel={template.playableLabel[locale]}
          answerLabel={template.answerLabel[locale]}
        />
      );
    },
  },
  starbattle: {
    parsePuzzLink: parseStarbattleLink,
    template: {
      type: 'starbattle',
      name: {
        'zh-CN': '星战',
        en: 'Star Battle',
      },
      rulesTitle: {
        'zh-CN': '规则',
        en: 'Rules',
      },
      rules: {
        'zh-CN': [
          '在一些格子内放置一颗星，使得每行、列、区域内的星数等于盘面外给出的数字。',
          '任意两颗星不能放在互相接触的格子内。',
        ],
        en: [
          'Place stars in some cells so that no two stars touch horizontally, vertically, or diagonally.',
          'The number in the upper-right means each row, each column, and each bold-bordered region must contain exactly that many stars.',
        ],
      },
      exampleTitle: {
        'zh-CN': '例题（5×5）',
        en: 'Example (5×5)',
      },
      playableLabel: {
        'zh-CN': '题面',
        en: 'Puzzle',
      },
      answerLabel: {
        'zh-CN': '正确答案',
        en: 'Answer',
      },
      example: {
        puzzleType: 'starbattle',
        width: 5,
        height: 5,
        starsPerUnit: 1,
        regionIds: [
          [0, 0, 0, 0, 1],
          [0, 0, 2, 2, 2],
          [3, 2, 2, 2, 2],
          [3, 2, 2, 4, 4],
          [3, 3, 4, 4, 4],
        ],
        starCells: [
          { row: 0, col: 4 },
          { row: 1, col: 1 },
          { row: 2, col: 3 },
          { row: 3, col: 0 },
          { row: 4, col: 2 },
        ],
      },
    },
    renderBoard: ({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange }) => (
      <StarbattleBoard
        puzzle={puzzle}
        startTime={startTime}
        resetToken={resetToken}
        onComplete={onComplete}
        initialSnapshot={initialSnapshot}
        onSnapshotChange={onSnapshotChange}
      />
    ),
    renderExample: (template, locale) => {
      const example = template.example;
      if (example.puzzleType !== 'starbattle') {
        throw new Error('Starbattle template example type mismatch.');
      }

      return (
        <StarbattleExample
          type="starbattle"
          width={example.width}
          height={example.height}
          starsPerUnit={example.starsPerUnit}
          regionIds={example.regionIds}
          starCells={example.starCells}
          playableLabel={template.playableLabel[locale]}
          answerLabel={template.answerLabel[locale]}
        />
      );
    },
  },
  heyawake: {
    parsePuzzLink: parseHeyawakeLink,
    template: {
      type: 'heyawake',
      name: {
        'zh-CN': '数间',
        en: 'Heyawake',
      },
      rulesTitle: {
        'zh-CN': '规则',
        en: 'Rules',
      },
      rules: {
        'zh-CN': [
          '盘面被划分为若干区域。涂黑一些格子，涂黑的格子之间不能横竖相邻。',
          '数字表示此区域内涂黑格的个数。',
          '任意一段横或纵的连续留白格不能穿过两个或更多区域边界。',
          '所有留白的格子必须连通成一个整体。',
        ],
        en: [
          'The board is divided into rooms. Shade some cells, and shaded cells cannot touch horizontally or vertically.',
          'In a numbered room, the number gives the total count of shaded cells in that room.',
          'No horizontal or vertical run of unshaded cells may pass through two or more room borders.',
          'All unshaded cells on the board must form one orthogonally connected area.',
        ],
      },
      exampleTitle: {
        'zh-CN': '例题（5×5）',
        en: 'Example (5×5)',
      },
      playableLabel: {
        'zh-CN': '题面',
        en: 'Puzzle',
      },
      answerLabel: {
        'zh-CN': '正确答案',
        en: 'Answer',
      },
      example: {
        puzzleType: 'heyawake',
        width: 5,
        height: 5,
        regionIds: [
          [0, 0, 0, 1, 1],
          [2, 2, 3, 1, 1],
          [2, 2, 3, 1, 1],
          [2, 2, 3, 4, 4],
          [5, 5, 5, 4, 4],
        ],
        clues: [
          { row: 0, col: 0, value: 2 },
          { row: 1, col: 0, value: 0 },
          { row: 4, col: 0, value: 1 },
        ],
        correctSolution: [
          [1, 0, 1, 0, 0],
          [0, 0, 0, 1, 0],
          [0, 0, 1, 0, 0],
          [0, 0, 0, 1, 0],
          [0, 1, 0, 0, 0],
        ],
      },
    },
    renderBoard: ({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange }) => (
      <HeyawakeBoard
        puzzle={puzzle}
        startTime={startTime}
        resetToken={resetToken}
        onComplete={onComplete}
        initialSnapshot={initialSnapshot}
        onSnapshotChange={onSnapshotChange}
      />
    ),
    renderExample: (template, locale) => {
      const example = template.example;
      if (example.puzzleType !== 'heyawake') {
        throw new Error('Heyawake template example type mismatch.');
      }

      return (
        <HeyawakeExample
          width={example.width}
          height={example.height}
          regionIds={example.regionIds}
          clues={example.clues}
          correctSolution={example.correctSolution}
          playableLabel={template.playableLabel[locale]}
          answerLabel={template.answerLabel[locale]}
        />
      );
    },
  },
  aqre: {
    parsePuzzLink: parseAqreLink,
    template: {
      type: 'aqre',
      name: {
        'zh-CN': '黑白无四',
        en: 'Aqre',
      },
      rulesTitle: {
        'zh-CN': '规则',
        en: 'Rules',
      },
      rules: {
        'zh-CN': [
          '盘面被划分为若干区域。涂黑一些格子。',
          '数字表示此区域内涂黑格的个数。',
          '任意横或纵的连续段中，涂黑格或留白格都不能达到 4 个或更多。',
          '所有涂黑的格子必须连通成一个整体。',
        ],
        en: [
          'The board is divided into rooms. Shade some cells on the board.',
          'In a numbered room, the number gives the total count of shaded cells in that room.',
          'There may not be a horizontal or vertical run of 4 or more consecutive shaded cells or 4 or more consecutive unshaded cells.',
          'All shaded cells on the board must form one orthogonally connected area.',
        ],
      },
      exampleTitle: {
        'zh-CN': '例题（6×6）',
        en: 'Example (6×6)',
      },
      playableLabel: {
        'zh-CN': '题面',
        en: 'Puzzle',
      },
      answerLabel: {
        'zh-CN': '正确答案',
        en: 'Answer',
      },
      example: {
        puzzleType: 'aqre',
        width: 6,
        height: 6,
        regionIds: [
          [0, 1, 1, 1, 2, 2],
          [0, 0, 1, 1, 1, 3],
          [0, 0, 4, 4, 3, 3],
          [5, 0, 4, 4, 3, 3],
          [5, 6, 6, 6, 3, 7],
          [6, 6, 6, 8, 8, 8],
        ],
        clues: [
          { row: 0, col: 0, value: 6 },
          { row: 0, col: 1, value: 0 },
          { row: 1, col: 5, value: 4 },
          { row: 2, col: 2, value: 3 },
          { row: 4, col: 1, value: 4 },
          { row: 5, col: 3, value: 0 },
        ],
        correctSolution: [
          [1, 0, 0, 0, 1, 1],
          [1, 1, 0, 0, 0, 1],
          [1, 1, 0, 1, 1, 1],
          [0, 1, 1, 1, 0, 0],
          [0, 0, 1, 1, 1, 0],
          [0, 1, 1, 0, 0, 0],
        ],
      },
    },
    renderBoard: ({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange }) => (
      <AqreBoard
        puzzle={puzzle}
        startTime={startTime}
        resetToken={resetToken}
        onComplete={onComplete}
        initialSnapshot={initialSnapshot}
        onSnapshotChange={onSnapshotChange}
      />
    ),
    renderExample: (template, locale) => {
      const example = template.example;
      if (example.puzzleType !== 'aqre') {
        throw new Error('Aqre template example type mismatch.');
      }

      return (
        <AqreExample
          width={example.width}
          height={example.height}
          regionIds={example.regionIds}
          clues={example.clues}
          correctSolution={example.correctSolution}
          playableLabel={template.playableLabel[locale]}
          answerLabel={template.answerLabel[locale]}
        />
      );
    },
  },
  mintonette: {
    parsePuzzLink: parseMintonetteLink,
    template: {
      type: 'mintonette',
      name: {
        'zh-CN': '数弯',
        en: 'Mintonette',
      },
      rulesTitle: {
        'zh-CN': '规则',
        en: 'Rules',
      },
      rules: {
        'zh-CN': [
          '用横平竖直地经过格子中心的路径把圆圈两两连接配对，使得每个圈都恰好属于一对。',
          '路径不能和自身或互相交叉，包括在端点交叉。',
          '每个格子必须恰好有一条路径经过。',
          '圆圈里的数字表示其路径转弯的次数。',
        ],
        en: [
          'Draw lines between circles to form pairs.',
          'Lines cannot cross or overlap each other.',
          'A number indicates the amount of turns the line must take before reaching the end. Circles without numbers can be used as any number.',
          'All cells must be used by a line.',
        ],
      },
      exampleTitle: {
        'zh-CN': '例题（5×5）',
        en: 'Example (5×5)',
      },
      playableLabel: {
        'zh-CN': '题面',
        en: 'Puzzle',
      },
      answerLabel: {
        'zh-CN': '正确答案',
        en: 'Answer',
      },
      example: {
        puzzleType: 'mintonette',
        width: 5,
        height: 5,
        clues: [
          { row: 0, col: 0, value: 0 },
          { row: 0, col: 2, value: 0 },
          { row: 0, col: 4, value: null },
          { row: 1, col: 4, value: null },
          { row: 2, col: 3, value: 2 },
          { row: 2, col: 4, value: null },
          { row: 3, col: 2, value: 1 },
          { row: 4, col: 0, value: 3 },
          { row: 4, col: 3, value: 2 },
          { row: 4, col: 4, value: 1 },
        ],
        solutionEdges: [
          { r1: 0, c1: 0, r2: 0, c2: 1 },
          { r1: 0, c1: 1, r2: 0, c2: 2 },
          { r1: 0, c1: 3, r2: 0, c2: 4 },
          { r1: 1, c1: 0, r2: 1, c2: 1 },
          { r1: 1, c1: 1, r2: 1, c2: 2 },
          { r1: 1, c1: 2, r2: 1, c2: 3 },
          { r1: 2, c1: 1, r2: 2, c2: 2 },
          { r1: 2, c1: 2, r2: 2, c2: 3 },
          { r1: 3, c1: 2, r2: 3, c2: 3 },
          { r1: 0, c1: 3, r2: 1, c2: 3 },
          { r1: 1, c1: 0, r2: 2, c2: 0 },
          { r1: 1, c1: 4, r2: 2, c2: 4 },
          { r1: 2, c1: 0, r2: 3, c2: 0 },
          { r1: 2, c1: 1, r2: 3, c2: 1 },
          { r1: 3, c1: 0, r2: 4, c2: 0 },
          { r1: 3, c1: 1, r2: 4, c2: 1 },
          { r1: 3, c1: 3, r2: 3, c2: 4 },
          { r1: 4, c1: 1, r2: 4, c2: 2 },
          { r1: 4, c1: 2, r2: 4, c2: 3 },
          { r1: 3, c1: 4, r2: 4, c2: 4 },
        ],
      },
    },
    renderBoard: ({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange }) => (
      <MintonetteBoard
        puzzle={puzzle}
        startTime={startTime}
        resetToken={resetToken}
        onComplete={onComplete}
        initialSnapshot={initialSnapshot}
        onSnapshotChange={onSnapshotChange}
      />
    ),
    renderExample: (template, locale) => {
      const example = template.example;
      if (example.puzzleType !== 'mintonette') {
        throw new Error('Mintonette template example type mismatch.');
      }

      return (
        <MintonetteExample
          width={example.width}
          height={example.height}
          clues={example.clues}
          solutionEdges={example.solutionEdges}
          crossedEdges={example.crossedEdges}
          playableLabel={template.playableLabel[locale]}
          answerLabel={template.answerLabel[locale]}
        />
      );
    },
  },
  nikoji: {
    parsePuzzLink: parseNikojiLink,
    template: {
      type: 'nikoji',
      name: {
        'zh-CN': '异同分割',
        en: 'NIKOJI',
      },
      rulesTitle: {
        'zh-CN': '规则',
        en: 'Rules',
      },
      rules: {
        'zh-CN': [
          '沿虚格线把盘面分成若干个区域，使得每个区域恰好包含一个字母。',
          '包含相同字母的区域必须平移全等，包括字母在区域内的相对位置。',
          '包含不同字母的区域不能以任何方式全等。',
        ],
        en: [
          'Divide the grid into regions, and each region must contain exactly one letter.',
          'Regions with the same letter must be identical in shape and orientation, and the letter must appear in the same relative position.',
          'Regions with different letters must have different shapes, even after rotation or reflection.',
        ],
      },
      exampleTitle: {
        'zh-CN': '例题（6×6）',
        en: 'Example (6×6)',
      },
      playableLabel: {
        'zh-CN': '题面',
        en: 'Puzzle',
      },
      answerLabel: {
        'zh-CN': '正确答案',
        en: 'Answer',
      },
      example: {
        puzzleType: 'nikoji',
        width: 4,
        height: 4,
        letters: [
          [null, null, null, 'A'],
          ['B', null, 'A', null],
          ['C', null, null, null],
          ['C', 'B', null, 'D'],
        ],
        solutionRegionIds: [
          [0, 0, 1, 1],
          [0, 2, 2, 3],
          [4, 5, 5, 3],
          [6, 5, 3, 3],
        ],
      },
    },
    renderBoard: ({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange }) => (
      <NikojiBoard
        puzzle={puzzle}
        startTime={startTime}
        resetToken={resetToken}
        onComplete={onComplete}
        initialSnapshot={initialSnapshot}
        onSnapshotChange={onSnapshotChange}
      />
    ),
    renderExample: (template, locale) => {
      const example = template.example;
      if (example.puzzleType !== 'nikoji') {
        throw new Error('Nikoji template example type mismatch.');
      }

      return (
        <NikojiExample
          width={example.width}
          height={example.height}
          letters={example.letters}
          solutionRegionIds={example.solutionRegionIds}
          playableLabel={template.playableLabel[locale]}
          answerLabel={template.answerLabel[locale]}
        />
      );
    },
  },
  akari: {
    parsePuzzLink: parseAkariLink,
    template: {
      type: 'akari',
      name: {
        'zh-CN': '美术馆',
        en: 'Akari',
      },
      rulesTitle: {
        'zh-CN': '规则',
        en: 'Rules',
      },
      rules: {
        'zh-CN': [
          '在一些空格内放置灯泡，以照亮所有空格。灯泡可以照亮自身以及横竖方向上直到被黑格阻挡为止的所有空格。',
          '任意两个灯泡不能互相照亮。',
          '黑格里的数字表示与之相邻的（至多）四格中的灯泡个数。',
        ],
        en: [
          'Place lights in some empty cells so that every non-black cell is illuminated. A light illuminates its own cell and all cells seen horizontally or vertically until blocked by a black cell.',
          'Lights may not illuminate each other.',
          'A number in a black cell gives the exact number of lights in the up to four orthogonally adjacent cells.',
        ],
      },
      exampleTitle: {
        'zh-CN': '例题（5×5）',
        en: 'Example (5×5)',
      },
      playableLabel: {
        'zh-CN': '题面',
        en: 'Puzzle',
      },
      answerLabel: {
        'zh-CN': '正确答案',
        en: 'Answer',
      },
      example: {
        puzzleType: 'akari',
        width: 5,
        height: 5,
        cells: [
          [0, null, null, null, 2],
          [null, null, null, null, null],
          [null, 'black', null, null, 'black'],
          [3, null, 'black', null, null],
          [null, null, null, 1, null],
        ],
        bulbCells: [
          { row: 0, col: 3 },
          { row: 1, col: 4 },
          { row: 2, col: 0 },
          { row: 2, col: 2 },
          { row: 3, col: 1 },
          { row: 4, col: 0 },
          { row: 4, col: 4 },
        ],
      },
    },
    renderBoard: ({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange }) => (
      <AkariBoard
        puzzle={puzzle}
        startTime={startTime}
        resetToken={resetToken}
        onComplete={onComplete}
        initialSnapshot={initialSnapshot}
        onSnapshotChange={onSnapshotChange}
      />
    ),
    renderExample: (template, locale) => {
      const example = template.example;
      if (example.puzzleType !== 'akari') {
        throw new Error('Akari template example type mismatch.');
      }

      return (
        <AkariExample
          width={example.width}
          height={example.height}
          cells={example.cells}
          bulbCells={example.bulbCells}
          playableLabel={template.playableLabel[locale]}
          answerLabel={template.answerLabel[locale]}
        />
      );
    },
  },
  kurarin: {
    parsePuzzLink: parseKurarinLink,
    template: {
      type: 'kurarin',
      name: {
        'zh-CN': '黑暗回路',
        en: 'Kurarin',
      },
      rulesTitle: {
        'zh-CN': '规则',
        en: 'Rules',
      },
      rules: {
        'zh-CN': [
          '涂黑一些格子，并在其余所有留白格中画一条回路。',
          '回路不能分叉或与自身交叉。',
          '黑色圆圈接触的格子中涂黑格多于留白格。',
          '白色圆圈接触的格子中留白格多于涂黑格。',
          '灰色圆圈接触的格子中涂黑格与留白格一样多。',
        ],
        en: [
          'Shade some cells and draw a single loop through all remaining unshaded cells.',
          'The loop cannot branch or cross itself.',
          'A black circle overlaps more shaded cells than unshaded cells.',
          'A white circle overlaps more unshaded cells than shaded cells.',
          'A gray circle overlaps the same number of shaded and unshaded cells.',
        ],
      },
      exampleTitle: {
        'zh-CN': '例题（5×5）',
        en: 'Example (5×5)',
      },
      playableLabel: {
        'zh-CN': '题面',
        en: 'Puzzle',
      },
      answerLabel: {
        'zh-CN': '正确答案',
        en: 'Answer',
      },
      example: {
        puzzleType: 'kurarin',
        width: 5,
        height: 5,
        clues: [
          { row: 1, col: 1, color: 'black' },
          { row: 1, col: 5, color: 'gray' },
          { row: 1, col: 8, color: 'black' },
          { row: 3, col: 7, color: 'white' },
          { row: 4, col: 3, color: 'gray' },
          { row: 6, col: 7, color: 'white' },
          { row: 7, col: 0, color: 'black' },
          { row: 7, col: 2, color: 'white' },
          { row: 8, col: 5, color: 'gray' },
        ],
        shadedCells: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 0, col: 2 },
          { row: 0, col: 3 },
          { row: 0, col: 4 },
          { row: 1, col: 0 },
          { row: 1, col: 4 },
          { row: 2, col: 0 },
          { row: 2, col: 2 },
          { row: 3, col: 0 },
          { row: 4, col: 0 },
          { row: 4, col: 3 },
          { row: 4, col: 4 },
        ],
        loopEdges: [
          { r1: 1, c1: 1, r2: 1, c2: 2 },
          { r1: 1, c1: 2, r2: 1, c2: 3 },
          { r1: 2, c1: 3, r2: 2, c2: 4 },
          { r1: 3, c1: 2, r2: 3, c2: 3 },
          { r1: 3, c1: 3, r2: 3, c2: 4 },
          { r1: 4, c1: 1, r2: 4, c2: 2 },
          { r1: 1, c1: 1, r2: 2, c2: 1 },
          { r1: 1, c1: 3, r2: 2, c2: 3 },
          { r1: 2, c1: 1, r2: 3, c2: 1 },
          { r1: 2, c1: 4, r2: 3, c2: 4 },
          { r1: 3, c1: 1, r2: 4, c2: 1 },
          { r1: 3, c1: 2, r2: 4, c2: 2 },
        ],
      },
    },
    renderBoard: ({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange }) => (
      <KurarinBoard
        puzzle={puzzle}
        startTime={startTime}
        resetToken={resetToken}
        onComplete={onComplete}
        initialSnapshot={initialSnapshot}
        onSnapshotChange={onSnapshotChange}
      />
    ),
    renderExample: (template, locale) => {
      const example = template.example;
      if (example.puzzleType !== 'kurarin') {
        throw new Error('Kurarin template example type mismatch.');
      }

      return (
        <KurarinExample
          width={example.width}
          height={example.height}
          clues={example.clues}
          shadedCells={example.shadedCells}
          loopEdges={example.loopEdges}
          crossedEdges={example.crossedEdges}
          playableLabel={template.playableLabel[locale]}
          answerLabel={template.answerLabel[locale]}
        />
      );
    },
  },
  walkwalk: {
    parsePuzzLink: parseWalkwalkLink,
    template: {
      type: 'walkwalk',
      name: {
        'zh-CN': '数行',
        en: 'Walkwalk',
      },
      rulesTitle: {
        'zh-CN': '规则',
        en: 'Rules',
      },
      rules: {
        'zh-CN': [
          '画出一条经过所有数字的单一回路。',
          '回路不能分叉，也不能自交；没有数字的格子可以经过，也可以不经过。',
          '数字表示经过该数字的那一段回路，在所属区域内连续经过的格子数量。',
        ],
        en: [
          'Draw a single loop that passes through every number.',
          'The loop cannot branch or cross itself. Non-numbered cells may be used or left unused.',
          'A number gives the amount of consecutive loop cells in that region on the segment passing through the clue.',
        ],
      },
      exampleTitle: {
        'zh-CN': '例题（5×5）',
        en: 'Example (5×5)',
      },
      playableLabel: {
        'zh-CN': '题面',
        en: 'Puzzle',
      },
      answerLabel: {
        'zh-CN': '正确答案',
        en: 'Answer',
      },
      example: {
        puzzleType: 'walkwalk',
        width: walkwalkExamplePuzzle.width,
        height: walkwalkExamplePuzzle.height,
        regionIds: walkwalkExamplePuzzle.regionIds,
        clues: walkwalkExamplePuzzle.clues,
        solutionEdges: [
          { r1: 0, c1: 0, r2: 0, c2: 1 },
          { r1: 0, c1: 1, r2: 0, c2: 2 },
          { r1: 0, c1: 2, r2: 0, c2: 3 },
          { r1: 0, c1: 3, r2: 0, c2: 4 },
          { r1: 1, c1: 1, r2: 1, c2: 2 },
          { r1: 1, c1: 2, r2: 1, c2: 3 },
          { r1: 1, c1: 3, r2: 1, c2: 4 },
          { r1: 2, c1: 1, r2: 2, c2: 2 },
          { r1: 2, c1: 2, r2: 2, c2: 3 },
          { r1: 3, c1: 1, r2: 3, c2: 2 },
          { r1: 4, c1: 0, r2: 4, c2: 1 },
          { r1: 4, c1: 2, r2: 4, c2: 3 },
          { r1: 0, c1: 0, r2: 1, c2: 0 },
          { r1: 0, c1: 4, r2: 1, c2: 4 },
          { r1: 1, c1: 0, r2: 2, c2: 0 },
          { r1: 1, c1: 1, r2: 2, c2: 1 },
          { r1: 2, c1: 0, r2: 3, c2: 0 },
          { r1: 2, c1: 3, r2: 3, c2: 3 },
          { r1: 3, c1: 0, r2: 4, c2: 0 },
          { r1: 3, c1: 1, r2: 4, c2: 1 },
          { r1: 3, c1: 2, r2: 4, c2: 2 },
          { r1: 3, c1: 3, r2: 4, c2: 3 },
        ],
      },
    },
    renderBoard: ({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange }) => (
      <WalkwalkBoard
        puzzle={puzzle}
        startTime={startTime}
        resetToken={resetToken}
        onComplete={onComplete}
        initialSnapshot={initialSnapshot}
        onSnapshotChange={onSnapshotChange}
      />
    ),
    renderExample: (template, locale) => {
      const example = template.example;
      if (example.puzzleType !== 'walkwalk') {
        throw new Error('Walkwalk template example type mismatch.');
      }

      return (
        <WalkwalkExample
          width={example.width}
          height={example.height}
          regionIds={example.regionIds}
          clues={example.clues}
          solutionEdges={example.solutionEdges}
          crossedEdges={example.crossedEdges}
          playableLabel={template.playableLabel[locale]}
          answerLabel={template.answerLabel[locale]}
        />
      );
    },
  },
  slither: {
    parsePuzzLink: parseSlitherlinkLink,
    template: {
      type: 'slither',
      name: {
        'zh-CN': '数回',
        en: 'Slitherlink',
      },
      rulesTitle: {
        'zh-CN': '规则',
        en: 'Rules',
      },
      rules: {
        'zh-CN': [
          '沿格子边画线，形成一条回路。',
          '回路不能分叉或与自身交叉。',
          '数字表示此格四条边中被回路经过的边数。',
        ],
        en: [
          'Draw lines along cell edges to form one single loop.',
          'The loop cannot branch or cross itself.',
          'A number gives how many of the four edges around that cell are used by the loop.',
        ],
      },
      exampleTitle: {
        'zh-CN': '例题（4×4）',
        en: 'Example (4×4)',
      },
      playableLabel: {
        'zh-CN': '题面',
        en: 'Puzzle',
      },
      answerLabel: {
        'zh-CN': '正确答案',
        en: 'Answer',
      },
      example: {
        puzzleType: 'slither',
        width: 4,
        height: 4,
        clues: [
          [null, 2, 2, null],
          [1, null, null, 3],
          [0, null, null, 3],
          [null, 0, 1, null],
        ],
        loopEdges: [
          'h-0-2', 'h-0-3', 'h-1-1', 'h-1-3', 'h-2-1', 'h-2-3', 'h-3-2', 'h-3-3',
          'v-0-2', 'v-0-4', 'v-1-1', 'v-1-3', 'v-2-2', 'v-2-4',
        ],
      },
    },
    renderBoard: ({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange }) => (
      <SlitherlinkBoard
        puzzle={puzzle}
        startTime={startTime}
        resetToken={resetToken}
        onComplete={onComplete}
        initialSnapshot={initialSnapshot}
        onSnapshotChange={onSnapshotChange}
      />
    ),
    renderExample: (template, locale) => {
      const example = template.example;
      if (example.puzzleType !== 'slither') {
        throw new Error('Slitherlink template example type mismatch.');
      }

      return (
        <AdditionalPuzzleExample
          example={example}
          playableLabel={template.playableLabel[locale]}
          answerLabel={template.answerLabel[locale]}
        />
      );
    },
  },
  lits: {
    parsePuzzLink: parseLitsLink,
    template: {
      type: 'lits',
      name: {
        'zh-CN': '四格骨墙',
        en: 'LITS',
      },
      rulesTitle: {
        'zh-CN': '规则',
        en: 'Rules',
      },
      rules: {
        'zh-CN': [
          '在每个区域中涂黑一个四格骨牌（由四个涂黑格组成的连通块）。',
          '所有涂黑的格子必须连通成一个整体，且没有全部涂黑的 2×2 结构。',
          '两个相邻的四格骨牌不能形状全等（旋转和翻转视为相同）。',
        ],
        en: [
          'Place one tetromino, a connected block of four shaded cells, in every outlined region.',
          'All shaded cells must be orthogonally connected, and no 2×2 block may be fully shaded.',
          'Two edge-adjacent tetrominoes cannot have the same shape, counting rotations and reflections as the same.',
        ],
      },
      exampleTitle: {
        'zh-CN': '例题（4×4）',
        en: 'Example (4×4)',
      },
      playableLabel: {
        'zh-CN': '题面',
        en: 'Puzzle',
      },
      answerLabel: {
        'zh-CN': '正确答案',
        en: 'Answer',
      },
      example: {
        puzzleType: 'lits',
        width: 4,
        height: 4,
        regionIds: [
          [0, 0, 1, 1],
          [0, 0, 1, 2],
          [0, 1, 1, 2],
          [2, 2, 2, 2],
        ],
        correctSolution: [
          [1, 0, 1, 1],
          [1, 1, 1, 0],
          [1, 0, 1, 0],
          [1, 1, 1, 1],
        ],
      },
    },
    renderBoard: ({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange }) => (
      <LitsBoard
        puzzle={puzzle}
        startTime={startTime}
        resetToken={resetToken}
        onComplete={onComplete}
        initialSnapshot={initialSnapshot}
        onSnapshotChange={onSnapshotChange}
      />
    ),
    renderExample: (template, locale) => {
      const example = template.example;
      if (example.puzzleType !== 'lits') {
        throw new Error('LITS template example type mismatch.');
      }

      return (
        <AdditionalPuzzleExample
          example={example}
          playableLabel={template.playableLabel[locale]}
          answerLabel={template.answerLabel[locale]}
        />
      );
    },
  },
  lakes: {
    parsePuzzLink: parseLakesLink,
    template: {
      type: 'lakes',
      name: {
        'zh-CN': '湖泊',
        en: 'Lakes',
      },
      rulesTitle: {
        'zh-CN': '规则',
        en: 'Rules',
      },
      rules: {
        'zh-CN': [
          '涂黑一些格子，把其余白格分成若干个正交连通的湖区。',
          '每个湖区必须恰好包含一个线索格。',
          '数字表示其所在湖区的格数；问号表示大小未知。',
        ],
        en: [
          'Shade some cells so that the remaining white cells form orthogonally connected lake areas.',
          'Each lake area must contain exactly one clue cell.',
          'A number gives the size of its lake area; a question mark leaves the size unspecified.',
        ],
      },
      exampleTitle: {
        'zh-CN': '例题（5×5）',
        en: 'Example (5×5)',
      },
      playableLabel: {
        'zh-CN': '题面',
        en: 'Puzzle',
      },
      answerLabel: {
        'zh-CN': '正确答案',
        en: 'Answer',
      },
      example: {
        puzzleType: 'lakes',
        width: 5,
        height: 5,
        clues: [
          { row: 0, col: 1, value: 1 },
          { row: 0, col: 4, value: 3 },
          { row: 1, col: 2, value: 4 },
          { row: 2, col: 0, value: 5 },
          { row: 4, col: 3, value: 2 },
        ],
        correctSolution: [
          [1, 0, 1, 0, 0],
          [0, 1, 0, 1, 0],
          [0, 1, 0, 0, 1],
          [0, 1, 0, 1, 1],
          [0, 0, 1, 0, 0],
        ],
      },
    },
    renderBoard: ({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange }) => (
      <LakesBoard
        puzzle={puzzle}
        startTime={startTime}
        resetToken={resetToken}
        onComplete={onComplete}
        initialSnapshot={initialSnapshot}
        onSnapshotChange={onSnapshotChange}
      />
    ),
    renderExample: (template, locale) => {
      const example = template.example;
      if (example.puzzleType !== 'lakes') {
        throw new Error('Lakes template example type mismatch.');
      }

      return (
        <AdditionalPuzzleExample
          example={example}
          playableLabel={template.playableLabel[locale]}
          answerLabel={template.answerLabel[locale]}
        />
      );
    },
  },
  tapa: {
    parsePuzzLink: parseTapaLink,
    template: {
      type: 'tapa',
      name: {
        'zh-CN': '土派回路',
        en: 'Tapa',
      },
      rulesTitle: {
        'zh-CN': '规则',
        en: 'Rules',
      },
      rules: {
        'zh-CN': [
          '涂黑一些空格，使得所有涂黑格连成一个整体，且不能出现2×2全黑区域。',
          '线索格不能涂黑；线索中的数字表示周围八格中每一段连续黑格的长度，顺序不限。',
          '问号可代表任意正整数；如果线索格中只有一个问号，也允许周围没有黑格。',
        ],
        en: [
          'Shade cells so that all shaded cells form one orthogonally connected area, with no fully shaded 2×2 block.',
          'Clue cells cannot be shaded. Their numbers give the lengths of the consecutive shaded runs around the eight neighboring cells, in any order.',
          'A question mark can represent any positive length; a lone question mark can also represent no shaded neighbors.',
        ],
      },
      exampleTitle: {
        'zh-CN': '例题（5×5）',
        en: 'Example (5×5)',
      },
      playableLabel: {
        'zh-CN': '题面',
        en: 'Puzzle',
      },
      answerLabel: {
        'zh-CN': '正确答案',
        en: 'Answer',
      },
      example: {
        puzzleType: 'tapa',
        width: tapaExamplePuzzle.width,
        height: tapaExamplePuzzle.height,
        clues: tapaExamplePuzzle.clues,
        correctSolution: tapaExampleCorrectSolution,
      },
    },
    renderBoard: ({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange }) => (
      <TapaBoard
        puzzle={puzzle}
        startTime={startTime}
        resetToken={resetToken}
        onComplete={onComplete}
        initialSnapshot={initialSnapshot}
        onSnapshotChange={onSnapshotChange}
      />
    ),
    renderExample: (template, locale) => {
      const example = template.example;
      if (example.puzzleType !== 'tapa') {
        throw new Error('Tapa template example type mismatch.');
      }

      return (
        <PlayableExample
          example={example}
          playableLabel={template.playableLabel[locale]}
          answerLabel={template.answerLabel[locale]}
          fixedCellSize={boardLayoutMetrics.loopExampleCellSize}
          answer={<TapaExample width={example.width} height={example.height} clues={example.clues} correctSolution={example.correctSolution} />}
          renderBoard={({ puzzle, startTime, onComplete, fixedCellSize }) => (
            <TapaBoard puzzle={puzzle as TapaPuzzleData} startTime={startTime} resetToken={0} onComplete={onComplete} fixedCellSize={fixedCellSize} showValidationMessage />
          )}
        />
      );
    },
  },
  'magic-summer': {
    parsePuzzLink: parseMagicSummerLink,
    template: {
      type: 'magic-summer',
      name: {
        'zh-CN': '魔夏',
        en: 'Magic Summer',
      },
      rulesTitle: {
        'zh-CN': '规则',
        en: 'Rules',
      },
      rules: {
        'zh-CN': [
          '在一些空格里填一个属于给出的列表中的数码，使得每个数码在每行和每列都恰好出现一次。',
          '盘面外的数字表示此行或此列中所有数码组成的数字之和，其中每一段多个连续的有数码的格子从左到右或从上到下形成一个多位数。',
          '有一些数码可能已经放入了盘面。有叉标记的格子不能填数。',
        ],
        en: [
          'Fill cells with digits from the given list so that every digit appears exactly once in each row and column.',
          'An outside clue gives the sum of the multi-digit numbers formed by each consecutive run of filled cells in that row or column.',
          'Crossed cells cannot contain digits, and some digits may already be given.',
        ],
      },
      exampleTitle: {
        'zh-CN': '例题（5×5）',
        en: 'Example (5×5)',
      },
      playableLabel: {
        'zh-CN': '题面',
        en: 'Puzzle',
      },
      answerLabel: {
        'zh-CN': '正确答案',
        en: 'Answer',
      },
      example: {
        puzzleType: 'magic-summer',
        width: magicSummerExamplePuzzle.width,
        height: magicSummerExamplePuzzle.height,
        numbers: magicSummerExamplePuzzle.numbers,
        rowSums: magicSummerExamplePuzzle.rowSums,
        columnSums: magicSummerExamplePuzzle.columnSums,
        clues: magicSummerExamplePuzzle.clues,
        cells: magicSummerExamplePuzzle.cells,
        correctGrid: magicSummerExampleCorrectGrid,
      },
    },
    renderBoard: ({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange }) => (
      <MagicSummerBoard
        puzzle={puzzle}
        startTime={startTime}
        resetToken={resetToken}
        onComplete={onComplete}
        initialSnapshot={initialSnapshot}
        onSnapshotChange={onSnapshotChange}
      />
    ),
    renderExample: (template, locale) => {
      const example = template.example;
      if (example.puzzleType !== 'magic-summer') {
        throw new Error('Magic Summer template example type mismatch.');
      }

      return (
        <PlayableExample
          example={example}
          playableLabel={template.playableLabel[locale]}
          answerLabel={template.answerLabel[locale]}
          fixedCellSize={boardLayoutMetrics.exampleCellSize}
          answer={<MagicSummerExample width={example.width} height={example.height} cells={example.cells} rowSums={example.rowSums} columnSums={example.columnSums} correctGrid={example.correctGrid} />}
          renderBoard={({ puzzle, startTime, onComplete, fixedCellSize }) => (
            <MagicSummerBoard puzzle={puzzle as MagicSummerPuzzleData} startTime={startTime} resetToken={0} onComplete={onComplete} fixedCellSize={fixedCellSize} showValidationMessage />
          )}
        />
      );
    },
  },
  skyscrapers: {
    parsePuzzLink: parseSkyscrapersLink,
    template: {
      type: 'skyscrapers',
      name: {
        'zh-CN': '摩天楼',
        en: 'Skyscrapers',
      },
      rulesTitle: {
        'zh-CN': '规则',
        en: 'Rules',
      },
      rules: {
        'zh-CN': [
          '在每个空格中填入 1 到 N 的数字，使每行和每列都不能重复数字。',
          '每个数字代表对应高度的摩天楼；盘面外的数字表示从该方向能看到的摩天楼数量。',
          '从某个方向观察时，较高的摩天楼会遮挡其后较矮的摩天楼；空格不会遮挡视线。',
        ],
        en: [
          'Fill every cell with a number from 1 to N so that numbers do not repeat in any row or column.',
          'Each number represents a building height; an outside clue gives the number of buildings visible from that side.',
          'A taller building blocks shorter buildings behind it, while empty cells do not block the view.',
        ],
      },
      exampleTitle: {
        'zh-CN': '例题（4×4）',
        en: 'Example (4×4)',
      },
      playableLabel: {
        'zh-CN': '题面',
        en: 'Puzzle',
      },
      answerLabel: {
        'zh-CN': '正确答案',
        en: 'Answer',
      },
      example: {
        puzzleType: 'skyscrapers',
        width: skyscrapersExamplePuzzle.width,
        height: skyscrapersExamplePuzzle.height,
        numbers: skyscrapersExamplePuzzle.numbers,
        clues: skyscrapersExamplePuzzle.clues,
        correctGrid: skyscrapersExampleCorrectGrid,
      },
    },
    renderBoard: ({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange }) => (
      <SkyscrapersBoard
        puzzle={puzzle}
        startTime={startTime}
        resetToken={resetToken}
        onComplete={onComplete}
        initialSnapshot={initialSnapshot}
        onSnapshotChange={onSnapshotChange}
      />
    ),
    renderExample: (template, locale) => {
      const example = template.example;
      if (example.puzzleType !== 'skyscrapers') {
        throw new Error('Skyscrapers template example type mismatch.');
      }

      return (
        <PlayableExample
          example={example}
          playableLabel={template.playableLabel[locale]}
          answerLabel={template.answerLabel[locale]}
          fixedCellSize={boardLayoutMetrics.exampleCellSize}
          outsideClueSides={2}
          answer={<SkyscrapersExample width={example.width} height={example.height} clues={example.clues} correctGrid={example.correctGrid} />}
          renderBoard={({ puzzle, startTime, onComplete, fixedCellSize }) => (
            <SkyscrapersBoard puzzle={puzzle as SkyscrapersPuzzleData} startTime={startTime} resetToken={0} onComplete={onComplete} fixedCellSize={fixedCellSize} showValidationMessage />
          )}
        />
      );
    },
  },
  battleship: {
    parsePuzzLink: parseBattleshipLink,
    template: {
      type: 'battleship',
      name: {
        'zh-CN': '战舰',
        en: 'Battleships',
      },
      rulesTitle: {
        'zh-CN': '规则',
        en: 'Rules',
      },
      rules: {
        'zh-CN': [
          '把舰队中的所有船放入盘面；船可以旋转或镜像，每艘船必须恰好使用一次，且不能出现舰队之外的船形。',
          '任意两艘不同的船不能横向、纵向或斜向接触。',
          '盘面外的数字表示对应行或列内有船的格数。',
          '盘面中可能给出带方向的船段、形状未知的灰色船段或单格船；水波符号所在格不能放船。',
        ],
        en: [
          'Place every ship from the fleet into the grid. Ships may be rotated or mirrored, every ship must be used exactly once, and no extra ship shapes are allowed.',
          'Two different ships cannot touch horizontally, vertically, or diagonally.',
          'A number outside the grid gives the number of ship cells in that row or column.',
          'Some oriented ship segments, gray segments of unknown shape, or single-cell ships may be given. A cell marked with water cannot contain a ship.',
        ],
      },
      exampleTitle: {
        'zh-CN': '例题（6×6）',
        en: 'Example (6×6)',
      },
      playableLabel: {
        'zh-CN': '题面',
        en: 'Puzzle',
      },
      answerLabel: {
        'zh-CN': '正确答案',
        en: 'Answer',
      },
      example: {
        puzzleType: 'battleship',
        width: battleshipExamplePuzzle.width,
        height: battleshipExamplePuzzle.height,
        columnClues: battleshipExamplePuzzle.columnClues,
        rowClues: battleshipExamplePuzzle.rowClues,
        cellClues: battleshipExamplePuzzle.cellClues,
        fleet: battleshipExamplePuzzle.fleet,
        correctSolution: battleshipExampleCorrectSolution,
      },
    },
    renderBoard: ({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange }) => (
      <BattleshipBoard
        puzzle={puzzle}
        startTime={startTime}
        resetToken={resetToken}
        onComplete={onComplete}
        initialSnapshot={initialSnapshot}
        onSnapshotChange={onSnapshotChange}
      />
    ),
    renderExample: (template, locale) => {
      const example = template.example;
      if (example.puzzleType !== 'battleship') {
        throw new Error('Battleship template example type mismatch.');
      }

      return (
        <PlayableExample
          example={example}
          playableLabel={template.playableLabel[locale]}
          answerLabel={template.answerLabel[locale]}
          fixedCellSize={boardLayoutMetrics.compactExampleCellSize}
          answer={<BattleshipExample width={example.width} height={example.height} columnClues={example.columnClues} rowClues={example.rowClues} cellClues={example.cellClues} fleet={example.fleet} correctSolution={example.correctSolution} />}
          renderBoard={({ puzzle, startTime, onComplete, fixedCellSize }) => (
            <BattleshipBoard puzzle={puzzle as BattleshipPuzzleData} startTime={startTime} resetToken={0} onComplete={onComplete} fixedCellSize={fixedCellSize} showValidationMessage />
          )}
        />
      );
    },
  },
  'domino-search': {
    parsePuzzLink: parseDominoSearchLink,
    template: {
      type: 'domino-search',
      name: {
        'zh-CN': '多米诺搜寻',
        en: 'Domino Search',
      },
      rulesTitle: {
        'zh-CN': '规则',
        en: 'Rules',
      },
      rules: {
        'zh-CN': [
          '把盘面分成若干个 1×2 或 2×1 的多米诺。',
          '每个格子必须恰好属于一个多米诺。',
          '每个多米诺覆盖的两个数字必须对应目标列表中的一个数对，并且每个目标数对必须恰好使用一次。',
        ],
        en: [
          'Divide the grid into 1×2 or 2×1 dominoes.',
          'Every cell must belong to exactly one domino.',
          'The two numbers covered by each domino must match one target pair, and every target pair must be used exactly once.',
        ],
      },
      exampleTitle: {
        'zh-CN': '例题（5×4）',
        en: 'Example (5×4)',
      },
      playableLabel: {
        'zh-CN': '题面',
        en: 'Puzzle',
      },
      answerLabel: {
        'zh-CN': '正确答案',
        en: 'Answer',
      },
      example: {
        puzzleType: 'domino-search',
        width: 5,
        height: 4,
        numbers: [
          [0, 1, 2, 1, 0],
          [0, 2, 2, 1, 0],
          [1, 3, 2, 3, 1],
          [3, 3, 0, 3, 2],
        ],
        dominoes: [[0, 0], [0, 1], [0, 2], [0, 3], [1, 1], [1, 2], [1, 3], [2, 2], [2, 3], [3, 3]],
        solutionEdges: [
          { r1: 0, c1: 0, r2: 0, c2: 1 },
          { r1: 0, c1: 2, r2: 1, c2: 2 },
          { r1: 0, c1: 3, r2: 1, c2: 3 },
          { r1: 0, c1: 4, r2: 1, c2: 4 },
          { r1: 1, c1: 0, r2: 1, c2: 1 },
          { r1: 2, c1: 0, r2: 3, c2: 0 },
          { r1: 2, c1: 1, r2: 3, c2: 1 },
          { r1: 2, c1: 2, r2: 2, c2: 3 },
          { r1: 2, c1: 4, r2: 3, c2: 4 },
          { r1: 3, c1: 2, r2: 3, c2: 3 },
        ],
      },
    },
    renderBoard: ({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange }) => (
      <DominoSearchBoard
        puzzle={puzzle}
        startTime={startTime}
        resetToken={resetToken}
        onComplete={onComplete}
        initialSnapshot={initialSnapshot}
        onSnapshotChange={onSnapshotChange}
      />
    ),
    renderExample: (template, locale) => {
      const example = template.example;
      if (example.puzzleType !== 'domino-search') {
        throw new Error('Domino Search template example type mismatch.');
      }

      return (
        <AdditionalPuzzleExample
          example={example}
          playableLabel={template.playableLabel[locale]}
          answerLabel={template.answerLabel[locale]}
        />
      );
    },
  },
  snail: {
    parsePuzzLink: parseMagicSnailLink,
    template: {
      type: 'snail',
      name: {
        'zh-CN': '蜗牛',
        en: 'Magic Snail',
      },
      rulesTitle: {
        'zh-CN': '规则',
        en: 'Rules',
      },
      rules: {
        'zh-CN': [
          '在一些空格里填一个属于给出的列表（1~N）中的数，使得每个数字在每行和每列都恰好出现一次。',
          '从有圆圈的格子开始，沿着螺旋（“蜗牛”）的这一路径，所经过的数字必须按1~N循环：1, 2, ..., N, 1, 2, ...。',
          '×表示此格不能填数。',
        ],
        en: [
          'Fill available cells with numbers from the given list.',
          'No number may repeat in any row or column.',
          'Reading the filled cells along the outside-in spiral must repeat the given number sequence.',
        ],
      },
      exampleTitle: {
        'zh-CN': '例题（5×5）',
        en: 'Example (5×5)',
      },
      playableLabel: {
        'zh-CN': '题面',
        en: 'Puzzle',
      },
      answerLabel: {
        'zh-CN': '正确答案',
        en: 'Answer',
      },
      example: {
        puzzleType: 'snail',
        width: magicSnailExamplePuzzle.width,
        height: magicSnailExamplePuzzle.height,
        numbers: magicSnailExamplePuzzle.numbers,
        cells: magicSnailExamplePuzzle.cells,
        start: magicSnailExamplePuzzle.start,
        correctGrid: magicSnailExampleCorrectGrid,
      },
    },
    renderBoard: ({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange }) => (
      <MagicSnailBoard
        puzzle={puzzle}
        startTime={startTime}
        resetToken={resetToken}
        onComplete={onComplete}
        initialSnapshot={initialSnapshot}
        onSnapshotChange={onSnapshotChange}
      />
    ),
    renderExample: (template, locale) => {
      const example = template.example;
      if (example.puzzleType !== 'snail') {
        throw new Error('Magic Snail template example type mismatch.');
      }

      return (
        <AdditionalPuzzleExample
          example={example}
          playableLabel={template.playableLabel[locale]}
          answerLabel={template.answerLabel[locale]}
        />
      );
    },
  },
  'slovak-sums': {
    parsePuzzLink: parseSlovakSumsLink,
    template: {
      type: 'slovak-sums',
      name: {
        'zh-CN': '斯洛伐克和',
        en: 'Slovak Sums',
      },
      rulesTitle: {
        'zh-CN': '规则',
        en: 'Rules',
      },
      rules: {
        'zh-CN': [
          '在白格中填入给定数字列表中的数字。',
          '每一行和每一列都必须恰好包含一次每个指定数字。',
          '黑格中的上方数字表示其正交相邻白格中已填数字的总和，白色圆点数量表示这些相邻已填数字的数量；没有圆点表示数量未知。',
        ],
        en: [
          'Fill white cells with numbers from the given list.',
          'Each row and each column must contain each listed number exactly once.',
          'In a black clue cell, the upper number gives the sum of adjacent filled numbers, and the white dots give how many adjacent cells contain numbers; no dots means the amount is unknown.',
        ],
      },
      exampleTitle: {
        'zh-CN': '例题（6×6）',
        en: 'Example (6×6)',
      },
      playableLabel: {
        'zh-CN': '题面',
        en: 'Puzzle',
      },
      answerLabel: {
        'zh-CN': '正确答案',
        en: 'Answer',
      },
      example: {
        puzzleType: 'slovak-sums',
        width: 6,
        height: 6,
        numbers: [1, 2, 3],
        cells: [
          [null, null, null, { sum: 4, count: 2 }, null, null],
          [null, { sum: 6, count: 3 }, null, null, null, null],
          [null, null, null, null, null, { sum: 3, count: 1 }],
          [{ sum: 1, count: 1 }, null, null, null, null, null],
          [null, null, null, null, { sum: 5, count: 2 }, null],
          [null, null, { sum: 2, count: 1 }, null, null, null],
        ],
        correctGrid: [
          [null, 3, 1, null, null, 2],
          [2, null, null, 3, 1, null],
          [null, 1, 2, null, 3, null],
          [null, null, 3, 1, 2, null],
          [1, 2, null, null, null, 3],
          [3, null, null, 2, null, 1],
        ],
      },
    },
    renderBoard: ({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange }) => (
      <SlovakSumsBoard
        puzzle={puzzle}
        startTime={startTime}
        resetToken={resetToken}
        onComplete={onComplete}
        initialSnapshot={initialSnapshot}
        onSnapshotChange={onSnapshotChange}
      />
    ),
    renderExample: (template, locale) => {
      const example = template.example;
      if (example.puzzleType !== 'slovak-sums') {
        throw new Error('Slovak Sums template example type mismatch.');
      }

      return (
        <AdditionalPuzzleExample
          example={example}
          playableLabel={template.playableLabel[locale]}
          answerLabel={template.answerLabel[locale]}
        />
      );
    },
  },
  kakuro: {
    parsePuzzLink: parseKakuroLink,
    template: {
      type: 'kakuro',
      name: {
        'zh-CN': '数和',
        en: 'Kakuro',
      },
      rulesTitle: {
        'zh-CN': '规则',
        en: 'Rules',
      },
      rules: {
        'zh-CN': [
          '在每个白格内填入一个 1~9 的数字。',
          '每一段横向或纵向白格中的数字不能重复。',
          '黑格中的右侧数字表示其右方横段的总和，下方数字表示其下方纵段的总和；最上边和最左边的黑格同样用于标记从边缘开始的横段或纵段。',
        ],
        en: [
          'Fill every white cell with a digit from 1 to 9.',
          'Digits may not repeat within a horizontal or vertical run.',
          'The right clue in a black cell gives the sum of the run to its right, and the lower clue gives the sum of the run below it. Black cells on the top and left edges mark runs that start at the edge.',
        ],
      },
      exampleTitle: {
        'zh-CN': '例题（6×6）',
        en: 'Example (6×6)',
      },
      playableLabel: {
        'zh-CN': '题面',
        en: 'Puzzle',
      },
      answerLabel: {
        'zh-CN': '正确答案',
        en: 'Answer',
      },
      example: {
        puzzleType: 'kakuro',
        width: kakuroExamplePuzzle.width,
        height: kakuroExamplePuzzle.height,
        cells: kakuroExamplePuzzle.cells,
        topClues: kakuroExamplePuzzle.topClues,
        leftClues: kakuroExamplePuzzle.leftClues,
        correctGrid: kakuroExampleCorrectGrid,
      },
    },
    renderBoard: ({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange }) => (
      <KakuroBoard
        puzzle={puzzle}
        startTime={startTime}
        resetToken={resetToken}
        onComplete={onComplete}
        initialSnapshot={initialSnapshot}
        onSnapshotChange={onSnapshotChange}
      />
    ),
    renderExample: (template, locale) => {
      const example = template.example;
      if (example.puzzleType !== 'kakuro') {
        throw new Error('Kakuro template example type mismatch.');
      }

      return (
        <PlayableExample
          example={example}
          playableLabel={template.playableLabel[locale]}
          answerLabel={template.answerLabel[locale]}
          fixedCellSize={boardLayoutMetrics.exampleCellSize}
          answer={<KakuroExample width={example.width} height={example.height} cells={example.cells} correctGrid={example.correctGrid} />}
          renderBoard={({ puzzle, startTime, onComplete, fixedCellSize }) => (
            <KakuroBoard puzzle={puzzle as KakuroPuzzleData} startTime={startTime} resetToken={0} onComplete={onComplete} fixedCellSize={fixedCellSize} showValidationMessage />
          )}
        />
      );
    },
  },
  wolvesandsheepfences: {
    parsePuzzLink: parseWolvesAndSheepLink,
    template: {
      type: 'wolvesandsheepfences',
      name: {
        'zh-CN': '狼羊围栏',
        en: 'Wolves and Sheep Fences',
      },
      rulesTitle: {
        'zh-CN': '规则',
        en: 'Rules',
      },
      rules: {
        'zh-CN': [
          '沿格子边缘画一条不分叉、不自交的单一回路。',
          '数字表示其所在格子四周被回路经过的边数。',
          '羊必须在回路内，狼必须在回路外。',
        ],
        en: [
          'Draw a single loop along cell edges; it may not branch or cross itself.',
          'A number gives the count of loop edges surrounding its cell.',
          'Every sheep must be inside the loop, and every wolf must be outside it.',
        ],
      },
      exampleTitle: {
        'zh-CN': '例题（4×4）',
        en: 'Example (4×4)',
      },
      playableLabel: {
        'zh-CN': '题面',
        en: 'Puzzle',
      },
      answerLabel: {
        'zh-CN': '正确答案',
        en: 'Answer',
      },
      example: {
        puzzleType: 'wolvesandsheepfences',
        width: wolvesAndSheepExamplePuzzle.width,
        height: wolvesAndSheepExamplePuzzle.height,
        clues: wolvesAndSheepExamplePuzzle.clues,
        loopEdges: wolvesAndSheepExampleLoopEdges,
      },
    },
    renderBoard: ({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange }) => (
      <WolvesAndSheepBoard
        puzzle={puzzle}
        startTime={startTime}
        resetToken={resetToken}
        onComplete={onComplete}
        initialSnapshot={initialSnapshot}
        onSnapshotChange={onSnapshotChange}
      />
    ),
    renderExample: (template, locale) => {
      const example = template.example;
      if (example.puzzleType !== 'wolvesandsheepfences') {
        throw new Error('Wolves and Sheep Fences template example type mismatch.');
      }

      return (
        <AdditionalPuzzleExample
          example={example}
          playableLabel={template.playableLabel[locale]}
          answerLabel={template.answerLabel[locale]}
        />
      );
    },
  },
  'shape-minesweeper': {
    parsePuzzLink: parseShapeMinesweeperLink,
    template: {
      type: 'shape-minesweeper',
      name: {
        'zh-CN': '形状扫雷',
        en: 'Shape Minesweeper',
      },
      rulesTitle: {
        'zh-CN': '规则',
        en: 'Rules',
      },
      rules: {
        'zh-CN': [
          '将形状库中的所有形状各放入盘面一次；形状可以旋转或镜像。',
          '形状不能覆盖数字格，不同形状之间不能正交或斜向接触。',
          '数字表示周围八格（包括斜向相邻格）中被形状覆盖的格数。形状上的字母仅用于提交答案。',
        ],
        en: [
          'Place every shape from the bank into the grid exactly once; shapes may be rotated or reflected.',
          'Shapes may not cover numbered cells, and different shapes may not touch, even diagonally.',
          'A number gives how many of its eight surrounding cells contain a shape part. Letters on the shapes are only answer-entry labels.',
        ],
      },
      exampleTitle: {
        'zh-CN': '例题（8×8）',
        en: 'Example (8×8)',
      },
      playableLabel: {
        'zh-CN': '题面',
        en: 'Puzzle',
      },
      answerLabel: {
        'zh-CN': '正确答案',
        en: 'Answer',
      },
      example: {
        puzzleType: 'shape-minesweeper',
        width: shapeMinesweeperExamplePuzzle.width,
        height: shapeMinesweeperExamplePuzzle.height,
        clues: shapeMinesweeperExamplePuzzle.clues,
        shapes: shapeMinesweeperExamplePuzzle.shapes,
        correctSolution: shapeMinesweeperExampleSolution,
      },
    },
    renderBoard: ({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange }) => (
      <ShapeMinesweeperBoard
        puzzle={puzzle}
        startTime={startTime}
        resetToken={resetToken}
        onComplete={onComplete}
        initialSnapshot={initialSnapshot}
        onSnapshotChange={onSnapshotChange}
      />
    ),
    renderExample: (template, locale) => {
      const example = template.example;
      if (example.puzzleType !== 'shape-minesweeper') {
        throw new Error('Shape Minesweeper template example type mismatch.');
      }
      const examplePuzzle: ShapeMinesweeperPuzzleData = {
        type: 'shape-minesweeper',
        width: example.width,
        height: example.height,
        clues: example.clues,
        shapes: example.shapes,
      };
      return (
        <PlayableExample
          example={example}
          playableLabel={template.playableLabel[locale]}
          answerLabel={template.answerLabel[locale]}
          fixedCellSize={boardLayoutMetrics.exampleCellSize}
          answer={<ShadingPuzzleExample puzzle={examplePuzzle} correctSolution={example.correctSolution} />}
          renderBoard={({ puzzle, startTime, onComplete, fixedCellSize }) => (
            <ShapeMinesweeperBoard puzzle={puzzle as ShapeMinesweeperPuzzleData} startTime={startTime} resetToken={0} onComplete={onComplete} fixedCellSize={fixedCellSize} showValidationMessage />
          )}
        />
      );
    },
  },
  cave: {
    parsePuzzLink: parseCaveLink,
    template: {
      type: 'cave',
      name: {
        'zh-CN': '山洞',
        en: 'Cave',
      },
      rulesTitle: {
        'zh-CN': '规则',
        en: 'Rules',
      },
      rules: {
        'zh-CN': [
          '涂黑一些格子，使其余留白格组成一个正交连通的山洞；所有数字格都属于山洞。',
          '不能有被山洞完全围住的涂黑区域；换言之，每一片涂黑格都必须能经由涂黑格正交连到盘面边缘。',
          '数字表示从该格向上下左右直线可见的连续山洞格总数，数字格本身只计一次。',
        ],
        en: [
          'Shade cells so the remaining unshaded cells form one orthogonally connected cave; every numbered cell belongs to the cave.',
          'There may be no enclosed shaded area: every shaded component must connect edge-wise to the edge of the grid.',
          'A number gives the total unshaded cells visible in straight lines vertically and horizontally, counting its own cell once.',
        ],
      },
      exampleTitle: {
        'zh-CN': '例题（5×5）',
        en: 'Example (5×5)',
      },
      playableLabel: {
        'zh-CN': '题面',
        en: 'Puzzle',
      },
      answerLabel: {
        'zh-CN': '正确答案',
        en: 'Answer',
      },
      example: {
        puzzleType: 'cave',
        width: caveExamplePuzzle.width,
        height: caveExamplePuzzle.height,
        clues: caveExamplePuzzle.clues,
        correctSolution: caveExampleSolution,
      },
    },
    renderBoard: ({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange }) => (
      <CaveBoard
        puzzle={puzzle}
        startTime={startTime}
        resetToken={resetToken}
        onComplete={onComplete}
        initialSnapshot={initialSnapshot}
        onSnapshotChange={onSnapshotChange}
      />
    ),
    renderExample: (template, locale) => {
      const example = template.example;
      if (example.puzzleType !== 'cave') {
        throw new Error('Cave template example type mismatch.');
      }
      const examplePuzzle: CavePuzzleData = { type: 'cave', width: example.width, height: example.height, clues: example.clues };
      return (
        <PlayableExample
          example={example}
          playableLabel={template.playableLabel[locale]}
          answerLabel={template.answerLabel[locale]}
          fixedCellSize={boardLayoutMetrics.exampleCellSize}
          answer={<ShadingPuzzleExample puzzle={examplePuzzle} correctSolution={example.correctSolution} />}
          renderBoard={({ puzzle, startTime, onComplete, fixedCellSize }) => (
            <CaveBoard puzzle={puzzle as CavePuzzleData} startTime={startTime} resetToken={0} onComplete={onComplete} fixedCellSize={fixedCellSize} showValidationMessage />
          )}
        />
      );
    },
  },
  'japanese-arrows': {
    parsePuzzLink: parseJapaneseArrowsLink,
    template: {
      type: 'japanese-arrows', name: { 'zh-CN': '日式箭头', en: 'Japanese Arrows' }, rulesTitle: { 'zh-CN': '规则', en: 'Rules' },
      rules: { 'zh-CN': ['在每个格子中填入数字。数字和箭头共同表示箭头方向上（不含自身）出现的不同数字数量。'], en: ['Fill every cell. The number and arrow indicate how many different numbers occur in the pointed direction, excluding the cell itself.'] },
      exampleTitle: { 'zh-CN': '例题', en: 'Example' }, playableLabel: { 'zh-CN': '题面', en: 'Puzzle' }, answerLabel: { 'zh-CN': '答案', en: 'Answer' },
      example: { puzzleType: 'japanese-arrows', width: 2, height: 1, arrows: [['E', 'W']], clues: [[1, null]], correctGrid: [[1, 1]] },
    },
    renderBoard: ({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange }) => <JapaneseArrowsBoard puzzle={puzzle} startTime={startTime} resetToken={resetToken} onComplete={onComplete} initialSnapshot={initialSnapshot} onSnapshotChange={onSnapshotChange} />,
    renderExample: (template, locale) => {
      const example = template.example;
      if (example.puzzleType !== 'japanese-arrows') throw new Error('Japanese Arrows template example type mismatch.');
      return <AdditionalPuzzleExample example={example} playableLabel={template.playableLabel[locale]} answerLabel={template.answerLabel[locale]} />;
    },
  },
  'four-winds-with-parks': {
    parsePuzzLink: parseFourWindsWithParksLink,
    template: {
      type: 'four-winds-with-parks', name: { 'zh-CN': '四风带公园', en: 'Four Winds with Parks' }, rulesTitle: { 'zh-CN': '规则', en: 'Rules' },
      rules: { 'zh-CN': ['从数字格边缘画出指向四个方向的箭头；箭头不能重叠。每行每列恰好有一个公园（圈）。数字是从该格出发的箭头总长度。'], en: ['Draw non-overlapping arrows from numbered cell edges. Every row and column has exactly one park (circle). A clue is the total length of arrows starting beside it.'] },
      exampleTitle: { 'zh-CN': '例题', en: 'Example' }, playableLabel: { 'zh-CN': '题面', en: 'Puzzle' }, answerLabel: { 'zh-CN': '答案', en: 'Answer' },
      example: {
        puzzleType: 'four-winds-with-parks',
        width: 5,
        height: 5,
        clues: [
          [3, null, null, 4, null],
          [null, null, 2, null, null],
          [null, null, null, null, null],
          [null, null, 2, null, null],
          [null, 1, null, null, 2],
        ],
        correctGrid: [
          [0, 2, 0, 0, 2],
          [3, 4, 0, 3, 0],
          [3, 0, 3, 3, 1],
          [0, 4, 0, 3, 1],
          [4, 0, 3, 0, 0],
        ],
      },
    },
    renderBoard: ({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange }) => <FourWindsWithParksBoard puzzle={puzzle} startTime={startTime} resetToken={resetToken} onComplete={onComplete} initialSnapshot={initialSnapshot} onSnapshotChange={onSnapshotChange} />,
    renderExample: (template, locale) => {
      const example = template.example;
      if (example.puzzleType !== 'four-winds-with-parks') throw new Error('Four Winds with Parks template example type mismatch.');
      return <AdditionalPuzzleExample example={example} playableLabel={template.playableLabel[locale]} answerLabel={template.answerLabel[locale]} />;
    },
  },
  'fourwinds': {
    parsePuzzLink: parseFourWindsLink,
    template: {
      type: 'fourwinds', name: { 'zh-CN': '四风', en: 'Four Winds' }, rulesTitle: { 'zh-CN': '规则', en: 'Rules' },
      rules: {
        'zh-CN': [
          '在空格中画箭头。箭头只能沿上下左右四个方向，并且必须从数字格的边缘出发。',
          '每个空格必须恰好被一个箭头覆盖。',
          '数字表示从该格边缘出发的所有箭头的总长度。',
        ],
        en: [
          'Draw arrows in the empty cells. Arrows may only point in the four standard directions and must begin at the edge of a numbered cell.',
          'Every empty cell must be covered by exactly one arrow.',
          "A number indicates the total length of all arrows that begin at an edge next to that number's cell.",
        ],
      },
      exampleTitle: { 'zh-CN': '例题', en: 'Example' }, playableLabel: { 'zh-CN': '题面', en: 'Puzzle' }, answerLabel: { 'zh-CN': '答案', en: 'Answer' },
      // WPF Puzzle GP 2016, Round 1 Competitive instructions example (5×5).
      example: {
        puzzleType: 'fourwinds', width: 5, height: 5,
        clues: [
          [null, null, 2, null, null],
          [null, null, null, null, 4],
          [null, 3, null, 2, null],
          [6, null, null, null, null],
          [null, null, 2, null, null],
        ],
        correctGrid: [
          [1, 1, 1, 2, 1],
          [1, 1, 3, 1, 1],
          [1, 1, 2, 1, 3],
          [1, 2, 2, 3, 3],
          [3, 4, 1, 2, 3],
        ],
      },
    },
    renderBoard: ({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange }) => <FourWindsBoard puzzle={puzzle} startTime={startTime} resetToken={resetToken} onComplete={onComplete} initialSnapshot={initialSnapshot} onSnapshotChange={onSnapshotChange} />,
    renderExample: (template, locale) => {
      const example = template.example;
      if (example.puzzleType !== 'fourwinds') throw new Error('Four Winds template example type mismatch.');
      return <AdditionalPuzzleExample example={example} playableLabel={template.playableLabel[locale]} answerLabel={template.answerLabel[locale]} />;
    },
  },
  'consecutive-kakuro': {
    parsePuzzLink: parseConsecutiveKakuroLink,
    template: {
      type: 'consecutive-kakuro', name: { 'zh-CN': '连续数和', en: 'Consecutive Kakuro' }, rulesTitle: { 'zh-CN': '规则', en: 'Rules' },
      rules: { 'zh-CN': ['按数和规则填入 1~9；白线相邻格必须填连续数字，无白线相邻格不能填连续数字。'], en: ['Solve as Kakuro with digits 1–9. White bars require consecutive digits; adjacent cells without a bar may not be consecutive.'] },
      exampleTitle: { 'zh-CN': '例题', en: 'Example' }, playableLabel: { 'zh-CN': '题面', en: 'Puzzle' }, answerLabel: { 'zh-CN': '答案', en: 'Answer' },
      example: {
        puzzleType: 'consecutive-kakuro',
        width: 5,
        height: 5,
        cells: [
          [{ right: null, down: null }, { right: null, down: 7 }, { right: null, down: null }, { right: null, down: 11 }, { right: null, down: null }],
          [{ right: null, down: null }, null, { right: 12, down: 9 }, null, null],
          [{ right: 10, down: null }, null, null, null, { right: null, down: 8 }],
          [{ right: null, down: null }, { right: 6, down: null }, null, null, null],
          [{ right: 5, down: null }, null, null, { right: null, down: null }, null],
        ],
        topClues: [null, null, null, null, null],
        leftClues: [null, null, null, null, null],
        horizontalBars: [
          [false, false, false, false],
          [false, false, false, false],
          [false, false, true, false],
          [false, false, true, false],
          [false, false, false, false],
        ],
        verticalBars: [
          [false, false, false, false, false],
          [false, false, false, false, false],
          [false, false, true, true, false],
          [false, false, false, false, false],
        ],
        correctGrid: [
          [null, null, null, null, null],
          [null, 2, null, 8, 4],
          [null, 5, 3, 2, null],
          [null, null, 2, 1, 3],
          [null, 1, 4, null, 5],
        ],
      },
    },
    renderBoard: ({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange }) => <ConsecutiveKakuroBoard puzzle={puzzle} startTime={startTime} resetToken={resetToken} onComplete={onComplete} initialSnapshot={initialSnapshot} onSnapshotChange={onSnapshotChange} />,
    renderExample: (template, locale) => {
      const example = template.example;
      if (example.puzzleType !== 'consecutive-kakuro') throw new Error('Consecutive Kakuro template example type mismatch.');
      return <AdditionalPuzzleExample example={example} playableLabel={template.playableLabel[locale]} answerLabel={template.answerLabel[locale]} />;
    },
  },
  'japanese-sums-with-zeroes': {
    parsePuzzLink: parseJapaneseSumsLink,
    template: {
      type: 'japanese-sums-with-zeroes', name: { 'zh-CN': '带零日式和', en: 'Japanese Sums with Zeroes' }, rulesTitle: { 'zh-CN': '规则', en: 'Rules' },
      rules: {
        'zh-CN': [
          '在部分格子中填入 0 到题目给定的最大数字，同一行或同一列中每个数字最多出现一次；格子可以留空。',
          '盘面外的数字表示该行或该列中所有连续数字组的和（包括只有一个数字的“组”）。',
          '这些数字组之间由空格分隔（数字 0 不算空格）。',
          '外侧的和按对应数字组的顺序给出。',
        ],
        en: [
          "Place a digit from 0 up to the puzzle's maximum digit into some cells so that no digit appears more than once in each row or column. Cells may remain empty.",
          'Numbers outside the grid indicate all sums of continuous groups of digits (including "sums" of a single digit) along that row or column.',
          'These groups are separated by empty cells (a cell with 0 is not considered empty).',
          'These sums are given in the same order as their corresponding groups of digits.',
        ],
      },
      exampleTitle: { 'zh-CN': '例题', en: 'Example' }, playableLabel: { 'zh-CN': '题面', en: 'Puzzle' }, answerLabel: { 'zh-CN': '答案', en: 'Answer' },
      // 例题与答案取自
      // http://localhost:8080/p.html?japanesesumswithzeroes/5/5/4/5h34gah33g45gah4h61g43g9h
      example: {
        puzzleType: 'japanese-sums-with-zeroes',
        width: 5,
        height: 5,
        maxDigit: 4,
        clues: {
          top: [[5], [4, 3], [10], [3, 3], [5, 4]],
          right: [[], [], [], [], []],
          bottom: [[], [], [], [], []],
          left: [[10], [4], [1, 6], [3, 4], [9]],
        },
        correctGrid: [
          [null, 4, 3, 1, 2],
          [null, null, 1, 0, 3],
          [1, null, 4, 2, null],
          [0, 1, 2, null, 4],
          [4, 2, 0, 3, null],
        ],
      },
    },
    renderBoard: (props) => <JapaneseSumsBoard {...props} />,
    renderExample: (template, locale) => {
      const example = template.example;
      if (example.puzzleType !== 'japanese-sums-with-zeroes') throw new Error('Japanese Sums with Zeroes template example type mismatch.');
      return <AdditionalPuzzleExample example={example} playableLabel={template.playableLabel[locale]} answerLabel={template.answerLabel[locale]} />;
    },
  },
  'abc-box': {
    parsePuzzLink: parseABCBoxLink,
    template: { type: 'abc-box', name: { 'zh-CN': 'ABC 盒', en: 'ABC-Box' }, rulesTitle: { 'zh-CN': '规则', en: 'Rules' }, rules: { 'zh-CN': ['每格填入 A、B、C 之一；外侧符号描述同字母连续区段的长度或字母。'], en: ['Fill each cell with A, B, or C. Outside symbols describe the lengths or letters of consecutive runs.'] }, exampleTitle: { 'zh-CN': '例题', en: 'Example' }, playableLabel: { 'zh-CN': '题面', en: 'Puzzle' }, answerLabel: { 'zh-CN': '答案', en: 'Answer' }, example: { puzzleType: 'abc-box', width: 2, height: 2, givens: [['A', null], [null, 'B']], clues: { top: [[],[]], right: [[],[]], bottom: [[],[]], left: [[],[]] }, correctGrid: [['A','B'],['C','A']] } },
    renderBoard: (props) => <ABCBoxBoard {...props} />,
    renderExample: (template, locale) => {
      const example = template.example;
      if (example.puzzleType !== 'abc-box') throw new Error('ABC-Box template example type mismatch.');
      return (
        <PlayableExample
          example={example}
          playableLabel={template.playableLabel[locale]}
          answerLabel={template.answerLabel[locale]}
          fixedCellSize={boardLayoutMetrics.exampleCellSize}
          answer={<ABCBoxExample example={example} />}
          renderBoard={({ puzzle, startTime, onComplete, fixedCellSize }) => (
            <ABCBoxBoard puzzle={puzzle as ABCBoxPuzzleData} startTime={startTime} resetToken={0} onComplete={onComplete} fixedCellSize={fixedCellSize} showValidationMessage />
          )}
        />
      );
    },
  },
  magnets: {
    parsePuzzLink: parseMagnetsLink,
    template: {
      type: 'magnets', name: { 'zh-CN': '磁铁', en: 'Magnets' }, rulesTitle: { 'zh-CN': '规则', en: 'Rules' },
      rules: {
        'zh-CN': [
          '盘面被分割成若干个两格区域（只画出区域边界）。在部分格子中放置 + 或 −，每格至多一个符号。',
          '每个区域要么恰好放置两个符号，要么一个都不放。',
          '相邻的格子（即使在同一区域内）不能放置相同的符号。',
          '上方的数字表示该列中 + 的个数，左侧的数字表示该行中 − 的个数；没有数字表示个数不限。',
        ],
        en: [
          'The grid is partitioned into regions of two square cells each (only region borders are drawn). Put + and − symbols into some cells, at most one symbol per cell.',
          'Each region either has two symbols or no symbols at all.',
          'Adjacent cells (even within a region) cannot contain the same symbol.',
          'The numbers above and to the left of the grid indicate the exact number of + in each column and − in each row. If a number is not given, there might be any number of the specified symbol.',
        ],
      },
      exampleTitle: { 'zh-CN': '例题', en: 'Example' }, playableLabel: { 'zh-CN': '题面', en: 'Puzzle' }, answerLabel: { 'zh-CN': '答案', en: 'Answer' },
      // 例题与答案取自
      // http://localhost:8080/p.html?magnets/6/6/121232233111212232121222dfnrrlrebqqu
      example: {
        puzzleType: 'magnets',
        width: 6,
        height: 6,
        regions: [
          [{ row: 0, col: 0 }, { row: 0, col: 1 }],
          [{ row: 0, col: 2 }, { row: 1, col: 2 }],
          [{ row: 0, col: 3 }, { row: 0, col: 4 }],
          [{ row: 0, col: 5 }, { row: 1, col: 5 }],
          [{ row: 1, col: 0 }, { row: 1, col: 1 }],
          [{ row: 1, col: 3 }, { row: 2, col: 3 }],
          [{ row: 1, col: 4 }, { row: 2, col: 4 }],
          [{ row: 2, col: 0 }, { row: 3, col: 0 }],
          [{ row: 2, col: 1 }, { row: 2, col: 2 }],
          [{ row: 2, col: 5 }, { row: 3, col: 5 }],
          [{ row: 3, col: 1 }, { row: 4, col: 1 }],
          [{ row: 3, col: 2 }, { row: 3, col: 3 }],
          [{ row: 3, col: 4 }, { row: 4, col: 4 }],
          [{ row: 4, col: 0 }, { row: 5, col: 0 }],
          [{ row: 4, col: 2 }, { row: 4, col: 3 }],
          [{ row: 4, col: 5 }, { row: 5, col: 5 }],
          [{ row: 5, col: 1 }, { row: 5, col: 2 }],
          [{ row: 5, col: 3 }, { row: 5, col: 4 }],
        ],
        topClues: [2, 2, 2, 3, 1, 1],
        topMinusClues: [1, 1, 3, 2, 3, 1],
        leftClues: [2, 2, 3, 1, 1, 2],
        leftPlusClues: [1, 2, 2, 2, 2, 2],
        givens: Array.from({ length: 6 }, () => Array<MagnetsPole | null>(6).fill(null)),
        correctGrid: [
          [null, null, 2, 1, 2, null],
          [1, 2, 1, 2, null, null],
          [2, 1, 2, 1, null, 2],
          [1, null, null, null, 2, 1],
          [null, null, 1, 2, 1, null],
          [null, 1, 2, 1, 2, null],
        ],
      },
    },
    renderBoard: (props) => <MagnetsBoard {...props} />,
    renderExample: (template, locale) => {
      const example = template.example;
      if (example.puzzleType !== 'magnets') throw new Error('Magnets template example type mismatch.');
      return <AdditionalPuzzleExample example={example} playableLabel={template.playableLabel[locale]} answerLabel={template.answerLabel[locale]} />;
    },
  },
  pills: {
    parsePuzzLink: parsePillsLink,
    template: {
      type: 'pills', name: { 'zh-CN': '药丸', en: 'Pills' }, rulesTitle: { 'zh-CN': '规则', en: 'Rules' },
      rules: {
        'zh-CN': [
          '在盘面中定位给定的一组药丸。药丸是 1×3 或 3×1 的形状，且互不重叠。',
          '每个药丸有一个互不相同的“值”（药丸内部圆点的数量），如盘面右侧所示。',
          '盘面左侧和上方的每个数字表示该行或该列中位于药丸内部的圆点数量。',
        ],
        en: [
          'Locate the indicated set of pills in the grid. Pills have a 1×3 or 3×1 shape and do not overlap each other.',
          'Each pill has a different "value" (number of dots inside the pill), as indicated to the right of the grid.',
          'Each number to the left and top of the grid reveals the number of dots in that row or column that are inside pills.',
        ],
      },
      exampleTitle: { 'zh-CN': '例题', en: 'Example' }, playableLabel: { 'zh-CN': '题面', en: 'Puzzle' }, answerLabel: { 'zh-CN': '答案', en: 'Answer' },
      example: {
        puzzleType: 'pills',
        width: 5,
        height: 5,
        dots: [
          [1, 0, 0, 0, 0],
          [0, 0, 0, 0, 1],
          [1, 1, 1, 0, 1],
          [0, 0, 0, 0, 0],
          [1, 1, 2, 0, 0],
        ],
        topClues: [3, 2, 3, 0, 2],
        leftClues: [1, 1, 4, 0, 4],
        pillValues: [1, 2, 3, 4],
        correctGrid: [
          [1, 1, 1, 0, 1],
          [0, 0, 0, 0, 1],
          [1, 1, 1, 0, 1],
          [0, 0, 0, 0, 0],
          [1, 1, 1, 0, 0],
        ],
      },
    },
    renderBoard: (props) => <PillsBoard {...props} />,
    renderExample: (template, locale) => {
      const example = template.example;
      if (example.puzzleType !== 'pills') throw new Error('Pills template example type mismatch.');
      return <AdditionalPuzzleExample example={example} playableLabel={template.playableLabel[locale]} answerLabel={template.answerLabel[locale]} />;
    },
  },
  'place-by-product': {
    parsePuzzLink: parsePlaceByProductLink,
    template: {
      type: 'place-by-product', name: { 'zh-CN': '乘积摆放', en: 'Place by Product' }, rulesTitle: { 'zh-CN': '规则', en: 'Rules' },
      rules: {
        'zh-CN': [
          '将给定的一组拼块放入盘面。拼块之间不能相互接触，即使是斜对角接触也不行。',
          '拼块可以旋转和翻转。拼块将每一行（列）的白色格分割成若干组。',
          '部分行（列）旁标有数字：它表示该行（列）中所有白色分组的长度的乘积。数字 0 表示该行（列）被拼块完全填满。',
          '部分拼块的某些格已预先给出，但它们属于哪个拼块并不标明。',
        ],
        en: [
          'Place the given set of pieces into the grid. Pieces may not touch, not even diagonally.',
          'Pieces may be rotated and reflected. The pieces divide rows (and columns) into groups of adjacent white (unoccupied) cells.',
          'Numeric clues are provided for some rows (and columns); a clue indicates the multiplicative product of the sizes of the (white) groups in that row (or column). A zero indicates that that row or column is completely filled.',
          'Some piece parts may already be placed for you; however, which piece the parts belong to is not identified for you.',
        ],
      },
      exampleTitle: { 'zh-CN': '例题', en: 'Example' }, playableLabel: { 'zh-CN': '题面', en: 'Puzzle' }, answerLabel: { 'zh-CN': '答案', en: 'Answer' },
      // WPF Puzzle GP 2016 Round 1 instructions example (5×5).
      example: {
        puzzleType: 'place-by-product',
        width: 5,
        height: 5,
        rowClues: [null, 3, 3, 2, 3],
        colClues: [null, 4, 4, null, 1],
        pieces: [
          { cells: [[0, 0], [0, 1], [1, 1], [1, 2]] },
          { cells: [[0, 0], [0, 1], [1, 0]] },
          { cells: [[0, 0], [0, 1], [1, 0]] },
        ],
        givens: [
          [false, false, false, false, false],
          [false, false, false, false, false],
          [false, false, false, false, false],
          [false, false, false, false, false],
          [false, false, false, false, false],
        ],
        correctGrid: [
          [0, 0, 1, 1, 0],
          [0, 0, 0, 1, 1],
          [1, 1, 0, 0, 0],
          [1, 0, 0, 1, 1],
          [0, 0, 0, 1, 0],
        ],
      },
    },
    renderBoard: (props) => <PlaceByProductBoard {...props} />,
    renderExample: (template, locale) => {
      const example = template.example;
      if (example.puzzleType !== 'place-by-product') throw new Error('Place by Product template example type mismatch.');
      return (
        <PlayableExample
          example={example}
          playableLabel={template.playableLabel[locale]}
          answerLabel={template.answerLabel[locale]}
          fixedCellSize={boardLayoutMetrics.exampleCellSize}
          answer={<PlaceByProductExample width={example.width} height={example.height} rowClues={example.rowClues} colClues={example.colClues} correctGrid={example.correctGrid} />}
          renderBoard={({ puzzle, startTime, onComplete, fixedCellSize }) => (
            <PlaceByProductBoard puzzle={puzzle as PlaceByProductPuzzleData} startTime={startTime} resetToken={0} onComplete={onComplete} fixedCellSize={fixedCellSize} />
          )}
        />
      );
    },
  },
  masyu: {
    parsePuzzLink: parseMasyuLink,
    template: {
      type: 'masyu', name: { 'zh-CN': '黑白珍珠', en: 'Masyu' }, rulesTitle: { 'zh-CN': '规则', en: 'Rules' },
      rules: {
        'zh-CN': [
          '画一条不交叉的单一回路，回路从相邻格子的中心之间穿过，并通过所有带圆圈的格子。',
          '回路必须从白圈中直行穿过，并且白圈前后的格子中至少一个必须转弯。',
          '回路必须在黑圈中转弯，并且黑圈前后的两个格子都必须直行穿过。',
        ],
        en: [
          'Draw a single, non-intersecting loop that passes orthogonally through all circled cells.',
          'The loop must go straight through the cells with white circles, with a turn in at least one of the cells immediately before or after each white circle.',
          'The loop must make a turn in all the black circles, but must go straight in both cells immediately before and after each black circle.',
        ],
      },
      exampleTitle: { 'zh-CN': '例题', en: 'Example' }, playableLabel: { 'zh-CN': '题面', en: 'Puzzle' }, answerLabel: { 'zh-CN': '答案', en: 'Answer' },
      // pzprjs official masyu test puzzle (verified against the pzpr checker).
      example: {
        puzzleType: 'masyu',
        width: 6,
        height: 6,
        cells: [
          [0, 0, 1, 0, 0, 0],
          [0, 2, 0, 0, 1, 0],
          [0, 0, 0, 0, 0, 0],
          [0, 0, 0, 2, 0, 0],
          [0, 1, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0],
        ],
        solutionEdges: [
          '0,0-0,1', '0,1-0,2', '0,2-0,3', '0,4-0,5',
          '1,1-1,2', '1,2-1,3', '2,2-2,3', '2,3-2,4',
          '3,1-3,2', '3,3-3,4', '3,4-3,5', '4,0-4,1', '4,1-4,2', '5,2-5,3',
          '0,0-1,0', '0,3-1,3', '0,4-1,4', '0,5-1,5',
          '1,0-2,0', '1,1-2,1', '1,4-2,4', '1,5-2,5',
          '2,0-3,0', '2,1-3,1', '2,2-3,2', '2,5-3,5',
          '3,0-4,0', '3,3-4,3', '4,2-5,2', '4,3-5,3',
        ],
      },
    },
    renderBoard: (props) => <MasyuBoard {...props} />,
    renderExample: (template, locale) => {
      const example = template.example;
      if (example.puzzleType !== 'masyu') throw new Error('Masyu template example type mismatch.');
      return (
        <PlayableExample
          example={example}
          playableLabel={template.playableLabel[locale]}
          answerLabel={template.answerLabel[locale]}
          fixedCellSize={boardLayoutMetrics.exampleCellSize}
          answer={<MasyuExample width={example.width} height={example.height} cells={example.cells} solutionEdges={example.solutionEdges} />}
          renderBoard={({ puzzle, startTime, onComplete, fixedCellSize }) => (
            <MasyuBoard puzzle={puzzle as MasyuPuzzleData} startTime={startTime} resetToken={0} onComplete={onComplete} fixedCellSize={fixedCellSize} />
          )}
        />
      );
    },
  },
  kropki: {
    parsePuzzLink: parseKropkiLink,
    template: {
      type: 'kropki', name: { 'zh-CN': '黑白点', en: 'Kropki' }, rulesTitle: { 'zh-CN': '规则', en: 'Rules' },
      rules: {
        'zh-CN': [
          '在每个格子中填入一个从1到N的数字（N为每行的格子数），使得每个数字在每行和每列都恰好出现一次。',
          '两个格子之间的白点表示这两个格子中的数字是连续数字。',
          '两个格子之间的黑点表示其中一个格子中的数字是另一个格子数字的两倍。',
          '如果1和2在相邻的格子中，它们之间的点可以是任意颜色。',
          '如果两个格子之间没有点，表示那里既不能是白点也不能是黑点。',
        ],
        en: [
          'Place a number from 1 to N (N is the number of cells in each row) into each cell so that each number appears exactly once in each row and column.',
          'A white dot on the edge of two cells indicates that those two cells must contain consecutive numbers.',
          'A black dot on the edge of two cells indicates that a number in one of those cells is double the value of the number in the other cell.',
          'If 1 and 2 are in adjacent cells, then the dot between them could be either colour.',
          'If there is no dot on the edge of two cells, it means neither a black nor a white dot could go there.',
        ],
      },
      exampleTitle: { 'zh-CN': '例题（4×4）', en: 'Example (4×4)' }, playableLabel: { 'zh-CN': '题面', en: 'Puzzle' }, answerLabel: { 'zh-CN': '正确答案', en: 'Answer' },
      // WPF Puzzle GP 2016 Round 2 example: designated rows 4321 and 1432.
      example: {
        puzzleType: 'kropki',
        width: kropkiExamplePuzzle.width,
        height: kropkiExamplePuzzle.height,
        givens: kropkiExamplePuzzle.givens,
        verticalDots: kropkiExamplePuzzle.verticalDots,
        horizontalDots: kropkiExamplePuzzle.horizontalDots,
        correctSolution: kropkiExampleCorrectSolution,
      },
    },
    renderBoard: (props) => <KropkiBoard {...props} />,
    renderExample: (template, locale) => {
      const example = template.example;
      if (example.puzzleType !== 'kropki') throw new Error('Kropki template example type mismatch.');
      return (
        <PlayableExample
          example={example}
          playableLabel={template.playableLabel[locale]}
          answerLabel={template.answerLabel[locale]}
          fixedCellSize={boardLayoutMetrics.exampleCellSize}
          answer={<KropkiExample width={example.width} height={example.height} givens={example.givens} verticalDots={example.verticalDots} horizontalDots={example.horizontalDots} correctSolution={example.correctSolution} />}
          renderBoard={({ puzzle, startTime, onComplete, fixedCellSize }) => (
            <KropkiBoard puzzle={puzzle as KropkiPuzzleData} startTime={startTime} resetToken={0} onComplete={onComplete} fixedCellSize={fixedCellSize} showValidationMessage />
          )}
        />
      );
    },
  },
  yinyang: {
    parsePuzzLink: parseYinYangLink,
    template: {
      type: 'yinyang', name: { 'zh-CN': '阴阳', en: 'Yin-Yang' }, rulesTitle: { 'zh-CN': '规则', en: 'Rules' },
      rules: {
        'zh-CN': [
          '每个格子都画一个黑色或白色的圆圈。',
          '所有黑色圆圈必须正交连通成一个整体，所有白色圆圈也必须正交连通成一个整体。',
          '任意2×2的区域必须同时包含至少一个黑色圆圈和至少一个白色圆圈。',
          '部分格子已经给出。',
        ],
        en: [
          'Draw a black or white circle in every cell.',
          'All black circles must be connected orthogonally, and all white circles must be connected orthogonally.',
          'Every 2×2 block of cells must contain at least one black circle and at least one white circle.',
          'Some cells are already filled in for you.',
        ],
      },
      exampleTitle: { 'zh-CN': '例题（7×7）', en: 'Example (7×7)' }, playableLabel: { 'zh-CN': '题面', en: 'Puzzle' }, answerLabel: { 'zh-CN': '正确答案', en: 'Answer' },
      // WPF Puzzle GP 2016 Round 2 (Competitive) puzzle 29a.
      example: {
        puzzleType: 'yinyang',
        width: yinYangExamplePuzzle.width,
        height: yinYangExamplePuzzle.height,
        givens: yinYangExamplePuzzle.givens,
        correctSolution: yinYangExampleCorrectSolution,
      },
    },
    renderBoard: (props) => <YinYangBoard {...props} />,
    renderExample: (template, locale) => {
      const example = template.example;
      if (example.puzzleType !== 'yinyang') throw new Error('Yin-Yang template example type mismatch.');
      return (
        <PlayableExample
          example={example}
          playableLabel={template.playableLabel[locale]}
          answerLabel={template.answerLabel[locale]}
          fixedCellSize={boardLayoutMetrics.exampleCellSize}
          answer={<YinYangExample width={example.width} height={example.height} givens={example.givens} correctSolution={example.correctSolution} />}
          renderBoard={({ puzzle, startTime, onComplete, fixedCellSize }) => (
            <YinYangBoard puzzle={puzzle as YinYangPuzzleData} startTime={startTime} resetToken={0} onComplete={onComplete} fixedCellSize={fixedCellSize} showValidationMessage />
          )}
        />
      );
    },
  },
};

export function getPuzzleTemplate(type: PuzzleType): PuzzleTemplate {
  return puzzleRegistry[type].template;
}

/**
 * Runtime counterpart of PuzzleType.  Puzzle types can arrive from URLs or
 * imported note files, so callers must not rely on a TypeScript cast alone.
 */
export function isPuzzleType(value: unknown): value is PuzzleType {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(puzzleRegistry, value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isPuzzleDimension(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= 100;
}

function isPuzzleMatrix(value: unknown, width: number, height: number) {
  return Array.isArray(value) && value.length === height && value.every(
    (row) => Array.isArray(row) && row.length === width
  );
}

function isFiniteInteger(value: unknown, min = Number.MIN_SAFE_INTEGER): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= min;
}

function isNullableInteger(
  value: unknown,
  min = Number.MIN_SAFE_INTEGER,
  max = Number.MAX_SAFE_INTEGER
) {
  return value === null || (isFiniteInteger(value, min) && value <= max);
}

function isCoordinate(value: unknown, width: number, height: number): value is { row: number; col: number } {
  const record = isRecord(value) ? value : null;
  return record !== null &&
    isFiniteInteger(record.row, 0) && record.row < height &&
    isFiniteInteger(record.col, 0) && record.col < width;
}

function isNumberArray(value: unknown, length?: number, min = Number.MIN_SAFE_INTEGER) {
  return Array.isArray(value) &&
    (length === undefined || value.length === length) &&
    value.every((item) => isFiniteInteger(item, min));
}

function isNullableNumberArray(value: unknown, length: number, min = Number.MIN_SAFE_INTEGER) {
  return Array.isArray(value) && value.length === length && value.every((item) => isNullableInteger(item, min));
}

function isTypedMatrix(
  value: unknown,
  width: number,
  height: number,
  predicate: (cell: unknown) => boolean
) {
  return isPuzzleMatrix(value, width, height) &&
    (value as unknown[]).every((row) => (row as unknown[]).every(predicate));
}

function isCoordinateClueList(
  value: unknown,
  width: number,
  height: number,
  predicate: (clue: Record<string, unknown>) => boolean
) {
  if (!Array.isArray(value)) return false;
  const coordinates = new Set<string>();
  return value.every((item) => {
    if (!isRecord(item) || !isCoordinate(item, width, height)) return false;
    const key = `${item.row},${item.col}`;
    // A coordinate clue list is a sparse map, not a multimap. Rejecting
    // duplicates keeps imported data deterministic instead of silently
    // shadowing one clue with another during rendering.
    if (coordinates.has(key)) return false;
    coordinates.add(key);
    return predicate(item);
  });
}

const BATTLESHIP_SEGMENTS = new Set([
  'unknown', 'up', 'down', 'left', 'right', 'center', 'single',
  'up-left', 'up-right', 'down-left', 'down-right',
]);

function isBattleshipFleet(value: unknown) {
  return Array.isArray(value) && value.every((shape) => {
    if (!isRecord(shape) || !isPuzzleDimension(shape.width) || !isPuzzleDimension(shape.height)) return false;
    return isTypedMatrix(shape.cells, shape.width, shape.height, (cell) => typeof cell === 'boolean') &&
      (shape.cells as boolean[][]).some((row) => row.some(Boolean));
  });
}

function isShapeMinesweeperBank(value: unknown) {
  return Array.isArray(value) && value.length > 0 && value.every((shape) => {
    if (!isRecord(shape) || typeof shape.label !== 'string' || shape.label.trim() === '') return false;
    if (!Array.isArray(shape.cells) || shape.cells.length === 0) return false;
    const firstRow = shape.cells[0];
    if (!Array.isArray(firstRow) || firstRow.length === 0) return false;
    return shape.cells.every((row) =>
      Array.isArray(row) && row.length === firstRow.length && row.every((cell) => typeof cell === 'boolean')
    ) && shape.cells.some((row) => (row as boolean[]).some(Boolean));
  });
}

/**
 * Structural guard for puzzle data coming from imported notes/localStorage.
 * Parsers already guarantee these shapes for URL puzzles; this guard keeps
 * untrusted persisted objects from reaching a renderer with missing fields.
 */
export function isPuzzleData(value: unknown): value is PuzzleData {
  if (!isRecord(value) || !isPuzzleType(value.type)) return false;
  if (!isPuzzleDimension(value.width) || !isPuzzleDimension(value.height)) return false;

  const width = value.width as number;
  const height = value.height as number;

  switch (value.type) {
    case 'nurikabe':
    case 'lakes':
      return isCoordinateClueList(value.clues, width, height, (clue) =>
        (clue.value === '?' || isFiniteInteger(clue.value, 0))
      );
    case 'yajilin':
      return isCoordinateClueList(value.clues, width, height, (clue) =>
        (clue.value === '?' || isFiniteInteger(clue.value, 0)) &&
        (clue.direction === 'up' || clue.direction === 'right' || clue.direction === 'down' || clue.direction === 'left')
      );
    case 'koburin':
      return isCoordinateClueList(value.clues, width, height, (clue) =>
        clue.value === '?' || (isFiniteInteger(clue.value, 0) &&
          clue.value <= (value.minesweeper === true ? 8 : 4))
      ) && (value.minesweeper === undefined || typeof value.minesweeper === 'boolean');
    case 'neighbor':
      return width === 9 && height === 9 &&
        isTypedMatrix(value.givens, width, height, (cell) => cell === null || isFiniteInteger(cell, 1) && cell <= 3) &&
        isTypedMatrix(value.grayCells, width, height, (cell) => typeof cell === 'boolean');
    case 'sky-neighbor': {
      const outside = value.outsideGrayCells;
      const clues = value.clues;
      const validOutside = outside === undefined || (
        isRecord(outside) &&
        isTypedMatrix([outside.top], width, 1, (cell) => typeof cell === 'boolean') &&
        isTypedMatrix([outside.bottom], width, 1, (cell) => typeof cell === 'boolean') &&
        isTypedMatrix([outside.left], height, 1, (cell) => typeof cell === 'boolean') &&
        isTypedMatrix([outside.right], height, 1, (cell) => typeof cell === 'boolean')
      );
      return width === 9 && height === 9 &&
        isTypedMatrix(value.givens, width, height, (cell) => cell === null || isFiniteInteger(cell, 1) && cell <= 3) &&
        isTypedMatrix(value.grayCells, width, height, (cell) => typeof cell === 'boolean') &&
        isRecord(clues) &&
        isNullableNumberArray(clues.top, width, 1) && (clues.top as unknown[]).every((clue) => clue === null || (clue as number) >= 1 && (clue as number) <= 3) &&
        isNullableNumberArray(clues.right, height, 1) && (clues.right as unknown[]).every((clue) => clue === null || (clue as number) >= 1 && (clue as number) <= 3) &&
        isNullableNumberArray(clues.bottom, width, 1) && (clues.bottom as unknown[]).every((clue) => clue === null || (clue as number) >= 1 && (clue as number) <= 3) &&
        isNullableNumberArray(clues.left, height, 1) && (clues.left as unknown[]).every((clue) => clue === null || (clue as number) >= 1 && (clue as number) <= 3) &&
        validOutside;
    }
    case 'mintonette':
      return isCoordinateClueList(value.clues, width, height, (clue) => isNullableInteger(clue.value, 0));
    case 'kurarin':
      // Kurarin clues live on the puzzle's dot grid (2w-1 by 2h-1), not
      // only on playable cell coordinates.  A clue may therefore sit on a
      // cell centre, an edge midpoint, or an intersection.
      return isCoordinateClueList(value.clues, width * 2 - 1, height * 2 - 1, (clue) =>
        clue.color === 'black' || clue.color === 'white' || clue.color === 'gray'
      );
    case 'fillomino':
      return isTypedMatrix(value.clues, width, height, (cell) => isNullableInteger(cell, 0));
    case 'slither':
      return isTypedMatrix(value.clues, width, height, (cell) => cell === null || (isFiniteInteger(cell, 0) && cell <= 4));
    case 'wolvesandsheepfences':
      return isTypedMatrix(value.clues, width, height, (cell) =>
        cell === null || cell === 'sheep' || cell === 'wolf' || (isFiniteInteger(cell, 0) && cell <= 4)
      );
    case 'shape-minesweeper':
      return isTypedMatrix(value.clues, width, height, (cell) =>
        cell === null || (isFiniteInteger(cell, 0) && cell <= 8)
      ) && isShapeMinesweeperBank(value.shapes);
    case 'cave':
      // A Cave clue is the number of visible cells in its row/column.  Its
      // useful range is therefore 1..(width + height - 1); null denotes an
      // unnumbered cell.
      return isTypedMatrix(value.clues, width, height, (cell) =>
        cell === null || (isFiniteInteger(cell, 1) && cell <= width + height - 1)
      );
    case 'japanese-arrows':
      return isTypedMatrix(value.clues, width, height, (cell) => cell === null || isFiniteInteger(cell, 1) && cell <= 9) &&
        isTypedMatrix(value.arrows, width, height, (cell) => typeof cell === 'string' && ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'].includes(cell));
    case 'four-winds-with-parks':
      return isTypedMatrix(value.clues, width, height, (cell) => cell === null || isFiniteInteger(cell, 1));
    case 'fourwinds':
      return isTypedMatrix(value.clues, width, height, (cell) => cell === null || isFiniteInteger(cell, 0) && cell <= width + height);
    case 'consecutive-kakuro':
      return isTypedMatrix(value.cells, width, height, (cell) => cell === null || (
        isRecord(cell) && isNullableInteger(cell.right, 0, 45) && isNullableInteger(cell.down, 0, 45)
      )) && isTypedMatrix(value.horizontalBars, height, Math.max(0, width - 1), (cell) => typeof cell === 'boolean') &&
        isTypedMatrix(value.verticalBars, Math.max(0, height - 1), width, (cell) => typeof cell === 'boolean') &&
        isNullableNumberArray(value.topClues, width, 0) && isNullableNumberArray(value.leftClues, height, 0);
    case 'japanese-sums-with-zeroes':
      return isFiniteInteger(value.maxDigit, 1, 9) && isRecord(value.clues) && ['top','right','bottom','left'].every((side) => Array.isArray(value.clues[side])) &&
        (value.clues.top as unknown[]).length === width && (value.clues.bottom as unknown[]).length === width &&
        (value.clues.left as unknown[]).length === height && (value.clues.right as unknown[]).length === height;
    case 'abc-box':
      return isTypedMatrix(value.givens, width, height, (cell) => cell === null || cell === 'A' || cell === 'B' || cell === 'C') && isRecord(value.clues);
    case 'magnets':
      return Array.isArray(value.regions) && value.regions.every((region) =>
          Array.isArray(region) && region.length === 2 && region.every((cell) => isCoordinate(cell, width, height))
        ) &&
        isTypedMatrix(value.givens, width, height, (cell) => cell === null || cell === '+' || cell === '-') &&
        isNullableNumberArray(value.topClues, width, 0) &&
        isNullableNumberArray(value.topMinusClues, width, 0) &&
        isNullableNumberArray(value.leftClues, height, 0) &&
        isNullableNumberArray(value.leftPlusClues, height, 0);
    case 'pills':
      return isTypedMatrix(value.dots, width, height, (cell) => isFiniteInteger(cell, 0) && cell <= 15) &&
        isNullableNumberArray(value.topClues, width, 0) &&
        isNullableNumberArray(value.leftClues, height, 0) &&
        Array.isArray(value.pillValues) && value.pillValues.every((item) => isFiniteInteger(item, 1));
    case 'masyu':
      return isTypedMatrix(value.cells, width, height, (cell) => cell === 0 || cell === 1 || cell === 2);
    case 'place-by-product':
      return isNullableNumberArray(value.rowClues, height, 0) &&
        isNullableNumberArray(value.colClues, width, 0) &&
        Array.isArray(value.pieces) && value.pieces.every((piece: { cells: unknown }) =>
          Array.isArray(piece.cells) && piece.cells.every((cell: unknown) =>
            Array.isArray(cell) && isFiniteInteger(cell[0], 0) && isFiniteInteger(cell[1], 0))) &&
        isTypedMatrix(value.givens, width, height, (cell) => typeof cell === 'boolean');
    case 'tapa':
      return isTypedMatrix(value.clues, width, height, (cell) =>
        cell === null || (Array.isArray(cell) && cell.every((item) => item === '?' || (isFiniteInteger(item, 0) && item <= 8)))
      );
    case 'yinyang':
      return isTypedMatrix(value.givens, width, height, (cell) => cell === null || cell === 0 || cell === 1);
    case 'kropki':
      return isTypedMatrix(value.givens, width, height, (cell) => cell === null || isFiniteInteger(cell, 1)) &&
        isTypedMatrix(value.verticalDots, height, Math.max(0, width - 1), (cell) => cell === null || cell === 'white' || cell === 'black') &&
        isTypedMatrix(value.horizontalDots, Math.max(0, height - 1), width, (cell) => cell === null || cell === 'white' || cell === 'black');
    case 'starbattle':
      return isFiniteInteger(value.starsPerUnit, 1) && isTypedMatrix(value.regionIds, width, height, (cell) => isFiniteInteger(cell, 0));
    case 'heyawake':
    case 'aqre':
      return isTypedMatrix(value.regionIds, width, height, (cell) => isFiniteInteger(cell, 0)) &&
        isCoordinateClueList(value.clues, width, height, (clue) => isFiniteInteger(clue.value, 0));
    case 'nikoji':
      return isTypedMatrix(value.letters, width, height, (cell) => cell === null || typeof cell === 'string');
    case 'akari':
      return isTypedMatrix(value.cells, width, height, (cell) =>
        cell === null || cell === 'black' || (isFiniteInteger(cell, 0) && cell <= 4)
      );
    case 'walkwalk':
      return isTypedMatrix(value.regionIds, width, height, (cell) => isFiniteInteger(cell, 0)) &&
        isCoordinateClueList(value.clues, width, height, (clue) => isFiniteInteger(clue.value, 0));
    case 'lits':
      // -1 marks cells excluded by the encoded puzzle (they are not part of
      // any region and are intentionally left unplayable).
      return isTypedMatrix(value.regionIds, width, height, (cell) => isFiniteInteger(cell, -1));
    case 'magic-summer':
      return isNumberArray(value.numbers, undefined, 1) &&
        isNullableNumberArray(value.rowSums, height, 0) &&
        isNullableNumberArray(value.columnSums, width, 0) &&
        isTypedMatrix(value.cells, width, height, (cell) =>
          cell === null || cell === 'block' || isFiniteInteger(cell, 1)
        ) &&
        (value.clues === undefined || isRecord(value.clues));
    case 'skyscrapers':
      return isNumberArray(value.numbers, width, 1) &&
        isTypedMatrix(value.givens, width, height, (cell) => isNullableInteger(cell, 1)) &&
        isRecord(value.clues) &&
        isNullableNumberArray(value.clues.top, width, 0) &&
        isNullableNumberArray(value.clues.bottom, width, 0) &&
        isNullableNumberArray(value.clues.left, height, 0) &&
        isNullableNumberArray(value.clues.right, height, 0);
    case 'battleship':
      return isNullableNumberArray(value.columnClues, width, 0) &&
        isNullableNumberArray(value.rowClues, height, 0) &&
        isCoordinateClueList(value.cellClues, width, height, (clue) => {
          if (clue.kind === 'water') return clue.segment === undefined;
          return clue.kind === 'ship' &&
            (clue.segment === undefined || BATTLESHIP_SEGMENTS.has(String(clue.segment)));
        }) &&
        isBattleshipFleet(value.fleet);
    case 'domino-search':
      return isTypedMatrix(value.numbers, width, height, (cell) => isNullableInteger(cell, 0)) &&
        Array.isArray(value.dominoes) && value.dominoes.every((pair) =>
          Array.isArray(pair) && pair.length === 2 && isFiniteInteger(pair[0], 0) && isFiniteInteger(pair[1], 0)
        );
    case 'snail':
      return isNumberArray(value.numbers, undefined, 1) &&
        isTypedMatrix(value.cells, width, height, (cell) => cell === null || cell === 'block' || isFiniteInteger(cell, 1)) &&
        (value.start === undefined || isCoordinate(value.start, width, height));
    case 'slovak-sums':
      return isNumberArray(value.numbers, undefined, 1) &&
        isTypedMatrix(value.cells, width, height, (cell) =>
          cell === null || (isRecord(cell) && isNullableInteger(cell.sum, 0) && isFiniteInteger(cell.count, 0))
        );
    case 'kakuro':
      return isTypedMatrix(value.cells, width, height, (cell) =>
        cell === null || (
          isRecord(cell) &&
          isNullableInteger(cell.right, 0, 45) &&
          isNullableInteger(cell.down, 0, 45)
        )
      ) &&
        isNullableNumberArray(value.topClues, width, 0) &&
        (value.topClues as unknown[]).every((clue) => clue === null || (typeof clue === 'number' && clue <= 45)) &&
        isNullableNumberArray(value.leftClues, height, 0) &&
        (value.leftClues as unknown[]).every((clue) => clue === null || (typeof clue === 'number' && clue <= 45));
    default:
      return false;
  }
}

export function getPuzzleTypeFromLink(link: string | undefined | null): PuzzleType | null {
  const dataPart = normalizePuzzLinkDataPart(link);
  const type = dataPart.split('/')[0]?.trim().toLowerCase();
  if (isPuzzleType(type)) {
    return type;
  }

  const aliases: Record<string, PuzzleType> = {
    slitherlink: 'slither',
    battleships: 'battleship',
    'magic-snail': 'snail',
    magic: 'magic-summer',
    slovaksums: 'slovak-sums',
    skyscraper: 'skyscrapers',
    building: 'skyscrapers',
    neighbors: 'neighbor',
    neighbours: 'neighbor',
    neighbour: 'neighbor',
    'sky-neighbors': 'sky-neighbor',
    'sky-neighbours': 'sky-neighbor',
    skyneighbor: 'sky-neighbor',
    skyneighbors: 'sky-neighbor',
    skyneighbours: 'sky-neighbor',
    'sky-neighbour': 'sky-neighbor',
    skyneighbour: 'sky-neighbor',
    shapeminesweeper: 'shape-minesweeper',
    'shape-minesweep': 'shape-minesweeper',
    japanesearrows: 'japanese-arrows',
    japanese: 'japanese-arrows',
    fourwindswithparks: 'four-winds-with-parks',
    consecutivekakuro: 'consecutive-kakuro',
    japanesesumswithzeroes: 'japanese-sums-with-zeroes',
    japanesesums: 'japanese-sums-with-zeroes',
    abcbox: 'abc-box',
    placebyproduct: 'place-by-product',
    pearl: 'masyu',
    mashu: 'masyu',
  };
  if (Object.prototype.hasOwnProperty.call(aliases, type)) {
    return aliases[type];
  }

  return null;
}

export function resolvePuzzleEntry(entry: PuzzleEntry): PuzzleData | null {
  // Accept the lower-case 'puzzlink' spelling too, since hand-edited
  // database entries sometimes use it.
  const link = entry.puzzLink ?? (entry as PuzzleEntry & { puzzlink?: string }).puzzlink;
  return parsePuzzleLink(link);
}

export function parsePuzzleLink(link: string | undefined | null): PuzzleData | null {
  if (typeof link !== 'string' || link.trim() === '') return null;
  const type = getPuzzleTypeFromLink(link);
  if (!type) return null;
  return puzzleRegistry[type].parsePuzzLink(link);
}

export function renderPuzzleBoard(
  puzzle: PuzzleData,
  startTime: number,
  resetToken: number,
  onComplete: (time: number) => void,
  initialSnapshot?: unknown,
  onSnapshotChange?: (snapshot: unknown) => void
): ReactElement {
  const entry = puzzleRegistry[puzzle.type] as PuzzleRegistryEntry<typeof puzzle>;
  return entry.renderBoard({ puzzle, startTime, resetToken, onComplete, initialSnapshot, onSnapshotChange });
}

export function renderPuzzleExample(template: PuzzleTemplate, locale: Locale): ReactElement {
  return puzzleRegistry[template.type].renderExample(template, locale);
}
