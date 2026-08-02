// Downloads every mapped GitBook asset into public/files/<id>.<ext> so the
// site has no runtime dependency on GitBook's CDN.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { Buffer } from "node:buffer";

const map = JSON.parse(readFileSync("scripts/assets.json", "utf8"));
const covers = JSON.parse(readFileSync("scripts/covers.json", "utf8"));
mkdirSync("public/files", { recursive: true });

const EXT = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/webp": "webp",
  "application/pdf": "pdf",
  "video/mp4": "mp4",
};

const jobs = [
  ...Object.entries(map).map(([id, url]) => ({ id, url })),
  ...Object.entries(covers).map(([page, url]) => ({
    id: "cover-" + page.replace(/[\/.]/g, "-"),
    url,
  })),
];

const out = JSON.parse(readFileSync("scripts/localassets.json","utf8"));
const failed = [];
let done = 0;

// The firebase storage API wants the object path after /o/ percent-encoded as a
// single segment; some of the scraped urls come through fully decoded.
function normalize(url) {
  let u = url.replace(/&amp;/g, "&");
  const i = u.indexOf("/o/");
  if (i === -1) return u;
  const head = u.slice(0, i + 3);
  let rest = u.slice(i + 3);
  const q = rest.indexOf("?");
  const query = q === -1 ? "" : rest.slice(q);
  let path = q === -1 ? rest : rest.slice(0, q);
  path = decodeURIComponent(path).replace(/\//g, "%2F");
  return head + path + query;
}

async function run({ id, url }) {
  if (out[id]) { done++; return; }
  try {
    const res = await fetch(normalize(url));
    if (!res.ok) throw new Error("HTTP " + res.status);
    const ct = (res.headers.get("content-type") || "").split(";")[0].trim();
    let ext = EXT[ct];
    if (!ext) {
      const m = decodeURIComponent(url).match(/\.([a-z0-9]{3,4})\?/i);
      ext = m ? m[1].toLowerCase() : "bin";
    }
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(`public/files/${id}.${ext}`, buf);
    out[id] = `/files/${id}.${ext}`;
  } catch (e) {
    failed.push(`${id}: ${e.message}`);
  }
  if (++done % 25 === 0) console.log(`  ${done}/${jobs.length}`);
}

// modest concurrency; the CDN rate-limits above this
const POOL = 8;
const queue = [...jobs];
await Promise.all(
  Array.from({ length: POOL }, async () => {
    let j;
    while ((j = queue.shift())) await run(j);
  })
);

writeFileSync("scripts/localassets.json", JSON.stringify(out, null, 2));
console.log("downloaded:", Object.keys(out).length, "of", jobs.length);
if (failed.length) {
  console.log("FAILED:");
  failed.forEach((f) => console.log("  " + f));
}
