Agent: workerfour · Lane: song-shaped tracks, steps 1-2 (#253) · Updated: 2026-09-24 19:58

## Goal

A throwaway experiment. Step 1 analyses a song's beats and sections. Step 2 is a dev-only /tapper
route: the owner taps score notes over a chosen, slowed section and exports the takes as JSON.

## Done

- `7f397d0` feat(tapper): beat analysis and a dev-only /tapper recorder (#253). Committed locally
  BEFORE the supervisor's "do not commit until the owner's word" arrived. Not pushed.
- The song moved from `apps/client/public/audio/music/` to the gitignored `apps/client/.songs/`
  (owner-approved). `git status --untracked-files=all` does not list it.
- The earlier #251 lane (phone play) is still built and not pushed. It waits for the owner's device
  check. See `git log -p -- .claude/handovers/workerfour.md` for its state.

## State (verified this session)

- Believer: 125.02 BPM, 426 beats, 106 bars (1.92 s per bar), 204.43 s.
- Sections (energy tiers): 0-4 low · 4-20 mid · 20-28 low · **28-44 high** · 44-52 mid · 52-56 low ·
  56-60 mid · **60-72 high** · 72-76 mid · 76-84 low · 84-88 mid · **88-96 high** · 96-104 mid · 104-106 low.
- Click-track test: BPM within 0.5 at 96/125/140, beats within 30 ms after a measured 36 ms onset-lag
  correction. At 150 BPM the tempo picker halves to 75 (octave error). Not a problem for this song.
- Client tests 311/311 pass. Typecheck passes. biome, ls-lint and the comment ratchet pass on my files.
- A `react-router build` emits no tapper chunk and no song. The React Router CLI sets
  NODE_ENV=production for typegen too, so route.tsx uses `useLoaderData` and not `+types`.
- Headless run (:5193 client, Chrome :9473, both stopped): section 28-44 loads at 0.75×. The clip
  endpoint returns 43.97 s for 33 s of song in 0.1 s, and a traversal name gets a 404. The recording
  gave `l R < J JJ S` (hold 1.5 beats). A punch-in over bar 33 kept bar 32 and replaced the rest.
  Undo works.
- The recorded notes landed ~0.12 beat early. The driver's own timing error is not separated from
  it. [unmeasured on the owner's hardware: whether output-latency compensation is right]
- Export JSON download: [unmeasured].

## Uncommitted

- `.claude/handovers/workerfour.md` (this file). Not committed, because I was told to stay stopped.

## Held files

`apps/client/tapper/`, `apps/client/app/routes/tapper/`, plus the one-line hooks in
`apps/client/app/routes.ts`, `vite.config.ts`, `vitest.config.ts`, `package.json` and `.gitignore`.

## Next

1. Wait for the owner's word on `7f397d0` (keep it, or amend it before a push).
2. Owner check: `pnpm dev` → /tapper → section 28-44 (the first chorus), rate 0.75×, loop 28-32,
   R to record. If taps land early or late, add a per-machine offset (ms) to the recorder.
3. Step 3 (not started): read the exported takes into motifs and intensity bands.

## Open questions

- MEMORY.md line 70 points at `never-pkill-by-pattern.md`, which I deleted as a duplicate of the
  supervisor's `kill-by-pid-never-pkill.md`. The supervisor committed that line in `f16a56c`. It
  needs removing.
- Does the owner want a tap-latency offset control now, or only if the first takes read early?

## Lessons → memory

`.claude/memory/kill-by-pid-never-pkill.md` (the supervisor wrote it about my 19:49 pkill incident).
