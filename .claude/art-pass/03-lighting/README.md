# Task 3 — Scene lighting

**Status:** not started
**Depends on:** tasks 1 and 2 — lighting is balanced against a real sky and a real track, never against
placeholders.
**Blocks:** tasks 4 and 5. The rock materials must be judged under **one agreed lighting rig**, or they will
diverge (this is exactly what went wrong in the earlier attempt: asteroid and monolith studies used different
review lighting and their materials stopped speaking the same language).

---

## 1. What this task delivers

The **one** lighting setup for the game and for every isolation lab, plus the shared control panel that
exposes it, lifted into `<IsoLab>` so every `/iso-*` route inherits it rather than inventing its own.

## 1a. ⚠ This is NOT a three-point rig — read this before anything else

An earlier draft of this brief specified `key / fill / rim / ambient`. That was a reflexive default, the
owner caught it, and reading the boards at native resolution disproves it. **Do not reintroduce it.**

Evidence, from native-res crops of board 12 (`01-background/refs/12_*.L-monoliths.jpg`, `.R-planet-star.jpg`,
`.floor-ship.jpg`):

- A monolith's track-facing side is **brightest at its base and falls off upward**. That is a near-field line
  emitter sitting at floor level. A directional key would light the face evenly top to bottom.
- Everything bright on the floor is the **reflection of an emitter** — the rails, the seam dashes, the ship's
  own engines pooling light beneath it, a pickup casting a vertical reflection column. There is no broad
  diffuse pool anywhere. The graphite base is near-black.
- The star is a real light, but what it lights is the **asteroids' upper-right faces and the planet's
  terminator**. A monolith directly beneath it is still lit by its own seam.
- Shadow sides go essentially black. **There is no fill.** That *is* the "deep shadows" instruction.
- Board 13 prints the thesis on itself: *"COLD SPACE. WARM LIGHT."*

### The actual model

| Layer | Source | Role |
|---|---|---|
| **Warm, dominant, near-field** | the gameplay emissives themselves — track rails, seams, engines, pickups, projectiles, monolith seams, block fractures | lights the track and everything close to it |
| **Cold, distant, single** | one star | rim + specular on rocks, planet terminator; barely touches the track |
| **Cold, very low ambient** | the sky | meaningful on the far rock field, near-black on the track |
| **Fill** | — | **none** |

This inverts the architecture. The warm half of "Cold Space, Warm Energy" is carried entirely by gameplay
emissives acting as light sources — which means the lighting rig is downstream of the **track** (task 2),
not a free-standing thing.

### The load-bearing engineering problem

`MeshStandardMaterial.emissive` **does not illuminate other objects** in three.js *(recalled — task 1's
research was asked to verify this against the installed 0.185 and name the source tier)*. So the single most
important mechanism in the whole art pass is unidentified, and it needs its own research brief — a real
≥5-option enumeration per non-negotiable #14, not a reflex.

Candidate mechanisms to enumerate (task 1's research is scoping the option space, not solving it):
`RectAreaLight` · drei `<Lightformer>` inside `<Environment>` · a camera-following point/spot light rig ·
an analytic line-light term computed in the floor's own shader · light probes / irradiance volumes ·
screen-space approaches.

**The decisive axis** appears to be: which of these give correct **near-field falloff along a moving track**,
versus which are effectively infinitely-distant environment contributions. The base-brightest monolith
falloff is the evidence to test any candidate against.

## 2. Spec

**`CURRENT_STATUS.md`, approved:** *cold rim light, deep shadows, localized bloom, controlled warm reflected
spill; no foreground haze washing out hazards.*

**`HANDOVER.md` §4:** visible optical bloom **is** part of the look — bright warm cores, soft local halos,
warm reflected spill. But: *do not eliminate bloom to fix haze; equally do not lift all black levels or spread
glow into a fog veil.* Silhouette separation and gap rims must stay readable at A, B and C.

**`06_IMPLEMENTATION_NOTES_THREEJS.md`:** keep the environment mostly **below** the bloom threshold. Bloom
prioritises track edges, engines, pickups, projectiles and functional energy. *Do not turn every marigold seam
into a large halo.* Evaluate shape readability with bloom **disabled** as well.

**Hierarchy the lighting must serve** (`01_ART_DIRECTION.md`): ship / immediate threats / pickups first →
track boundaries, gaps, obstacles, finish → near environmental framing → far environmental scale. Background
detail may be rich; background *contrast and saturation* must stay controlled.

## 3. The control surface

Shaped around the model in §1a, not around a three-point rig. Angles in **degrees**, not xyz vectors — a
position vector is a physics constant, a compass bearing and elevation are things a human can reason about
(project rule: tuning surfaces are intuitive and derived).

| Knob | Controls |
|---|---|
| `emissiveGain` | how hard gameplay emissives drive the warm near-field light |
| `emissiveReach` | how far that warm light falls off from the emitter |
| `starIntensity` · `starAzimuth` · `starElevation` · `starColor` | the single cold distant source |
| `envIntensity` | cold sky ambient reaching the far field |
| `bgIntensity` | how bright the sky *reads*, independent of what it lights |
| `exposure` | tone-mapping exposure |
| `bloomThreshold` · `bloomIntensity` | the bloom budget |

Plus named A / B / C presets. **No `fillIntensity`** — the absence of fill is the direction, not an oversight.

## 4. Open questions

1. **Where does the star's direction come from?** It is not free: the sky (task 1) puts a visible flare at a
   specific place, and a star light pointing elsewhere desynchronises the render from its own background.
   Open whether the star should be a real directional light *separate from* the sky's IBL, rather than a
   bright spot baked into a cubemap whose convolution then averages it away. Task 1's research is answering this.
2. **Which emissive-as-light mechanism** (§1a). This gets its own research brief before anything is built.
3. **Does the ship's engine glow light the floor beneath it?** Board 12 says yes, clearly. That is a
   *moving* near-field emitter, which constrains the mechanism harder than the static rails do.

## 5. Definition of done

- One rig, defined in one place, consumed by the game **and** every `/iso-*` lab. No route-local light hacks.
- **A monolith beside the rail is brightest at its base and falls off upward** — the falsifiable test that
  the warm light is genuinely near-field rather than an environment contribution wearing a costume.
- The ship's engines visibly light the floor under the ship, and the pool moves with the ship.
- Deep shadows survive: shadow sides go near-black, black levels are not lifted, haze does not wash out hazards.
- Bloom is localized — a seam is a seam, not a halo. Verified by toggling bloom off and confirming every
  shape still reads.
- A/B/C presets change density/pressure, **not** saturation, and no preset makes a hazard unfairly hard to read.
- `roughness 0.2` and `roughness 0.9` probes look clearly different under the rig.

## 6. Out of scope

Per-asset materials (tasks 4/5) · camera · HUD.

## 7. Decision / As-built

*(filled in at review and after implementation)*
