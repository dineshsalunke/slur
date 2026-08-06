# SLUR — Audio / Sound Design Document

> Status: **v0 draft**. Sets the sonic target and the tech approach. Concrete asset lists follow once the look/feel is locked.

## 1. Audio pillar

**Driving synthwave over a sci-fi cockpit.** Music is a pulsing, propulsive electronic score (the
TRON: Legacy / Daft Punk lineage); the UI and cockpit speak in clean Star-Trek-style computer blips.
Together: *fast and neon* (music) + *slick spaceship* (SFX/UI). Sound must sell **speed** and give
**instant combat feedback** — you should *hear* a bolt coming before you see it.

**Pillars:**
1. **Feedback first** — every mechanic (pickup, fire, hit, boost, death) has an unmistakable sound. Gameplay clarity > ambience.
2. **Speed you can hear** — engine/wind pitch tracks velocity; boost is a physical *whoosh*.
3. **Neon mood** — synthwave keeps energy high without demanding attention.

## 2. References
- **Music:** TRON: Legacy (Daft Punk), Carpenter Brut / Mitch Murder / Kavinsky (synthwave), Blur (2010) OST energy.
- **UI/cockpit:** Star Trek LCARS computer chirps/confirms; clean, warm, non-annoying.
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
| Engine | Continuous synth hum, **pitch ∝ speed** | The core "speed you can hear" cue |
| Boost | Rising whoosh + bass drop | Physical, brief, punchy |
| Pickup collect | Bright confirm chime, category-tinted | Ties to the pickup color-code |
| Fire (bolt) | Zappy laser transient | Directional |
| Incoming threat | **Warning blip** (LCARS-style) | Hear the bolt/mine before impact — telegraph! |
| Hit / disrupted | Impact + descending "spin" whine | Sells the stun without frustration |
| Shield | Shimmer on-up, crack on-absorb | |
| Mine drop / trigger | Soft *clunk* → pulse → detonation | |
| Death (derezz) | TRON-style dissolve/glitch | Matches the visual derezz |
| Respawn | Materialize / power-up sweep | |
| UI (nav/select/confirm/error) | LCARS chirps | Consistent set, not per-screen randoms |
| Countdown / go | Rising blips → downbeat | Syncs to run-start |

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
Dynamic adaptive music engine, voice-over/announcer (maybe later — an LCARS "computer" announcer would be *chef's kiss*), per-surface footstep-style detail.

## 8. OPEN QUESTIONS
1. **Music sourcing** — royalty-free/CC packs vs commissioned/generated? (Lean CC.)
2. **Layered stems vs single loop** for intensity?
3. **Audio tech** — three.js `PositionalAudio` only, or add Howler for buses/ducking?
4. **Announcer** — add an LCARS "computer" voice for events, or stay SFX-only for v1?
5. **Threat telegraph timing** — how much lead time on incoming-bolt warning to be fair but tense?
