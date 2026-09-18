# 2026-09-18 — Supervisor session: cost controls + art consolidation

Handover written at ~181k context/turn. Everything below is done and verified unless marked OPEN.

## Why this session happened

Session limit hit 70%. Cause, measured from local transcripts:

- Four parallel Opus lane agents + supervisor burned **~1.86M output tokens in one 5-hour window**.
  The lanes were **93%** of it; `monoliths` alone was 37% (1,425 calls at ~480 output tokens each).
- **3,022 subagent calls, 716,632 output tokens, 100% Opus** — mostly file-search and summarising.
- Context re-read averaged ~109k/turn across 4,163 calls; this session peaked at **~484k/turn**.

The dominant multiplier is **turn count × context size**, not either alone.

## Done

**Lanes torn down.** The four lane agents were already dead on arrival; one orphaned `sky` dev stack
(ports 2601/5205) was still running and was killed. All four worktrees removed. Branches survive:

    art/asteroids     c508e44 [ahead 4]
    art/backdrop-only 50742f7 [ahead 13]   (WIP committed before removal)
    art/monoliths     f9bf8cd [ahead 10]   (WIP committed before removal)
    art/sky           c1ad214 [ahead 2]

**Art consolidation** — commit `293fdeb` on `art/handoff-v2`, full verify gate green.
`docs/references/art-handoff-v1/` and `art-handoff-v2/` are gone; everything lives unversioned in
`docs/art-direction/{boards,handoff,source}`. Three things this fixed or avoided:
- `.gitattributes` LFS rule had to follow the boards, or 30MB of PNGs enter history as raw blobs.
- `vite.config.ts` had a **live** path into v1's boards (the dev board-server) — deleting v1 blind
  would have broken every `/iso-*` lab.
- Board 12 (the golden reference the lanes adopted) was unreachable from the labs; board 13 was
  never committed. One folder fixes both.

ADR-008/ADR-010 keep the historical `art-handoff-v1` name plus a location pointer — not retconned.

**Idiom audits** (both on Sonnet). Codebase is clean: 0 violations across resource lifetime, useEffect
justification, fragments, one-component-per-file, router imports, subscription boundaries, ECS→R3F
bridging, materials, Bloom. Two findings, both fixed in `293fdeb`:
- `track.tsx` per-frame array literal in `useFrame`.
- `attach-room-to-world.ts:155` — the one timer without a rationale. Kept as a wall clock (sends must
  hold 30Hz when a backgrounded tab throttles rAF); reason now stated in one line.

**Cost controls.** `explorer` (haiku) + `researcher` (sonnet) agent definitions in
`$CLAUDE_CONFIG_DIR/agents/`, mirrored to `~/.claude/agents/` because which path wins under
`CLAUDE_CONFIG_DIR` is undocumented. `settings.json` gains `CLAUDE_CODE_SUBAGENT_MODEL=sonnet`.
`CLAUDE_CODE_SUBAGENT_MODEL_FORCE` deliberately NOT used — a hard task must still be able to opt up.

**Context watchdog.** `~/.claude-personal/hooks/context-watchdog.sh`, UserPromptSubmit. No hook exposes
context usage, so it recomputes from `transcript_path` + the last non-sidechain assistant `usage`.
Absolute threshold (`CLAUDE_CTX_WARN_TOKENS`, default 150k), not a percentage — the session model is
`opus-5[1m]`, where 30% is 300k tokens/turn. Verified firing live.

## OPEN

1. **Nothing is pushed.** `art/asteroids|backdrop-only|monoliths|sky` and `art/handoff-v2` are
   local-only — ~30 commits of art work exist on one disk. Asked twice, never answered.
2. **Agent definitions need a session restart** to load. Until then, pass `model:` explicitly on every
   Agent call. The watchdog hook, by contrast, is already live.
3. **Art-vs-GDD conflicts found, none fixed** (docs untouched):
   - BLOCKING — `handoff/HANDOVER.md:9,121,127` still proposes a 4–5u camera. ADR-006 sets +9u so the
     player sees over 8u pillars; ADR-010 already rejected the lower cam. Art doc never corrected.
   - MATERIAL — package says "no slow blocks"; they are live in the generator until ADR-009 is
     accepted (still PROPOSED).
   - MATERIAL — package says "destructible does not mean safe to ram"; ADR-009 proposes ramming with a
     speed tax. Collision behaviour is the GDD's call.
   - MINOR — `CURRENT_STATUS.md:67` juxtaposes a 7u *camera* trial with the 7u *clearance* invariant.
   - The suspected `MIN_CLEAR=7u` hedge is **not** a real conflict; both docs agree. Do not re-raise.
4. **Turn-count alarm deferred.** `maxTurns` in agent frontmatter needs v2.1.246+; this machine is on
   2.1.212. Turn count is the signal that would have caught `monoliths`, so this gap still matters.
