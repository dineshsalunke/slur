Agent: workerone · Lane: #337 server metrics (room + player counts) · Updated: 2026-09-28

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#337: `GET /metrics` and lifecycle log lines on the live server at slur.kurmah.studio.

## Done

- `59a4599` (pushed): `apps/server/src/metrics.ts` (`slur_rooms{phase}`, `slur_players{role}`, `slur_connections`, `slur_uptime_seconds`), `log.ts` (logfmt `slur event=…`), `/metrics` route in `http.ts`, one-line hooks in `rooms/run-room.ts`, `metrics.test.ts`.

## State

- Local :2567, measured: two node clients → lobby 1 / racers 2 / connections 2; after `start` → racing 1; after leave → all 0.
- Log order, measured in the test: room.create → room.phase 0 → join ×2 → drop ×2 → leave ×2 (players=0) → room.dispose. One leave per client.
- Server tests 43/43; server typecheck 0; `pnpm lint` 0 errors (9 warnings, all there before).
- Not deployed. The owner must run `./scripts/deploy.sh`.

## Uncommitted

- `.claude/memory/MEMORY.md`: my index line for `quit-docker-desktop-via-cli.md` (carried from #336).

## Held files

- None. Released to slur-supervisor on 2026-09-28; workertwo holds `rooms/run-room.ts` for #338. Do not edit the #337 files. Verify and close only.

## Next

1. Wait for the owner's deploy (relayed by slur-supervisor).
2. `curl https://slur.kurmah.studio/metrics` during a live race (node client over wss + start) → counts right.
3. `gh issue close 337 -c "…59a4599…"`, then report DONE.

## Open questions

- None.

## Lessons → memory

- none (onLeave also fires after a failed allowReconnection in 0.17; it is recorded in the commit body)
