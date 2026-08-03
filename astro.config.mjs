import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import { pages, sidebar as groups } from "./scripts/structure.mjs";

// The sidebar is derived from the same structure map the content conversion
// uses, so page order in the sidebar always matches the documented IA and
// nothing can silently drift out of sync.
const routeOf = (out) => "/" + out.replace(/\.md$/, "").replace(/\/index$/, "");

function buildGroup(dir, label) {
  const inGroup = pages.filter((p) => p.out === `${dir}/index.md` || p.out.startsWith(`${dir}/`));
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
        { icon: "github", label: "GitHub", href: "https://github.com/GATA-HUB" },
      ],
      components: {
        // two-state light/dark button in place of the Auto/Light/Dark <select>
        ThemeSelect: "./src/components/ThemeToggle.astro",
      },
      editLink: {
        baseUrl: "https://github.com/GATA-HUB/docs/edit/main/",
      },
      lastUpdated: true,
      pagination: true,
      customCss: ["./src/styles/custom.css"],
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
      sidebar: groups.map((g) => buildGroup(g.dir, g.label)),
    }),
  ],
});
