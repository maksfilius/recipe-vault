// When focus leaves a small dropdown menu, close it only if focus went somewhere else.
// Safari (iPhone and Mac) does not focus a tapped button, so a tap on a menu item blurs to
// nothing (relatedTarget null); closing then would unmount the item before its click fires.
// Taps outside the menu are handled separately by a pointerdown listener.
export function shouldCloseMenuOnBlur(menu: { contains: (node: never) => boolean }, relatedTarget: unknown): boolean {
  return relatedTarget !== null && !menu.contains(relatedTarget as never);
}
