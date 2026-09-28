Agent: workerone · Lane: #339 server hardening (BUILDING, owner approved) · #337 open until final deploy · Updated: 2026-09-28 17:45

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#339: room caps, message rate limit, input validation, payload cap, and deploy.sh built from committed code. #337: verify prod `/metrics` and close it after the ONE final deploy (owner deploys).

## Done

- #337 `59a4599` (pushed): `/metrics` + logfmt lifecycle lines. Not deployed.
- #339 `fda4814` (pushed): `limits.ts` (MAX_ROOMS 12, 3 live/IP, 10 creates/10 min, seat 15 s, 60 msg/s, 2 KiB) · `create-quota.ts` gate appended to `installMatchmakeGuard([ new FailedJoinLimit(), createQuota ])` · RunRoom: `onCreate` full check, `onAuth` records owner IP, `onDispose` frees, `onUncaughtException` logs `room.error` · ws `maxPayload` 2 KiB in index.ts · `RunSim.join` typeof name · shared `CREATE_LIMIT_CODE` 430, `SERVER_FULL_CODE` 503.
- #339 `e8bb786` (pushed): client `net/input-chunks.ts` (newest 120, ≤20 per message) wired in attach-room-to-world.ts · menu messages SERVER_FULL / CREATE_LIMIT.

## State

- Tests measured: shared 561/561 · server 89/89 (incl. create-quota 8, room-hardening 5) · client input-chunks + menu-form.utils + prediction 12/12. Client tsc clean for my files. Comment ratchet clean.
- Input validation audit: `sanitizeInputs`, `enqueueFire`, `isSlot`, `isShipId`, `isColorId`, chat `post(text: unknown)` were already type-checked + clamped. Only gap was the join name (fixed).
- Client batch bound: `createFixedStep` maxSteps 5 → ≤5 inputs per frame; 30 Hz drain → normally 2. Chunking makes the 2 KiB cap hold by construction (20 touch inputs 1360 B, measured last seam). No browser re-measure done [skipped: invariant replaces it].
- Owner IP: WS auth context uses `x-real-ip` first; HTTP matchmake uses XFF. Behind Traefik both give the client IP [inferred]. In dev/tests the HTTP ip is 'unknown', so pending creates key there and expire after 15 s.
- Flood test takes 20 s: the dropped flooder holds a reconnection seat (RECONNECT_SECONDS 20).
- run-sim.ts + run-room.ts RELEASED to workertwo (#341) after fda4814. Ask the supervisor before touching them again.
- Shared dist went stale after editing run-sim.ts; `npx tsc -b --force` in packages/shared fixed it.

## Uncommitted

- `.claude/memory/MEMORY.md`: my index line for `quit-docker-desktop-via-cli.md` (carried from #336).

## Held files

- apps/server/src/index.ts, limits.ts, create-quota.ts(+test), rooms/room-hardening.test.ts · scripts/deploy.sh · docs/DECISIONS.md (ADR-026). Released: run-sim.ts, run-room.ts, room-code.ts, menu-form*, attach-room-to-world.ts, input-chunks*.

## Next

1. scripts/deploy.sh: `set -euo pipefail`; SSH preflight `ssh -o BatchMode=yes ... true`; refuse a dirty tree for tracked files and refuse HEAD not on origin/dev (`git fetch` + `git merge-base --is-ancestor HEAD origin/dev`); build from `git archive HEAD | tar -x` into a temp dir (plus `git lfs` files — check how LFS content lands in an archive; may need `git lfs pull` then copy LFS objects, or `git archive` with LFS smudge attr); docker build there; NEVER write /opt/slur/docker-compose.yml; after healthz, curl `/metrics` with basic auth `owner` + `security find-generic-password -s slur-metrics -w` only if readable. Keep SLUR_HOST/KEY/DIR/URL env overrides. Test with `bash -n` + shellcheck if installed; do NOT deploy.
2. ADR-026 in docs/DECISIONS.md: the numbers + measurements (CPU slope 0.75%/room on M1 Pro, ×3 droplet, ×2 headroom → 12; msgpackr sizes; 4 KiB default → 2 KiB), per-IP owner via onAuth + pending seat window, onUncaughtException, chunking, deploy rule. Quote Room.mjs:973 rate-limit behaviour (count resets after 1 s window).
3. Commit, tell slur-supervisor, brief the owner (via supervisor) for a /test-level + hosted-room check. Leave #339 open until the owner's final deploy; then verify prod /metrics during a race, close #337 and #339 with SHAs.

## Open questions

- None open. Owner approved: 12 rooms, 3 live per IP, 10 creates/10 min, 60 msg/s, 2 KiB, refuse-unless-pushed deploy.

## Lessons → memory

- none new (stale dist is already `shared-watcher-can-leave-dist-stale.md`; zsh no word-split is covered by `bash-tool-runs-fish.md`).
