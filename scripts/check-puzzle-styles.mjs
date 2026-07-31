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
}

if (violations.length > 0) {
  console.error('Puzzle style contract violations:');
  for (const violation of violations) {
    console.error(`  ${violation}`);
  }
  process.exit(1);
}

console.log('Puzzle style contract passed.');
