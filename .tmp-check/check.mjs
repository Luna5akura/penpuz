// Verbatim copy of the decoding logic from src/puzzles/FourWinds/utils.ts
function parsePuzzLinkParts(link) {
  let dataPart = link.trim();
  const q = dataPart.indexOf('?');
  if (q >= 0) dataPart = dataPart.slice(q + 1);
  return dataPart.split('/');
}
function isPositiveGridSize(w, h) { return Number.isInteger(w) && Number.isInteger(h) && w > 0 && h > 0; }

function readNumber16(encoded, index) {
  const char = encoded[index];
  if (!char) return null;
  if (char === '.') return { value: null, consumed: 1 };
  if (/^[0-9a-f]$/u.test(char)) {
    return { value: Number.parseInt(char, 16), consumed: 1 };
  }
  const prefixedLengths = { '-': 2, '+': 3, '=': 3, '%': 3, '@': 3, '*': 4, '$': 5 };
  const digitCount = prefixedLengths[char];
  if (digitCount === undefined) return null;
  const digits = encoded.slice(index + 1, index + 1 + digitCount);
  if (digits.length !== digitCount || !/^[0-9a-f]+$/u.test(digits)) return null;
  let value = Number.parseInt(digits, 16);
  if (char === '=') value += 4096;
  else if (char === '%' || char === '@') value += 8192;
  else if (char === '*') value += 12240;
  else if (char === '$') value += 77776;
  return { value, consumed: digitCount + 1 };
}

function decodeFourWindsClues(encoded, width, height) {
  const clues = Array.from({ length: height }, () => Array(width).fill(null));
  const cellCount = width * height;
  let cellIndex = 0;
  let stringIndex = 0;
  while (stringIndex < encoded.length && cellIndex < cellCount) {
    const char = encoded[stringIndex];
    if (char >= 'g' && char <= 'z') {
      const skipped = Number.parseInt(char, 36) - 15;
      if (cellIndex + skipped > cellCount) return null;
      cellIndex += skipped;
      stringIndex += 1;
      continue;
    }
    const decoded = readNumber16(encoded, stringIndex);
    if (!decoded) return null;
    if (decoded.value !== null) {
      if (decoded.value < 0 || decoded.value > width + height) return null;
      clues[Math.floor(cellIndex / width)][cellIndex % width] = decoded.value;
    }
    cellIndex += 1;
    stringIndex += decoded.consumed;
  }
  return cellIndex === cellCount && stringIndex === encoded.length ? clues : null;
}

function decodeFourWindsNumber10Clues(encoded, width, height) {
  const clues = Array.from({ length: height }, () => Array(width).fill(null));
  const cellCount = width * height;
  let cell = 0;
  let index = 0;
  while (index < encoded.length && cell < cellCount) {
    const char = encoded[index];
    if (char >= 'a' && char <= 'z') {
      cell += Number.parseInt(char, 36) - 9;
      index += 1;
      continue;
    }
    if (char === '.') { cell += 1; index += 1; continue; }
    if (char >= '0' && char <= '9') {
      const digits = encoded.slice(index, index + 2);
      if (!/^[0-9]{2}$/u.test(digits)) return null;
      const value = Number(digits);
      if (value < 0 || value > width + height) return null;
      clues[Math.floor(cell / width)][cell % width] = value;
      cell += 1;
      index += 2;
      continue;
    }
    return null;
  }
  return index === encoded.length && cell <= cellCount ? clues : null;
}

function isConsistentFourWindsClues(clues, width, height) {
  let sum = 0, clueCount = 0;
  for (let r = 0; r < height; r++) for (let c = 0; c < width; c++) {
    const clue = clues[r][c];
    if (clue === null) continue;
    sum += clue; clueCount += 1;
  }
  return sum === width * height - clueCount;
}

function parseFourWindsLink(link) {
  try {
    const parts = parsePuzzLinkParts(link);
    if (parts[0]?.toLowerCase() !== 'fourwinds' || parts.length < 4) return null;
    const width = Number(parts[1]);
    const height = Number(parts[2]);
    if (!isPositiveGridSize(width, height)) return null;
    const encoded = parts.slice(3).join('/').replace(/\/+$/u, '');
    if (!encoded) return null;
    const number16Clues = decodeFourWindsClues(encoded, width, height);
    if (number16Clues && isConsistentFourWindsClues(number16Clues, width, height)) {
      return { type: 'fourwinds', width, height, clues: number16Clues };
    }
    const number10Clues = decodeFourWindsNumber10Clues(encoded, width, height);
    if (number10Clues && isConsistentFourWindsClues(number10Clues, width, height)) {
      return { type: 'fourwinds', width, height, clues: number10Clues };
    }
    const clues = number16Clues ?? number10Clues;
    return clues ? { type: 'fourwinds', width, height, clues } : null;
  } catch { return null; }
}

function dump(clues) {
  if (!clues) { console.log('null'); return; }
  for (const row of clues) console.log(row.map(v => (v === null ? '.' : String(v))).join(' '));
}

const urls = [
  'http://localhost:8080/p.html?fourwinds/10/10/b03a05b03g05d03f04a02c05n05b08n06c02a08f08d09g02b02a02b',
  'http://localhost:8080/p.html?fourwinds/9/9/2g8h2h2g2h4h2u4i4i4i4i4u2h2h2g4h2h6g2',
  'http://localhost:8080/p.html?fourwinds/9/9/b01c03f09d03a05e01c03f07b00b05f03c03e05a01d07f03c05b',
  'http://localhost:8080/p.html?fourwinds/10/10/a01d03g05d05b03d05b03d03g05d03b05d05g05d05b03d05b03d03g03d07a',
];
for (const u of urls) {
  console.log('==', u.split('?')[1]);
  const d = parseFourWindsLink(u);
  dump(d?.clues ?? null);
  console.log();
}

// OLD url from git HEAD
const oldUrl = 'http://localhost:8080/p.html?fourwinds/10/10/h3g5i3l5j3m42i5t5h8t6i2g8l8j9m2h2h2g';
console.log('== OLD url (git HEAD)');
dump(parseFourWindsLink(oldUrl)?.clues ?? null);
