#!/usr/bin/env bash
# Deploy the portfolio to the homelab (kota@server) and push to GitHub Pages.
#
#   ./deploy.sh            # deploy to the homeserver only
#   ./deploy.sh --push     # also commit + push to GitHub (Pages mirror)
#
# The homeserver serves kota.dpdns.org through the Cloudflare tunnel;
# GitHub Pages serves kota1738.github.io/portfolio-site as an independent mirror.

set -euo pipefail

HOST="kota@server"
DEST="/home/kota/portfolio-site"
FILES=(index.html 404.html style.css script.js robots.txt sitemap.xml default.conf Dockerfile)

cd "$(dirname "$0")"

echo "==> uploading $(( ${#FILES[@]} )) files to $HOST:$DEST"
scp -q "${FILES[@]}" "$HOST:$DEST/"

echo "==> rebuilding image and recreating container"
ssh "$HOST" "cd $DEST \
  && docker build -q -t portfolio:latest . \
  && docker rm -f portfolio >/dev/null 2>&1 || true; \
  docker run -d --name portfolio --restart unless-stopped -p 8080:80 portfolio:latest >/dev/null \
  && sleep 2 \
  && curl -sf -o /dev/null -w 'local: HTTP %{http_code}\n' http://localhost:8080/"

echo "==> checking the public URL"
curl -s -o /dev/null -m 15 -w "kota.dpdns.org: HTTP %{http_code}\n" https://kota.dpdns.org/ \
  || echo "kota.dpdns.org: unreachable (is cf-tunnel running?)"

if [[ "${1:-}" == "--push" ]]; then
  echo "==> pushing to GitHub"
  git add -A
  git diff --cached --quiet || git commit -m "Update portfolio content"
  git push origin main
  echo "Pages will rebuild in ~30s: https://kota1738.github.io/portfolio-site/"
fi

echo "done."
