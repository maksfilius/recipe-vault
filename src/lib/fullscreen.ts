// Cooking mode asks for real fullscreen so the browser chrome gets out of the
// way at the stove. It is strictly an enhancement: iPhone Safari has no
// Fullscreen API for regular elements, and there the equivalent is installing
// the PWA, which already runs without chrome.

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

type FullscreenDocument = Document & {
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitFullscreenElement?: Element | null;
};

function getRoot() {
  return document.documentElement as FullscreenElement;
}

export function isFullscreenSupported() {
  if (typeof document === "undefined") return false;

  const root = getRoot();
  return typeof root.requestFullscreen === "function" || typeof root.webkitRequestFullscreen === "function";
}

export function isFullscreenActive() {
  if (typeof document === "undefined") return false;

  const doc = document as FullscreenDocument;
  return Boolean(doc.fullscreenElement ?? doc.webkitFullscreenElement);
}

/**
 * Must be called from within a user gesture — browsers reject the request
 * otherwise, and the transient activation does not survive a React commit.
 */
export async function requestAppFullscreen() {
  if (!isFullscreenSupported() || isFullscreenActive()) return;

  const root = getRoot();

  try {
    await (root.requestFullscreen?.() ?? root.webkitRequestFullscreen?.());
  } catch {
    // Denied, or the gesture already expired. Cooking mode works either way.
  }
}

export async function exitAppFullscreen() {
  if (!isFullscreenActive()) return;

  const doc = document as FullscreenDocument;

  try {
    await (doc.exitFullscreen?.() ?? doc.webkitExitFullscreen?.());
  } catch {
    // Nothing to recover from: leaving cooking mode is what matters.
  }
}
