// Renders scripts/store/frames.html into the Chrome Web Store graphics in docs/store/.
// Pass frame names (read cook save devices tile) to render only those. Run capture-screens.mjs first; needs the static server on KC_STATIC_URL and Chrome on KC_CDP_PORT.
import { writeFile } from "node:fs/promises";
import sharp from "sharp";
import { connect } from "./cdp.mjs";

const statics = (process.env.KC_STATIC_URL || "http://127.0.0.1:8765").replace(/\/$/, "");
const frames = [["read", "1-read.png"], ["cook", "2-cook.png"], ["save", "3-save.png"], ["devices", "4-devices.png"], ["tile", "promo-tile-440x280.png"]];
const page = await connect();
await page.beforeLoad(null);
const only = process.argv.slice(2);
for (const [frame, file] of frames.filter(([frame]) => !only.length || only.includes(frame))) {
  const [width, height] = frame === "tile" ? [440, 280] : [1280, 800];
  await page.viewport(width, height, 1, false);
  await page.open(`${statics}/scripts/store/frames.html?frame=${frame}`, "[...document.images].every((img) => img.naturalWidth > 0)");
  // The store wants 24-bit images without alpha.
  const png = await sharp(await page.png({ x: 0, y: 0, width, height })).flatten({ background: "#f3ebe2" }).removeAlpha().png({ compressionLevel: 9 }).toBuffer();
  await writeFile(new URL(`../../docs/store/${file}`, import.meta.url), png);
  const meta = await sharp(png).metadata();
  process.stdout.write(`docs/store/${file} ${meta.width}×${meta.height} channels=${meta.channels} ${Math.round(png.length / 1024)} KB\n`);
}
page.close();
