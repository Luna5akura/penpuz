export type CellCoord = { row: number; col: number };
export function getCellKey(row: number, col: number): string { return `${row},${col}`; }
export function isPositiveGridSize(w: number, h: number) { return Number.isInteger(w) && Number.isInteger(h) && w > 0 && h > 0; }
export function parsePuzzLinkParts(link: string): string[] {
  let dataPart = link.trim();
  const queryIndex = dataPart.indexOf("?");
  if (queryIndex >= 0) dataPart = dataPart.slice(queryIndex + 1);
  return dataPart.split("/");
}
