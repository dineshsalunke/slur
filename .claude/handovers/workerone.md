Agent: workerone · Lane: #342 moderation (DONE, closed) · #337/#339 open until owner deploys · Updated: 2026-09-28

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#342 is shipped. #337/#339 wait for the owner's deploy. Then verify prod /metrics in a race and close both (the supervisor pings).

## Done

- #339 `fda4814`, `e8bb786`, `8fc2486`. #337 `59a4599`. All pushed. Not deployed.
- #342 `eaeb301` (pushed, issue closed): host kick (KICK/KICKED messages, CONSENTED close), per-browser token rejoin block (403), chat purge on kick, obscenity server-side filter (mask chat, bad name → Racer, strip \p{Cc}\p{Cf}), roster kick button, ADR-028, GDD line.

## State

- Tests: shared 572/572 · server 99/99 · client 617/617. Typecheck + lint clean (9 old warnings).
- Live on :2567 with two node clients (measured): bad name → Racer · "gg you sh1t" → "gg you ****" · kicked guest leave code 4000 · rejoin 403 · new token joins.
- obscenity englishDataset: 119 patterns, 66 whitelist terms (measured). Gaps: spaced letters pass; "Dick Grayson" is masked.
- The kick button is on the lobby roster only. The supervisor asked the owner about the results rows.
- Not checked in a browser. The owner check is pending.

## Uncommitted

- none of mine. `.claude/memory/MEMORY.md` + `time-hot-loops-in-chrome-not-tsx.md` are a peer's.

## Held files

- none (released at eaeb301).

## Next

1. Owner check in a hosted room with two clients: kick from the roster, rejoin by link is blocked, masked chat, bad name → Racer.
2. If the owner wants it: a kick button on the results rows.
3. After the deploy: prod /metrics in a race, then close #337 and #339.

## Open questions

- Kick button on the results rows? (with the owner, via the supervisor)

## Lessons → memory

- none new. The consented-close rule is recorded in ADR-028.
