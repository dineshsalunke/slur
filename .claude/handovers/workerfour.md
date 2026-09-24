Agent: workerfour · Lane: results screen redesign #238 · Updated: 2026-09-24

## Goal

Build the PHASE.finished overlay (`game/overlays/results-overlay.tsx`) to **comp B "Winner card"**, which
the owner picked. Grammar: `apps/client/DESIGN.md` (lower third over the live world).

## Done

- Issue #238 filed. Comps A and B sent; the owner picked **B**. Comp files are in the old session's
  scratchpad: `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/874e8c91-53a8-4052-a9e3-62e8851cef6a/scratchpad/comps/`
  (`comp.html?v=b&host=1|0`, `comp-b-host-desk.png`, `comp-b-guest-mob.png`). Open the PNGs first.
- Owner calls (via the supervisor): keep "<Name> wins" as the title and "Race again ›" as the button.
  YES to Enter = Race again for the host. YES to rows landing in finish order with a short stagger,
  instant under reduced motion. YES to hiding mute on results. workertwo did that in `aee81fb` (#240).
- No build code written yet.

## State (verified this session unless marked)

- Tailwind 4.3.3 has the `starting:` variant, which maps to `@starting-style` (read in `lib.mjs`).
- Data comes from `useRunView(room)` plus `computeStandings(view.players)`. `Standing` has `rank`, `dnf`,
  `finishTime`, `colorId`, `shipId`. Ship names: `isShipId(id) ? SHIPS[id].name : id` (from `roster.tsx`).
- The Enter precedent is `lobby-ship-picker.tsx`: a window keydown listener in a `useEffect`, with
  `isBareEnter` from `ship/ship-keys.ts` and a check on `room.state.phase`.
- `LeaveButton tone="ghost"` is final (`aee81fb`). AudioToggle is hidden in PHASE.finished (`aee81fb`).
- `DESIGN.md` has another worker's uncommitted hunk ("In-race controls", workertwo). Before I commit
  DESIGN.md, check `git diff apps/client/DESIGN.md`. If their hunk is still uncommitted, ask the
  supervisor, because a pathspec commit would sweep it in.
- The old magenta HudButton Leave and the cyan HudPanel go away with this build.

## Build spec (comp B)

Files, all under `apps/client/app/game/overlays/` unless noted:
- `results-overlay.tsx`: the shell. It holds zero subscriptions. `<Fragment><Scrim/>` and a
  `fixed inset-0 z-[2] flex flex-col font-readout text-readout selection:bg-marigold selection:text-deep`
  column. The header is copied from `lobby-overlay.tsx` (SLUR mark + `<LeaveButton tone="ghost"/>`). Then
  `mt-auto grid gap-5 px-5 pb-6 sm:px-10 lg:grid-cols-[minmax(0,1fr)_32rem] lg:items-end lg:gap-10` holding
  `<WinnerCard/>` and `<Standings/>`. Then the strip, a `<section>` with
  `border-t border-readout/15 bg-space px-5 py-4 shadow-strip sm:px-10 sm:py-5`. Its grid is
  `grid-cols-[1fr_auto] items-center gap-4 sm:grid-cols-[auto_auto_1fr] sm:gap-10`, holding
  `<YourFinish/>` and `<RaceAgain/>`.
- `winner-card.tsx`: the first non-DNF standing. A label line holds a 10px square in the winner's colour
  and "Results" (600 12px 0.22em uppercase, `text-shadow-readout`). The h2 reads "<name> wins": 700
  uppercase, `leading-[0.86]`, about `clamp(44px,6.4vw,96px)`, balanced, allowed to wrap to 2 lines. Below
  it: the time (600, 22px, 28px from sm) and the ship in Meta. With no finisher, the h2 reads "No
  finishers".
- `standings.tsx`: an `<ol aria-label="Standings">` grid with 6px gaps and `tabular-nums`, mapping to
  `<StandingRow>`.
- `standing-row.tsx`: takes props only, no subscription. The row is 36px (40px from sm), `bg-deep/85`,
  1px border (Readout/45 on the self row, else Readout/15), `px-3.5`, `gap-x-3`. Columns:
  `22px_10px_minmax(0,1fr)_4.6rem_3.4rem`; from sm, add an `auto` ship column after the name. Cells: rank
  (700, right-aligned), colour square (inline background, as in the roster), name (600 15px, truncate)
  with You/Host tags (700 11px 0.2em; You in Readout, Host in Dim), ship (Meta, `hidden sm:block`), time
  (600 14px, right-aligned, "DNF" when dnf), gap (13px Dim, `+s.ss`, blank for the leader and DNF). A
  DNF row sets rank, name and time in Readout Dim.
  Stagger: `style={{'--order': i}}` plus `transition-[opacity,translate] duration-300 ease-out
  delay-[calc(var(--order)*60ms)] starting:opacity-0 starting:translate-y-2 motion-reduce:transition-none`.
- `your-finish.tsx`: the "Your finish" label (the `LABEL` string from `ui/field-label.tsx`). Below it:
  the ordinal (700, 20px, 22px from sm, or "DNF"), the time (600 16px) and the gap (13px Dim, only when
  rank > 1). A spectator sees "Spectated".
- `race-again.tsx`: the host gets `<Button type="button" className="w-full sm:w-auto">Race again
  <Chevron dir="right"/></Button>`, which sends `RESTART_MESSAGE`. A guest gets a "Waiting for <host>" /
  "The host starts the next run" block, copied from `start-control.tsx`. Add
  `<KeyHint hints={[{keys:['Enter'],does:'Race again'}]} className="hidden justify-end self-center lg:flex"/>`
  for the host. A `useEffect` keydown listener (one-line comment: "Syncs with the browser keyboard: a
  bare Enter restarts the run for the host.") sends RESTART when `phase === PHASE.finished`, the key is
  a bare Enter, and self is the host.
- `results-format.ts` (+ `results-format.test.ts`): `raceTime(s)` gives `m:ss.cc` (round to
  centiseconds first). `gapTo(leader, s)` gives `+s.ss`. `ordinal(n)` gives 1st/2nd/3rd/4th, and
  11th–13th end in "th".
- Tests in `overlays.test.tsx`, results block: host Enter sends RESTART and guest Enter does not; the title
  reads "<name> wins"; a DNF row shows "DNF"; a per-player patch does not re-render the shell.
- NN #13 weighing for the PR/commit body. Row entrance options: (1) the Tailwind `starting:` variant plus
  a CSS transition and a `--order` var (chosen: CSS only, no JS clock, no re-render); (2) a keyframes
  utility in `app.css` (not my file); (3) the Web Animations API in a ref callback (imperative, more
  code); (4) a useState reveal counter plus setTimeout (rejected on sight); (5) R3F `addEffect` opacity
  writes (couples DOM chrome to the render loop). Enter options: a window keydown listener in a leaf
  `useEffect` (chosen: lobby precedent), autofocus on the button (it paints the Core focus fill at rest),
  a module singleton listener, and a form submit (no form).

## Uncommitted

None.

## Held files

Cleared: `game/overlays/results-overlay.tsx`, the new leaves above, the results tests in
`game/overlays/overlays.test.tsx`, and the DESIGN.md "Results" section only.
Do not edit `overlays.tsx`, `leave-button.tsx` or `audio-toggle.tsx` (workertwo, #240).

## Next

1. Write the files above in one batch. Run `pnpm typecheck`, vitest for overlays and results-format, and
   `pnpm lint` (comment ratchet).
2. Headless check (a free CDP port, DPR 1, mute, killed after) on a hosted room reaching PHASE.finished:
   desktop 1440×900 host and 390×844 guest. Use the memory `drive-a-hosted-room-over-cdp.md` to finish a
   race fast.
3. Commit by pathspec with the NN #13 weighing in the body. Then run the finish review
   (`impeccable-finish-reviewer`, comp B PNGs as the approved comp), apply its fixes, and add the
   DESIGN.md "Results" section.

## Open questions

- Hand-off with workerone's hosted finish fade (#241): results mount on PHASE.finished, independent of
  the fade. The supervisor relayed this. Any answer from workerone is unknown to me [unmeasured].
- Delete `game/net-debug-hud.tsx` (owner must run `git rm` or allow it). Carried over.

## Lessons → memory

none
