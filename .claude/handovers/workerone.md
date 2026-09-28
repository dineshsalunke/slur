Agent: workerone · Lane: #336 deploy to slur.kurmah.studio · Updated: 2026-09-28

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#336: SLUR as one container, live at https://slur.kurmah.studio.

## Done

- `dc2af77` (pushed): server serves the SPA + `GET /healthz` through the Colyseus 0.17 `express` option (`apps/server/src/http.ts`), only when `SLUR_CLIENT_DIR` is set. Client connects same-origin (`wss` on https) in prod, `ws://hostname:VITE_SERVER_PORT` in dev. `@types/express` devDep. Multi-stage `Dockerfile` (build on BUILDPLATFORM, prod deps + runtime amd64, LFS-pointer guard, HEALTHCHECK), `.dockerignore`, `scripts/deploy.sh` (defaults: root@168.144.186.50, ~/.ssh/kurmah_ed25519, /opt/slur, service `slur`).

## State

- Colyseus router answers first, express second (read in `@colyseus/core` router/index.mjs) → the SPA catch-all cannot shadow /matchmake.
- SIGTERM: Colyseus registers SIGINT/SIGTERM → gracefullyShutdown by default (read in utils/Utils.mjs). No extra code.
- Dev routes: already gated in `routes.ts`; prod manifest holds only `routes/home` + `routes/game/route` (measured in the image).
- Local image check on :8080 (container stopped after): /healthz 200, / 200, /game/x 200 (SPA fallback), POST /matchmake 200. Node client: gen `phrase`, phase 0 → 2, ship z 227 after 7 s. Headless Chrome: Host → /game/:id → Go → race clock 00:04, ship model drawn, 0 console errors, ws `ws://localhost:8080/...`.
- Image: 121 MB content, 462 MB disk.
- Tests at `dc2af77`: shared 547/547, server 40/40, client 581/581; typecheck 0; lint 0 errors.
- Deploy NOT run: `./scripts/deploy.sh` was denied by the auto-mode classifier (Production Deploy). Needs the owner.

## Uncommitted

None of mine.

## Held files

None after the deploy lands (Dockerfile, .dockerignore, scripts/deploy.sh, apps/server/src/{index,http}.ts, apps/client/app/net/client.ts released on DONE).

## Next

1. Owner runs `! ./scripts/deploy.sh` (Docker Desktop is running; needs `git lfs pull` + ssh key).
2. Verify https://slur.kurmah.studio/healthz 200, host + Go in headless Chrome over wss.
3. Quit Docker Desktop. `gh issue close 336 -c "dc2af77 …"` after the owner plays a race.

## Open questions

- None.

## Lessons → memory

none
