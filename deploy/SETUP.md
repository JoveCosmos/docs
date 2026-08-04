# Server setup — docs.gatahub.zone

One-time setup on the existing box (Ubuntu 24.04, nginx 1.24, Node 20, certbot
2.9 — all already installed).

Follows the conventions the other services use: a single-word `nologin` service
user with its home under `/srv`, the served files under `/var/www`, and an nginx
site file named without an extension.

| | |
|---|---|
| user / group | `docs` |
| build workspace | `/srv/gata-docs` (private, `750`) |
| published output | `/var/www/gata-docs` (`755`) |
| nginx site | `/etc/nginx/sites-available/gata-docs` |
| certificate name | `gata-docs` |
| repo | `git@github.com:JoveCosmos/docs.git` |

**Why the split between `/srv` and `/var/www`:** the repo, `node_modules` and the
build workspace never need to be readable by nginx, so they stay at `750` under
`/srv` like `explorer` and `gata-hub`. Only the finished static output is
published under `/var/www`. `gata-landing` currently runs its build as root; this
one does not.

> [!IMPORTANT]
> The SSH **private** key is generated on the server and never leaves it. Only
> the **public** half goes to GitHub, as a deploy key with write access off.
> Nothing secret is committed to the repo.

---

## 1. Create the service user

```bash
sudo adduser --system --group --home /srv/gata-docs --shell /usr/sbin/nologin docs
```

`--system` means no password and no ageing; `nologin` means nobody can get a
shell as this user even if they find a way to authenticate as it.

```bash
sudo mkdir -p /srv/gata-docs/repo /var/www/gata-docs/releases
sudo chown -R docs:docs /srv/gata-docs /var/www/gata-docs
sudo chmod 750 /srv/gata-docs
sudo chmod 755 /var/www/gata-docs
```

## 2. Generate the deploy key

```bash
sudo -u docs mkdir -p /srv/gata-docs/.ssh && sudo chmod 700 /srv/gata-docs/.ssh
```

```bash
sudo -u docs ssh-keygen -t ed25519 -N "" -f /srv/gata-docs/.ssh/id_ed25519 -C "docs@$(hostname) deploy key"
```

```bash
sudo cat /srv/gata-docs/.ssh/id_ed25519.pub
```

Copy that single line. In GitHub: **JoveCosmos/docs → Settings → Deploy keys →
Add deploy key**. Title it `docs server (read only)`, paste the key, and **leave
"Allow write access" unchecked**.

Pre-trust GitHub's host key so the first fetch is not interactive:

```bash
sudo -u docs bash -c 'ssh-keyscan -t ed25519 github.com >> /srv/gata-docs/.ssh/known_hosts'
```

Verify — expect `Hi JoveCosmos/docs! You've successfully authenticated`:

```bash
sudo -u docs ssh -i /srv/gata-docs/.ssh/id_ed25519 -o IdentitiesOnly=yes -T git@github.com
```

## 3. Clone and build

```bash
sudo -u docs git clone git@github.com:JoveCosmos/docs.git /srv/gata-docs/repo
```

```bash
sudo -u docs /srv/gata-docs/repo/deploy/deploy.sh --force
```

Expect it to end with `now serving /var/www/gata-docs/releases/...`. Confirm:

```bash
ls -l /var/www/gata-docs/current && ls /var/www/gata-docs/current | head
```

## 4. nginx — certificate first

nginx will not start pointing at a certificate that does not exist, so install
the HTTP-only block first.

```bash
sudo cp /srv/gata-docs/repo/deploy/nginx-bootstrap.conf /etc/nginx/sites-available/gata-docs
sudo ln -sf /etc/nginx/sites-available/gata-docs /etc/nginx/sites-enabled/gata-docs
sudo nginx -t && sudo systemctl reload nginx
```

Confirm DNS resolves here before asking certbot for anything:

```bash
echo "DNS: $(dig +short docs.gatahub.zone)  server: $(curl -s ifconfig.me)"
```

Issue the certificate. `--cert-name gata-docs` keeps the path predictable, the
same way the apex uses `gata-landing`:

```bash
sudo certbot certonly --webroot -w /var/www/html -d docs.gatahub.zone --cert-name gata-docs --agree-tos -m jovecosmos@gmail.com --no-eff-email
```

Swap in the real config:

```bash
sudo cp /srv/gata-docs/repo/deploy/nginx.conf /etc/nginx/sites-available/gata-docs
sudo nginx -t && sudo systemctl reload nginx
```

Confirm renewal will work unattended:

```bash
sudo certbot renew --dry-run
```

## 5. Cron

```bash
sudo -u docs crontab /srv/gata-docs/repo/deploy/crontab.example
sudo -u docs crontab -l
```

Every 5 minutes it fetches; if the commit has not moved it exits silently, so
the log only grows on a real deploy.

```bash
tail -f /srv/gata-docs/deploy.log
```

## 6. Verify

```bash
curl -sI https://docs.gatahub.zone | head -1
```

```bash
curl -s -o /dev/null -w 'http->https: %{http_code}\n' http://docs.gatahub.zone
```

Old GitBook URLs must still resolve — this is what is linked from Discord, X and
partner sites:

```bash
curl -s -o /dev/null -w 'legacy: %{http_code}\n' https://docs.gatahub.zone/g/gata-hub
```

Security headers:

```bash
curl -sI https://docs.gatahub.zone | grep -iE 'content-security|strict-transport|x-content-type|referrer'
```

Then open the site and check that **search works** — it is the one feature that
depends on `wasm-unsafe-eval` being present in the CSP.

Finally, push a trivial change and confirm it lands within 5 minutes.

---

## Rolling back

```bash
ls -1dt /var/www/gata-docs/releases/*/
```

```bash
sudo -u docs bash -c 'ln -sfn /var/www/gata-docs/releases/<previous> /var/www/gata-docs/current.tmp && mv -Tf /var/www/gata-docs/current.tmp /var/www/gata-docs/current'
```

No nginx reload needed. Note the next cron tick redeploys whatever is on `main`,
so revert in git too if the bad commit is still there.

## Troubleshooting

**Nothing deploys.** `tail /srv/gata-docs/deploy.log`. If empty, cron is not
firing: `sudo -u docs crontab -l`, then `grep CRON /var/log/syslog`.

**`npm: not found` in the log.** Cron's PATH is minimal. The script prepends the
usual locations already; if node moves, set `PATH` at the top of the crontab.

**403 from nginx.** It cannot traverse into the docroot. Check with
`sudo -u www-data stat /var/www/gata-docs/current/index.html`, then re-apply
`sudo chmod 755 /var/www/gata-docs`.

**Stale content after a deploy.** `disable_symlinks off` must be in the server
block, otherwise nginx caches the resolved symlink target.

**Search returns nothing.** Pagefind runs as WebAssembly; if `wasm-unsafe-eval`
is missing from `script-src` the browser console shows a CSP violation.
