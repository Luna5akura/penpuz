import { parseKropkiLink, validateKropki } from './kutils.ts';
const url = 'http://localhost:8080/p.html?kropki/4/4/1....2.....3..2./.b.bww.wb.b./.wwwe.w.wwww';
const puzzle = parseKropkiLink(url);
console.log('givens:');
for (const row of puzzle.givens) console.log(row.map((v) => (v === null ? '.' : v)).join(''));
console.log('vDots:', puzzle.verticalDots.map((r) => r.map((d) => (d ? d[0] : '.')).join('')).join('/'));
console.log('hDots:', puzzle.horizontalDots.map((r) => r.map((d) => (d ? d[0] : '.')).join('')).join('/'));
const solution = [[1,4,3,2],[3,2,1,4],[2,1,4,3],[4,3,2,1]];
const result = validateKropki(solution, puzzle);
console.log('valid:', result.valid, 'message:', result.message, 'bad:', result.badCells.length);
// also a broken case
const broken = [[1,4,3,2],[3,2,1,4],[2,1,4,3],[4,3,2,2]];
console.log('broken valid:', validateKropki(broken, puzzle).valid, validateKropki(broken, puzzle).message);
