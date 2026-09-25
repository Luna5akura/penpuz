import { parseBattleshipLink } from './utils.ts';
const p = parseBattleshipLink('https://pzprxs.vercel.app/p?battleship/9/9/234223211141152114zzg6zy//d');
console.log('clues:', JSON.stringify(p.cellClues));
console.log('fleet:', p.fleet.map((s) => s.width + 'x' + s.height));
