/**
 * Split an instruction against the actual space available to the reader.
 * The caller supplies a DOM measurement; this function only owns the
 * word/character boundaries so it can be tested without a browser.
 */
export function paginateStepText(text: string, fits: (candidate: string) => boolean): string[] {
  const tokens = text.trim().match(/\S+\s*/gu) ?? [];
  const pages: string[] = [];
  let start = 0;

  while (start < tokens.length) {
    let low = start + 1;
    let high = tokens.length;
    let end = start;

    while (low <= high) {
      const middle = Math.floor((low + high) / 2);
      const candidate = tokens.slice(start, middle).join("").trim();
      if (fits(candidate)) {
        end = middle;
        low = middle + 1;
      } else {
        high = middle - 1;
      }
    }

    if (end > start) {
      pages.push(tokens.slice(start, end).join("").trim());
      start = end;
      continue;
    }

    // One word is taller than the stage, usually because it is a long URL
    // or an unbroken OCR token. Split by Unicode code point and always
    // consume at least one point, even on an exceptionally short viewport.
    const token = tokens[start];
    const word = token.trimEnd();
    const characters = Array.from(word);
    low = 1;
    high = characters.length;
    let characterEnd = 0;

    while (low <= high) {
      const middle = Math.floor((low + high) / 2);
      if (fits(characters.slice(0, middle).join(""))) {
        characterEnd = middle;
        low = middle + 1;
      } else {
        high = middle - 1;
      }
    }

    characterEnd = Math.max(1, characterEnd);
    pages.push(characters.slice(0, characterEnd).join(""));
    const remaining = characters.slice(characterEnd).join("");
    if (remaining) tokens[start] = remaining + token.slice(word.length);
    else start += 1;
  }

  return pages;
}

/** Keep the same approximate word when text reflows after rotation or resize. */
export function remapPageIndex(previousPages: string[], previousIndex: number, nextPages: string[]): number {
  if (nextPages.length === 0) return 0;
  const consumedBefore = previousPages.slice(0, previousIndex)
    .reduce((length, page) => length + page.length + 1, 0);
  let consumed = 0;
  for (let index = 0; index < nextPages.length; index += 1) {
    consumed += nextPages[index].length + 1;
    if (consumedBefore < consumed) return index;
  }
  return nextPages.length - 1;
}
