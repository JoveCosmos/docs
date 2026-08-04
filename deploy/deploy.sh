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

# The build workspace stays private under /srv (the repo, node_modules and any
# future secrets). Only the finished output is published under /var/www, which
# is the one tree nginx can read. That split is why /srv/gata-docs can keep the
# same 750 permissions as the other services on this box.
REPO_DIR="${REPO_DIR:-/srv/gata-docs/repo}"
RELEASES_DIR="${RELEASES_DIR:-/var/www/gata-docs/releases}"
CURRENT_LINK="${CURRENT_LINK:-/var/www/gata-docs/current}"
LOCK_FILE="${LOCK_FILE:-/srv/gata-docs/.deploy.lock}"
BRANCH="${BRANCH:-main}"
KEEP_RELEASES="${KEEP_RELEASES:-5}"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

# cron fires on a fixed interval regardless of how long a build takes, so take
# an exclusive lock and exit quietly if a previous run is still going.
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  log "another deploy is already running, skipping"
  exit 0
fi

# cron runs with a minimal PATH that usually lacks node/npm
export PATH="/usr/local/bin:/usr/bin:/bin:${PATH:-}"
if ! command -v npm >/dev/null 2>&1; then
  # pick up nvm's default install if that is how node was installed
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
fi
command -v npm >/dev/null 2>&1 || { log "ERROR: npm not on PATH"; exit 1; }

cd "$REPO_DIR"

log "fetching origin/$BRANCH"
git fetch --quiet origin "$BRANCH"

LOCAL="$(git rev-parse HEAD)"
REMOTE="$(git rev-parse "origin/$BRANCH")"

if [[ "$LOCAL" == "$REMOTE" && "${1:-}" != "--force" ]]; then
  # quiet on the no-op path so cron does not mail every 5 minutes
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

# nginx runs as its own user and only needs to read the built site
chmod -R a+rX "$RELEASE"

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
