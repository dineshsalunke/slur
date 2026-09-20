# Brief — the bloom knobs do nothing: find the cause on the INPUT side

Cold-start doc. Read this and the files it names; do **not** re-read the big art docs.

## The report

The owner, dragging the bloom sliders at the top of the art-lab **TUNING** panel, said they do
nothing. His words: *"the top bloom knobs on tuning panel"*. This is a first-hand observation while
dragging, so it is not the stale-read hazard.

## The evidence that narrows it — this is the useful part

At the end of the previous gate he used the panel's `copy values` button. That dump **reads from the
store**. Diffed against `origin/dev`, the only values that had moved were
`MARIGOLD_REFERENCE_INTENSITY`, `BOUNDARY_W` and `BOUNDARY_H`. `GRID_VOID`'s bloom block came out as
the committed `1.2 / 0.42 / 0.2 / 0.6 / 4`, byte-identical.

So either he reset the bloom sliders, or **the store never received his drags**. That puts the break
at **panel → store**, not store → pixels. Start there: are the bloom sliders in whichever panel he
used actually wired to `setDebugTuning`, with the right keys?

## Leads already closed — do not re-walk any of these

- **`apps/client/app/dev/tuned-bloom.tsx` is wired correctly.** `useDebugTuning()` plus a DEV ternary,
  and it already handles the constructor-arg problem by remounting the pass on `radius`/`levels` via a
  `key`. Established first-hand.
- **`art-lab-canvas.tsx` does mount `TunedBloom`** — imported at line 7, mounted at line 77 inside an
  `EffectComposer`, behind a `bloom` layer toggle. A previous context reported it absent; that was
  wrong, most likely a `git grep` with an unescaped `|` and no `-E`.
- **The `config={env.bloom}` prop lead is closed outright.** In the installed
  `@react-three/postprocessing` **3.0.4**, `wrapEffect` computes args via `useMemo` keyed on
  `JSON.stringify(props)` and hands them to the R3F primitive, so any prop change reconstructs the
  `BloomEffect` — store → `<Bloom>` applies live by construction. And `TunedBloom` ignores `config`
  in DEV regardless.
- **The store is not the suspect.** The deck and boundary knobs travel the same `notify()` and they
  work.

## The thing to settle first

There are **two** panels: `apps/client/app/dev/debug-panel.tsx` (writes `DEBUG_TUNING`) and
`apps/client/app/routes/art-lab/art-lab-controls.tsx`. Establish **which one the owner was dragging**
before writing a line of fix.

## Come back with the cause before the fix

If it is structural, report the cause and stop. I would rather spend a message than have you commit a
guess.

## Chrome

**The owner holds the tab.** He is eye-gating PR #149 on `http://localhost:5205/art-lab` and only one
tab renders at a time. Diagnose from source. If you reach a point where you genuinely cannot proceed
without a tab, **ask me first** — do not take one.

## Worktree

Fresh off `origin/dev` (`bb59350`), sibling path, your own ports:

```
git fetch origin
git worktree add -B art/bloom-input ../slur-worktrees/bloom-input origin/dev
cd ../slur-worktrees/bloom-input && pnpm install
```

**Leave `../slur-worktrees/bloom-knobs` alone** — despite its name it holds `art/boundary-bevel` and
is serving the owner's `:5205` gate. Never reuse or rebase off `art/track-slice2`,
`art/marigold-retone`, `art/deck-emissive-knobs`, `art/deck-4u-bond`, `art/deck-joint-width` — all
squashed away.

## Gate

Full: `pnpm typecheck` · `pnpm lint` (3 pre-existing `noExcessiveLinesPerFile` warnings in
`packages/shared` are expected; canvas-isolation must stay 8/8; the comment ratchet must not gain
lines) · `pnpm -r test` · `pnpm build`.

Comments 1–2 plain lines, only what the code cannot say. Any mechanism decision needs five weighed
candidates, weighed **in the PR body**, never in a comment.

## Instrument hazards — all already paid for

A tab must mount **genuinely visible** (a never-visible tab never mounts R3F; canvas size is not the
test). Check `gl.info.render.frame` advances before believing any A/B capture. Drive the panel's own
DOM — never `await import(...)`, Vite HMR hands you a second module instance that half-works. Yield a
task after `dispatchEvent` before reading.
