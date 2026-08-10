# SLUR — Audio Credits

All sound effects are **CC0** (public domain, zero attribution required). The SFX layer is 100% Kenney.
Music: one **CC-BY** in-run track (the single attribution below) + one CC0 lobby track.

## Music

| File | Track | Author | License | Source |
|------|-------|--------|---------|--------|
| `music/neon_laser_horizon.mp3` | *Neon Laser Horizon* | **Kevin MacLeod** (incompetech.com) | **CC-BY 4.0** | https://incompetech.com/music/royalty-free/ |
| `music/lobby_calm_ambient.mp3` | *Calm Ambient 1 (Synthwave 4k)* | The Cynic Project (cynicmusic.com) | CC0 | https://opengameart.org/content/calm-ambient-1-synthwave-4k |

### Required attribution (CC-BY)

> "Neon Laser Horizon" by Kevin MacLeod (incompetech.com)
> Licensed under Creative Commons: By Attribution 4.0 License
> http://creativecommons.org/licenses/by/4.0/

## Sound effects (all CC0 — Kenney.nl)

Packs: **Sci-Fi Sounds**, **Interface Sounds**, **Digital Audio**, **Impact Sounds** — all CC0
(https://kenney.nl/assets, "Creative Commons Zero, CC0"). Specific files used, renamed to their SLUR event:

| SLUR file (`sfx/`) | Cue | Kenney pack — original |
|--------------------|-----|------------------------|
| `laser_fire.ogg` | bolt fire | Digital Audio — `laser5.ogg` |
| `hit_impact.ogg` | ship impact | Sci-Fi Sounds — `impactMetal_001.ogg` |
| `stun.ogg` | you get disrupted (descending whine) | Digital Audio — `phaserDown1.ogg` |
| `pickup.ogg` | power-up collected | Digital Audio — `powerUp1.ogg` |
| `threat.ogg` | incoming-bolt telegraph | Digital Audio — `highUp.ogg` |
| `death_derezz.ogg` | derezz / elimination | Digital Audio — `zapThreeToneDown.ogg` |
| `respawn.ogg` | materialize back in | Digital Audio — `phaseJump1.ogg` |
| `boost.ogg` | boost whoosh (wired when the boost pickup lands) | Sci-Fi Sounds — `thrusterFire_000.ogg` |
| `countdown_blip.ogg` | 3-2-1 blip (pitch rises via playbackRate) | Digital Audio — `pepSound1.ogg` |
| `go.ogg` | GO downbeat | Sci-Fi Sounds — `lowFrequency_explosion_000.ogg` |
| `ui_nav.ogg` | menu nav | Interface Sounds — `select_001.ogg` |
| `ui_select.ogg` | menu click | Interface Sounds — `click_001.ogg` |
| `ui_confirm.ogg` | commit (lock ship / host start) | Interface Sounds — `confirmation_001.ogg` |
| `ui_error.ogg` | rejected action | Interface Sounds — `error_002.ogg` |
| `engine_loop.ogg` | positional remote-ship engine | Sci-Fi Sounds — `spaceEngineLow_000.ogg` |

The local ship's engine hum is **synthesized** (Web Audio oscillators, no sample) — see `app/audio/engine-hum.ts`.

## Notes

- **Substitutions vs. the sourcing plan:** the plan named a few Freesound CC0 hero one-shots (Kinoton laser,
  PeteBarry stun, JustInvoke pickup, clif_creates warp, gis_sweden alarm). Freesound downloads require a
  logged-in account/API, so we used the **Kenney CC0 equivalents** listed above instead (zero attribution,
  one author = a cohesive UI family). No aiff transcode was needed — every file shipped is already OGG/MP3.
- **UI cues** (`ui_*`, `countdown`, `go`, `pickup`) are loaded and mapped, ready for the lobby/results
  overlays to call `playSfx('uiSelect' | 'uiConfirm' | …)`. Wiring those DOM buttons lives with the S6
  lobby-pick-UI work (another track), not this audio subsystem.
