// Downscales and re-encodes the scraped screenshots to webp so the repo stays
// a sane size. Non-images (txt/xlsx/pdf/svg) are left exactly as they are.
import { readFileSync, writeFileSync, unlinkSync, statSync, existsSync } from "node:fs";
import sharp from "sharp";

const local = JSON.parse(readFileSync("scripts/localassets.json", "utf8"));
const MAX_WIDTH = 1600;
let before = 0;
let after = 0;
let converted = 0;

for (const [id, rel] of Object.entries(local)) {
  let path = "public" + rel;
  if (!/\.(png|jpg|jpeg|webp)$/i.test(path)) continue;
  // an earlier interrupted run may already have replaced this one
  if (!existsSync(path)) {
    const webp = path.replace(/\.[a-z]+$/i, ".webp");
    if (!existsSync(webp)) continue;
    local[id] = webp.replace(/^public/, "");
    continue;
  }
  const size = statSync(path).size;
  before += size;

  // read into memory first: on Windows sharp keeps the source file handle open,
  // which blocks writing the result back to the same path
  const img = sharp(readFileSync(path), { limitInputPixels: false });
  const meta = await img.metadata();
  const out = path.replace(/\.[a-z]+$/i, ".webp");
  const buf = await img
    .resize({ width: Math.min(meta.width || MAX_WIDTH, MAX_WIDTH), withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  // keep whichever is smaller; never regress
  if (buf.length < size || out !== path) {
    writeFileSync(out, buf);
    if (out !== path) unlinkSync(path);
    local[id] = out.replace(/^public/, "");
    converted++;
    after += buf.length;
  } else {
    after += size;
  }
}

writeFileSync("scripts/localassets.json", JSON.stringify(local, null, 2));
const mb = (n) => (n / 1024 / 1024).toFixed(1) + "MB";
console.log(`converted ${converted} images: ${mb(before)} -> ${mb(after)}`);
