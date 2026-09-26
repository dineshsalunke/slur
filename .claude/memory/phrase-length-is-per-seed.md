---
name: phrase-length-is-per-seed
description: "Since afcc66c the phrase track length is phraseSegments(seed) (744–768 on seeds 1–30); a script that passes 600 measures a different, 4-section track"
metadata:
  node_type: memory
  type: project
  originSessionId: 26731eaf-3e92-46f4-ae68-8905820e0be2
  modified: 2026-09-26T20:36:41.206Z
---

Since `afcc66c` (#300, 2026-09-27) the phrase gen has no fixed length. `phraseSegments(seed)` in
`sim/phrase/plan.ts` sizes it for 5 sections, and `procgenDescriptor` and `/test-level` both call it.
`TRACK_GEN_SEGMENTS.phrase` (600) is left only as the fallback when a descriptor has no length.

**Why:** a scratch post-count script still called `planPhrases(seed, 600)`. It reported 4-section
numbers (1.0 posts per act-1 lane) where the real track has 2. Nothing errors. The plan just shrinks.

**How to apply:** in any phrase measurement, build through `phraseTrack(seed)`, `buildPhrase(seed)` or
`planPhrases(seed, phraseSegments(seed))`. Never type 600. Same trap as [[fixtures-must-be-width-relative]].
