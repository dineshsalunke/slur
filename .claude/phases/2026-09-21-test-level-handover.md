# 2026-09-21 — handover: art backlog and the test level

Session state at context hand-off. As-built detail is in `2026-09-21-test-level.md`; this file is the
state of play and what comes next.

## Shipped to `dev`

**PR #191** (`aa62ca4`) — the art backlog. The `[~] ART PASS` umbrella was retired in place; its six-task
order lived in the deleted `.claude/art-pass/INDEX.md` and predates the re-organisation of
`docs/art-direction/`. Five `[art]` items replace it, ordered **test level → lighting → track → vehicle →
blocks**.

## On branch `feat/test-level`, not pushed

**`db87190`** — `/test-level`, closing **#192**. Visual gate passed. Details in the as-built doc.

Nothing else is in flight. `pnpm dev` was left running; kill it or reuse it.

## Do this next

1. **Amend the CLAUDE.md `/solo` line.** The owner said they would. Current text: *"`/solo` was removed
   (`52f5a04`) and stays removed."* Suggested replacement:

   > **Playtest the track in a hosted room; do art work in `/test-level`.** `/solo` was removed
   > (`52f5a04`) as a *duplicate scene* — it rendered its own grid plane and scenery and drifted from the
   > real one. A duplicate scene stays removed. `/test-level` is not one: it mounts the same `WorldScene`
   > as `/game/:roomId`.

   The as-built doc quotes the removal commit if the reasoning needs checking.

2. **Push `feat/test-level` and open the PR.** Not done — the branch was held for the visual gate.

3. **Start the next art item: scene lighting to the golden reference.** It is the first of the four that
   the test level unblocks. Note before starting: the target is not settled.
   `docs/art-direction/README.md` says *"the background board governs the newly approved hue and tonal
   balance; golden-reference colour reconciliation remains pending"* and, of the action image,
   *"Reconcile hue and tonal balance against the newly approved background board; cruise HUD accents still
   need matching."* Two approved lighting states exist — `action-lighting.png` and `cruise-lighting.png`.
   Ask the owner which governs before tuning anything.

## Things found this session that outlive it

- **`docs/art-direction/` is read-only for Claude.** Corrections go in a Claude-owned doc with a
  *decisions + departures* section, then to the owner to paste into ChatGPT.
- **The `arc` skill is not installed.** Only `backlog` exists in `~/.claude-personal/skills/` and
  `~/.claude/skills/`; there is no `.claude/skills/` in the repo. CLAUDE.md mandates `/arc` and says not to
  paraphrase it, so arc phases could not be run as written.
- **`ProcgenDescriptor.length` is wired; `tier` is not.** `makeProcgenTrack` reads
  `const length = d.length || TRACK_SEGMENTS` (`sim/track.ts:337`). Nothing reads `d.tier`. The backlog's
  ADR-001 note calling both "reserved UNWIRED" was half stale and is corrected.
- **`DebugPanel` is a full art-tuning rig already** — bloom, deck roughness and metalness, rail emitter,
  marigold reference and boundary, cold key, ambient, chase camera, with copy-to-source. It mounts in both
  `/game/:roomId` and `/test-level` under `import.meta.env.DEV`. Do not rebuild it.
- **Blocks render as two placeholder families** — `LETHAL_SURFACE` (pink) and `DRAG_SURFACE` (white) in
  `track-blocks.tsx`. The non-destructible block-art item replaces these.
- **Open issues that touch art work:** #166 bloom + React 19 ref crash on any Canvas re-render (keep
  reactive state below the Canvas); #128 R3F camera far defaults to 1000 and no client Canvas sets it;
  #173, #170, #162, #161, #160, #167, #163 are the standing art and lighting bugs.
