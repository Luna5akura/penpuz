import { parseFourWindsLink } from './src/utils.ts';
const urls = [
  'http://localhost:8080/p.html?fourwinds/10/10/b03a05b03g05d03f04a02c05n05b08n06c02a08f08d09g02b02a02b',
  'http://localhost:8080/p.html?fourwinds/9/9/02a08b02b02a02b04b02o04c04c04c04c04o02b02b02a04b02b06a02',
  'http://localhost:8080/p.html?fourwinds/9/9/b01c03f09d03a05e01c03f07b00b05f03c03e05a01d07f03c05b',
  'http://localhost:8080/p.html?fourwinds/10/10/a01d03g05d05b03d05b03d03g05d03b05d05g05d05b03d05b03d03g03d07a',
];
for (const u of urls) {
  console.log('==', u.split('?')[1]);
  const d = parseFourWindsLink(u);
  if (!d) { console.log('NULL'); continue; }
  for (const row of d.clues) console.log(row.map(v => (v === null ? '.' : String(v))).join(' '));
  console.log();
}
