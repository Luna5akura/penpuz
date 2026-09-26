import { getPuzzleByDateStr } from './db.ts';
const data = getPuzzleByDateStr('2026-08-22');
console.log('type:', data?.puzzle?.type, 'index:', data?.databaseIndex);
if (data?.puzzle && data.puzzle.type === 'battleship') {
  console.log('size:', data.puzzle.width + 'x' + data.puzzle.height);
  console.log('clues:', JSON.stringify(data.puzzle.cellClues));
}
