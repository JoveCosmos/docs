// Maps GitBook markdown `/files/<id>` refs to real CDN URLs by matching them,
// in document order, against the images in each page's rendered HTML.
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const RAW = "_raw";
const BASE = "https://docs.gatahub.zone/g/";

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (e.endsWith(".md")) out.push(p);
  }
  return out;
}

const pages = walk(RAW).map((p) => relative(RAW, p).replace(/\\/g, "/"));
const map = {};
const covers = {};
const problems = [];

for (const page of pages) {
  const md = readFileSync(join(RAW, page), "utf8");
  // GitBook writes each image twice (light/dark <picture> sources), so dedupe
  // ids the same way we dedupe the rendered urls, preserving document order.
  const ids = [
    ...new Set([...md.matchAll(/\/files\/([A-Za-z0-9_-]+)/g)].map((m) => m[1])),
  ];
  if (!ids.length) continue;

  const slug = page.replace(/\.md$/, "");
  const res = await fetch(BASE + slug);
  const html = await res.text();

  // The same asset appears many times per page (srcset variants, SSR + hydration
  // payload, different encodings), so key on the stable upload id and keep the
  // first fully-formed CDN url seen for it.
  const seen = new Set();
  const urls = [];
  for (const m of html.matchAll(
    /files\.gitbook\.io[^"'\\\s]*?(?:%2F|%252F|\/)uploads(?:%2F|%252F|\/)([A-Za-z0-9_-]{16,})/g
  )) {
    const id = m[1];
    if (seen.has(id)) continue;
    seen.add(id);
    // recover the full url incl. ?alt=media&token=... from the surrounding text
    const start = html.indexOf(m[0]);
    const tail = html.slice(start, start + 800);
    const full = tail.match(/^[^"'\\\s]*?token(?:%3D|=)[A-Za-z0-9-]+/);
    let u = full ? full[0] : m[0];
    // the url is percent-encoded once inside the proxy param; the storage-API
    // path segments stay encoded (%252F -> %2F), which is what the CDN expects
    try {
      u = decodeURIComponent(u);
    } catch {}
    urls.push("https://298708583-" + u.replace(/^(https?:\/\/)?(298708583-)?/, ""));
  }

  // A GitBook page cover renders above <main> and has no counterpart in the
  // markdown body, so it always shows up as one extra leading image.
  let body = urls;
  if (urls.length === ids.length + 1) {
    covers[page.replace(/\.md$/, "")] = urls[0];
    body = urls.slice(1);
  }

  if (body.length !== ids.length) {
    problems.push(`${page}: md=${ids.length} html=${body.length}`);
  }
  ids.forEach((id, i) => {
    if (body[i]) map[id] = body[i];
  });
}

writeFileSync("scripts/assets.json", JSON.stringify(map, null, 2));
writeFileSync("scripts/covers.json", JSON.stringify(covers, null, 2));
console.log("covers:", Object.keys(covers).length);
console.log("mapped:", Object.keys(map).length);
if (problems.length) {
  console.log("\nCOUNT MISMATCHES (" + problems.length + "):");
  problems.forEach((p) => console.log("  " + p));
}
