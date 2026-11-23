# v1 alpha preview under `/next/`

`https://design-system.osmova.com/` serves the stable 0.10.x site. `https://design-system.osmova.com/next/`
serves the v1 alpha gallery and `/next/storybook/` its Storybook. The preview has its own workflow, GitHub
environment, deploy key, Unix user, receiver and release tree, so it can never replace the stable site.

| Piece | Stable site | v1 preview |
| --- | --- | --- |
| Workflow | `ci.yml` → `deploy.yml` (branch `production`) | `preview.yml` (branch `v1/main`) |
| GitHub environment | `production` | `preview` |
| Forced command | `deploy <sha> <run-id>` | `deploy-next <sha> <run-id>` |
| Receiver | `receive-site.py` | `receive-next.py` |
| Release tree | `/var/www/qds` | `/var/www/qds-next` |

## Build

`preview.yml` runs the full verification (publish checks, catalog, Storybook, gallery visual gate, receiver
tests), then rebuilds the gallery with `ODS_GALLERY_BASE=/next/` and `VITE_ODS_PREVIEW=1`. The flag adds a
fixed "Alpha preview" banner linking back to the stable root `/`. The Storybook build uses relative URLs and
needs no base. `assemble-next.py` writes `index.html`, `storybook/`, `release.json` and `SHA256SUMS`;
`smoke-next.py` serves the result under `/next/` and fetches every linked script and stylesheet.

Local proof:

```sh
pnpm build && pnpm catalog:storybook:build
ODS_GALLERY_BASE=/next/ VITE_ODS_PREVIEW=1 pnpm gallery:build
python3 .github/scripts/assemble-next.py --sha "$(git rev-parse HEAD)" --run-id 1 \
  --repository Osmova/quasar-design-system --output /tmp/site-next
python3 .github/scripts/smoke-next.py /tmp/site-next
```

## Operator checklist

Do these once, before the first push to `v1/main` that should deploy.

### GitHub

1. Create the environment `preview`. Restrict its deployment branches to `v1/main`. Add required reviewers if
   preview deploys should be approved.
2. In that environment add the secrets `DEPLOY_NEXT_SSH_PRIVATE_KEY` (a new ed25519 key used only for the
   preview) and `DEPLOY_NEXT_SSH_KNOWN_HOSTS` (the server's host key lines, for example from `ssh-keyscan`
   checked against the server's own fingerprint).
3. Add the variables `DEPLOY_NEXT_SSH_HOST`, `DEPLOY_NEXT_SSH_USER` and, if not 22, `DEPLOY_NEXT_SSH_PORT`.
   Do not reuse the stable `DEPLOY_SSH_*` values for the key or user.

### Server

1. Create a dedicated unprivileged user for the preview, without a password, sudo or a login shell
   beyond what the forced command needs. Do not reuse the stable deploy user.
2. Install the receiver as root and keep it out of that user's write access:

   ```sh
   install -d -o root -g root -m 0755 /usr/local/lib/ods-next
   install -o root -g root -m 0755 receive-next.py /usr/local/lib/ods-next/receive-next.py
   ```

   It needs Python 3.11 or newer (`hashlib.file_digest`).
3. Create the release tree owned by the preview user, readable by the web server:

   ```sh
   install -d -o <preview-user> -g <preview-user> -m 0755 /var/www/qds-next /var/www/qds-next/releases
   ```

   The receiver writes `releases/<sha>-<run>-<id>/`, then swaps the `current` symlink atomically. It never
   deletes earlier releases: prune `releases/` by hand, never the target of `current`.
4. In the preview user's `~/.ssh/authorized_keys` (directory and file owned by root or not writable by the
   user), allow only the forced command:

   ```text
   command="/usr/bin/python3 /usr/local/lib/ods-next/receive-next.py",restrict ssh-ed25519 AAAA... ods-next-preview
   ```

5. Serve `design-system.osmova.com` with the stable release as the root and the preview under `/next/`. The
   stable path below is the stable receiver's `current` symlink; adapt it if the stable tree lives elsewhere.

   ```nginx
   server {
       listen 443 ssl;
       listen [::]:443 ssl;
       http2 on;
       server_name design-system.osmova.com;
       # TLS certificate lines for design-system.osmova.com (see step 6).

       root /var/www/qds/current;
       index index.html;

       location = /next { return 301 /next/; }
       location = /next/storybook { return 301 /next/storybook/; }

       # Hashed gallery assets: a missing file is a real 404, never the SPA page.
       location ^~ /next/assets/ {
           alias /var/www/qds-next/current/assets/;
           try_files $uri =404;
       }

       # Storybook is static: directory index, no SPA fallback.
       location ^~ /next/storybook/ {
           alias /var/www/qds-next/current/storybook/;
           index index.html;
           try_files $uri $uri/ =404;
       }

       location ^~ /next/ {
           alias /var/www/qds-next/current/;
           index index.html;
           try_files $uri $uri/ /next/index.html;
       }
   }

   server {
       listen 80;
       listen [::]:80;
       server_name design-system.osmova.com;
       return 301 https://$host$request_uri;
   }
   ```

   Keep the existing stable rules (for example the stable `/storybook` handling) inside the same server block.
   `nginx -t` before reloading.
6. Issue or extend the TLS certificate for `design-system.osmova.com` (for example
   `certbot --nginx -d design-system.osmova.com`), and point its DNS at the server.
7. The stable `deploy.yml` still checks its own host name. Keep that host serving the same stable tree, or
   update `deploy.yml` on `master` when the stable site moves to `design-system.osmova.com`.

### Checks after the first deploy

`preview.yml` verifies these over HTTPS and fails the run otherwise:

- `/next/release.json` names the deployed commit and run.
- `/next/index.html`, `/next/storybook/index.html`, `/next/storybook/iframe.html` and every script or
  stylesheet they link match the uploaded artifact byte for byte.
- `/next` and `/next/storybook` redirect to the trailing-slash URL.
- A missing file under `/next/assets/` or `/next/storybook/assets/` returns 404.
- An unknown path under `/next/` returns the preview's `index.html`.
- The domain root `/` is not the preview.

The receiver checks `release.json` against the repository name `Osmova/quasar-design-system`. If the repository
is renamed, update `REPOSITORY` in both receivers and reinstall them.
