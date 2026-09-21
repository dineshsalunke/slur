# 2026-09-21 — the comment rule goes mechanical, and the art/iso routes go

Two changes, both merged to `dev`. Written to be read cold.

## 1. Non-negotiable #15 rewritten — PR #183 (`fe00b5b`)

**The rule is now:** no comments at all, except **one line each** on `setTimeout`, `setInterval` and
`useEffect` (for an Effect, the line names the outside-React system it synchronizes with). Functional
directives are not prose and are exempt: `biome-ignore`, `@ts-expect-error`, `@vitest-environment`,
`/// <reference`, shebangs. Everything else — rejected alternatives, external constraints, units — goes
in the **PR body**.

**Why mechanical:** two previous judgement-based bars ("only what the code cannot say", "1–2 plain
lines") both drifted back into 10–20 line `JUSTIFIED EFFECT / 1) render-derivation? …` blocks. There is
nothing left to judge now.

**Stated in four places, all updated together:** `CLAUDE.md` #15 (replaced) · `CLAUDE.md` #14 (its
"one-line rationale **in the code**" clause now points at the PR body — #15 would otherwise contradict
it) · `CONTRIBUTING.md` §3 (two bullets) · `conventions/react-router.md` (the `useEffect`
justification rule's citation of #15).

**The sweep: 3,040 comment spans removed across 193 of 195 source files, 33 kept.** Kept = the 31
timer/effect sites (trimmed to the *first* line of each run) + 2 `@vitest-environment jsdom`.

### If you ever redo this — the tooling facts, paid for already

- **TypeScript cannot do it.** TS **7.0.2 is the native port**: `typescript` exports only
  `lib/version.cjs`, there is no `ts.createSourceFile`, and `typescript/unstable/ast` ships 409 helpers
  but **no parser** — only `typescript/unstable/ast/scanner`. A bare scanner mis-lexes JSX text and
  regex-vs-divide in `.tsx`, so it is unsafe here.
- **What worked: `oxc-parser` 0.150.0**, installed throwaway in the scratchpad (the repo gained no
  dependency). `parseSync(filename, src, {lang})` → `ParseResult.comments: [{type,value,start,end}]`.
- **Verified before trusting it:** those spans are **JS string indices, not UTF-8 byte offsets**. This
  codebase is full of em-dashes; byte offsets would have corrupted every file silently.
- Removing a `{/* … */}` JSX container leaves `{}` unless you delete the whole
  `JSXExpressionContainer` whose expression is `JSXEmptyExpression`. The stripper does.
- Stripping a comment that a file *started* with leaves a blank first line, which biome rejects. Strip
  leading blank lines, then run `pnpm format` — it fixed 7 files whose code had been wrapped around a
  now-deleted comment.
- The stripper is at
  `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/<session>/scratchpad/strip-comments.mjs`
  — **session-scoped, so assume it is gone.** Everything needed to rewrite it is above.

### Open, deliberately not decided

- **`apps/client/app/app.css`** still carries its design-token comments (`/* brand primary */` …).
  oxc parses JS/TS only. lightningcss arrives via `@tailwindcss/vite` and could do it.
- **`.claude/comment-sweep/`** — an earlier, unexecuted plan for this same sweep. Now stale.
- **`constants.ts` tuning fields lost their unit notes.** CONTRIBUTING used to exempt them ("one line
  so the value can be tuned without reading the sim"); the new rule admits three constructs and nothing
  else. `strafeClamp: number;` no longer states its unit. A fourth exception is a small edit to
  `CLAUDE.md` #15 + `CONTRIBUTING.md` §3; the deleted comments are at `676eb9d^`.

## 2. art-* and iso-* routes deleted — PR #184 (`d35d146`)

Gone: `art-lab`, `art-gallery`, `iso-monolith`, `iso-sky`, `iso-block`, `iso-block-wear`, plus
`app/iso-lab/` (6 files) and `art-refs-plugin.ts` with both vite registrations. **43 files.**
`env-lab` stays — neither `art-*` nor `iso-*`.

**Kept because the game imports them:** `dev/debug-panel` + `dev/tuned-bloom` (`net-canvas`),
`dev/frame-tap` + `frame-tap-plugin.ts` (`env-lab`), all `game/scene/*`.

**Couplings that were not in `routes.ts`** (check these first if something looks off): `vite.config.ts`
(plugin import + 2 calls) · `apps/client/tsconfig.json` (its `allowImportingTsExtensions` note cited
`art-refs-plugin.ts`, now cites `frame-tap-plugin.ts`) · `frame-tap-plugin.test.ts` (responder-URL
fixtures, now `/env-lab` + `/game/demo`) · `CLAUDE.md`'s art block.

Client tests 96 → 93: `routes/art-lab/lab-defaults.test.ts` had exactly 3 cases and died with its
route. Nothing broke.

### The live concern, unresolved

`.claude/art-pass/` still presents the six-task art arc as **live work** and is written around
`/art-lab` and `/art-gallery` as the way to review art without a server. Those handovers now describe
routes that do not exist. Either mark that directory as history, or accept that `/env-lab` + a hosted
room is a thinner instrument than what was there. Restore any piece with
`git show fe00b5b -- apps/client/app/routes/art-lab`.

## State

`dev` = `d35d146`, clean, no worktrees outstanding. Gates green on both merges: typecheck · lint
(3 warnings, **pre-existing on dev**, verified) · 78 shared + 4 server + 93 client tests · build.
