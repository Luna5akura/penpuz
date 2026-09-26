import { parseBattleshipLink } from './utils.ts';
const links = [
  'https://pzprxs.vercel.app/p?battleship/9/9/234223211141152114zzg6zy//d',
  'https://pzprxs.vercel.app/p?battleship/9/9/111622223141114161zg5zzy//d',
  'https://luna5akura.github.io/Atol-Solver/p.html?battleship/10/10/12323241111141323212zh5zg5zg5zs//d',
  'http://localhost:8080/p.html?battleship/10/10/2h4h6h4h1g35g3hi0n0g0n0g0h0n0j0i0g0h0g0i0j0n0h0g0n0g0n0i//d',
];
for (const link of links) {
  const p = parseBattleshipLink(link);
  console.log('---', p.width + 'x' + p.height);
  console.log('clues:', JSON.stringify(p.cellClues));
}
