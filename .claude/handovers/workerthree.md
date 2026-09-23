Agent: workerthree · Lane: monolith seam flicker (read-only, no issue yet) · Updated: 2026-09-24 ~02:40

## Goal

Find why the monolith seams flicker far away and stop close up. Read-only lane. Report the cause and a
proposed fix to slur-supervisor.

## Done

- Cause found and measured. Report sent to slur-supervisor. Nothing in the tree changed except this
  handover and one memory (committed with it).

## State

- Method: headless Chrome, DPR 1, 1600×813, `/test-level` at HEAD fd818e6. Stepped R3F clock
  (`frameloop 'never'` + `advance`), ship placed over CDP, 1u per frame (≈ cruise 55u/s at 60 fps).
  Seam pair at z 494.23, x ±34.22. Probe = warm (R−B) peak in ±8 px of the seam's projected column.
- Cause [verified]: sub-pixel point sampling. The scene has no AA (`EffectComposer multisampling={ 0 }`,
  main target `DEPTH_COMPONENT24` 1600×813, no MSAA). The 0.5u seam is < 1 px at ~350–420u. When it
  crosses a column boundary no pixel centre is inside it, and the whole seam is gone for a frame
  (pixel dump: frame 11 col 851, frame 12 absent in rows 340–382, frame 13 col 852).
- Baseline 380→340u (camera 394→354u), 41 frames: 5–7 whole-seam drops to 0.65–0.79 of neighbours, every
  ~7 frames = one per 1 px lateral travel. Mean frame-to-frame jump 0.10.
- At 314u camera distance (0.5u steps): no drops, seam in 100% of rows. Matches "gone close".
- Dials, one at a time, same 41 frames (drops < 0.85 / mean jump):
  emissive 6: 8 / 0.145 (worse) · width 0.75: 0 / 0.023 · width 1.0: 0 / 0.03 · width 1.5: 0 / 0.03 ·
  proud 1.0: 0 / 0.022 · proud 1.5: 0 / 0.03 · polygonOffset −1/−1: 0 / 0.024 · −2: 0 / 0.02 · −4: 0 / 0.03.
- Not z-fight [verified depth format, inferred step]: 24-bit depth step at 374u ≈ 0.008u vs 0.25u proud.
  polygonOffset cures it by widening the visible sliver near the oblique inner face [inferred].
- polygonOffset −1 at d 40 and 120: no visible bleed-through or width change (crop compare, by eye).
- Plate grid ruled out by the owner (Monolith.plate 0 still flickers).
- Why "suddenly" [unmeasured]: not established. The AA drop in 1bb7ae3 did not change the scene pass
  (composer was already multisampling 0 since a2c4f8d) [inferred]. A lower `Render.dpr` (slider since
  248096d) would halve the seam's px and push the flicker band closer [inferred].
- Scratch :5183 and my Chrome :9343 are killed. My Chrome :9333 (pid 56470) is left running because
  another agent navigated it to `localhost:5173/?backdrop=game` and is driving it — flagged to the
  supervisor.

## Uncommitted

- none

## Held files

- none (read-only lane)

## Next

1. Wait for the supervisor/owner's pick of fix. Proposed: `polygonOffset: true, polygonOffsetFactor: -1,
   polygonOffsetUnits: -1` on the seam material in `monolith-group.tsx` (same values as `SEAM_SURFACE`,
   `track-materials.ts:72-74`). Alternative: `EDGE_SEAM.width` 0.75.
2. If approved as a build lane: claim `monolith-group.tsx` (or `monolith-config.ts`), apply, rerun the
   41-frame stepped sequence to confirm 0 drops, plus a 430→250u sweep.

## Open questions

- Owner: polygonOffset −1 (no look change) or width 0.75 (seam 1.5× thicker everywhere)?
- Supervisor: who is driving the Chrome on :9333? It renders the game on :5173.

## Lessons → memory

- `.claude/memory/sub-pixel-geometry-drops-out-without-aa.md` (no-AA dropout mechanism; zsh `$a` does
  not word-split, so verify a dial applied before trusting a null result).
