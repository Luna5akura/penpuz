export function safeSetPointerCapture(target: Element | null, pointerId: number) {
  if (!target || !('setPointerCapture' in target)) return false;

  try {
    (target as Element & { setPointerCapture(pointerId: number): void }).setPointerCapture(pointerId);
    return true;
  } catch {
    return false;
  }
}
