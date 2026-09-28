Agent: workerone · Lane: #339 server hardening (PLAN sent, awaiting owner) · #337 open until final deploy · Updated: 2026-09-28

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#339: room caps, message rate limit, input validation, payload cap, and deploy.sh built from `git archive HEAD`. #337: verify prod `/metrics` and close it after the ONE final deploy (owner deploys after all hardening lands).

## Done

- #337 `59a4599` (pushed): `/metrics` + logfmt lifecycle lines. Not deployed.
- #339 plan sent to slur-supervisor (full text in that message). No edits yet.

## State

- Load test, measured on :2567 with scratchpad `room-load.mjs` (node bots, 30 Hz × 2 inputs, groove track, tsx dev): server CPU 1 room 4.4% · 4: 9.6% · 8: 10.8–11.8% · 16: 18.0% · 24: 23.5%. Slope ≈ 0.75% of one M1 Pro core per full room. RSS +14 MB for 24 rooms.
- Droplet factor ×3 [inferred], combat/phrase headroom ×2 [guessed] → ~4.5% per room → MAX_ROOMS 12.
- msgpackr sizes, measured: 2 inputs 104/152 B (keyboard/touch); 10 inputs 448/688 B; 20 inputs 880/1360 B; 60 touch inputs 4040 B. Chat max 429 B (569 B before the server slices).
- ws-transport default maxPayload is 4 KiB (`WebSocketTransport.mjs:19`). Rate-limit close is at `Room.mjs:973`. Unknown message types are closed in production (`Room.mjs:94–101`).
- Crash gap: no `onUncaughtException` on RunRoom, so a throw in a handler or the tick ends the process [inferred from `Room.mjs:112, 372–378, 603`].
- Sequencing: I land run-room.ts + index.ts first, then release them to workertwo (#340).
- workertwo pushed `client-ip.ts` + `matchmake-guard.ts` in `fcd917b` [API relayed by supervisor, not read by me]: `clientIp(authContext)` → last XFF hop or 'unknown'. `installMatchmakeGuard(gates)` wraps invokeMethod once. Gate = `{ admit?(call, nowMs), failed?(call, error, nowMs) }`, `call = { method, roomName, ip }`. Throw `ServerError(code, msg)` from admit to refuse.
- My per-IP create cap = a gate in MY `create-quota.ts` that counts `create`/`joinOrCreate` in admit. NEVER edit `matchmake-guard.ts`.
- Supervisor's call: in index.ts I add the one line `installMatchmakeGuard([ new FailedJoinLimit(), <my gates> ])`, importing workertwo's `apps/server/src/failed-join-limit.ts`.
- GAP A (chatHistory throttle) is workertwo's, in chat-log.ts. Dropped from my claims.
- deploy.sh contract (do-setup #343): root@168.144.186.50:22, key ~/.ssh/kurmah_ed25519. NEVER write /opt/slur/docker-compose.yml. /metrics basic auth user `owner`, password `security find-generic-password -s slur-metrics -w`.

## Uncommitted

- `.claude/memory/MEMORY.md`: my index line for `quit-docker-desktop-via-cli.md` (carried from #336).

## Held files

- None until the plan is approved. Claims requested: run-room.ts, index.ts, limits.ts, create-quota.ts(+test), hardening.test.ts, shared run-sim.ts(+test), client attach-room-to-world.ts, scripts/deploy.sh.

## Next

1. Wait for the owner's approval via slur-supervisor.
2. Build step 1: measure the real max input batch in one headless /test-level race with a forced 2 s block.
3. Land run-room.ts + index.ts (including the installMatchmakeGuard line and the create-quota gate), release them, then the rest. Read `fcd917b` for the real gate types before writing create-quota.ts.
4. After the owner's final deploy: verify prod /metrics during a race, close #337 and #339.

## Open questions

- Owner: approve the numbers (12 rooms, 3 live per IP, 60 msg/s, 2 KiB) and the refuse-unless-pushed rule in deploy.sh.

## Lessons → memory

- none
