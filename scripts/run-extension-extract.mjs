// Runs extension/extract.js against an HTML string in Node, through a tiny DOM over cheerio
// that covers only the browser API the script uses. Shared by tests and the extraction benchmark.
import { runInNewContext } from "node:vm";
import { load } from "cheerio";

export function runExtensionExtract(script, html, href) {
  const $ = load(html);
  const wrap = (node) => ({
    get textContent() { return $(node).text(); },
    getAttribute: (name) => $(node).attr(name) ?? null,
    querySelectorAll: (selector) => $(node).find(selector).toArray().map(wrap),
  });
  return runInNewContext(script, {
    URL,
    location: { href, hostname: new URL(href).hostname },
    document: {
      querySelectorAll: (selector) => $(selector).toArray().map(wrap),
      createElement: () => ({
        value: "",
        set innerHTML(value) { this.value = load(value).root().text(); },
        get textContent() { return this.value; },
      }),
    },
  });
}
