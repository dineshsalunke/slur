#!/usr/bin/env bash
set -euo pipefail

SLUR_HOST="${SLUR_HOST:-root@168.144.186.50}"
SLUR_KEY="${SLUR_KEY:-$HOME/.ssh/kurmah_ed25519}"
SLUR_DIR="${SLUR_DIR:-/opt/slur}"
SLUR_URL="${SLUR_URL:-https://slur.kurmah.studio}"
IMAGE=slur:latest

cd "$(dirname "$0")/.."

remote() {
    ssh -i "$SLUR_KEY" "$SLUR_HOST" "$@"
}

git lfs pull
docker build --platform linux/amd64 -t "$IMAGE" .
docker save "$IMAGE" | gzip | remote 'gunzip | docker load'
remote "cd '$SLUR_DIR' && docker compose up -d --force-recreate slur && docker image prune -f"

for _ in $(seq 1 45); do
    if curl -fsS "$SLUR_URL/healthz" >/dev/null 2>&1; then
        echo "live: $SLUR_URL"
        exit 0
    fi
    sleep 2
done
echo "healthz did not answer at $SLUR_URL" >&2
exit 1
