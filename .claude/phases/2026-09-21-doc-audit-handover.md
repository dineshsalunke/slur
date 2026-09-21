# Handover — doc audit and de-bloat (2026-09-21)

**State: complete and committed.** `23ce09c` (GDD · TDD · docs/README · backlog) on `dev`, after the
owner's `9fbd395` which committed the CLAUDE.md rewrite alongside the new `.claude/rules/`.
Working tree clean. `pnpm lint` and `pnpm test` green.

## What was done

**CLAUDE.md** — cut 3 725 → 2 366 words. All non-negotiables kept, renumbered 1–14 (the list skipped #12).
The ADR-000 restatement, the GDD §0 restatement and the ~700-word arc-status paragraph became pointers.
Corrected: the art-pass self-contradiction, the pnpm version (now "read the catalog"), the `pnpm lint`
command, a missing `pnpm test` row, hard-coded test counts, the false "deps not installed / blank page"
paragraph, the stale raised-camera claim, and a **"Shift boost" control that does not exist**.

**TDD** — rewritten as v1 as-built. Routes, schema field order, `@colyseus/testing`, generator description,
§10.

**GDD** — 9 targeted edits: §5.6 as-built rows (armour live · slab is the game floor · rail shipped),
§5.2 camera, §8 aiming + LMB, §10 renumbering, §5.2/§5.5 de-duplication.

## Deliberately NOT done (owner's call this session)

1. **GDD §0 names a contract that was never built.** `MIN_CLEAR`, `MAX_SHIP_WIDTH`, `CLEARANCE_MARGIN` and
   the module-load assertion `2·max(halfW) ≤ MAX_SHIP_WIDTH` exist in **no source file**. What ships is
   `MIN_LANE = 2 * CELL = 8u` (`sim/track.ts:91`) with `SLOPE_CAP`/`CURV_CAP`, asserted in `track.test.ts`,
   not at module load. §0 even claims it "replaces the old ≥2 lanes = 8u" — but 8u is what runs. Owner chose
   flag-only; no issue filed. **CLAUDE.md non-negotiable #11 now points at this section.**
2. **GDD §5.5 flight stats** disagree with `ship-classes.ts` on strafe power and grip for all five classes.
   Marked stale in place; reconciliation parked in `.claude/backlog.md`.

## ADD audit — findings only, nothing edited

1. **§0's authority table points at dead paths.** `docs/art-direction/handoff/` and `boards/` were replaced
   2026-09-20/21 by subject folders. `ADD.md:15–17,230,238` cite them. Same stale paths in `DECISIONS.md`
   (ADR-008/010/012, "board 24 panel 02", "boards 07/09"), `ART_SCALE_REFERENCE.md`, `ART_MATERIALS.md`.
   The package README says dev reference code was left un-updated at the owner's request — known desync.
   **Only CLAUDE.md's block was fixed.**
2. **§6 and §10 OQ8 are superseded by ADR-011.** §6 argues to *keep* +9u for see-over-walls; `chase.ts:7`
   ships `height: 7.5`. OQ8 still says the change needs an ADR that already landed.
3. **A third camera authority exists.** `art-direction/progression/CAMERA.md` (2026-09-21) freezes an
   *elevated* framing with "visible obstacle tops" and explicitly refuses to give numbers. Neither 7.5u nor
   v2's 4.5u. Needs reconciliation by a human.
4. **§5 says "cyan bolt tracers"**; `projectile-field.tsx:69` emits `#8affff`. ADR-008 makes marigold the
   only energy colour. Either the code owes a recolour or the palette owes an exception.
5. **§6 claims the camera knobs are "commented" in `chase.ts`** — that file has zero comments, correct under
   the comment rule.
6. **§7 lists "speed/fuel"** as HUD content; fuel was cut in GDD §5.1.
7. **§4 treats the breakable block as frozen contract** while ADR-009 is PROPOSED and gated on a readability
   test. Art locked ahead of the mechanic.
8. §9's "one bitmap" claim verified true (`nebula-backdrop.jpg` is the only file in `public/textures/`).

## If picking this up next

The ADD is the remaining doc. Items 2–7 above are ordinary corrections a session can make. **Item 1 and
item 3 are not** — they need the owner, because they cross into `docs/art-direction/`, which is read-only
for Claude, and because the camera now has three competing authorities.
