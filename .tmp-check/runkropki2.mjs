import { parseKropkiLink } from './kutils.ts';
const pzprUrl = 'https://pzprxs.vercel.app/p?kropki/6/6/1il0906369i2206i0226';
const puzzle = parseKropkiLink(pzprUrl);
console.log('size:', puzzle.width + 'x' + puzzle.height);
console.log('givens:', puzzle.givens.flat().filter((v) => v !== null).length, 'given cells');
console.log('vDots:');
for (const row of puzzle.verticalDots) console.log(row.map((d) => (d ? d[0] : '.')).join(''));
console.log('hDots:');
for (const row of puzzle.horizontalDots) console.log(row.map((d) => (d ? d[0] : '.')).join(''));
// my custom format still works
const custom = parseKropkiLink('http://localhost:8080/p.html?kropki/4/4/1....2.....3..2./.b.bww.wb.b./.wwwe.w.wwww');
console.log('custom format:', custom.width + 'x' + custom.height, 'given cells:', custom.givens.flat().filter((v) => v !== null).length);
