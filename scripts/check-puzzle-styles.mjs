import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const checkedRoots = [
  'src/puzzles',
  'src/components/examples',
  'src/components/notes/NotePuzzleBoard.tsx',
];
const allowedStyleSources = new Set([
  'src/puzzles/boardTheme.ts',
  'src/puzzles/trialStyles.ts',
]);

const rules = [
  {
    name: 'direct hex color',
    pattern: /#[0-9a-fA-F]{3,8}\b/g,
    message: 'Use woodBoardTheme or trialStyles instead of hard-coded colors.',
  },
  {
    name: 'direct fontWeight',
    pattern: /\bfontWeight\s*[:=]/g,
    message: 'Use boardTypography or a boardTheme text helper instead of direct fontWeight.',
  },
  {
    name: 'fixed fontSize literal',
    pattern: /\bfontSize\s*:\s*['"`]\d+px['"`]/g,
    message: 'Use a boardTheme text helper instead of fixed fontSize pixels.',
  },
  {
    name: 'raw board number font helper',
    pattern: /\bgetBoardNumberFontSize\b/g,
    message: 'Use getBoardTextStyle, getBoardFixedTextStyle, or getBoardSvgTextProps instead.',
  },
  {
    name: 'direct board text Tailwind classes',
    pattern: /\bfont-semibold\s+tabular-nums\b/g,
    message: 'Use boardClassNames instead of direct board text classes.',
  },
  {
    name: 'bold Tailwind text weight',
    pattern: /\bfont-(?:bold|extrabold|black)\b/g,
    message: 'Use boardClassNames or boardTypography instead of direct bold text classes.',
  },
  {
    name: 'legacy dark-cell token',
    pattern: /woodBoardTheme\.shaded(?:Text)?\b/g,
    message: 'Use the canonical woodBoardTheme.darkCell/darkCellText token for dark cells.',
  },
  {
    name: 'independent outlined-cell shadow',
    pattern: /boxShadow\s*:\s*[^,\n]*\binset\b[^,\n]*accentBorder/g,
    message: 'Use BoardCellOutline instead of a renderer-specific inset outline.',
  },
  {
    name: 'literal SVG stroke width',
    pattern: /strokeWidth\s*=\s*(?:['"]\d+(?:\.\d+)?['"]|\{\s*\d+(?:\.\d+)?\s*\})/g,
    message: 'Use a boardTheme stroke-width helper instead of a renderer-specific literal.',
  },
  {
    name: 'literal CSS outline width',
    pattern: /outline\s*:\s*[^,}\n]*\b\d+px\b/g,
    message: 'Use getBoardSelectionStyle from boardTheme for selection outlines.',
  },
  {
    name: 'literal example geometry token',
    pattern: /const\s+(?:CELL_SIZE|CLUE_GUTTER|(?:BOARD_)?GAP|PADDING|DEFAULT_CELL_SIZE)\s*=\s*\d+(?:\.\d+)?\b/g,
    message: 'Use boardLayoutMetrics/commonBoardChrome instead of a per-example geometry literal.',
  },
  {
    name: 'legacy inline board shell',
    pattern: /\binline-(?:grid|block)\b/g,
    message: 'Use the shared fixed board frame/grid helpers; inline board shells produce inconsistent sizing and pointer offsets.',
  },
];

function walk(path) {
  const stat = statSync(path);
  if (stat.isFile()) {
    return /\.(ts|tsx)$/.test(path) ? [path] : [];
  }

  return readdirSync(path).flatMap((entry) => walk(join(path, entry)));
}

function lineAndColumn(source, index) {
  const before = source.slice(0, index);
  const lines = before.split('\n');
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  };
}

const files = checkedRoots.flatMap((item) => walk(join(root, item)));
const violations = [];

for (const file of files) {
  const rel = relative(root, file);
  if (allowedStyleSources.has(rel)) continue;

  const source = readFileSync(file, 'utf8');
  for (const rule of rules) {
    for (const match of source.matchAll(rule.pattern)) {
      const { line, column } = lineAndColumn(source, match.index ?? 0);
      violations.push(`${rel}:${line}:${column} ${rule.name}: ${rule.message}`);
    }
  }

  // Every example that exposes an answer must go through the shared reveal
  // component. This keeps the spoiler mask, confirmation dialog, keyboard
  // handling, and stacking context identical for current and future puzzles.
  if (rel.startsWith('src/components/examples/') && /answerLabel/u.test(source) && !/ExampleAnswerReveal/u.test(source)) {
    violations.push(
      `${rel} answer masking: Example components with answerLabel must use ExampleAnswerReveal.`
    );
  }
}

// A board component must either use one of the shared board primitives or
// explicitly opt into the common frame helper.  This catches a newly added
// puzzle that would otherwise quietly introduce its own sizing/colour system.
const boardComponentFiles = files.filter((file) => {
  const rel = relative(root, file);
  return /^src\/puzzles\/[^/]+\/[^/]+\.tsx$/u.test(rel) && !rel.startsWith('src/puzzles/shared/');
});
for (const file of boardComponentFiles) {
  const rel = relative(root, file);
  const source = readFileSync(file, 'utf8');
  if (!/function\s+\w*Board\b|function\s+\w*Puzzle\b/u.test(source)) continue;
  if (!/(?:getBoardFrameStyle|NumberPlacementBoard|ShadingBoard|YajilinBoard|SlitherlinkBoard)/u.test(source)) {
    violations.push(
      `${rel} board shell: Use getBoardFrameStyle or a shared board primitive (NumberPlacementBoard/ShadingBoard/SlitherlinkBoard).`
    );
  }
}

const boardThemeSource = readFileSync(join(root, 'src/puzzles/boardTheme.ts'), 'utf8');
const answerRevealSource = readFileSync(
  join(root, 'src/components/ExampleAnswerReveal.tsx'),
  'utf8'
);
const answerOverlaySource = readFileSync(
  join(root, 'src/components/ExampleAnswerOverlay.tsx'),
  'utf8'
);
const answerRevealContract = [
  {
    pattern: /className=\{`[^`]*overflow-x-auto/u,
    message: 'ExampleAnswerReveal must own the constrained horizontal overflow container.',
  },
  {
    pattern: /className="relative mx-auto w-max/u,
    message: 'ExampleAnswerReveal must size its frame to the answer content, not the card.',
  },
  {
    pattern: /content\.scrollWidth/u,
    message: 'ExampleAnswerReveal must account for content that overflows an inner renderer.',
  },
  {
    pattern: /ResizeObserver/u,
    message: 'ExampleAnswerReveal must remeasure when a board renderer changes size.',
  },
];
for (const requirement of answerRevealContract) {
  if (!requirement.pattern.test(answerRevealSource)) {
    violations.push(`src/components/ExampleAnswerReveal.tsx answer-mask contract: ${requirement.message}`);
  }
}
if (/bg-black\/(?:\d+|\[[^\]]+\])/u.test(answerOverlaySource) ||
    /rgba?\([^)]*,\s*0?\.?\d+\s*\)/u.test(answerOverlaySource)) {
  violations.push(
    'src/components/ExampleAnswerOverlay.tsx answer-mask contract: The spoiler mask must be fully opaque so solved cells cannot show through.'
  );
}
const requiredStyleLibraryExports = [
  'woodBoardTheme',
  'boardTypography',
  'boardStrokeWidths',
  'boardGeometry',
  'boardControlMetrics',
  'boardLayoutMetrics',
  'boardStyleLibrary',
  'getBoardCellStyle',
  'getBoardTrialCellStyle',
  'getBoardFrameDimensions',
  'getBoardGridStyle',
  'getBoardGridOutlineRect',
  'getBoardBoundaryStrokeMetrics',
  'getBoardNumpadPanelStyle',
  'getBoardNumpadButtonStyle',
  'getBoardNumpadDismissStyle',
  'getBoardNumpadHeaderStyle',
  'getBoardNumpadGridStyle',
  'getBoardModeButtonStyle',
];
for (const exportName of requiredStyleLibraryExports) {
  if (!new RegExp(`export (?:const|function) ${exportName}\\b`, 'u').test(boardThemeSource)) {
    violations.push(`src/puzzles/boardTheme.ts style-library contract: Missing ${exportName}.`);
  }
}
const canonicalDarkCellContract = [
  /const\s+DARK_CELL_BACKGROUND\s*=\s*['"][^'"]+['"]/u,
  /const\s+DARK_CELL_TEXT\s*=\s*['"][^'"]+['"]/u,
  /darkCell\s*:\s*DARK_CELL_BACKGROUND/u,
  /darkCellText\s*:\s*DARK_CELL_TEXT/u,
  /shaded\s*:\s*DARK_CELL_BACKGROUND/u,
  /shadedText\s*:\s*DARK_CELL_TEXT/u,
  /case\s+['"]playerShaded['"][\s\S]*?background:\s*woodBoardTheme\.darkCell/u,
  /case\s+['"]shaded['"][\s\S]*?background:\s*woodBoardTheme\.darkCell/u,
];
for (const requirement of canonicalDarkCellContract) {
  if (!requirement.test(boardThemeSource)) {
    violations.push(
      `src/puzzles/boardTheme.ts dark-cell contract: Missing canonical token declaration (${requirement}).`
    );
  }
}

const skyNeighborCellSizeMatch = boardThemeSource.match(/skyNeighborCellSize\s*:\s*(\d+(?:\.\d+)?)/u);
const skyNeighborCellSize = skyNeighborCellSizeMatch ? Number(skyNeighborCellSizeMatch[1]) : Number.NaN;
if (!Number.isFinite(skyNeighborCellSize) || skyNeighborCellSize < 32 || skyNeighborCellSize > 58) {
  violations.push(
    'src/puzzles/boardTheme.ts sky-neighbor size contract: skyNeighborCellSize must stay between 32px and 58px, matching the shared board scale.'
  );
}
if (!/outlinedCellInsetRatio\s*:\s*0\.08/u.test(boardThemeSource) ||
    !/outlinedCellMinInset\s*:\s*2/u.test(boardThemeSource)) {
  violations.push(
    'src/puzzles/boardTheme.ts outline contract: Keep one shared inset metric for outlined cells.'
  );
}

const outlineComponentSource = readFileSync(
  join(root, 'src/puzzles/shared/BoardCellOutline.tsx'),
  'utf8'
);
if (!/getBoardCellOutlineStyle\s*\(/u.test(outlineComponentSource)) {
  violations.push(
    'src/puzzles/shared/BoardCellOutline.tsx outline contract: The shared component must use getBoardCellOutlineStyle.'
  );
}

const boardFrameStart = boardThemeSource.indexOf('export function getBoardFrameStyle');
const boardFrameEnd = boardThemeSource.indexOf('export function getOutlinedBorderStrokeWidth', boardFrameStart);
const boardFrameHelper = boardFrameStart >= 0 && boardFrameEnd > boardFrameStart
  ? boardThemeSource.slice(boardFrameStart, boardFrameEnd)
  : '';
if (/maxWidth\s*:\s*['"]100%['"]/u.test(boardFrameHelper)) {
  violations.push(
    'src/puzzles/boardTheme.ts getBoardFrameStyle: Do not shrink only the frame around fixed-size cells; use responsive cell sizing or an overflow-x container.'
  );
}

if (violations.length > 0) {
  console.error('Puzzle style contract violations:');
  for (const violation of violations) {
    console.error(`  ${violation}`);
  }
  process.exit(1);
}

console.log('Puzzle style contract passed.');
