export function safeSetPointerCapture(target: Element | null, pointerId: number) {
  if (!target || !('setPointerCapture' in target)) return false;

  try {
    (target as Element & { setPointerCapture(pointerId: number): void }).setPointerCapture(pointerId);
    return true;
  } catch {
    return false;
  }
}

/** Long-press duration and movement tolerance shared by touch gestures. */
export const LONG_PRESS_MS = 450;
export const LONG_PRESS_MOVE_TOLERANCE = 10;

/** Short vibration used as tactile feedback when a long-press action fires. */
export function triggerHapticFeedback() {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(12);
    }
  } catch {
    // Haptics are optional; ignore unsupported or blocked environments.
  }
}
