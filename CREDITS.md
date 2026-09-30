# SLUR — Asset Acknowledgments

SLUR is built on freely-licensed third-party assets. This file consolidates every
external asset used and its license. Most are **CC0** (public domain, no attribution
required) — we credit them anyway, out of respect for the authors. One music track is
**CC-BY-SA 4.0** and three sound effects are **CC-BY**; their attribution is legally
**required** (see below).

Full per-file audio breakdown lives in
[`apps/client/public/audio/CREDITS.md`](apps/client/public/audio/CREDITS.md).

---

## Required attribution (CC-BY / CC-BY-SA)

> "Vector Racing [Looping]" by Technodono — https://opengameart.org/content/vector-racing-looping
> Licensed under CC BY-SA 4.0 — https://creativecommons.org/licenses/by-sa/4.0/ (re-encoded to Ogg Opus)

> "SPACE ENGINE THRUST" by vedas — https://freesound.org/s/124099/ — CC BY 3.0 (cut and re-encoded)

> "missile_launch_2.wav" by smcameron — https://freesound.org/s/51468/ — CC BY 4.0 (cut and re-encoded)

> "Sci-Fi Whoosh.wav" by sonicboom_sfx — https://freesound.org/s/223783/ — CC BY 3.0 (cut and re-encoded)

---

## 3D models

| Asset | Author | License | Source |
|-------|--------|---------|--------|
| Ship placeholders — `bob`, `challenger`, `dispatcher`, `executioner` (4× glTF) | **Quaternius** | **CC0** | *Ultimate Spaceships Pack* — https://quaternius.com/ |

Four of the five ship classes still fly a placeholder from Quaternius' **Ultimate Spaceships Pack**
(CC0, public domain). No attribution is required; we acknowledge it gladly. The Freighter's
`split-crown` is a bespoke project asset, not a Quaternius model.

## Music

| Track | Author | License | Source |
|-------|--------|---------|--------|
| *Vector Racing [Looping]* (in-run) | **Technodono** | **CC-BY-SA 4.0** | https://opengameart.org/content/vector-racing-looping |
| *Calm Ambient 1 (Synthwave 4k)* (lobby) | The Cynic Project (cynicmusic.com) | CC0 | https://opengameart.org/content/calm-ambient-1-synthwave-4k |

## Sound effects

The flight and combat cues are from **Freesound**: ten CC0 authors (peridactyloptrix, Jofae,
qubodup, JapanYoshiTheGamer, BlenderDiplom, Sheyvan, AudioPapkin, Alxy, magnuswaker, BMacZero) and
the three CC-BY sounds above. The UI, countdown, pickup, stun, threat, death and respawn cues are
**CC0** from **[Kenney.nl](https://kenney.nl/assets)**. Per-file mapping:
[`apps/client/public/audio/CREDITS.md`](apps/client/public/audio/CREDITS.md).

## Code

The black hole effect (`apps/client/app/game/scene/black-hole/`) ports the shaders of the
**[vgpu](https://github.com/vercel-labs/vgpu)** example *Optimized Black Hole*
(https://vgpu.sh/examples/optimized-black-hole) from WGSL to GLSL. The source is **MIT**:

```
MIT License

Copyright (c) 2025 Vercel, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Fonts

No bundled font files — the UI uses native system font stacks
(`ui-sans-serif` / `ui-monospace` and platform fallbacks). Nothing to attribute.
