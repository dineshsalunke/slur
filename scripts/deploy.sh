#!/usr/bin/env bash
set -euo pipefail

SLUR_HOST="${SLUR_HOST:-root@168.144.186.50}"
SLUR_KEY="${SLUR_KEY:-$HOME/.ssh/kurmah_ed25519}"
SLUR_DIR="${SLUR_DIR:-/opt/slur}"
SLUR_URL="${SLUR_URL:-https://slur.kurmah.studio}"
IMAGE=slur:latest

cd "$(dirname "$0")/.."

fail() {
    echo "deploy: $*" >&2
    exit 1
}

remote() {
    ssh -i "$SLUR_KEY" -o BatchMode=yes -o ConnectTimeout=10 "$SLUR_HOST" "$@"
}

remote true || fail "cannot reach $SLUR_HOST with $SLUR_KEY"
remote "test -f '$SLUR_DIR/docker-compose.yml'" || fail "$SLUR_DIR/docker-compose.yml is missing on $SLUR_HOST"

git diff --quiet HEAD -- || {
    git diff --name-only HEAD -- >&2
    fail "tracked files above differ from HEAD; commit or wait for their owners"
}

git fetch --quiet origin dev
git merge-base --is-ancestor HEAD origin/dev || fail "HEAD $(git rev-parse --short HEAD) is not on origin/dev; push first"

SHA="$(git rev-parse HEAD)"
git lfs fetch origin "$SHA"

WORK="$(mktemp -d "${TMPDIR:-/tmp}/slur-deploy.XXXXXX")"
trap 'rm -rf "$WORK"' EXIT
git archive --format=tar "$SHA" | tar -x -C "$WORK"

docker build --platform linux/amd64 \
    --label "org.opencontainers.image.revision=$SHA" \
    -t "$IMAGE" "$WORK"
docker save "$IMAGE" | gzip | remote 'gunzip | docker load'
remote "cd '$SLUR_DIR' && docker compose up -d --force-recreate slur && docker image prune -f"

live=0
for _ in $(seq 1 45); do
    if curl -fsS "$SLUR_URL/healthz" >/dev/null 2>&1; then
        live=1
        break
    fi
    sleep 2
done
[ "$live" = 1 ] || fail "healthz did not answer at $SLUR_URL"
echo "live: $SLUR_URL at ${SHA:0:7}"

if password="$(security find-generic-password -s slur-metrics -w 2>/dev/null)"; then
    printf 'user = "owner:%s"\n' "$password" | curl -fsS --config - "$SLUR_URL/metrics" \
        || echo "deploy: /metrics did not answer" >&2
else
    echo "deploy: no slur-metrics keychain entry; skipped /metrics" >&2
fi
