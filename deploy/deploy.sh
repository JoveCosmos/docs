#!/usr/bin/env bash
#
# Server-side deploy for docs.gatahub.zone.
#
# Fetches the latest commit, builds into a fresh timestamped release directory,
# and only then flips the `current` symlink that nginx serves. A failed build
# leaves the live site untouched.
#
# Usage:  ./deploy.sh [--force]
#   --force   rebuild even when the remote commit hasn't changed
#
set -euo pipefail

REPO_DIR="${REPO_DIR:-/srv/gata-docs/repo}"
RELEASES_DIR="${RELEASES_DIR:-/srv/gata-docs/releases}"
CURRENT_LINK="${CURRENT_LINK:-/srv/gata-docs/current}"
BRANCH="${BRANCH:-main}"
KEEP_RELEASES="${KEEP_RELEASES:-5}"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

cd "$REPO_DIR"

log "fetching origin/$BRANCH"
git fetch --quiet origin "$BRANCH"

LOCAL="$(git rev-parse HEAD)"
REMOTE="$(git rev-parse "origin/$BRANCH")"

if [[ "$LOCAL" == "$REMOTE" && "${1:-}" != "--force" ]]; then
  log "already at ${REMOTE:0:8}, nothing to do"
  exit 0
fi

log "updating ${LOCAL:0:8} -> ${REMOTE:0:8}"
git reset --hard --quiet "origin/$BRANCH"

# npm ci needs a lockfile and gives reproducible installs; fall back if absent
if [[ -f package-lock.json ]]; then
  npm ci --no-audit --no-fund
else
  npm install --no-audit --no-fund
fi

log "building"
npm run build

RELEASE="$RELEASES_DIR/$(date +%Y%m%d-%H%M%S)-${REMOTE:0:8}"
mkdir -p "$RELEASE"
cp -r dist/. "$RELEASE/"

# atomic swap: create the new symlink beside the old one, then rename over it
ln -sfn "$RELEASE" "$CURRENT_LINK.tmp"
mv -Tf "$CURRENT_LINK.tmp" "$CURRENT_LINK"
log "now serving $RELEASE"

# prune old releases, keeping the most recent $KEEP_RELEASES
if [[ -d "$RELEASES_DIR" ]]; then
  ls -1dt "$RELEASES_DIR"/*/ 2>/dev/null | tail -n "+$((KEEP_RELEASES + 1))" | while read -r old; do
    log "pruning $old"
    rm -rf "$old"
  done
fi

log "done"
