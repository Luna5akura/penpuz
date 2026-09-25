import { parseTapaLink } from './src/puzzles/Tapa/utils.ts';
import { parsePuzzLinkParts } from './src/puzzles/gridUtils.ts';
const url = 'http://localhost:8080/p.html?tapa/5/5/j1hbqoabh.j';
const data = parseTapaLink(url);
console.log(JSON.stringify(data, null, 1));
