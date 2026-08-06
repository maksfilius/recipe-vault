// Regenerates the PWA icons from the real logo on a flat brand background.
// Run with: node scripts/generate-icons.mjs
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const LOGO = path.join(ROOT, "src/assets/Logo.svg");
const OUT = path.join(ROOT, "public/icons");

// theme_color from the manifest, so the icon matches the app chrome.
const BACKGROUND = "#c2410c";

// A plain icon may fill most of the square; the OS applies its own mask. A
// maskable icon must survive a circle of 80% diameter, so it needs more room.
const TARGETS = [
  { file: "icon-192.png", size: 192, logoRatio: 0.62 },
  { file: "icon-512.png", size: 512, logoRatio: 0.62 },
  { file: "icon-maskable-512.png", size: 512, logoRatio: 0.46 },
  { file: "apple-touch-icon.png", size: 180, logoRatio: 0.62 },
];

const logo = await readFile(LOGO);
await mkdir(OUT, { recursive: true });

for (const { file, size, logoRatio } of TARGETS) {
  const logoWidth = Math.round(size * logoRatio);
  const rendered = await sharp(logo, { density: 600 })
    .resize({ width: logoWidth, fit: "inside", withoutEnlargement: false })
    .png()
    .toBuffer();

  const output = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BACKGROUND,
    },
  })
    .composite([{ input: rendered, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toBuffer();

  await writeFile(path.join(OUT, file), output);
  console.log(`${file.padEnd(24)} ${size}x${size}  logo ${logoWidth}px  ${output.byteLength} bytes`);
}
