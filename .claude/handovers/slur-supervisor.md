Agent: slur-supervisor · Lane: supervision · Updated: 2026-09-29 (seam 13)

## Goal

Assign lanes, hold the file-claim table, relay plans and questions between the owner and the workers.
The rules are in `CLAUDE.local.md`. Clear and resume steps: memory `supervisor-clears-workers-via-herdr.md`.
Standing approval to clear workers at a seam. Read the context bar with `grep -oE "│ [█░]* [0-9]*%"`; loop reads
until 0%. Use `bash -c '…'` for herdr loops. Reply to a worker's cross-session message with SendMessage to its
`from=` socket (workerone = uds:/tmp/cc-socks/1146.sock, workerthree = uds:/tmp/cc-socks/58651.sock).
Older history: `git log -p -- .claude/handovers/slur-supervisor.md` (seam 12 = 9f900eb and follow-ups).

## Standing owner decisions

- OWNER RULE: dev only, ONE stack (:5173/:2567). No worktrees, no scratch stacks.
- OWNER RULE: the worker who fixes an issue closes it with a SHA comment. Put it in every lane brief.
- OWNER RULE: the owner tests everything on /test-level. Every brief says so.
- OWNER RULE: never ask about an issue by number alone (title + one line).
- ONLY THE OWNER DEPLOYS: `! docker desktop start && ./scripts/deploy.sh` (refuses dirty tree / unpushed HEAD).
- Prod: https://slur.kurmah.studio. do-setup owns infra.
- Look (#364 254d267): HDRI cyclorama_hard_light 1k (#362 d47a026), Environment.rotation 210, intensity 1,
  Metal + Hull baseColor #232324, Neutral tone mapping exposure 1. Home, lobby and race all read one tuning.
- #354 closed (cb21183): engine pool marigold, anisotropy DROPPED, Reflect.blur dial, Wear = base.
- FINAL KEY LAYOUT (owner, supersedes #358 Blur): ↑/↓ throttle/brake, ←/→ strafe, Space jump, E fire fwd,
  D fire back, S/F prev/next slot, X drop, B mirror, M mute, Esc. ALL old keys removed, no Mac split, pad +
  touch remapped. Owner keeps the half-height MacBook ↑. Lobby ship picker A/D stays (lobby only).
- Hidden keys: W removed #363 056e436; R/E/F removed #366 9981493; V mirror for players #367 2cf7326
  (persists in localStorage slur.rearView; moves to B in #368). CLAUDE.md controls line has V (f718a13).

## Workers

| Worker | Pane | Lane | State | Held files |
|---|---|---|---|---|
| workerone | w2Z:p2 | #365 seam streaks: (a) exact cross-profile from world-affine varyings (cause = quad interpolation skew, measured; NOT camera); (b) normal warp, energy-conserving roughness spread, grime/groove mask, Schlick. New dials Reflect.warp/grime. Owner APPROVED | BUILDING | deck-reflection.ts, tuning-schema.ts, tuning-panel.tsx, docs/DECISIONS.md (ADR-031), docs/ART_MATERIALS.md |
| workertwo | w2Z:p3 | — (~12% context: clear before next lane) | IDLE | — |
| workerthree | w2Z:p5 | #368 final key layout. CLEAR for all code paths + GDD. DECISIONS.md NOT yet: gets ADR-032 after #365 lands | BUILDING | input/keyboard, power-select(+test), rear-view-toggle(+test), key-label(+test), gamepad(+test), touch-dpad.constants, power-rack.utils, controls-panel/*, lobby-chat.test, docs/GDD.md |
| do-setup | w2Z:p4 | infra | idle | — |

## Open owner questions

1. Should workertwo measure what the rear-view mirror costs (perf-analysis, GPU-synced, on/off)? Owner saw no
   FPS gain with the mirror off; likely vsync cap [inferred].
2. Compact MEMORY.md (~20 KB, near the read limit)? I offered to do it.
3. Env band: owner to try bandIntensity 5–7 under the new HDRI and report → fold as default.
4. Older: 60 fps cap for heating / M1 Retina → medium; #344 perf run window; deploy (safe when pushed);
   power-slot leak (resetSlot() never called); #349 RFC §8 Q1–Q10; .glb models, kick on results rows, #14
   reconnection Q1/Q2, #312/#313, #16, #342 gaps.
   Ctrl+1..3 tab switch is moot with #368 (digits and Ctrl both gone).

## Uncommitted

None of mine. The tree shows workerone's in-progress #365 edits (deck-reflection.ts, tuning-schema.ts,
tuning-panel.tsx).

## Next

1. DONE: #365 3f6f791 closed (workerone IDLE, no files; brief relayed). #368 code d65ada3 pushed; workerthree
   told "DECISIONS clear" for ADR-032 AND to explain the test-count drop (#367 98 files/668 → #368 73/495)
   before closing #368. CLAUDE.md controls line updated to #368 layout (this seam).
2. Await workerthree: ADR-032 SHA + test-count answer → relay to owner.
3. Owner answers → forward.
4. On owner deploy → ping workerone (/metrics, close #337/#339) and workertwo (close #338/#340/#341).

## Lessons → memory

`.claude/memory/herdr-send-keys-does-not-submit.md`
