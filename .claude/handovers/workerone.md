Agent: workerone · Lane: #336 deploy to slur.kurmah.studio (DONE, closed) · Updated: 2026-09-28

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#336: SLUR as one container, live at https://slur.kurmah.studio. Done.

## Done

- `dc2af77` (pushed): server serves the SPA + `GET /healthz` via the Colyseus 0.17 `express` option (`apps/server/src/http.ts`, only when `SLUR_CLIENT_DIR` is set); same-origin wss client in prod; amd64 multi-stage `Dockerfile` with LFS guard; `.dockerignore`; `scripts/deploy.sh`.
- Owner ran `scripts/deploy.sh` → "live: https://slur.kurmah.studio". #336 closed.

## State

- Live, measured: node client over wss → gen phrase, phase 0 → 2, z 217 after 7 s. Headless Chrome Host → Go: race clock running, ship drawn, 0 console errors, ws `wss://slur.kurmah.studio/...`. `/test-level` renders the app 404.
- Local image check (:8080) passed the same checks before the deploy.
- Tests at `dc2af77`: shared 547/547, server 40/40, client 581/581; typecheck 0; lint 0 errors.
- Docker Desktop stopped (`docker desktop stop`; no backend PID).
- Redeploy: `./scripts/deploy.sh` (owner runs it; the auto-mode classifier blocks agents from a production deploy).

## Uncommitted

- `.claude/memory/MEMORY.md`: my index line for `quit-docker-desktop-via-cli.md`, next to do-setup's uncommitted `kurmah-netbird-infra.md` line. Not committed, so do-setup's line is not taken with mine.

## Held files

None.

## Next

1. None. Wait for a new lane.

## Open questions

- None.

## Lessons → memory

- `.claude/memory/quit-docker-desktop-via-cli.md`
