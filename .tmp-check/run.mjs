import { parseYinYangLink, validateYinYang } from './utils.ts';
// encode the 7x7 example: values 0/1/2, 3 per base27 digit
const sol = [
  'WWWWBWW','WBWBBBW','WBWWWBW','WBWBWBW','WBWBWBW','WBBBBBW','WWWWWWW',
];
const givens = [
  '....B..','.B.B...','.......','.....B.','.......','.......','.......',
];
const vals = [];
for (const row of sol) for (const ch of row) vals.push(ch === 'B' ? 2 : 1);
let data = '';
for (let i = 0; i < vals.length; i += 3) {
  let d = 0;
  for (let k = 0; k < 3; k++) d += (vals[i + k] ?? 0) * [9, 3, 1][k];
  data += d.toString(27);
}
// puzzle URL with givens only
const gvals = [];
for (const row of givens) for (const ch of row) gvals.push(ch === 'B' ? 2 : 0);
let gdata = '';
for (let i = 0; i < gvals.length; i += 3) {
  let d = 0;
  for (let k = 0; k < 3; k++) d += (gvals[i + k] ?? 0) * [9, 3, 1][k];
  gdata += d.toString(27);
}
const url = `http://localhost:8080/p.html?yinyang/7/7/${gdata}`;
const puzzle = parseYinYangLink(url);
console.log('parsed givens:');
for (const row of puzzle.givens) console.log(row.map((v) => (v === null ? '.' : v)).join(''));
const grid = sol.map((row) => row.split('').map((ch) => (ch === 'B' ? 1 : 2)));
const result = validateYinYang(grid, puzzle);
console.log('valid:', result.valid, 'message:', result.message, 'bad:', result.badCells.length);
