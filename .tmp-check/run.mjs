import { parseFourWindsLink } from './src/utils.ts';
const url = 'http://localhost:8080/p.html?fourwinds/10/10/b03a05b03g05d03f04a02c05n05b08n06c02a08f08d09g02b02a02b';
const data = parseFourWindsLink(url);
if (!data) { console.log('NULL'); } else {
  for (const row of data.clues) console.log(row.map(v => (v === null ? '.' : String(v))).join(' '));
}
