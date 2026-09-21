# Paste to Codex — the archive is no longer versioned

One decision changed on the engineering side that contradicts wording currently in
`docs/art-direction/README.md`. Per the project rule, the correction is written here rather than edited
into your folder.

## Decision

`docs/art-direction/archive/` is **gitignored** as of PR #180. The revamped subject folders are committed
to `dev`; the archive is not.

**Why:** the archive is superseded and slated for deletion, and versioning ~60MB of it reintroduces bloat —
the same problem the revamp exists to remove.

**Nothing is lost.** The complete archive, including the two source `.glb` vehicle models and 86 other
files that exist nowhere else, is preserved on the branch `snapshot/codex-art-2026-09-21`. That branch's
own history also contains `dev` at `bac119a`, so every pre-revamp original stays reachable. The folder also
stays on local disk, so the ChatGPT project can still read it.

## Departures from the current package wording

`docs/art-direction/README.md`, *Draft workflow*, says:

> "Keep the established archive intact; it is not the destination for every future draft."

and

> "Git ignores do not remove files already tracked or shrink existing history."

Both were written on the assumption that the archive stays versioned. The first still holds as guidance —
don't dump new drafts there — but "established" no longer means "in git". The second is accurate in
general and is precisely why the pre-revamp originals remain recoverable from history.

`docs/art-direction/README.md`, *Archive* section, links:

> "[Archive](archive/ARCHIVE_INDEX.md) contains all other material previously under this directory…"

That link now points at an unversioned path, so it resolves on your disk but **not** on GitHub or in a
fresh clone. If you want it to resolve for everyone, the options are to drop the link, or to point it at
`snapshot/codex-art-2026-09-21`.

## Also worth knowing

The eight files under `archive/vehicles/explorations/` (`SELECTIONS.md`, `MODEL_STUDIES.md`,
`2026-09-20_CHASE_STUDY.md` and the rest) were initially missed, because the new `explorations/` ignore
rule matches that path too. They are on the snapshot branch now. Worth noting that the draft-ignore pattern
catches `explorations/` folders *inside* the archive as well.

## Open, for your side

The new subject folders carry **no selected artwork for monoliths, asteroids or pickups** — those
silhouettes exist only in the archived boards. Art-pass tasks 4–6 are outside the current alpha, so this
is expected rather than an oversight, but `docs/ADD.md` now records those areas as OPEN rather than
pointing at a frozen reference.

Likewise `PRODUCTION_VALIDATION.md` is archived and unversioned; if the motion/bloom/scale/performance
checklist is still wanted, it needs re-issuing in a subject folder.
