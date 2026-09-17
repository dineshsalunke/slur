# art-handoff-v2 — what landed, and what deliberately did not

*Added by engineering on ingest (2026-09-18). Everything else in this directory is the vendor package
verbatim.*

## The boards were NOT reshot

**Every concept board in the v2 zip is byte-identical to its v1 counterpart** — verified by SHA-1 across
`01`, `02`, `03`, `07`, `09` and `10` before landing. `13_original_mood_anchor.png` is also a byte-identical
duplicate of `00_original_slur_gameplay_concept.png`.

So they are **not duplicated here**. The v1 boards remain the canonical copies at
`docs/references/art-handoff-v1/boards/`. Only the genuinely new image lives in `boards/`:

| File | Status |
|---|---|
| `12_approved_scene_marigold_depth.png` | **NEW** — the v2 "latest approved visual" |
| `01`–`11`, `00` | unchanged from v1 — see `../art-handoff-v1/boards/` |
| `13_original_mood_anchor.png` | dropped — byte-identical to board `00` |

This keeps 28MB of identical binaries out of the repo. It is a storage decision only; nothing was
discarded.

## What this means for the scale corrections

**The v2 corrections are textual, not visual.** `UPDATED_HANDOVER.md` §3 now carries the right numbers —
64u ribbon, 8u constant block height, 20u gaps, free block width/depth, correct ship footprints — but
**boards `07` and `09` still show the old undersized proportions**, because they were never re-rendered.

The package is honest about this: *"Approval of a concept image is approval of visual intent, not proof
that its perspective encodes exact dimensions"*, and its own acceptance check #1 says *"do not validate
dimensions from pixels in generated art."*

> **Therefore `docs/ART_SCALE_REFERENCE.md` remains authoritative on every dimension.** Read the boards for
> mood, material, silhouette and composition. Read the scale reference for numbers. That split has not
> changed between v1 and v2.

## Files reorganised on ingest

- `GOLDEN_REFERENCES/` → `boards/` (matches the v1 layout)
- `SOURCE/CLAUDE_ENGINEERING_FEEDBACK_2026-09-17.md` → top level (it is our own feedback doc, returned)
- `SOURCE/SLUR_GDD_v0_current.md` → dropped; the live GDD is `docs/GDD.md` and a stale snapshot beside it
  invites someone reading the wrong one

## Status of v1

**Superseded, not deleted.** `art-handoff-v1` stays for the boards and as the record of what was first
frozen. Where the two disagree, **v2 wins** — it incorporates the engineering corrections.
