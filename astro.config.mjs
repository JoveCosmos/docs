import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import react from "@astrojs/react";
import keystatic from "@keystatic/astro";
import { readdirSync, statSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pages, sidebar as groups } from "./scripts/structure.mjs";

// The admin CMS is mounted only by `astro dev`. A production build never loads
// it, so the deployed site ships no /keystatic route and no editing UI —
// visitors cannot see or reach it because it is not there.
const CMS = process.argv.includes("dev");

// The sidebar is derived from the same structure map the content conversion
// uses, so page order in the sidebar always matches the documented IA and
// nothing can silently drift out of sync.
const routeOf = (out) => "/" + out.replace(/\.md$/, "").replace(/\/index$/, "");

const CONTENT = "src/content/docs";

// Pages created in the CMS are not listed in structure.mjs, which would leave
// them reachable by URL but missing from the sidebar. Discover anything on disk
// that structure.mjs does not already account for and append it to its section,
// so a new page shows up without anyone editing code. Curated ordering is
// untouched: discovered pages always sort after the ones listed explicitly.
function discoverPages() {
  const found = [];
  const walk = (dir, base = "") => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const rel = base ? `${base}/${entry}` : entry;
      if (statSync(full).isDirectory()) walk(full, rel);
      else if (/\.mdx?$/.test(entry)) found.push({ out: rel.replace(/\.mdx?$/, ".md"), full });
    }
  };
  walk(CONTENT);
  return found;
}

function titleOf(file, fallback) {
  const head = readFileSync(file, "utf8").slice(0, 800);
  const m = head.match(/^title:\s*["']?(.+?)["']?\s*$/m);
  return m ? m[1] : fallback;
}

const known = new Set(pages.map((p) => p.out));
const extraPages = discoverPages()
  .filter((f) => f.out !== "index.md" && !known.has(f.out))
  .map((f) => ({
    out: f.out,
    title: titleOf(f.full, f.out.split("/").pop().replace(/\.md$/, "")),
  }));

const allPages = [...pages, ...extraPages];

function buildGroup(dir, label) {
  const inGroup = allPages.filter((p) => p.out === `${dir}/index.md` || p.out.startsWith(`${dir}/`));
  const items = [];
  const subgroups = new Map();

  for (const page of inGroup) {
    const rest = page.out.slice(dir.length + 1);
    if (rest === "index.md") {
      items.push({ label: "Overview", link: routeOf(page.out) });
      continue;
    }
    const slash = rest.indexOf("/");
    if (slash === -1) {
      items.push({ label: page.title, link: routeOf(page.out) });
      continue;
    }
    const sub = rest.slice(0, slash);
    if (!subgroups.has(sub)) {
      const g = { label: sub, items: [], _placeholder: items.length };
      subgroups.set(sub, g);
      items.push(g);
    }
    const g = subgroups.get(sub);
    if (rest.endsWith(`${sub}/index.md`)) {
      g.label = page.title; // the subdirectory's own index names the group
      g.items.unshift({ label: "Overview", link: routeOf(page.out) });
    } else {
      g.items.push({ label: page.title, link: routeOf(page.out) });
    }
  }

  for (const g of subgroups.values()) delete g._placeholder;
  return { label, collapsed: true, items };
}

// Every URL the GitBook site served lives under /g/... and is linked from
// Discord, X and partner sites. Map each old path (and its .md twin) onto its
// new home so none of those links break.
const redirects = {};
for (const p of pages) {
  const to = routeOf(p.out);
  for (const src of [p.src, ...(p.merge || []).map((m) => m.src)]) {
    const old = src.replace(/\.md$/, "");
    redirects[`/g/${old}`] = to;
    redirects[`/g/${old}.md`] = to;
  }
}
redirects["/g"] = "/";

export default defineConfig({
  site: "https://docs.gatahub.zone",
  redirects,
  integrations: [
    starlight({
      title: "GATA HUB Docs",
      description:
        "Documentation for GATA HUB — Cosmos validators, IBC relays, public goods, yield-bearing NFT collections and the GATA DAO.",
      logo: {
        light: "./src/assets/logo-light.png",
        dark: "./src/assets/logo-dark.png",
      },
      favicon: "/favicon.png",
      social: [
        { icon: "x.com", label: "X", href: "https://twitter.com/GataHubZone" },
        { icon: "discord", label: "Discord", href: "https://discord.com/invite/4MCrtaCetp" },
        { icon: "telegram", label: "Telegram", href: "https://t.me/gatahub" },
      ],
      components: {
        // two-state light/dark button in place of the Auto/Light/Dark <select>
        ThemeSelect: "./src/components/ThemeToggle.astro",
      },
      // No editLink: it renders a public "Edit page" link on every page, and the
      // source repo is private. Admin editing happens through the CMS instead.
      lastUpdated: true,
      pagination: true,
      customCss: ["./src/styles/custom.css"],
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
      sidebar: groups.map((g) => buildGroup(g.dir, g.label)),
    }),
    // dev only — see the CMS note at the top of this file
    ...(CMS ? [react(), keystatic()] : []),
  ],
  ...(CMS ? { output: "server" } : {}),
});
