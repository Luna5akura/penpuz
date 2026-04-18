import { getBoardNumberFontSize } from '../boardTheme';

export const MOBILE_CLUE_REFERENCE_SIZE = 44;

export function getClueNumberFontSize(cellSize: number) {
  if (cellSize >= MOBILE_CLUE_REFERENCE_SIZE) {
    return getBoardNumberFontSize(cellSize, 0.68, 22);
  }
  return getBoardNumberFontSize(cellSize, 0.7, 22);
}
