import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const script = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");

function fetchHandler() {
  const listeners = new Map<string, (event: unknown) => void>();
  const caches = { open: async () => ({ match: async () => undefined, put: async () => {} }), match: async () => undefined };
  runInNewContext(script, { URL, caches, fetch: async () => new Response(""), self: { location: { origin: "https://keepandcook.com" }, addEventListener: (type: string, listener: (event: unknown) => void) => listeners.set(type, listener) } });
  return (url: string) => {
    let handled = false;
    listeners.get("fetch")!({ request: { method: "GET", url, mode: "no-cors", destination: "image" }, respondWith() { handled = true; } });
    return handled;
  };
}

test("service worker caches our photos but leaves recipe sites' photos to the browser", () => {
  const handles = fetchHandler();
  assert.equal(handles("https://keepandcook.com/icons/icon-192.png"), true);
  assert.equal(handles("https://abc.supabase.co/storage/v1/object/public/recipe-images/u/p.webp"), true);
  // Fetching this from the worker is blocked by connect-src, which broke draft previews in the editor.
  assert.equal(handles("https://images.101cookbooks.com/Spicy-Rainbow-Chop-Salad-h.jpg"), false);
});
