# HANDOVER — supervisor session, 2026-09-23

Written at the watchdog warning (~151k/turn). The next supervisor session resumes from here.

## How supervision works

- Workers are Claude sessions in herdr panes. `herdr pane list` maps `terminal_title` to `pane_id`.
- The context watchdog (`~/.claude-personal/hooks/context-watchdog.sh`, warn 150k, hard stop 250k)
  tells a worker to reach a seam and write a handover. Workers were told to message `slur-supervisor`
  with "AT A SEAM at ~Nk" and never `/clear` themselves.
- On a seam: check that the worker is idle and its tree is committed. Then
  `herdr agent prompt <pane> "/clear"` (it reports "stalled"; that is success, so check that the status
  line shows 0%), then send a resume prompt naming the handover file. Memory:
  `supervisor-clears-workers-via-herdr.md`.
- Config dir is `~/.claude-personal`, not `~/.claude`.

## Workers (panes as of writing)

| Worker | Pane | Lane | State |
|---|---|---|---|
| workerone | w2P:pD | fps regression bisect (owner: <15 fps) | Measuring. Report only; no fix yet. Handover for the parked #213 work: `handover-bounce-leftovers.md` (6efa656). |
| workertwo | w2P:pF | #214 fractured blocks | Steps 1–3 and 6 landed (523d63c, b6f1f45, 8c9afaf, ADR-015 in 215159e). Step 5 is the OWNER's eyes-on gate: play /test-level at race speed and judge whether sealed and fractured blocks can be told apart, then smash one and shoot one in a hosted room. ADR-015 records that gate as open. Also built the DPR slider (248096d). |
| workerthree | w2P:pG | HOMING SEEKER — plan APPROVED, building (ADR-017) | The owner's answers were sent: one seeker in flight at a time (config: per room by default); nearest VISIBLE ship ahead within a tunable range (LOS test in shared); speed 120 and turn 40, configurable; TTL 6s; dodge only by jumping over it or a last-moment strafe (window by time OR distance, tunable mode and threshold); stun longer than the bolt's; sounds yes (pickup, launch, lock warning, in-flight loop, impact, dodge); "harder to shake". All tunables go in the dev panel. Asks before touching hit-spark.tsx. Reports the issue number and an ADR-017 summary after step 1. Earlier:  Sources: cruise-lighting.png and ingredients/ingredients.png; colour is marigold. The plan comes to the supervisor, and the owner and supervisor review it together before any work is handed over. |
| (was) workerthree | — | #218 bolt art | Landed 38b4fb8 and 9017e0f (collect 0.32s → 0.13s). HELD for the fps verdict. Handover `handover-bolt-art.md`. |
| workerfour | w2P:pH | main menu to match `golden-reference/cruise-lighting.png` | Read-only. Blocked on the impeccable plugin (marketplace added, plugin not installed; owner to run `/plugin install impeccable@impeccable` or say "go without it"). Owns ui/button.tsx, ui/panel.tsx, lobby/room-list.tsx, routes/home/*. |

## fps verdict (workerone, after this handover was first written)

No commit regressed the frame (HEAD 20.3 ms against a50049f 20.1 ms at DPR 2, Metal). The cause is GPU contention
from agents' uncapped headless Chrome tabs, plus the DPR 2 fill cost. Rule broadcast to all workers: headless
Chrome runs at `--force-device-scale-factor=1 --mute-audio` and is killed after measuring (memory
`headless-game-tabs-starve-the-gpu.md`, written by workerone). workertwo and workerthree holds are released. workerone holds for
the owner's choice among the code fixes: DPR cap 1.5 or adaptive DPR, a lower-resolution rearview (~4 ms), and
Environment `frames={Infinity}` → 1 (per-frame PMREM).
Still running: two client dev servers in the main checkout (pids 85607 and 87001) and a stale `leva-panel`
worktree stack (pid 34439). Not killed; ask the owner.

## fps investigation — evidence so far

- Machine is not CPU-bound (top process ~11%).
- workerfour, SwiftShader 1600×900: `/test-level` 116 draws/frame, JS 1.1 ms median. Menu 13 draws, 0.30 ms.
- workertwo, software GL: DPR 0.5 → 60 fps, DPR 2 → 24 fps.
- Inference, not proven: GPU fill rate, not per-frame JS.
- Suspects: 38b4fb8 (BoltPickups rewrites every pickup instance every frame; workerthree's lead, which
  would be JS cost, not fill), 8c9afaf (second instanced block mesh, debris pools), 8b4d950 (streak sparks).
- The owner has the DPR slider: press `` ` ``, then Render → dpr.

## Open owner decisions

1. Death explosion `game/scene/explosions.tsx:21-22`, still CYAN `#00e5ff` (local) and MAGENTA
   `#ff2bd6` (others) cubes. Marigold for all, or a per-player hue?
2. Generator retune (#213): workerone proposes no retune (a head-on bounce costs 1.45s against 1.50s for
   an old death). Record it in ADR-014, and file issues for graze glance-vs-stop sub-tick phase and the
   pocket stun-lock.
3. `PICKUP_RESPAWN_S = 3`: the respawn happens ~300u behind the player, so the leader never sees it.
4. Mount `<HitSpark/>` on /test-level (`test-level-canvas.tsx`, one line) — assign?
5. Push `dev`? Nothing is pushed today.
6. Unassigned: #216 (respawn can land inside a block).

## Reservations

- ADR-015 → workertwo (#214). ADR-016 → workerone (if the retune proposal goes ahead).
- `docs/art-direction/` is read-only for everyone.
