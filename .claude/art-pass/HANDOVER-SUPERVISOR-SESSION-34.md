# Supervisor handover — session 34 (2026-09-20)

**The lanes are fully gone and the first instrument is fixed.** `dev` at **`99782c0`**. PR queue: **empty**.
Remote branches: `dev`, `main`, `docs/codex-reconcile` (parked). Zero worktrees, zero dev stacks, zero lane
sessions.

This continues session 33, which retired the lane machinery. Read that one for why #171 closed invalid, why
#173 outranks #170, and the −Z seam question the block lane escalated.

## Done this session

- **The lane sessions themselves are closed.** Session 33 removed the worktrees and killed the stacks, but the
  two herdr workspaces were still sitting there with idle agents whose cwd pointed at deleted directories.
  Closed with `herdr workspace close w2K` / `w2M`; only the supervisor workspace `w24` remains.
- **#174 merged** → `99782c0`. `/art-lab` now opens on the Split Crown instead of on the debug slab.

## #174, as built

`DEFAULT_LAB_LAYERS` shipped `ships: false, shipBox: true` — an unlit opaque `#404040` slab exactly where the
ship belongs, with the ship hidden behind it. Both flipped.

**The lab's ship is now its own constant**, `LAB_DEFAULT_SHIP` in
`apps/client/app/routes/art-lab/lab-defaults.ts`, set to `'split-crown'`. `DEFAULT_SHIP`
(`ship-classes.ts:132`, `'challenger'`) is untouched and decides what every real player flies. **Both of the
lab's independent seeds read the new constant** — `art-lab-controls.tsx`'s `useState< ShipId >( … )` for the
picker's highlighted button and `art-lab-rig.tsx`'s `Net( { …, shipId: … } )` for what actually mounts — because
if they disagree the highlight lies about what is on screen.

Pinned by `lab-defaults.test.ts`: the two layer defaults, that the lab's ship is still in `SHIP_ORDER` (so a
roster edit cannot leave the lab pointing at a dead id), and that it is the Split Crown.

Gate green on `483b400`: typecheck clean, lint at the pre-existing 3-warning baseline, client 96/96, build OK.

## ▶ NEXT: #172, not started — but the source has been read, so don't re-derive it

**Do not re-read the whole plugin.** Everything below is verified-this-session by reading
`apps/client/frame-tap-plugin.ts` on `dev`.

**The shape.** `entry.done` is defined **inline inside `handleTap`**, closing over that request's `res`, and is
the sole writer of a tap's response. It calls the local `json( res, status, body )` helper, which sets
`statusCode`, sets `Content-Type` and calls `res.end()` — with **no `headersSent` check and no settled flag**.

**Its three callers**, each of which clears the other timers and deletes the `pending` entry before calling:

1. the `deadline` timer set when the tap is created,
2. the `settle` timer set by the **first** upload in `handleUpload`'s `req.on( 'end' )`,
3. the `server.hot.on( 'slur:frame-tap:error' )` handler.

**Honest state of the diagnosis.** The crash is real — `split-crown`'s `dev.log` carries
`ERR_HTTP_HEADERS_SENT` with the frame `Timeout._onTimeout → Object.done → json`, followed by `Exit status 1`,
and the albedo lane reproduced the conditions with a 5-tap retry loop against a port with no responder. But
**reading the code I could not construct the exact interleaving that reaches `done` twice**: each caller
guards on the `pending` map, and JS being single-threaded appears to make the obvious pairings impossible.
`[unverified]` — treat the interleaving as unknown, not as understood.

That does **not** weaken the fix, and the fix should not wait on naming the path:

- **Make the write idempotent.** A `settled` flag, or an early return on `res.headersSent`, makes the whole
  class impossible regardless of which pairing actually occurs. The testable shape is to extract the
  write-once behaviour into an **exported** helper (the existing tests only cover `validateTapName` and
  `arbitrate`, because those are the only exported pieces — `done` is currently untestable), then assert a
  double call writes once. Test file is `apps/client/frame-tap-plugin.test.ts` (note: at the `apps/client`
  root, **not** under `app/dev/`, where `frame-tap-interlock.test.ts` and `frame-tap-pump.test.ts` live).
- **Contain throws inside the tap's timer callbacks.** This is the half that actually kills the app and it is
  worth doing independently of the double-write. `done`'s success path calls `mkdirSync` and `writeFileSync`;
  a throw there happens inside a timer callback, where there is no request context to catch it, so Node exits
  and client and server go down together. Dev-only tooling must never be able to stop the app it photographs.

**Related, recorded, and unfixed:** the tap is **intermittent** — the albedo lane had `relay-probe` answer and
the next tap on an unchanged page 504. Unexplained. And a tap is **not** a safe "is anything open?" probe,
which is precisely what a retry loop makes it.

## ⚠ The user's last instruction, unactioned

**"now the way we will move ahead is first do some cleanup."** I ran out of context before acting on it and
did not ask which cleanup was meant. **Ask.** The plausible referents, in the order I would guess:

1. **The shared checkout, which still cannot `git pull`.** It carries modifications to 23 tracked files, of
   which **8 conflict with `dev`**: `CLAUDE.md`, `docs/ART_SCALE_REFERENCE.md`, `.claude/art-pass/INDEX.md`,
   `.claude/art-pass/02-track/README.md`, and four under `docs/art-direction/`. Against `dev` they are net
   deletions (90 insertions, 421 deletions), which **reads like** an older snapshot that later PRs superseded
   — `[inferred]`, not verified. Two are ours, four are ChatGPT's. **Nothing has been discarded.** Until it is
   settled, a file read from that tree can be stale, which is exactly what made session 32 report the
   frame-tap source as missing when it was on `dev`.
2. **65 untracked files under `docs/art-direction/`** — ChatGPT's divergent snapshot of a folder `dev` already
   has. Read-only for us; needs an owner decision, not an edit.
3. **`docs/codex-reconcile`** — pushed and safe, one commit, *"adopt Codex's 2026-09-19 reconciliation, keep
   the engineering sheets"*, still needs a PR-or-drop call.
4. **Untracked tool junk** that should probably be gitignored: `.playwright-mcp/` output, a `.Codex/`
   directory.
5. **Stale tech-debt issues** that are cleanup by nature: #127 and #138 (the Canvas-isolation guard's
   `strip()` silently exempting wrappers and eating files with odd apostrophes), #114, #110, #109.

## Carried, still unresolved

**#163's scope list has never been confirmed — carried from sessions 29–33.** Track slice: gaps and gap rims,
rail breaks over gaps, the z=0 seam. Ask directly rather than carrying it a sixth time.

`/iso-block-wear` has never had a frame captured, and it is the block lane's own top unmeasured item — the
wear ships at strength 0 pinned by a test, so nothing it computes reaches a shipped frame, but nothing would
tell you if the noise is wrong · the z=0 rail seam is still unlooked-at · `.claude/art-pass/02-track/README.md`
still says "not started" · #160/#161 stay in Backlog deliberately · `LETHAL_SURFACE` is still `#ff2740` red ·
the coplanar finding is still unsent to Codex · `MARIGOLD_REFERENCE_INTENSITY` at 2.0 is `[unmeasured]`.

## Gotchas paid for this session

- **The comment ratchet is a real gate and it will block a good comment.** A three-line note on `shipBox`
  failed `lint` with *"gained comment lines: 8 → 11"*. The fix is to say it in one line, not to argue with the
  ratchet. Tightening a genuinely stale comment elsewhere in the same file is a legitimate way to pay for a
  new one — the `blocks` note's "untextured boxes awaiting their own design task" was made stale by #164.
- **Don't write a test that pins a coincidence.** I first asserted `LAB_DEFAULT_SHIP !== DEFAULT_SHIP`, which
  would fail legitimately the day someone makes the Split Crown the shipped default. Assert the intent
  (`=== 'split-crown'`), not the current difference.
- **`gh pr merge --delete-branch` cannot delete a local branch a worktree holds** — carried from session 32
  and hit again. Remove the worktree first, then the branch, then the remote.
- **Write handovers into a worktree and commit them.** Session 33 found 25 of these docs existing only as
  untracked files in the shared checkout, one `git clean` from gone. The shared checkout cannot be committed
  to (non-negotiable #12, enforced by `.githooks/pre-commit`), so a handover needs a worktree — this file came
  in that way.
