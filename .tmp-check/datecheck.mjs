import { getPuzzleByDateStr } from '../src/puzzles/database.ts';
const data = getPuzzleByDateStr('2026-08-22');
console.log('type:', data?.puzzle.type, 'index:', data?.databaseIndex);
if (data && data.puzzle.type === 'battleship') {
  console.log('clues:', JSON.stringify(data.puzzle.cellClues));
  console.log('fleet:', JSON.stringify(data.puzzle.fleet.map((s) => s.width + 'x' + s.height)));
} else {
  console.log('puzzle data:', JSON.stringify(data?.puzzle).slice(0, 300));
}
