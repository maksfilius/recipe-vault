(() => {
  function paginate(text, fits) {
    const tokens = text.trim().match(/\S+\s*/gu) ?? [];
    const pages = [];
    let start = 0;
    while (start < tokens.length) {
      let low = start + 1;
      let high = tokens.length;
      let end = start;
      while (low <= high) {
        const middle = Math.floor((low + high) / 2);
        const candidate = tokens.slice(start, middle).join("").trim();
        if (fits(candidate)) { end = middle; low = middle + 1; }
        else high = middle - 1;
      }
      if (end > start) {
        pages.push(tokens.slice(start, end).join("").trim());
        start = end;
        continue;
      }
      const token = tokens[start];
      const word = token.trimEnd();
      const characters = Array.from(word);
      low = 1;
      high = characters.length;
      let characterEnd = 0;
      while (low <= high) {
        const middle = Math.floor((low + high) / 2);
        if (fits(characters.slice(0, middle).join(""))) { characterEnd = middle; low = middle + 1; }
        else high = middle - 1;
      }
      characterEnd = Math.max(1, characterEnd);
      pages.push(characters.slice(0, characterEnd).join(""));
      const remaining = characters.slice(characterEnd).join("");
      if (remaining) tokens[start] = remaining + token.slice(word.length);
      else start += 1;
    }
    return pages;
  }

  function remap(before, index, after) {
    if (!after.length) return 0;
    const consumedBefore = before.slice(0, index).reduce((sum, page) => sum + page.length + 1, 0);
    let consumed = 0;
    for (let nextIndex = 0; nextIndex < after.length; nextIndex += 1) {
      consumed += after[nextIndex].length + 1;
      if (consumedBefore < consumed) return nextIndex;
    }
    return after.length - 1;
  }

  const groups = [
    { multiplier: 3600, pattern: "hours?|hrs?|h|stunden?|std\\.?|часов|часа|часу|час|ч" },
    { multiplier: 60, pattern: "minutes?|mins?|min\\.?|m|minuten?|минуты|минуту|минут|мин\\.?|м" },
    { multiplier: 1, pattern: "seconds?|secs?|sec\\.?|sekunden?|секунды|секунду|секунд|сек\\.?" },
  ];
  const number = String.raw`\d{1,3}(?:[.,]\d{1,2})?`;
  const units = groups.map(({ pattern }) => pattern).join("|");
  const pattern = new RegExp(String.raw`(${number})\s*(?:[-–—]|\bto\b|\bдо\b)?\s*(?:${number})?\s*(${units})(?![\p{L}\d])`, "giu");
  function durationLabel(seconds) {
    if (seconds < 60) return `${seconds} s`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    return minutes % 60 ? `${hours} h ${minutes % 60} min` : `${hours} h`;
  }
  function durations(text) {
    const found = [];
    const seen = new Set();
    for (const match of text.matchAll(pattern)) {
      const group = groups.find(({ pattern: groupPattern }) => new RegExp(`^(?:${groupPattern})$`, "iu").test(match[2]));
      if (!group) continue;
      const amount = Number.parseFloat(match[1].replace(",", "."));
      const seconds = Math.round(amount * group.multiplier);
      if (seconds < 5 || seconds > 12 * 3600 || seen.has(seconds)) continue;
      seen.add(seconds);
      found.push({ label: durationLabel(seconds), seconds });
      if (found.length === 3) break;
    }
    return found;
  }
  function countdown(seconds) {
    const safe = Math.max(0, Math.ceil(seconds));
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const rest = safe % 60;
    const pad = (value) => String(value).padStart(2, "0");
    return hours ? `${hours}:${pad(minutes)}:${pad(rest)}` : `${minutes}:${pad(rest)}`;
  }
  // Kitchen-timer alarm, kept identical to src/lib/alarm-sound.ts (tests/alarm-sound.test.mts compares them):
  // three 350 ms beeps, each with its own attack and decay, on an 880 Hz tone with a quieter fifth above.
  // Peak level 0.6 stays below clipping. Resolves false when audio is unavailable or the browser blocks it.
  const ALARM = { beeps: 3, length: 0.35, gap: 0.15, attack: 0.012, hold: 0.18, tones: [[880, 0.4], [1320, 0.2]] };
  async function alarm(context) {
    if (!context) return false;
    try {
      if (context.state !== "running") {
        // resume() stays pending when autoplay is blocked, so do not wait on it for long.
        await Promise.race([context.resume(), new Promise((resolve) => setTimeout(resolve, 400))]);
        if (context.state !== "running") return false;
      }
      const start = context.currentTime + 0.03;
      for (let beep = 0; beep < ALARM.beeps; beep += 1) {
        const at = start + beep * (ALARM.length + ALARM.gap);
        const envelope = context.createGain();
        envelope.gain.setValueAtTime(0, at);
        envelope.gain.linearRampToValueAtTime(1, at + ALARM.attack);
        envelope.gain.setValueAtTime(1, at + ALARM.hold);
        envelope.gain.exponentialRampToValueAtTime(0.001, at + ALARM.length);
        envelope.connect(context.destination);
        for (const [frequency, level] of ALARM.tones) {
          const oscillator = context.createOscillator();
          const mix = context.createGain();
          oscillator.type = "sine";
          oscillator.frequency.value = frequency;
          mix.gain.value = level;
          oscillator.connect(mix);
          mix.connect(envelope);
          oscillator.start(at);
          oscillator.stop(at + ALARM.length + 0.02);
        }
      }
      return true;
    } catch {
      return false;
    }
  }
  globalThis.keepAndCookReaderUtils = { paginate, remap, durations, countdown, alarm };
})();
