# Shared-checkout doc edits, preserved as a patch — 2026-09-21

`SHARED-CHECKOUT-DOC-EDITS-2026-09-21.patch` holds four documents that existed **only** as uncommitted
edits in the shared checkout. They are here as a patch and not as committed files on purpose.

## Why a patch and not a commit

The shared checkout's HEAD is `1807bc0` — **27 commits behind `dev`** — so these edits were authored
against a base that predates every PR from `#126` onward. Committing them onto a `dev`-based branch would
render as a revert of that later work, and merging such a branch is exactly the incident recorded in the
`reused-branch-stale-base-reverts-dev` memory: a stale base silently deletes newer `dev` work, and the
3-dot diff hides it. A patch cannot be merged by accident.

The patch's base is `1807bc0`. Apply it there, or reconcile hunk by hunk against current `dev` — do not
apply it to `dev` blind.

## What is in it

| File | Owner | What the local version has |
|---|---|---|
| `docs/ADD.md` | Claude | Codex's **complete concise rewrite** — ~50 lines replacing `dev`'s ~295. Visual direction, the six colour anchors, a final-authorities table, shape/material, progression, HUD, production boundary. |
| `docs/ART_SCALE_REFERENCE.md` | Claude | The Fighter's 4.0625% stated as **world-space or equal-depth, not a screenshot-width rule**; Freighter as a 2.4:1 needle (2.5u × 6u) with per-class footprints to preserve; `COLOR_COUNT = 12` marked palette *capacity*, not visual direction. |
| `.claude/art-pass/INDEX.md` | Claude | The `Alpha — core gameplay with art` scope block, and per-task status prose for tasks 2, 3 and 7. |
| `.claude/art-pass/02-track/README.md` | Claude | Flips the stale `Status: not started` header to `DECIDED, NOT YET BUILT`. |

`docs/ADD.md`'s links point at the **pre-restructure** layout (`scene-background/`, `boards/`,
`desctructible-block/`, `PRODUCTION_VALIDATION.md`). The commit before this one moves all of those under
`archive/`, so those links need rewriting before the file lands anywhere.

## What did NOT need preserving

`CLAUDE.md`, `README.md` and `docs/README.md` were also edited locally, but their exact content is already
committed on `origin/docs/codex-reconcile`. `CLAUDE.md`'s art-authority and read-only sections are already
on `dev`.

One of the `README.md` edits is worth a second look on its own merits: `dev`'s root `README.md` still
describes **two modes, "Race and Survival"**, which ADR-004 dropped. The local version says finite Race.
That is a real stale-doc bug on `dev`, independent of everything else here.
