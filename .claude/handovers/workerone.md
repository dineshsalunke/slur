Agent: workerone · Lane: #345 scene lighting (PLAN sent, awaiting owner) · #337/#339 open until deploy · Updated: 2026-09-28

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#345: the track must read evenly bright at every distance and facing on every quality tier. Space stays
dark. Plan first; build only after the owner approves via the supervisor.

## Done

- The plan went to slur-supervisor on 2026-09-28 (SendMessage): options 1–8 with numbers. Recommendation:
  keep metalness 1, raise `Metal.baseColor` to F0 ≈ 0.2 (~#7b7f86), add a world-fixed cool
  DirectionalLight from behind the camera (no shadows), put it on dials. Fallback option 7: metalness 0.6
  + albedo ×2.5 + the same key.
- No source edits.
- Earlier: #339 `fda4814` `e8bb786` `8fc2486`, #337 `59a4599` (pushed, not deployed). #342 `eaeb301` (closed).

## State

- Root cause (measured): all track metal is metalness 1, base #4a4d52, F0 ≈ 0.07.
- Baseline luma, 0–255 median: deck <30u 15.2 · 30–80u 27.3 · 80–160u 34.3. Block front 14.4, block side
  38.5, walls at 30–80u 5.8. Deep Space deck <30u 12.7.
- Option 6 (albedo ×3, metal 1, dir #cfd8e6 2.0 at pos (10,30,-20)): deck 45 / 60, fronts 37.5.
- Option 7 (metal 0.6, albedo ×2.5, same dir): deck 57 / 67, fronts 42, walls 19.6. Deep Space 55 / 61 / 39.
- Hemisphere light and lower metalness alone barely help (+3 to +4).
- GPU ms: [unmeasured]. Draw calls +0: [inferred].
- Low tier: [unmeasured]. The probe's camera capture failed on quality=low.
- Albedo was emulated live with `material.color × k` on mapped materials. That also tinted the ship. The real
  `Metal.baseColor` override is [unmeasured].

## Uncommitted

- `.claude/memory/MEMORY.md`: holds a peer's uncommitted line (time-hot-loops) plus my new line. Both are
  left for the memory commit.
- The peer's `.claude/memory/time-hot-loops-in-chrome-not-tsx.md` is not mine.

## Held files

- none. Build claims (after owner OK): new `game/scene/key-light/key-light.tsx` + `.constants.ts`,
  `game/scene/world-scene.tsx` (HELD by workerthree #344), `dev/tuning-schema.ts` (HELD by workerthree),
  `game/scene/metal.ts`, `dev/tuning-panel/tuning-panel.tsx`, `docs/ART_MATERIALS.md` (rev. 9 departure),
  `docs/DECISIONS.md`.

## Next

1. Wait for the owner's decision (relayed by the supervisor).
2. Before building:
   - Fix the probe on quality=low and measure baseline vs candidate.
   - Validate the real `Metal.baseColor` via a localStorage STORE `{value, from:"#4a4d52"}`.
   - Meter GPU ms with METER=1: a readPixels-synced median over 4 s, base vs cand.
   - Driver: `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/9b56a231-3599-418f-a76d-432ef6fb03b8/scratchpad/light/probe.mjs`
     (env: VARIANTS json, SEED, DRIVE ms, STORE json, Q tier, METER, STEP). Summary: `summ.sh <jsonl>`.
     Screenshots are `*-base.png` / `*-cand.png` in the same folder.
3. Build after workerthree commits its held files. The key light is a mount-time component, so there is no
   runtime shader recompile hitch. Record the ART_MATERIALS departure.
4. After the owner deploys: prod /metrics in a race, then close #337 and #339.

## Open questions

- Owner: option 6 (metal 1 kept) or option 7 (metalness 0.6, an art departure)?
- Kick button on the results rows (#342 follow-up)? Still with the owner.

## Lessons → memory

- `.claude/memory/raycast-luma-probe-per-surface.md`
