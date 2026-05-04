# Deploying the editor to your VPS

The editor is plain static files (HTML + CSS + JS), so it works behind any static webserver. The included `Dockerfile` + `nginx.conf` give you a 1-command production container.

---

## Option A — Coolify on the Hostinger VPS *(recommended)*

You already run Coolify at `http://156.67.216.187:8000`, so this slots in like every other project.

1. **Push this `editor/` folder to a git repo** (GitHub or any). The folder must contain `Dockerfile`, `nginx.conf`, `index.html`, `styles.css`, `app.js`.
2. In Coolify → **+ New Resource → Public/Private Git Repository**.
3. Pick the repo + branch. Set the **base directory** to `editor/` if the repo also has the renders/specs at the root.
4. Build pack: **Dockerfile**.
5. Port: **80** (matches the `EXPOSE 80` in the Dockerfile).
6. Set a domain. Coolify auto-provisions Let's Encrypt:
   - either `villa.156-67-216-187.sslip.io` (no DNS needed), or
   - your own subdomain (e.g. `villa.yourdomain.com`) — point a CNAME to the VPS first.
7. **Deploy**. Done; share the URL.

For redeploys after edits: push to git, click *Redeploy* in Coolify (or enable auto-deploy on push).

---

## Option B — `rsync` straight to the VPS (no Docker, no Coolify)

If you'd rather skip Coolify, scp the folder and let nginx (which is probably already running on the VPS for your other apps) serve it.

```bash
# from your Mac
rsync -avz --exclude '.DS_Store' /Users/xidik/Desktop/mountain-villa/editor/ \
   root@156.67.216.187:/var/www/villa-editor/
```

Then on the VPS, drop a server block in `/etc/nginx/sites-available/villa-editor`:

```nginx
server {
    listen 80;
    server_name villa.your-domain.com;
    root /var/www/villa-editor;
    index index.html;
    location / { try_files $uri $uri/ /index.html; }
}
```

`ln -s ... sites-enabled/`, `nginx -t && systemctl reload nginx`, and `certbot --nginx -d villa.your-domain.com` for HTTPS.

---

## Option C — Run the Docker image directly on the VPS

Skip Coolify, use raw Docker:

```bash
# from your Mac
rsync -avz /Users/xidik/Desktop/mountain-villa/editor/ \
   root@156.67.216.187:/srv/villa-editor/

# on the VPS
cd /srv/villa-editor
docker build -t villa-editor .
docker run -d --name villa-editor -p 8080:80 --restart unless-stopped villa-editor
# served at http://156.67.216.187:8080
```

For HTTPS: front it with the existing Coolify proxy or use a reverse proxy (Caddy / Traefik) with auto-LE.

---

## Test the container locally first

```bash
cd editor
docker build -t villa-editor .
docker run --rm -p 8080:80 villa-editor
# open http://localhost:8080
```

## Saving / sharing edits

- Each visitor's tweaks **auto-save to their browser's localStorage** (lives across reloads, scoped per browser per device).
- Click **⬇ Download JSON** in the *File* section to export a state file. Send it to someone, they click **⬆ Load JSON** to apply it.
- Click **↺ Reset to defaults** to clear the local state and reload the canonical layout.

For *shared* state (everyone seeing the same edits live), you'd need a tiny backend — let me know if you want one (a 30-line Node/Bun server with `GET /state` + `PUT /state` is enough).
