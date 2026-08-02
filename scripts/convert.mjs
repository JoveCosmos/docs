// Converts the scraped GitBook markdown into Starlight content collections:
// strips GitBook boilerplate, translates GitBook block syntax to Starlight
// equivalents, points assets at the local copies, and rewrites every internal
// link to the new information architecture.
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pages } from "./structure.mjs";

const RAW = "_raw";
const OUT = "src/content/docs";
const assets = JSON.parse(readFileSync("scripts/localassets.json", "utf8"));

// ---------------------------------------------------------------- descriptions
// llms.txt carries a one-line summary for most pages; reuse them as meta
// descriptions rather than inventing new ones.
const descriptions = {};
for (const line of readFileSync("scripts/source-llms.txt", "utf8").split("\n")) {
  const m = line.match(/^- \[.*?\]\(https:\/\/docs\.gatahub\.zone\/g\/(.*?)\)(?::\s*(.+))?$/);
  if (m && m[2]) descriptions[m[1]] = m[2].trim();
}

// ------------------------------------------------------------------- routing
const routeFor = (out) => "/" + out.replace(/\.md$/, "").replace(/\/index$/, "") + "/";
const routes = {}; // old raw path -> new route
for (const p of pages) {
  routes[p.src] = routeFor(p.out);
  for (const m of p.merge || []) {
    // merged-away pages keep working by pointing at their new section anchor
    routes[m.src] = routeFor(p.out) + "#" + slugify(m.heading);
  }
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

// -------------------------------------------------------------- transformers
function decodeEntities(s) {
  return s
    .replace(/&#x20;/g, " ")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d));
}

function localAsset(id) {
  return assets[id] || `/files/${id}`;
}

// GitBook hint styles -> Starlight aside types
const ASIDE = { info: "note", success: "tip", warning: "caution", danger: "danger" };

function convertHints(s) {
  return s.replace(
    /\{%\s*hint style="(\w+)"\s*%\}([\s\S]*?)\{%\s*endhint\s*%\}/g,
    (_, style, body) => `\n:::${ASIDE[style] || "note"}\n${body.trim()}\n:::\n`
  );
}

function convertEmbeds(s) {
  // {% embed url="<url>" %}caption{% endembed %}  |  {% embed url="<url>" %}
  return s.replace(
    /\{%\s*embed url="<?([^">]+)>?"[^%]*%\}([\s\S]*?)(?:\{%\s*endembed\s*%\}|(?=\n))/g,
    (_, url, caption) => {
      const label = caption.trim().split("\n")[0] || url;
      const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
      if (yt) {
        return `\n<iframe class="video-embed" src="https://www.youtube-nocookie.com/embed/${yt[1]}" title="${label.replace(/"/g, "&quot;")}" loading="lazy" allowfullscreen></iframe>\n`;
      }
      return `\n[${label}](${url})\n`;
    }
  );
}

function convertFiles(s) {
  // {% file src="/files/ID" %}caption{% endfile %}
  return s.replace(
    // the caption and the closing tag are both optional, and a caption-less
    // block can sit at the very end of the file
    /\{%\s*file src="\/files\/([A-Za-z0-9_-]+)"\s*%\}([\s\S]*?)(?:\{%\s*endfile\s*%\}|(?=\n\n)|$)/g,
    (_, id, caption) => {
      const label =
        caption.trim().split("\n")[0] ||
        localAsset(id).split("/").pop() ||
        "Download file";
      return `\n[⬇ ${label}](${localAsset(id)})\n`;
    }
  );
}

function convertTabs(s) {
  // Only a couple of pages use tabs. Flattening them to headings keeps every
  // page plain .md (no MDX), which avoids brace/JSX escaping hazards.
  return s
    .replace(/\{%\s*tabs\s*%\}/g, "")
    .replace(/\{%\s*endtabs\s*%\}/g, "")
    .replace(/\{%\s*tab title="([^"]+)"\s*%\}/g, (_, t) => `\n### ${t.trim()}\n`)
    .replace(/\{%\s*endtab\s*%\}/g, "");
}

function convertFigures(s) {
  // <figure><img src="/files/ID" alt="..."><figcaption><p>caption</p></figcaption></figure>
  return s.replace(
    /<figure>\s*<img src="\/files\/([A-Za-z0-9_-]+)"[^>]*>\s*(?:<figcaption>([\s\S]*?)<\/figcaption>)?\s*<\/figure>/g,
    (_, id, cap) => {
      const caption = (cap || "").replace(/<\/?p>/g, "").trim();
      return `\n![${caption.replace(/[[\]]/g, "")}](${localAsset(id)})\n`;
    }
  );
}

function rewriteAssetPaths(s) {
  // the negative lookahead skips refs the figure/file converters already
  // rewrote, which would otherwise gain a second extension
  return s.replace(
    /(["(])\/files\/([A-Za-z0-9_-]+)(?!\.[a-z0-9])/g,
    (_, pre, id) => pre + localAsset(id)
  );
}

function rewriteLinks(s) {
  // /g/some/page.md  and  /g/some/page.md#anchor
  return s.replace(/\((?:https:\/\/docs\.gatahub\.zone)?\/g\/([^)#\s]+\.md)(#[^)\s]*)?\)/g, (whole, path, hash) => {
    const route = routes[path];
    if (!route) return whole;
    if (route.includes("#")) return `(${route})`; // merged page: use its section anchor
    return `(${route}${hash || ""})`;
  });
}

// GitBook page-id links (`/pages/<id>`, some already emitted as `broken://`)
// are dead on the live site too — every one of them 404s there. Where the link
// text or anchor identifies the target unambiguously we repoint it; the rest
// are unlinked to plain text rather than guessed at.
const DEAD_PAGES = {
  "5Nb5GvO6jl6Q5HufYkpN": "/nfts/genesis-cats/",
  "9s8Z6lIqteuATOCgtOvV": "/nfts/genesis-cats/#voyager-cats-gatav",
  mdKd13vC8Gny3M2Rn5AV: "/nfts/yield-gorilla/reward-distribution/",
  PeJ6QV3ZjXEYMtxdAUsa: "/nfts/yield-paws/",
  Km0Goy3BK6KCxdiytcJw: "/infrastructure/validators/foundation-delegations/",
  fb93hun00wSAC1RxBX5C: "/infrastructure/public-goods/relays/",
  CKPgCfG8RvCjTt6TUbbO: "/nfts/souvenirs/",
  j0KfCuozDD8sxs79EhN7: "/community/zealy/",
  "7R7vVnQNufTpi2luZOAa": "/cosmos/interchain-security/",
};

function resolveDeadPage(id, anchor) {
  const target = DEAD_PAGES[id];
  if (!target) return null;
  // `#undefined` is an upstream authoring bug in the YG yield table; the row is
  // epoch 18, between the epoch-17 and epoch-19 rows
  let hash = anchor === "#undefined" ? "#yg-epoch-18" : anchor || "";
  if (target.includes("#")) return hash && hash !== "#undefined" ? target.split("#")[0] + hash : target;
  return target + hash;
}

function rewritePageIdLinks(s) {
  // markdown form: [label](broken://pages/ID#anchor) or [label](/pages/ID)
  s = s.replace(
    /\[([^\]]*)\]\((?:broken:)?\/*pages\/([A-Za-z0-9_-]+)(#[^)\s]*)?\)/g,
    (_, label, id, anchor) => {
      const target = resolveDeadPage(id, anchor);
      return target ? `[${label}](${target})` : label;
    }
  );
  // html form inside the raw tables GitBook exported
  s = s.replace(
    /<a href="(?:broken:)?\/*pages\/([A-Za-z0-9_-]+)(#[^"]*)?">([\s\S]*?)<\/a>/g,
    (_, id, anchor, label) => {
      const target = resolveDeadPage(id, anchor);
      return target ? `<a href="${target}">${label}</a>` : label;
    }
  );
  return s;
}

function stripBoilerplate(s) {
  return s
    // every page opened with the same llms.txt / "available as Markdown" notice
    .replace(/^>\s*For the complete documentation index[\s\S]*?\n\n/, "")
    .replace(/^\s*\n/, "");
}

function extractTitle(s) {
  const m = s.match(/^#\s+(.+)$/m);
  if (!m) return [null, s];
  return [m[1].trim(), s.replace(m[0], "").trim()];
}

function tidy(s) {
  return s
    .replace(/\{%\s*end\w+\s*%\}/g, "") // any stragglers
    // GitBook's hard-line-break backslashes are left stranded on their own line
    // once the surrounding markup is gone, where they render literally
    .replace(/^\\$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+$/gm, "")
    .trim();
}

function yamlString(s) {
  return '"' + String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
}

// ------------------------------------------------------------------- convert
function bodyOf(src) {
  let s = readFileSync(join(RAW, src), "utf8");
  s = stripBoilerplate(s);
  s = decodeEntities(s);
  s = convertHints(s);
  s = convertFiles(s);
  s = convertEmbeds(s);
  s = convertTabs(s);
  s = convertFigures(s);
  s = rewriteAssetPaths(s);
  s = rewriteLinks(s);
  s = rewritePageIdLinks(s);
  return s;
}

if (existsSync(OUT)) rmSync(OUT, { recursive: true });

let count = 0;
for (const page of pages) {
  let raw = bodyOf(page.src);
  const [origTitle, body] = extractTitle(raw);
  let content = body;

  for (const m of page.merge || []) {
    const [, mergedBody] = extractTitle(bodyOf(m.src));
    content += `\n\n## ${m.heading}\n\n${mergedBody}`;
  }

  // targeted corrections to inherited content errors, declared per page
  for (const [from, to] of page.fixes || []) {
    if (!content.includes(from)) {
      console.warn(`  ! fix no longer applies in ${page.out}: ${from}`);
      continue;
    }
    content = content.split(from).join(to);
  }

  const fm = [
    `title: ${yamlString(page.title || origTitle || "Untitled")}`,
  ];
  const desc = descriptions[page.src];
  if (desc) fm.push(`description: ${yamlString(decodeEntities(desc))}`);

  const dest = join(OUT, page.out);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, `---\n${fm.join("\n")}\n---\n\n${tidy(content)}\n`);
  count++;
}

// the hand-written landing page lives alongside the pipeline so that wiping and
// regenerating the collection never destroys it
copyFileSync("scripts/home.mdx", join(OUT, "index.mdx"));

// Regenerate llms.txt for the new structure — the GitBook site published one
// and AI crawlers / partners already reference it.
const SITE = "https://docs.gatahub.zone";
const llms = ["# GATA HUB Documentation", ""];
for (const p of pages) {
  const desc = descriptions[p.src];
  llms.push(`- [${p.title}](${SITE}${routeFor(p.out)})${desc ? ": " + decodeEntities(desc) : ""}`);
}
writeFileSync("public/llms.txt", llms.join("\n") + "\n");

console.log(`converted ${count} pages -> ${OUT}`);
