# SLUR — Audio / Sound Design Document

> Status: **IMPLEMENTED (S6, 2026-08-10)**, re-sourced as grounded sci-fi (**#267, ADR-021, 2026-09-26**).
> Subsystem: `apps/client/app/audio/**`. Singleton engine (context/buses/limiter/voice-pool OUTSIDE React).
> A sampled engine loop (`hover_engine.ogg`) with per-class pitch/brightness (`engine-voice.ts`), local and
> positional-remote. Freesound cues for bolt, hit, seeker, mine, jump, land, brake and pass-by. Kenney CC0
> for the UI and the still-unchosen events. Music: Technodono *Vector Racing* (CC-BY-SA) in-run, Cynic CC0
> lobby. `M` = mute. Credits: `CREDITS.md` and `apps/client/public/audio/CREDITS.md`.

## 1. Audio pillar

**Driving synthwave over a sci-fi cockpit.** Music is a pulsing, propulsive electronic score (the
TRON: Legacy / Daft Punk lineage); the UI and cockpit speak in clean TRON synth-UI blips (see §2).
Together: *fast and neon* (music) + *slick spaceship* (SFX/UI). Sound must sell **speed** and give
**instant combat feedback** — you should *hear* a bolt coming before you see it.

**Pillars:**
1. **Feedback first** — every mechanic (pickup, fire, hit, boost, death) has an unmistakable sound. Gameplay clarity > ambience.
2. **Speed you can hear** — engine/wind pitch tracks velocity; boost is a physical *whoosh*.
3. **Neon mood** — synthwave keeps energy high without demanding attention.

## 2. References
- **Music:** TRON: Legacy (Daft Punk), Carpenter Brut / Mitch Murder / Kavinsky (synthwave), Blur (2010) OST energy.
- **UI/cockpit:** clean electronic chirps/confirms — cold, sparse, functional, matching the "Cold Space. Warm Energy." visual direction; non-annoying. *(Was "Star Trek LCARS chirps", then "full-TRON synth-UI". **ADR-008** settles the aesthetic as TRON-*influenced* rather than an era pastiche and closes issue #117 as moot, so the concrete SFX set is now an ordinary open design task — not blocked on an era decision.)*
- **Combat/impact:** arcade racer punchiness (Blur, Wipeout) — short, bright, satisfying.
- **Wipeout series** overall — the gold standard for "electronic music + antigrav racing."

## 3. Music
- **In-run:** looping synthwave bed, ~120–140 BPM feel. *OPEN:* single loop vs intensity layers (add layers as speed/threat ramps — stems that fade in). Layered is nicer but more work; start single-loop.
- **Lobby/host/join:** calmer synth idle — same palette, lower energy.
- **Stingers:** run-start countdown, round-win, elimination, "you died" — short musical hits.
- *OPEN:* licensing — royalty-free/CC synthwave packs, or commission/generate? It's an office toy, so **royalty-free/CC first**; keep a credits list.

## 4. SFX vocabulary (the essentials)

| Event | Sound | Notes |
|-------|-------|-------|
| Engine | Sampled hover loop; **rate, lowpass and level ∝ speed**; pitch/brightness per class | The core "speed you can hear" cue (ADR-021 §3) |
| Boost | Rising whoosh + bass drop | Physical, brief, punchy |
| Pickup collect | Bright confirm chime, category-tinted | Ties to the pickup color-code |
| Fire (bolt) | Zappy laser transient | Directional |
| Incoming threat | **Warning blip** (TRON synth-UI) | Hear the bolt/mine before impact — telegraph! |
| Hit / disrupted | Impact + descending "spin" whine | Sells the stun without frustration |
| Shield | Shimmer on-up, crack on-absorb | |
| Mine drop / trigger | Soft *clunk* → pulse → detonation | |
| Death (derezz) | TRON-style dissolve/glitch | Matches the visual derezz |
| Respawn | Materialize / power-up sweep | |
| UI (nav/select/confirm/error) | TRON synth chirps | Consistent set, not per-screen randoms |
| Countdown / go | Rising blips → downbeat | Syncs to run-start |

*As-built hooks (S5): the combat **events** to bind SFX to now exist — `USE_POWERUP` fire, the `'hit'` broadcast, `stunTimer` (disrupt), pickup grab, and a directional threat-warning HUD (pairs with the "incoming" blip + OQ5 lead-time). No audio is implemented yet — S6 binds these.*

## 5. Spatial / mix
- **3D positional audio** for other ships and threats (Web Audio `PannerNode` via three.js `PositionalAudio`) —
  hearing *where* a rival/bolt is = a real gameplay signal. Engine of nearby ships pans/attenuates by position.
- **Mix priority (duck order):** threat warnings > your own combat/impact > pickups/UI > engine > music.
  Music ducks under important gameplay SFX so feedback never gets buried.
- Master limiter; sane defaults; a **mute/volume** control (office = someone always needs to mute fast).

## 6. Tech approach
- **three.js `Audio` / `PositionalAudio`** (Web Audio under the hood) — integrates natively with the R3F scene graph & camera as the listener. Avoids pulling a second audio lib unless we need advanced mixing.
- Preload/decode a small SFX set; **object-pool** audio nodes for rapid-fire sounds (bolts) to avoid GC/stutter.
- All audio is **client-local**, driven by ECS/game events (a "sound" reaction to networked events) — never networked. See TDD §5.
- Respect browser autoplay policy: audio context **resumes on first user gesture** (the host's Start / player's Join click).
- *OPEN:* is three's audio enough, or do we want Howler.js / a small Web Audio wrapper for buses & ducking? Decide after first pass — likely three.js is enough for v1.

## 7. Non-goals (v1)
Dynamic adaptive music engine, voice-over/announcer (maybe later — a cool TRON-style "system" announcer would be *chef's kiss*), per-surface footstep-style detail.

## 8. OPEN QUESTIONS → RESOLVED (2026-08-10)
1. **Music sourcing** — **CC-BY and CC-BY-SA accepted** (#267). In-run = Technodono *"Vector Racing"* hard
   loop (CC-BY-SA 4.0). Lobby idle = The Cynic Project *"Calm Ambient 1"* (CC0). Flight and combat SFX =
   Freesound picks (CC0 + three CC-BY); UI = Kenney CC0. See ADR-021, which supersedes the 2026-08-10
   choice (Kevin MacLeod *"Neon Laser Horizon"*, a zero-attribution SFX layer, a synthesized engine hum).
2. **Layered stems vs single loop** — **single loop first** (add intensity layers later only if it feels flat).
3. **Audio tech** — **three.js `PositionalAudio` only for v1** (no Howler); revisit only if bus/ducking needs it.
4. **Announcer** — **SFX-only for v1** (a TRON-style "system" voice is a maybe-later, per §7 non-goals).
5. **Threat telegraph timing** — still a **feel-gate** tune (start ~0.6–0.8 s lead; adjust in playtest).

*Asset shortlist + exact licenses live in `.claude/phases/2026-08-10-s6-identity.md` (audio sourcing block) →
folded into a `CREDITS.md` at Implement. New cues ship as **Ogg Opus** (ADR-021 §2).*
