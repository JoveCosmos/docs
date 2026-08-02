// Post-build audit: every internal link resolves to a real page, every image
// resolves to a real file, and no GitBook artefacts survived the conversion.
import { readdirSync, statSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const DIST = "dist";
const files = [];
(function walk(d) {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (e.endsWith(".html")) files.push(p);
  }
})(DIST);

const pageExists = (href) => {
  const clean = href.split("#")[0].split("?")[0];
  if (clean === "/" || clean === "") return true;
  const base = join(DIST, clean);
  return existsSync(join(base, "index.html")) || existsSync(base) || existsSync(base + ".html");
};

const badLinks = new Map();
const badImages = new Map();
const artefacts = new Map();

for (const file of files) {
  const html = readFileSync(file, "utf8");
  const page = file.replace(/\\/g, "/").replace(/^dist/, "").replace(/index\.html$/, "");

  for (const m of html.matchAll(/href="(\/[^"]*)"/g)) {
    const href = m[1];
    if (href.startsWith("//") || href.startsWith("/_astro/") || href.startsWith("/pagefind/")) continue;
    if (/\.(webp|png|jpg|svg|pdf|txt|xlsx|xml|ico|json|css|js)$/i.test(href)) continue;
    if (!pageExists(href)) badLinks.set(href, (badLinks.get(href) || []).concat(page));
  }

  for (const m of html.matchAll(/src="(\/files\/[^"]+)"/g)) {
    if (!existsSync(join("public", m[1]))) {
      badImages.set(m[1], (badImages.get(m[1]) || []).concat(page));
    }
  }

  // dist/g/** are the generated legacy-url redirect stubs; they necessarily
  // mention their own /g/ path
  if (page.startsWith("/g/")) continue;

  for (const pat of ["{%", "&#x20;", "/g/", "endhint", "endembed"]) {
    if (html.includes(pat)) artefacts.set(pat, (artefacts.get(pat) || []).concat(page));
  }
}

const report = (name, map) => {
  console.log(`\n${name}: ${map.size}`);
  for (const [k, v] of [...map].slice(0, 15)) {
    console.log(`  ${k}  <- ${v.slice(0, 3).join(", ")}${v.length > 3 ? ` (+${v.length - 3})` : ""}`);
  }
};

console.log(`scanned ${files.length} pages`);
report("BROKEN INTERNAL LINKS", badLinks);
report("MISSING IMAGES", badImages);
report("GITBOOK ARTEFACTS", artefacts);
