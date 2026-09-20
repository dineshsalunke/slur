# Supervisor handover — session 11 (2026-09-19)

Written at a clean seam. No work is in flight; nothing is uncommitted that a successor must finish.

## What this session did

1. **Killed both lanes.** `track-d0` and `block-f3` interrupted (`herdr agent send-keys … c-c c-c`), both
   worktrees removed. Verified clean and fully pushed **before** removal.
2. **Audited `docs/art-direction/` for material definitions** — the whole package, code deliberately not
   consulted (owner's instruction: reading the code would seed drift).
3. **Wrote `docs/ART_MATERIALS.md`** (untracked), revised it against Codex's review, and copied both
   revisions to the clipboard for the owner to paste into ChatGPT.
4. **Recorded the ChatGPT-workspace rule in `CLAUDE.md`** (modified, uncommitted).
5. Updated the `art-direction-from-chatgpt-handoff` memory with all of the above.

## Branch state — verified this session

`git fetch origin` then inspected. Both lane branches are pushed; **neither is behind `dev`**, so both
fast-forward cleanly and no stale-base hazard applies.

| Branch | Tip | vs `origin/dev` |
|---|---|---|
| `origin/art/track` | `86615cd` | 16 commits ahead, 0 behind |
| `origin/art/block` | `30a1b3c` | pushed, worktree removed |
| `origin/dev` | `1807bc0` | — |

Remaining worktrees: `background`, `frame-tap`. Removed: `track`, `block`.

## `art/track` — what is on it

Two interleaved bodies of work, 28 files, +1884/−352:

- **Sky/backdrop framing** — `e339381` backdrop inside R3F's far plane (not three's), `b00c91f` fov slider
  range + corrected coverage number, `441a2d9` tilt −2 / fov 120 with a pinned margin, `c937888` sky
  framing knobs in `/art-lab` with the star coupled to pan. Owner's read: good to go.
- **Track slice 1** — `track-view.tsx` split into `track-ribbon` / `track-blocks` / `track-floor`,
  `track-materials.ts` given the floor's real material, floor built past the finish line, a span's own
  height honoured, `track-instancing.ts`, a gallery slab subject. `86615cd` records what slice 1
  deliberately has **not** done — a seam, not breakage.

## Next action, and the reasoning behind it

**Open a PR for `art/track`, run the full verify gate, review, merge with `gh pr merge`.** Do not merge
into local `dev`: `CLAUDE.md`'s worktree rule keeps the shared checkout read/merge-only, a local merge
puts local `dev` ahead of origin (the `#118`→`#119` failure mode), and `.claude/art-pass/INDEX.md` +
`02-track/README.md` are dirty in the shared checkout *and* changed on the branch, so a local merge would
conflict or clobber.

**Land both halves in one PR rather than cherry-picking the sky commits.** The two bodies of work are
interleaved with lane docs that reference each other; surgery buys conflict risk and no gain. Split only
if the gate fails or review finds the track half visibly incomplete.

Gate, verbatim from `.claude/lane.json`:

```
pnpm typecheck && pnpm lint && pnpm --filter @slur/shared test && pnpm -r test && pnpm build
```

`pnpm -r test` silently skips `@slur/shared`; the explicit `--filter` is not redundant.

Run it in a worktree, never the shared checkout:

```
git fetch origin && git worktree add ../slur-worktrees/track-pr origin/art/track
cd ../slur-worktrees/track-pr && pnpm install
```

Before merging, check `refs/pull/N/head` equals the SHA the gate was green at — a PR's `headRefOid` has
trailed the real tip before (`#94`, three regressions shipped).

## Worktrees, as of this handover

`background`, `frame-tap`, and **`art-reorg`** at
`../slur-worktrees/art-reorg` on branch `art/art-direction-reorg` — holds PR #130, keep it until that
merges. Removed this session: `track`, `block`, `golden-ref`.

The shared checkout's `docs/art-direction/` will keep showing dirty (4 modified + the new folders) until
#130 merges — those same files are committed on the PR branch, so do **not** commit them here.

## Uncommitted in the shared checkout — needs a home

Modified: `CLAUDE.md` (the ChatGPT-workspace callout), `.claude/art-pass/INDEX.md`,
`.claude/art-pass/02-track/README.md`.
Untracked: `docs/ART_MATERIALS.md`, `.claude/art-pass/02-track/LANE-BRIEF.md`,
`.claude/art-pass/07-blocks/`, `HANDOVER-SUPERVISOR-SESSION-{6,7,8,10}.md`, and this file.

Note that `INDEX.md`, `02-track/README.md`, `02-track/LANE-BRIEF.md` and `07-blocks/LANE-BRIEF.md` also
exist **on `art/track`**. Land `art/track` first, then reconcile what is left — do not commit these paths
in the shared checkout ahead of the merge, or the same content lands twice with different history.

`docs/ART_MATERIALS.md` and the `CLAUDE.md` callout belong in their own docs PR, not bundled with the art
branch.

## ~~Open, unexplained~~ — RESOLVED later in this session, see "Earlier board-00 mystery: CLOSED" below

The section below is kept for the reasoning trail only. **Its conclusion is retracted**: board 00's change
was a deliberate ChatGPT re-export, its hash appears in that session's own manifest, and it is committed in
PR #130. Do not act on the open questions it raises.

`docs/art-direction/boards/00_original_slur_gameplay_concept.png` is **modified in the working tree** —
LFS pointer moved from oid `054eefbb…` / 2,728,059 bytes to `6e8fbc3b…` / 2,728,425 bytes, mtime today
13:00 while every other board reads 18 Sep 19:41. So the image bytes genuinely changed; it is not a smudge
artefact. It predates this session — nothing run here touched it. Either the ChatGPT project setup wrote
into the folder, or a lane did before being killed.

**Left exactly as found**, because that folder is now read-only for Claude. Unresolved question for the
owner: if ChatGPT writes into `docs/art-direction/`, the read-only rule must also forbid
`git checkout`-ing a file in there to "restore" it — otherwise Claude would revert Codex's own work. The
two dead branches have not been checked for whether either touched that path.

## Decisions taken this session, with reasoning

- **Material spine: stone for the world layer, hard-surface metal for the playable layer.** Owner's call.
  Resolves `handoff/04_OBSTACLES.md`'s unresolved "shared with track/**world**" fork for blocks toward
  metal — which is what makes hazards read differently from monoliths, the requirement that document
  opens with. Engineered stone stays live as the alternative in `ART_MATERIALS.md` §5, with the test that
  settles it named.
- **Monolith and standard-block marigold seams: restored** after Codex's review. Draft 1 removed both and
  declared only one as an override; the owner had asked for glowing monolith seams more than once. A
  material sheet must not smuggle art changes.
- **Environmental marigold quantified into two tiers** (`ART_MATERIALS.md` §3) rather than left as
  "sparse and subordinate": ≤0.25 of the track-boundary reference intensity, below the bloom threshold,
  `#FFE0A0` reserved to the gameplay tier. Codex's rule is the right direction but no asset can fail it.
- **Codex was right on physics twice** and the sheet is better for it: a gap has no cavity material (the
  void is absence; what you see is the slab's cut edges), and metalness 1.0 needs a stated finish — coated
  dielectric for blocks and shells, which separates them from the bare-metal deck by specular response,
  surviving lighting states where a roughness-only split collapses.

## The art-direction package — RESOLVED as PR #130, awaiting review

Sequence: ChatGPT's 2026-09-19 art session landed a new golden reference, which was committed verbatim as
`726b881` on `art/golden-reference-17` and opened as **PR #129**. **ChatGPT then reorganised the whole
folder, after that commit** — so #129's files sat at paths that no longer existed. `dev` never had those
paths either, meaning #129 would have **merged with no conflict** and left two copies of the archive plus
~35MB of duplicated LFS images at dead paths. A clean merge that silently duplicates, not a conflict.

**#129 is CLOSED** (branch and worktree deleted) and replaced by **PR #130** on
`art/art-direction-reorg`, cut from `origin/dev` at `1807bc0`. Two commits, deliberately separate so
ChatGPT's work is distinguishable from ours:

| Commit | What |
|---|---|
| `3a90de3` | ChatGPT's reorganised package **verbatim** — 104 added, 4 modified, 0 deleted, nothing of theirs edited |
| `e650726` | Organisation on our side — owner-authorised because ChatGPT's session limit was reached |

What `e650726` did, and why each part was needed:

- **`desctructible-block/` → `blocks/`**, with boards 25–27 moved in from `boards/`. The old name was a
  typo *and* contradicted its contents — a folder named *destructible* holding board 28's
  *non-destructible* boards — while the same topic's boards 25–27 sat loose in `boards/`. Blocks was the
  one topic that never got the per-topic folder that `track/`, `scene-background/` and `progression/` each
  received. All twelve files recorded as pure renames (`R100`).
- **The rename broke four links** naming the old folder, in `boards/README.md` and
  `golden-reference/DIRECTION.md`. Caught by re-running the link resolver *after* the move rather than
  assuming it was safe. Repointed and re-verified.
- **`ARCHIVE_SHA256.txt` now verifies 51/51.** It was 50/51: `DIRECTION.md` had been edited after the
  manifest was regenerated (the reorg's own link rewrites), so the one document carrying the decisions was
  the one document its integrity file could not vouch for. Recomputed — then recomputed again after the
  rename changed it a second time.
- `blocks/` added to the package README, which had omitted it.

**Left for ChatGPT, deliberately:** board numbers are no longer unique across folders — three different
`25`s (`blocks/25_non_destructible_blocks`, `scene-background/25_environment_celestial_hierarchy`,
`track/25_track_procedural_wear`), so "board 25" is ambiguous in any citation. Renumbering means renaming
images that specs link to: an authoring decision, not tidying.

**Next action on #130:** review and merge. Docs and images only — no code, `.ls-lint.yml` does not cover
`docs/`, PNGs ride the existing `docs/art-direction/**/*.png` LFS rule. Before merging, confirm
`refs/pull/130/head` matches `e650726`.

### New layout, verified 2026-09-19

Finalized work now sits in per-topic folders: `golden-reference/` (canonical image + `DIRECTION.md` +
`history/` with all 15 candidates, prompts, reviews, source attachments), `track/`, `scene-background/`,
`progression/`, `desctructible-block/`. Top-level `GOLDEN_REFERENCE.md` is now a 9-line pointer stub —
correctly retained, not deleted, so older references still resolve.

Checked first-hand: every relative markdown link across the package resolves except two that pre-date the
move (`handoff/README.md → UPDATED_HANDOVER.md`, `CURRENT_STATUS.md → ../../.claude/phases/…`).
`ARCHIVE_SHA256.txt` was regenerated for the new paths (51 entries, down from 82 — it now covers only the
golden-reference subtree) and **50 of 51 verify** from `docs/art-direction/`.

### Audit findings — three of four were FIXED by us in `e650726`, see PR #130 above

The owner authorised engineering-side organisation once ChatGPT hit its session limit, so the typo'd
folder, the split blocks topic, the stale `DIRECTION.md` checksum and the empty husk dirs are all handled.
**Only the board-number collision remains open**, and it is ChatGPT's to settle. The list below is the
original audit, kept as the evidence trail:

- **`golden-reference/DIRECTION.md` fails its own checksum** — the only failure of 51. Edited after the
  manifest was regenerated, or missed by it. The one doc carrying the decisions is the one unverified.
- **`desctructible-block/`** — transposed typo, and it holds `28_non_destructible_blocks_*`, so the name
  contradicts the contents. It is also the only new folder missing from the top-level README, and the
  blocks topic is split: drafts 25/26/27 stay loose in `boards/` while the final sits in that folder.
- **Board numbers are no longer unique** — three different `25`s (`boards/25_non_destructible_blocks`,
  `scene-background/25_environment_celestial_hierarchy`, `track/25_track_procedural_wear`). "Board 25" is
  now ambiguous in any citation.
- Empty husk dirs at `explorations/2026-09-19-nebula-golden-reference/source-inputs/`; boards 00–13 no
  longer covered by any checksum.

### Earlier board-00 mystery: CLOSED

`boards/00_original_slur_gameplay_concept.png` showing as modified was a deliberate re-export by ChatGPT —
its new hash appeared in that session's own 82-entry manifest, which verified clean in full. Not a stray
edit, not a lane. Commit it.

## `docs/ART_MATERIALS.md` needs a revision 3

The golden reference **overrides revision 2 in two places**. `golden-reference/DIRECTION.md`
§"Material document reconciliation" says to use revision 2 for the bare-metal deck, coated-metal
blocks/shells and stone distinctions, then explicitly supersedes: **interior track seams may carry sparse
irregular emissive inserts**, and **monolith seams may produce a visible localized halo**. Revision 2's §3
("environmental tier … below the bloom threshold — glows, does not halo") and M1's non-emissive transverse
seams both now conflict. The element table's "Interior panel divisions and seams → none" conflicts too.

`DIRECTION.md` also settles the 16-lane question the owner raised: "**Use 4u tiles as a scale/authoring
study ruler: 16 across 64u. This is not a new collision quantization rule**", with the track spec calling
for "sparse **intermittent** interior seam lights with varied lengths and irregular spacing. **No fully
glowing tile grid, marked driving lanes** or automatic safe route." So the 4u rhythm is real as an
authoring ruler and the drawing is irregular inserts, not 16 equal divisions — which was the supervisor's
recommendation, except that emissive inserts are permitted where it had said value-only. Fold that into
revision 3 as the panel-division hierarchy rather than re-deriving it.

`ART_MATERIALS.md` is still **untracked** on `dev`. It and the `CLAUDE.md` callout want their own docs PR,
after #130.

## Still not done

- Task 2 (track) and task 7 (blocks) are both mid-arc; their lane docs on the branches carry the detail.
- `docs/ART_MATERIALS.md` has not been shown to Codex in revision 2 — the clipboard copy was handed over,
  no reply yet at the time of writing.
- Nothing in this session was committed. Nothing needs to be, urgently.
