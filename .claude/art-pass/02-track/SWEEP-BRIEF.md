# LANE BRIEF — slice 2, the metalness sweep

**Branch** `art/track-slice2` (already at `fcd9112`, pushed, clean) · **worktree**
`/Users/apple/Projects/personal/slur-worktrees/track-slice2` · **ports** `CLIENT_PORT=5201`,
`VITE_SERVER_PORT=2601` (already in `apps/client/.env`).

Written by the supervisor. You execute. **You do not write briefs, decision records, handovers or docs of
any kind, and you do not write code comments.** Report first-hand facts in a short message; I write the
prose. Your context is the scarce thing — spend it on pixels.

This brief is deliberately self-contained. Do **not** read `LANE-BRIEF.md`, the task README, the research
docs or the boards for this job. Everything the sweep needs is below.

---

## 1. The finding you are acting on

`fcd9112` shipped `FLOOR_METALNESS = 1.0` / `FLOOR_ROUGHNESS = 0.42` in
`apps/client/app/game/scene/track-materials.ts`.

The captured frame (`.claude/art-pass/00-frame-tap/refs/s2-retone-bloomon.jpg`, and `…-bloomoff.jpg`) shows
two things:

- **The boundary is right.** Continuous narrow marigold at the slab's upper outer corner, embedded not
  raised, breaking over the gaps, blooming into the warm halo the board asks for. Do not touch it.
- **The deck is wrong** — a near-white specular sheet, the graphite texture washed out of it.

The diagnosis, inferred and not yet measured: the chase camera looks down the ribbon at a grazing angle,
and Fresnel reflectance goes to 1.0 at grazing incidence for every material, so a metalness-1.0 deck
mirrors the star and the sky across most of its visible area. Two corollaries worth knowing before you
try something clever: darkening the albedo is **not** the fix (`BASE = '#14181e'` in `track-texture.ts` is
already dark), and neither is raising roughness — Fresnel is an angle term, not a roughness term. The
shipped-before value of 0.12 was dodging this by accident.

## 2. The job

Sweep `FLOOR_METALNESS` down at **fixed** `FLOOR_ROUGHNESS = 0.42`. Change one constant, capture one frame,
repeat:

`1.0` (already captured — reuse `s2-retone-bloomon.jpg`) → `0.7` → `0.5` → `0.3` → `0.15`

Change nothing else. Not roughness, not the base colour, not the boundary, not the camera.

## 3. How to run and capture

One stack, from the worktree root: `PORT=2601 pnpm dev`. Do not start a second one. The lab is
`http://localhost:5201/art-lab`.

Capture: try `curl 'localhost:5201/__frame-tap?name=s2-metal-070'` **once**. If it 404s, hangs, or answers
"nobody answered", drop it immediately and use the Chrome-tab screenshot route, which worked first time
last session and cost nothing. Do not spend budget debugging the tap — that is a known-unresolved thing and
it is not your task.

Name every frame with its metalness value in the filename, into `.claude/art-pass/00-frame-tap/refs/`.

Two traps already paid for, if the Canvas comes up blank: a stale Vite dep cache
(`rm -rf apps/client/node_modules/.vite`, restart) and unsmudged git-lfs ship models (`git lfs pull`).

## 4. Then

Commit the winning value alone — one commit, code only, no comments — and open the PR for
`art/track-slice2` after running the **full** gate:

```
pnpm typecheck && pnpm lint && pnpm --filter @slur/shared test && pnpm -r test && pnpm build
```

(`pnpm -r test` silently skips `@slur/shared` and its 75 tests; the explicit `--filter` is not redundant.)

Message the supervisor the frame paths and your pick in a handful of lines. If something blocks the sweep,
message me — do not write a document about it.
