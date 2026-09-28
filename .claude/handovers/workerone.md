Agent: workerone · Lane: #339 server hardening (BUILT, awaiting owner check + deploy) · #337 open until final deploy · Updated: 2026-09-28

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#339: room caps, message rate limit, input validation, payload cap, and deploy.sh built from committed code. #337: verify prod `/metrics` and close it after the ONE final deploy (owner deploys).

## Done

- #337 `59a4599` (pushed): `/metrics` + logfmt lifecycle lines. Not deployed.
- #339 `fda4814` (pushed): server limits, create quota, rate + payload caps, exception guard, join name check.
- #339 `e8bb786` (pushed): client input chunks; menu messages SERVER_FULL / CREATE_LIMIT.
- #339 `8fc2486` (pushed): `scripts/deploy.sh` (SSH preflight, refuse tracked diffs / HEAD not on origin/dev, `git archive` build in a temp dir, SHA image label, never writes the droplet compose, /metrics via keychain + `curl --config -`) · ADR-026 in `docs/DECISIONS.md`.

## State

- Tests measured last seam: shared 561/561 · server 89/89 · client input-chunks + menu-form.utils + prediction 12/12.
- deploy.sh: `bash -n` clean. shellcheck not installed. Not run (owner deploys).
- `git archive` applies the LFS smudge: `bob.gltf` came out as glTF JSON (measured).
- The deploy refuses while any tracked file is dirty, which includes peers' uncommitted work. Intended: deploy only when every worker has committed.
- `pnpm lint` fails at 8fc2486 time on `apps/client/app/game/scene/ship-view.tsx` formatting — a peer's uncommitted file, not mine.
- /metrics has no app auth; Traefik adds basic auth on its own router (memory `kurmah-netbird-infra.md`).

## Uncommitted

- none.

## Held files

- apps/server/src/index.ts, limits.ts, create-quota.ts(+test), rooms/room-hardening.test.ts · scripts/deploy.sh · docs/DECISIONS.md (ADR-026). Release on the supervisor's word.

## Next

1. Owner: /test-level + hosted-room check of #339 (normal play unaffected; menu messages on 503/430).
2. After the owner's final deploy: curl prod `/metrics` during a race, then close #337 and #339 with SHAs.

## Open questions

- None.

## Lessons → memory

- none new (LFS-in-archive recorded in ADR-026).
