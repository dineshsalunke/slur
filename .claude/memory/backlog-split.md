---
name: backlog-split
description: Parking-lot scraps go to the global backlog; the project backlog is the SLUR roadmap only
metadata:
  type: feedback
---

The `backlog` skill writes to two files, and they have different jobs here. `~/.claude/backlog.md` is the
**parking lot** — loose scraps, including project-tied ones (tag them with the project). The project's
`.claude/backlog.md` is the **SLUR roadmap** — slices, arcs, and decisions the pipeline needs visible; it is
git-tracked on purpose.

**Why:** the skill's own framing ("the parking lot, not the roadmap") is the opposite of how this repo uses
its project file, so writing a scrap there interleaves it with the S1–S7 slice roadmap and makes
`/backlog list` noisy. Most existing project entries also predate the skill's scope vocabulary
(`[feature] [slice]`, `[research] [assets]`), so scope filtering over that file is unreliable anyway.

**How to apply:** a parked TODO → global, tagged. A slice, arc, or roadmap decision → project file. Use the
skill's item shape in both: `- [ ] DATE [scope] [tag] title` + a two-space-indented terse `why:` line, with
`scope` drawn only from idea · feature · enhancement · bug · research · decision · chore · brain-dump.

Related: [[project-memory-in-repo]]
