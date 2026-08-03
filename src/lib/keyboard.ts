export function getKeyboardDigit(event: KeyboardEvent): number | null {
  if (/^[0-9]$/.test(event.key)) {
    return Number(event.key);
  }

  const numpadMatch = /^Numpad([0-9])$/.exec(event.code);
  return numpadMatch ? Number(numpadMatch[1]) : null;
}

export function isKeyboardInputTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  if (target instanceof HTMLElement && target.isContentEditable) return true;

  return target.closest(
    'input, textarea, select, button, a, [contenteditable="true"], [role="textbox"]'
  ) !== null;
}
