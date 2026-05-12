export function sanitizeMatrix<T>(
  candidate: unknown,
  fallback: T[][],
  sanitizeCell: (value: unknown, fallbackCell: T) => T
): T[][] {
  if (!Array.isArray(candidate) || candidate.length !== fallback.length) {
    return fallback.map((row) => [...row]);
  }

  return fallback.map((fallbackRow, rowIndex) => {
    const candidateRow = candidate[rowIndex];
    if (!Array.isArray(candidateRow) || candidateRow.length !== fallbackRow.length) {
      return [...fallbackRow];
    }

    return fallbackRow.map((fallbackCell, colIndex) =>
      sanitizeCell(candidateRow[colIndex], fallbackCell)
    );
  });
}

export function sanitizeStringArray(candidate: unknown): string[] {
  if (!Array.isArray(candidate)) return [];
  return candidate.filter((value): value is string => typeof value === 'string');
}

export function sanitizeNumberRecord(candidate: unknown): Record<string, number> {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(candidate).filter(([, value]) => typeof value === 'number' && Number.isFinite(value))
  );
}
