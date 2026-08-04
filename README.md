# GATA HUB Docs

Self-hosted documentation for [docs.gatahub.zone](https://docs.gatahub.zone), built
with [Astro Starlight](https://starlight.astro.build). Migrated off GitBook — all
content, images and downloads are in this repo, with no runtime dependency on any
external service.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static site -> dist/
```

## Editing content

Pages are plain Markdown under `src/content/docs/`, mirroring the URL structure —
`src/content/docs/nfts/yield-paws/index.md` serves at `/nfts/yield-paws/`.

Each page needs only a title:

```markdown
---
title: Yield Paws
description: Shown in search results and link previews.
---

Body text here.
```

Starlight extras that are available: [asides](https://starlight.astro.build/guides/authoring-content/#asides)
(`:::note`, `:::tip`, `:::caution`, `:::danger`), tables, code blocks, and
collapsible `<details>` blocks (used for the German translations).

### Adding or moving a page

Curated page order lives in [`scripts/structure.mjs`](scripts/structure.mjs). To
place a page at an exact position in the sidebar, add an entry to `pages` there;
to reorder, move the entry.

Pages that are *not* listed there still appear: the config scans
`src/content/docs/` at build time and appends anything unlisted to the end of its
section, taking the label from the page's own `title`. That is what lets a page
created in the admin CMS show up without a code change.

## Admin CMS

A visual editor for page title, description, sidebar position and body text,
plus creating and deleting pages.

```bash
npm run cms
```

Then open <http://localhost:4321/keystatic>.

It edits the Markdown files in `src/content/docs/` directly on disk. Save, then
commit and push as usual — the server picks the change up on its next poll.

**The CMS is local only.** It is mounted exclusively by `astro dev`; a production
build never loads it, so the deployed site has no `/keystatic` route and no edit
UI of any kind. The public cannot see or reach it because it is not there. The
source repo is private, and there is no public "Edit page" link.

> [!IMPORTANT]
> Keystatic re-serialises the whole page body when it saves, so an edit can
> reformat parts of the page you did not touch. The `markdoc` field was rejected
> for exactly this reason — it rewrote standard Markdown tables into `{% table %}`
> syntax, which Starlight would render as literal text. The `mdx` field is used
> instead, but its round-trip has **not** been verified against this content yet.
>
> Until it has been: after your first save on a given page, run `git diff` and
> check that only your intended change appears. Nothing reaches the site until
> you push, so a bad round-trip is always caught locally.
>
> Editing the Markdown by hand has no such risk.

## Layout

| Path | What it is |
| --- | --- |
| `src/content/docs/` | The documentation itself |
| `src/styles/custom.css` | Theme — colours, tables, image frames |
| `src/assets/` | Logos (light/dark) |
| `public/files/` | Images and downloads carried over from GitBook |
| `scripts/structure.mjs` | Page order, titles, sidebar grouping, URL redirects |
| `deploy/` | Server deploy script, nginx config, systemd units |

## Deployment

Push to `main`; the server picks it up and rebuilds. See [`deploy/`](deploy/):

- `deploy.sh` — fetch, build into a timestamped release, then atomically flip the
  `current` symlink. A failed build never touches the live site.
- `nginx.conf` — server block serving `/srv/gata-docs/current`.
- `gata-docs-deploy.{service,timer}` — systemd timer that polls git every 5 minutes.

First-time server setup:

```bash
sudo mkdir -p /srv/gata-docs/{repo,releases}
sudo chown -R deploy:deploy /srv/gata-docs
sudo -u deploy git clone https://github.com/JoveCosmos/docs.git /srv/gata-docs/repo
sudo -u deploy /srv/gata-docs/repo/deploy/deploy.sh --force

sudo cp /srv/gata-docs/repo/deploy/nginx.conf /etc/nginx/sites-available/gata-docs
sudo ln -s /etc/nginx/sites-available/gata-docs /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

sudo cp /srv/gata-docs/repo/deploy/gata-docs-deploy.* /etc/systemd/system/
sudo systemctl enable --now gata-docs-deploy.timer
```

## Legacy URLs

Every old GitBook URL under `/g/...` (and its `.md` twin) redirects to the new
location, so existing links from Discord, X and partner sites keep working. The
redirect table is generated from `scripts/structure.mjs` — it cannot drift out of
sync with the content.

`llms.txt` is regenerated for the new structure and published at
[`/llms.txt`](https://docs.gatahub.zone/llms.txt).

## The migration pipeline

`scripts/` holds the one-off tooling that pulled the content out of GitBook. It is
kept so the migration is reproducible and auditable, and is not needed for normal
editing.

| Script | Purpose |
| --- | --- |
| `map-assets.mjs` | Match GitBook `/files/<id>` refs to real CDN URLs |
| `fetch-assets.mjs` | Download every image and attachment |
| `optimize-assets.mjs` | Downscale and re-encode to webp (119 MB → 13 MB) |
| `convert.mjs` | GitBook syntax → Starlight, rewrite links, apply the new IA |
| `audit.mjs` | Post-build check: broken links, missing images, leftover syntax |

Re-running the conversion needs the scraped GitBook markdown in `_raw/`, which is
gitignored. `node scripts/convert.mjs` regenerates `src/content/docs/` from it —
**this overwrites hand edits**, so once you start editing pages directly, treat
`src/content/docs/` as the source of truth and leave the pipeline alone.

After any build, `node scripts/audit.mjs` verifies the output.
