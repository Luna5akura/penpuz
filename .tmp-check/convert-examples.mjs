import fs from 'node:fs';

const files = {
  'PlaceByProductExample.tsx': ['PlaceByProductExample'],
  'SkyNeighborExample.tsx': ['SkyNeighborDiagram', 'SkyNeighborExample'],
  'StarbattleExample.tsx': ['StarbattleExample'],
  'TapaExample.tsx': ['TapaExample'],
  'WalkwalkExample.tsx': ['StaticWalkwalkBoard', 'WalkwalkExample'],
  'YajilinExample.tsx': ['YajilinExample'],
};


const dir = 'src/components/examples';

function findBodyBrace(source, funcName) {
  const start = source.indexOf(`function ${funcName}(`);
  if (start < 0) return { index: -1 };
  // skip to the opening paren
  const parenIdx = source.indexOf('(', start);
  let depth = 0;
  let i = parenIdx;
  for (; i < source.length; i++) {
    const ch = source[i];
    if (ch === '(') depth++;
    else if (ch === ')') { depth--; if (depth === 0) break; }
  }
  // from after the param list: find the body brace at outer level
  let braceDepth = 0;
  for (let j = i + 1; j < source.length; j++) {
    const ch = source[j];
    if (ch === '{') {
      if (braceDepth === 0) {
        // could be a type annotation or the body; a type annotation is
        // followed by more signature chars before the body '{' at depth 0.
        // The FIRST '{' at depth 0 after ')' is either type start or body.
        // If it is a type, it will close again at depth 0, then the next
        // depth-0 '{' is the body.
        const before = source.slice(i + 1, j);
        if (before.includes(':')) {
          // has a type annotation: find the matching close, then the body
          braceDepth = 1;
          continue;
        }
        return { index: j };
      }
      braceDepth++;
    } else if (ch === '}') {
      braceDepth--;
      if (braceDepth === 0) {
        // type annotation closed; next depth-0 '{' is the body
        for (let k = j + 1; k < source.length; k++) {
          if (source[k] === '{') return { index: k };
          if (source[k] !== ' ' && source[k] !== '\t' && source[k] !== '\n' && source[k] !== '\r') break;
        }
      }
    }
  }
  return { index: -1 };
}

for (const [file, components] of Object.entries(files)) {
  const path = `${dir}/${file}`;
  let source = fs.readFileSync(path, 'utf8');
  const original = source;

  // 1. remove the module-level CELL_SIZE const
  source = source.replace(/^const CELL_SIZE = boardLayoutMetrics\.[a-zA-Z]+;\n/m, '');

  // 2. insert the hook as the first statement of each listed component
  for (const name of components) {
    const { index } = findBodyBrace(source, name);
    if (index < 0) throw new Error(`${file}: cannot find body of ${name}`);
    source = source.slice(0, index + 1) + `\n  const CELL_SIZE = useExampleCellSize();` + source.slice(index + 1);
  }

  // 3. add the import at the top of the file
  source = `import { useExampleCellSize } from './exampleCellSizeContext';\n` + source;

  if (source !== original) {
    fs.writeFileSync(path, source);
    console.log(`converted ${file}`);
  }
}
