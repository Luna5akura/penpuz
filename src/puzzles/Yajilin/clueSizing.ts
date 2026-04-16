export const MOBILE_CLUE_REFERENCE_SIZE = 44;

export function getClueNumberFontSize(cellSize: number) {
  if (cellSize >= MOBILE_CLUE_REFERENCE_SIZE) {
    return Math.max(32, Math.floor(cellSize * 0.7));
  }
  return Math.max(22, Math.floor(cellSize * 0.74));
}
