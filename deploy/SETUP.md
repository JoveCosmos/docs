# Server setup — docs.gatahub.zone

One-time setup for a dedicated `gatadocs` user that pulls from the private repo,
builds, and serves the result through nginx over HTTPS.

Adjust these to match the convention your other services use:

| | value used below |
|---|---|
| user / group | `gatadocs` |
| base directory | `/srv/gata-docs` |
| domain | `docs.gatahub.zone` |
| repo | `git@github.com:JoveCosmos/docs.git` |

> [!IMPORTANT]
> The SSH **private** key is generated on the server and never leaves it. Do not
> commit it here or anywhere else — it is the server's identity. Only the
> **public** half (`.pub`) is uploaded to GitHub, as a read-only deploy key.

---

## 1. Create the service user

No password and no login shell — this account only ever runs the deploy script.

```bash
sudo adduser --system --group --shell /bin/bash --home /srv/gata-docs gatadocs
sudo mkdir -p /srv/gata-docs/{repo,releases}
sudo chown -R gatadocs:gatadocs /srv/gata-docs

# nginx must be able to traverse into the release directories
sudo chmod 755 /srv/gata-docs
```

## 2. Generate the deploy key

```bash
sudo -u gatadocs ssh-keygen -t ed25519 -N "" \
  -f /srv/gata-docs/.ssh/id_ed25519 \
  -C "gatadocs@$(hostname) deploy key for docs.gatahub.zone"

sudo -u gatadocs cat /srv/gata-docs/.ssh/id_ed25519.pub
```

Copy that one line of output.

Then in GitHub: **repo → Settings → Deploy keys → Add deploy key**. Paste it,
title it something like `docs server (pull only)`, and **leave "Allow write
access" unchecked** — the server only ever needs to read.

Trust GitHub's host key so the first fetch is not interactive:

```bash
sudo -u gatadocs bash -c 'ssh-keyscan github.com >> /srv/gata-docs/.ssh/known_hosts'
sudo -u gatadocs ssh -T git@github.com   # expect: "successfully authenticated"
```

## 3. Install Node

The build needs Node 20 or newer. If your other services already have it
system-wide, skip this.

```bash
node -v   # if this is missing or older than v20:
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## 4. Clone and run the first build

```bash
sudo -u gatadocs git clone git@github.com:JoveCosmos/docs.git /srv/gata-docs/repo
sudo -u gatadocs /srv/gata-docs/repo/deploy/deploy.sh --force
```

That should end with `now serving /srv/gata-docs/releases/...`. Confirm the
symlink exists:

```bash
ls -l /srv/gata-docs/current
```

## 5. nginx — get a certificate first

nginx will not start if it is pointed at a certificate that does not exist yet,
so install the HTTP-only block first.

```bash
sudo mkdir -p /var/www/certbot

sudo cp /srv/gata-docs/repo/deploy/nginx-bootstrap.conf \
        /etc/nginx/sites-available/gata-docs
sudo ln -sf /etc/nginx/sites-available/gata-docs /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Point `docs.gatahub.zone` at this server in DNS, wait for it to resolve, then:

```bash
sudo certbot certonly --webroot -w /var/www/certbot \
  -d docs.gatahub.zone \
  --agree-tos -m jovecosmos@gmail.com --no-eff-email
```

Now swap in the real config:

```bash
sudo cp /srv/gata-docs/repo/deploy/nginx.conf \
        /etc/nginx/sites-available/gata-docs
sudo nginx -t && sudo systemctl reload nginx
```

Certbot installs its own renewal timer. Confirm it works:

```bash
sudo certbot renew --dry-run
systemctl list-timers | grep certbot
```

## 6. Cron

```bash
sudo -u gatadocs crontab /srv/gata-docs/repo/deploy/crontab.example
sudo -u gatadocs crontab -l
```

Every 5 minutes it fetches; if the commit has not moved it exits silently, so
the log only ever grows on a real deploy.

```bash
tail -f /srv/gata-docs/deploy.log
```

## 7. Verify end to end

```bash
curl -I https://docs.gatahub.zone            # 200, and HTTP/2
curl -I http://docs.gatahub.zone             # 301 to https
curl -s https://docs.gatahub.zone/g/gata-hub -o /dev/null -w '%{http_code}\n'  # 301, old GitBook URL
```

Then push a trivial change and watch it land within 5 minutes.

---

## Rolling back

Releases are kept (5 by default). To go back to the previous one:

```bash
ls -1dt /srv/gata-docs/releases/*/          # newest first
sudo -u gatadocs ln -sfn /srv/gata-docs/releases/<previous> /srv/gata-docs/current.tmp
sudo -u gatadocs mv -Tf /srv/gata-docs/current.tmp /srv/gata-docs/current
```

No nginx reload needed — it follows the symlink.

Note that the next cron tick will redeploy whatever is on `main`, so roll back
in git too if the bad commit is still there.

## Troubleshooting

**Nothing deploys.** Check the log first: `tail /srv/gata-docs/deploy.log`. If it
is empty, cron is not firing — `sudo -u gatadocs crontab -l` and `grep CRON
/var/log/syslog`.

**`npm: not found` in the log.** Cron has a minimal PATH. The script already
prepends the usual locations and sources nvm if present; if node lives somewhere
else, set `PATH` at the top of the crontab.

**403 from nginx.** It cannot traverse the directories. Check
`sudo -u www-data stat /srv/gata-docs/current/index.html`, then re-apply
`chmod 755 /srv/gata-docs`.

**Stale content after a deploy.** `disable_symlinks off` must be present in the
server block, otherwise nginx caches the resolved symlink target.
