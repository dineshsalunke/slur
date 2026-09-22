# Research: what makes procedurally generated obstacle courses feel authored

Read-only research task. No source files touched. Grounded against `docs/GDD.md` §0/§5, `docs/DECISIONS.md`
ADR-006/ADR-007, `packages/shared/src/sim/track.ts`, and `packages/shared/src/constants.ts` as read in this
session.

## SLUR's numbers, for reference throughout

- Track: `SEG_LEN = 20u` per segment, `TRACK_SEGMENTS = 400`, `HALF_WIDTH = 32u` (16 lanes at `CELL = 4u`,
  authoring-grid only — GDD §0).
- Ship: `maxCruise` 48–70u/s across the 5-class roster (Fighter baseline 55, Comet fastest 70) —
  `packages/shared/src/constants.ts:71`, GDD §5.5 table.
- Jump: `height 3.2u`, `apexTime 0.3s`, `descentTime 0.24s`, `doubleHeight 3.8u`, `minHeight 0.8u`
  (`constants.ts:57-63`) — full airtime ≈ 0.3 + (impulse/√(riseGravity·fallGravity)); `jumpReach()` multiplies
  airtime by `maxCruise` and a `JUMP_SAFETY = 0.8` margin (`constants.ts:89-94`).
- Clearance: `MIN_CLEAR = 7u` (`MAX_SHIP_WIDTH 4u + CLEARANCE_MARGIN 3u`), GDD §0.
- Blocks: `BLOCK_HEIGHT = 8u` fixed (above double-jump, deliberately un-jumpable, ADR-007), `BLOCK_DEPTH = 8u`
  and width are generation artifacts, not rules.
- Corridor: `CORRIDOR_W_START = 5` lanes narrowing to `CORRIDOR_W_MIN = 4` lanes as intensity rises
  (`constants.ts:137-138`).
- Density ramps: `WALL_DENSITY 0.14 → 0.4`, `GAP_P 0.06 → 0.16`, `FLICK_RATE 0.15 → 0.55`
  (`constants.ts:140-148,174-175`), `FULL_GAP_FRAC = 0.4`, `CRACK_FRAC = 0.45` with `CRACK_W_LANES 1–5` over
  `CRACK_SEGS 2–4` (`constants.ts:176-183`).
- Macro pacing: an arrangement envelope modeled on Imagine Dragons' "Believer" song structure (ADR-006) —
  verse breathers → building pre-choruses → chorus slams → a bridge valley ~75% → biggest final chorus →
  quick outro.

## What each question means for SLUR, up front

1. **Concrete parameters** — SLUR already computes `jumpReach()` from speed × airtime × a safety margin
   (`constants.ts:89-94`) and a fixed `MIN_CLEAR`. The open question is whether the *density* ramps
   (`WALL_DENSITY`, `GAP_P`, `FLICK_RATE`) are tuned against player reaction time the way sourced games tune
   sight lines — right now they're just linear intensity interpolations with no explicit "how many seconds of
   warning" term.
2. **Rhythm** — ADR-006 already commits to a macro envelope ("Believer"). The open question is whether the
   *micro* level (individual segments) reads as phrases the way Bit.Trip Runner or Left 4 Dead's Director do,
   or as a flat noise stream at a given intensity, which was exactly ADR-006's original complaint about the
   generator it replaced ("no arc, independent noise streams").
3. **Vocabulary** — SLUR has three primitives (gaps, deadly blocks, slow blocks/pending breakable-block
   ADR-009) plus two block "moves" (regular pillar, flick pillar) and three gap families (full, partial-strip,
   crack). The question is whether adding 4u jumpable blocks is a new *type* (earns new silhouette/behavior)
   or a new *size* of the existing 8u block (which would be actively dangerous — see §6).
4. **Readability** — at 55–70u/s a block or gap must be legible well before the ship reaches it. SLUR doesn't
   yet have a documented "seconds of sight before arrival" budget; this is the number worth deriving.
5. **Authored-feeling generation** — SLUR's generator is closer to Dead Cells' hybrid (fixed macro frame +
   constrained micro placement) than to Spelunky's template grid, but the ADR-006 "uncorrelated noise, sparse,
   never clumped" placement rule for pillars is the load-bearing anti-noise mechanism today.
6. **Jumpable vs non-jumpable in one vocabulary** — this is SLUR's live risk (ADR-007's 8u is explicitly
   *un-jumpable by design*; a new 4u jumpable block sits close in dimension to a scaled instance of the same
   family). See §6 for the recommendation.

---

## 1. Concrete parameters

**Jump-arc-to-obstacle-height:** No source gave a general ratio (e.g. "obstacle height ≤ 0.4× jump apex
height"). The one primary technical source on jump construction, Kyle Pittman's 2016 GDC talk "Math for Game
Programmers: Building a Better Jump" (the same talk `docs/GDD.md` §5.6 already cites as SLUR's jump-feel
source — `gdcvault.com/play/1023559/Math-for-Game-Programmers-Building`), gives the *method* SLUR already
uses — derive gravity/impulse from designer-chosen **Jump Height** and **Time to Apex**
(`constants.ts:47-54` is exactly this derivation) — not a fixed obstacle-height ratio. **Inference, not a
sourced number:** ADR-007's choice to put `BLOCK_HEIGHT` "above double-jump reach on purpose" is the same
design move Pittman's method enables (choose height/apex-time first, then obstacles reference the resulting
reach) — but no source states a specific multiplier for "how far above" makes an obstacle read as clearly
un-jumpable.

**Gap-width-to-speed:** No source gave a formula. SLUR's own `jumpReach()` (`constants.ts:89-94`) —
`maxCruise × jumpAirtime(tuning) × JUMP_SAFETY(0.8)` — is itself the closest thing to a sourced formula found
anywhere in this research; it matches the shape of the one general claim found in the academic literature:
*"The success probability of a jump depends on player parameters including the average reaction time of the
player... the player skill value, and the absolute value of... the horizontal or vertical speed at which the
character approaches the jump."* — Compton & Mateas, "Procedural Level Design for Platform Games"
(https://cdn.aaai.org/ojs/18755/18755-52-22428-1-10-20210929.pdf). This confirms speed-scaled gap sizing is
the right *shape* of solution; it does not supply a ratio to check SLUR's `JUMP_SAFETY = 0.8` against.

**Reaction-time-to-spacing:** Not found as a stated design formula in any of the sourced games. The nearest
real material: a road-safety formula, `Reaction Distance = Reaction Time × Speed`
(https://www.offroad-ed.com/oregon/studyGuide/Sight-Distance-and-Reaction-Time/40203801_172885/) — real-world
traffic engineering, not games, cited here only because no game-design source supplied an equivalent and this
is at least the correct *shape* (spacing scales linearly with speed) to sanity-check against. **This is a gap
in publicly available primary sources**, not a claim I'm willing to assert as game-design consensus.

**Racing-specific parameters that did surface:**
- "A Rational Approach to Racing Game Track Design" (Chris Pruett? — byline not confirmed; article at
  https://www.gamedeveloper.com/design/a-rational-approach-to-racing-game-track-design) gives one directly
  transferable number: *"The standard deviation in vehicle speed should be quite narrow, ideally within a
  plus or minus 30 percent region."* — a track should keep the player's actual speed close to a target band,
  not swing wildly. For SLUR (player-controlled throttle, 48–70u/s across the roster) this reads as: **the
  generator's difficulty ramp should assume the player is riding near cruise speed, not braking
  constantly** — a generator that forces heavy braking throughout breaks the assumption `jumpReach()` bakes
  in (it uses `maxCruise`, not an average braked speed).
- Same article, on corner/obstacle difficulty: *"Difficulty of a corner increases if the angle between these
  three points is more acute and/or if the distance between these points is reduced."* — i.e. difficulty is a
  function of *rate of change* demanded of the player, not absolute geometry. This maps directly onto SLUR's
  own `SLOPE_CAP`/`CURV_CAP` derivation (`deriveWeaveSlopeCap`/`deriveWeaveCurvatureCap`,
  `constants.ts:113-121`) — SLUR already encodes "rate of lateral change" as the fairness ceiling, which is
  the same idea this source states in prose.

**Verdict on this question:** SLUR's own derived-fairness approach (`jumpReach`, `SLOPE_CAP`, `CURV_CAP`) is
already more rigorous than what any single source states as a public formula. No source contradicts it; none
supplies a number to tune `JUMP_SAFETY` or the density ramps against. Treat this as validated architecture,
not a place needing new numbers from outside — the open work is tuning the *density* curves
(`WALL_DENSITY`/`GAP_P`/`FLICK_RATE`), for which no source gives an authoritative number either.

---

## 2. The rhythm question

**Left 4 Dead's AI Director** is the primary, well-documented source for peak/relax pacing, from Michael
Booth's 2009 GDC talk "The AI Systems of Left 4 Dead" (https://gdcvault.com, cited via secondary summaries —
the original slides were not independently re-fetched in this pass, so treat the phase names below as
**recalled from secondary sources, not a direct quote**): the Director cycles **Build Up → Peak → Relax**,
where Relax "normally lasts about 30-45 seconds," and Booth frames the whole system as **"Structured
Unpredictability"** — population functions "not purely random, nor deterministically uniform." Dead Cells'
lead, Sébastien "Deepnight" Bénard, names this L4D system directly as Dead Cells' own model: *"building the
level's generation system around dramatic peaks and relaxing 'breaks' to ensure an interesting game
pacing"* (https://deepnight.net/tutorial/the-level-design-of-dead-cells-a-hybrid-approach/). This is the
closest primary-adjacent confirmation that "breather → build → spike → release" is a real, reused pattern
across two well-regarded, structurally different games (a corridor-shooter and a 2D roguelite) — which
supports ADR-006's own choice of the same shape at the macro level.

**Phrase length, quoted from a fast-corridor racer specifically:** 34BigThings (Redout) state the same idea
in racer terms, without L4D's numbers: *"Track design must account for that, giving space and time to
recover between difficult or particularly acrobatic sections."*
(https://34bigthings.com/a-word-on-racetrack-design/). Same article frames the two poles as **Ilinx**
(vertigo/thrill, per Roger Caillois) and **Agon** (skill/control) sections, and states both must be present:
*"There must be space for both: Ilinx sections... and Agon sections, where space is given to racers to let
their skills show through control."* This maps onto ADR-006's own "verse breathers" (Agon — control) vs
"chorus slams" (closer to Ilinx — intensity) framing, though 34BigThings never states a phrase length in
seconds or segments.

**Micro-level rhythm (within one wave, not the whole run):** the strongest primary-adjacent source is the
academic "rhythm group" concept from Smith, Treanor, Whitehead & Mateas' "Rhythm-Based Level Generation for
2D Platformers" (FDG 2009, https://eis.ucsc.edu/papers/smith-fdg-09.pdf — PDF is binary/could not be
text-extracted in this pass; the definition below is from a citing paper that quotes it directly, not the
original PDF, so it is a secondhand quote): *"Launchpad and Tanagra applied the idea of rhythm group: a small
level segment consisting of a rhythm of player actions (also referred as beats) and a level geometry that
corresponds to that rhythm."* (quoted in "An Integrated Framework for AI Assisted Level Design in 2D
Platformers," https://arxiv.org/html/1804.09153v1). The idea: a level is composed from small
action-sequence chunks (a jump, a jump, a run — "beats"), and each chunk gets its own matching geometry,
rather than geometry being generated independently of what the player is being asked to *do*. This is
directly analogous to SLUR's micro layer (ADR-006's "discrete slalom + flick") but ADR-006's own placement
rule is explicitly **uncorrelated noise** for pillars ("sparse, never clumped") — i.e. SLUR's micro layer is
closer to Dead Cells' *macro* peaks-and-breaks shape than to a beat-composed micro rhythm. **This is a real
gap worth naming plainly:** nothing in ADR-006 composes a slalom+flick+gap combination as a deliberate
"phrase" the way a rhythm group does; density and flick-rate are independent scalar curves
(`WALL_DENSITY_START/MAX`, `FLICK_RATE_START/MAX`) sampled per-segment, not phrase templates.

**Ludus Novus' close reading of Bit.Trip Runner** is the sharpest primary-adjacent source on phrase length
and repetition found in this pass (https://ludusnovus.net/2010/05/27/one-measure-of-bit-trip-runner/):
*"the 'doot dee-doot,' the 'one, and-three' rhythm that plays four times in a row"* — one identified rhythm
"appears a total of eight times in this level, and must be performed perfectly each time." The analysis also
states the visual-variety principle: *"the player's actions are the same, as indicated by the buttons in the
images: jump, pause, slide, and quickly jump... despite their visual dissimilarity"* — i.e. the *underlying
input rhythm* repeats far more than the *dressing* does, which is how a small vocabulary reads as varied
rather than repetitive. And on pacing new content: *"only rarely is a new rhythm or game element introduced,"*
giving *"the player time to learn and digest each addition."* **Direct implication for SLUR:** if a 4u
jumpable block is added, it should not appear densely at introduction — it should get its own short,
repeated, low-density "phrase" early (the equivalent of Bit.Trip's "try this, okay, now the same thing but
harder") before being combined with the existing 8u block, flick pillar, and gap families.

**Verdict:** ADR-006's macro envelope is validated by the closest real precedent (L4D Director / Dead Cells).
The micro layer is not currently phrase-composed in the rhythm-group sense; it is density-sampled. Whether
that gap matters is a judgment call — Left 4 Dead's own "population functions" are also not literally
composed micro-phrases, so density-sampling-within-a-macro-envelope is itself a defensible, precedented
design, just a different one than Tanagra's literal rhythm-group composition.

---

## 3. Vocabulary design — type vs. size

**Dead Cells' answer, stated directly:** a new *room* (SLUR's rough equivalent: a new primitive) exists
because it serves a distinct **purpose**, not because it's a size variant: *"A room designed to host a hidden
treasure won't be the same as another hosting a merchant, and both will be very different from the rooms
designed around combat."* (https://deepnight.net/tutorial/the-level-design-of-dead-cells-a-hybrid-approach/).
Applied to SLUR: a primitive earns "new type" status when it demands a **different player verb** — gaps
demand *jump*, deadly blocks demand *strafe-around-or-destroy* (GDD §5.2: *"Jump is gaps-only; blocks are
strafe-or-destroy — the two never overlap"*). A new *size* of an existing primitive is legitimate only when
it does not change which verb is correct.

**Bit.Trip Runner's vocabulary-from-few-primitives, quoted above** (§2): *"Sometimes, it's made up of only
fireballs, of UFOs..., or of rocks and crystals (which call for jump-jump-kick instead of jump-slide-jump)"*
— different obstacle *dressings* map to the same small set of *inputs*; the input vocabulary stays small
while the dressing varies. This is the inverse framing from Dead Cells' but the same conclusion: **the
vocabulary axis that matters is the verb it demands, not its visual size or skin.**

**Dead Cells' generation-density rule as a vocabulary-discipline mechanism:** monster/hazard placement is
gated by an explicit **cost budget**, not free density: *"The number of monsters in one level is defined by
the total length of the combat based tiles in the level... 1 monster for every 5 tiles,"* with *"some
monsters being more dangerous than the others [counting] for 10 tiles."* Applied to SLUR: if a 4u jumpable
block is added, the generator should charge it against the *same* intensity/density budget the 8u block
already draws from (`WALL_DENSITY`), not add a second independent density knob — two independent knobs is
exactly the "independent noise streams" failure ADR-006 already diagnosed and fixed once (context section:
*"places the primitives as independent noise streams so meaningful combinations happen only by luck"*).

**Verdict, direct answer to the question "what earns a new TYPE vs a new SIZE":** a primitive earns a new
**type** when it changes the required verb (jump vs strafe vs destroy) or the *consequence* of failing
(instant death vs a speed tax, per the pending ADR-009 breakable-block merge). It earns only a new **size**
when the verb and failure consequence are unchanged and only the *margin* (how much clearance, how much
runway) changes. A 4u-tall block that is jumpable is — by this test — **not a size variant of the 8u block**.
It demands a different verb (jump, not strafe) from something that looks like the same family (a cube
pillar). That is precisely the ambiguity Dead Cells' own quoted design principle (distinct purpose → distinct
room) and the readability sources in §4/§6 warn against.

---

## 4. The readability constraint

**Celeste's stated telegraphing window**, from a synthesis citing designer Maddy Thorson's public statements
on player-assist timing (not a single primary URL — this claim triangulates a widely repeated number rather
than one directly quoted source, flagged as such): *"Visual and audio communication should predict player
needs 4-6 frames ahead of actual events"* and that Celeste's own internal assist systems act *"6 frames
ahead"* of the player's actual input. **Label this inference-adjacent**: it describes *input-buffering*
generosity (the game forgiving a late or early press), not *obstacle telegraphing distance* (how far ahead
the player must visually spot a hazard) — the two are related but not the same claim, and no source in this
pass gave a frame-count specifically for "how long before an obstacle must be legible." Treat SLUR's own
"how many seconds ahead is a block visible" as an open, untested number — the honest answer is **no source
supplied it**.

**On visual differentiation over numeric ambiguity:** "Defining Boundaries: Creating Credible Obstacles In
Games" (https://www.gamedeveloper.com/design/defining-boundaries-creating-credible-obstacles-in-games)
states the core failure mode directly: *"If we are to create a plausible game world, then we need to ensure
players are instantly able to differentiate between what they can and cannot do."* Its worked example is
almost exactly SLUR's risk: *"Half-Life 2's breakable versus unbreakable wooden barriers"* look alike but
behave differently. The fix it states is not a numeric threshold but **visual distinction**: *"when barriers
look different, the player now has a good frame of reference and is able to quickly tell the difference the
next time it is encountered"* — and, framed as a hard rule: *"Stop players right at the start before they
spend frustrating moments thinking they can achieve what is impossible."*

**Affordance "dead zones," from the same research thread (Uncharted, cited via secondary analysis, not a
primary Naughty Dog source — flagged accordingly):** *"a 'dead zone' between 3.25m and 4m [is defined] to
ensure no climbable edge falls into the unreadable middle area"* — i.e. Uncharted's designers deliberately
avoid generating a ledge height that sits ambiguously between "obviously climbable" and "obviously not," so
every ledge the player sees is unambiguous by construction. This is the single most directly transferable
finding for SLUR's §6 risk: **the fix is not "make the 4u block readable," it's "never generate a block
height that sits in an ambiguous zone between the two known-good heights."**

**On silhouette/color at speed:** no primary developer source on F-Zero GX's or Redout's specific
silhouette/telegraphing technique was found in this pass — attempts to fetch a period developer interview
(shmuplations.com) failed (HTTP 418), and no alternative primary source surfaced. **This is a stated gap, not
filled with inference.** What SLUR already has that substitutes for it: GDD §5.2/ADR-008 commit to a single
"marigold-primary" energy colour with cold/desaturated everything else, and ADR-008 explicitly notes the
resulting cost — *"under one energy colour, colour cannot discriminate object classes. Discrimination moves
to silhouette and material state"* (`docs/DECISIONS.md` ADR-008). No external source in this pass validated
or challenged that specific choice; it's SLUR's own open problem (ADD §10 OQ7), not something this research
resolved.

**Verdict:** the strongest, best-evidenced readability principle across every source in this pass is not a
number — it's **"never let two different behaviors look alike, and never generate a size that sits between
two already-legible sizes."** That is a direct, actionable constraint for §6.

---

## 5. What makes generated content feel authored

Three real, well-documented approaches surfaced, each with the tradeoff the source itself states:

**A. Fixed macro frame + constrained micro solve (Dead Cells).** *"First, we place the fixed elements, acting
a bit like a frame in which the procedural generation can express itself... the overall world layout is fixed
and designed by hand."* Within that frame, room selection is **constraint satisfaction, with retry**: *"For
each node, the algorithm tries a random room, among the ones dedicated for this particular biome, and tests
to see if it complies with the instructions given by the graph (location and number of entrances, type,
etc). If it doesn't match, the algorithm tries another room until it finds one."*
(https://deepnight.net/tutorial/the-level-design-of-dead-cells-a-hybrid-approach/). **Tradeoff, stated by the
source itself:** requires a large enough room library per biome to avoid visible repetition, and requires the
graph itself (the macro shape) to be hand-authored — procgen does not replace level design, it replaces
*room selection within* a designed shape. **This is the closest match to SLUR's own architecture** — ADR-006
is exactly "fixed macro envelope (arrangement/Believer) + constrained micro placement (uncorrelated noise
with a sparsity/buffer rule)."

**B. Template grid + guaranteed-solvable path (Spelunky).** Darius Kazemi's widely-cited technical breakdown
(http://tinysubversions.com/spelunkyGen/index.html) describes the mechanism precisely: *"The level is made of
16 rooms in a 4x4 grid,"* with four room templates keyed to which exits they guarantee (left/right only;
left/right/bottom; left/right/top; a non-solution-path filler room). The solution path is walked
probabilistically — *"It picks a... random number from 1 to 5. On a 1 or 2, the solution path moves left. On
a 3 or 4, the solution path moves right. On a 5, the path goes down"* — and **every room the path touches is
forced to the template that guarantees the exits the path needs**, which is what guarantees solvability by
construction rather than by testing after the fact. **Tradeoff:** this technique is naturally suited to a
branching 2D grid of discrete rooms; SLUR's track is a single continuous corridor along one axis (z), so the
room-grid mechanism doesn't map directly — but the underlying principle (constrain placement so failure is
structurally impossible, rather than generating freely and rejecting bad results) is exactly what SLUR's own
`MIN_LANE`/`SLOPE_CAP`/`CURV_CAP`/`jumpReach` derivation already does at the corridor level, and what the
validator (z-monotonic flood-fill + per-gap reach, GDD §5.2) does as the after-the-fact backstop.

**C. Generate-and-test with a validator.** SLUR already has this as its explicit fairness gate: *"A validator
(z-monotonic flood-fill + per-gap reach) enforces the two floors on any track, authored or generated"* (GDD
§5.2). Compton & Mateas' paper frames the general version of this same idea academically: jump success is
modeled as a **probability**, not a boolean, by *"applying a noise function to generate random takeoff
positions around the optimal takeoff position"* — i.e. treat the player's approach as having natural
variance, and require the obstacle to be clearable across that variance, not just at one idealized input.
**Tradeoff, general to this family of technique:** generate-and-test is only as good as the validator's model
of the player; SLUR's two hard floors (FIT, GAP-REACH — GDD §5.2) are binary go/no-go checks, closer to
Spelunky's "guarantee by construction" than to Compton & Mateas' probabilistic model. **No source in this
pass gives a reason to prefer one over the other** — this is a genuine design choice, not something the
research resolved for SLUR.

**Grammar-based generation:** the academic "rhythm group" work (Tanagra/Launchpad, §2) is the clearest
example in this research of a *grammar* — level chunks matched to input sequences, composed like a sentence.
**No source gave a production-scale postmortem of grammar-based generation shipping in a well-regarded
finished game** (Tanagra/Launchpad are research tools, not shipped titles) — flagged as a real evidence gap,
not filled in.

**Verdict, direct:** SLUR's current architecture (fixed macro envelope + noise-constrained micro placement +
binary validator) is the same *shape* as Dead Cells' shipped, well-regarded hybrid approach — the strongest
precedent found. The identified gap (§2) is that the *micro* layer is closer to constrained-noise than to a
composed rhythm-group grammar; closing that gap, if wanted, would mean moving toward Tanagra's beat-then-
geometry composition, which has academic grounding but no shipped precedent found in this research.

---

## 6. The jumpable-4u vs. non-jumpable-8u risk — direct recommendation

**The risk, restated precisely.** Today's single deadly-block family reads unambiguously because it has one
rule: `BLOCK_HEIGHT = 8u`, always non-jumpable, and GDD §5.2 states the mechanic boundary as an invariant:
*"Jump is gaps-only; blocks are strafe-or-destroy — the two never overlap."* Adding a 4u-tall block that
**is** jumpable breaks that invariant's simplicity: the player will now see two members of the same visual
family (a cube pillar) that demand opposite verbs, distinguished only by height, at 48–70u/s, with a jump
apex height of only 3.2u (single) / effectively higher with double jump via `doubleJumpImpulse`
(`constants.ts:57-63`) — meaning the two heights (4u vs 8u) are numerically close relative to the player's own
jump arc.

**What the sourced evidence says to do about it, converging from three independent angles:**

1. **Never let the two look like the same object at a different scale (Dead Cells' §3 principle + the
   Half-Life-2-barrel failure case, §4).** *"A room designed to host a hidden treasure won't be the same as
   another hosting a merchant"* — apply the same discipline here: a jumpable block should not read as "the
   8u block, but shorter." It needs its own silhouette/material distinction sufficient to be identified before
   the player is close enough for height-judgment to matter, because — per the Half-Life-2 barrel case —
   *"when barriers look different, the player now has a good frame of reference."* Under ADR-008's
   single-energy-colour constraint, this distinction has to come from **silhouette or material state**, which
   ADR-008 itself already names as the harder, unresolved readability problem (OQ7) — this new block makes
   that open problem load-bearing rather than cosmetic.

2. **Avoid an ambiguous middle height (Uncharted's "dead zone" principle, §4).** The Uncharted source's
   *"dead zone between 3.25m and 4m [ensures] no climbable edge falls into the unreadable middle area"* is
   the single most directly transferable rule found. Applied literally: whatever height the new jumpable
   block ends up, it must sit clearly separated from `BLOCK_HEIGHT = 8u` on the scale the player actually
   judges by — which, given the player's own `deriveJump` numbers, is the ship's jump arc, not an absolute
   ruler. **Inference, not sourced:** a defensible operationalization is to key the jumpable block's height to
   a fraction of single-jump apex height (3.2u) so it reads as "clearable at a glance" (e.g. noticeably below
   3.2u), while the 8u non-jumpable block already sits, by ADR-007's own stated design, above double-jump
   reach — leaving a wide, unambiguous gap between the two rather than a near neighbor. No source supplies
   the exact fraction; this is a recommendation to derive one and test it, not a validated number.

3. **Introduce it as its own low-density phrase before combining it with existing primitives (Bit.Trip
   Runner's pacing principle, §2).** *"Only rarely is a new rhythm or game element introduced,"* giving *"the
   player time to learn and digest each addition."* Concretely for SLUR: the new block should get its own
   short run early in the arrangement envelope (a "verse," in ADR-006's own vocabulary) where it appears
   **alone**, not interleaved with the 8u block or the flick pillar, before intensity ramps combine all three
   families. This also satisfies Dead Cells' density-budget principle (§3): give the jumpable block its own
   line in the density budget initially, and only fold it into the shared `WALL_DENSITY` pool once the
   player has been taught to read it.

4. **Charge it against the same fairness floors SLUR already enforces, not a new one.** GDD §5.2's two hard
   floors — FIT (a connected corridor links entry→exit) and GAP-REACH (every gap ≤ worst jumper's reach) —
   were designed around "jump is gaps-only." A jumpable block introduces a third floor implicitly: **every
   jumpable block's height must be ≤ the worst jumper's *vertical* reach**, the same way gaps are already
   bounded by *horizontal* reach. The existing validator (z-monotonic flood-fill + per-gap reach) has no
   equivalent height check today, because it has never needed one — this is a concrete, testable addition
   the validator needs before this block ships, not an optional nice-to-have.

**What no source resolved:** an exact height, an exact silhouette treatment compatible with ADR-008's
single-colour rule, and an exact minimum "own phrase" length in segments or seconds. Those remain SLUR design
decisions to make and playtest, not facts this research could supply.

---

## Sources consulted (primary where available; secondary flagged inline above where the primary could not be
fetched)

- Kyle Pittman, "Math for Game Programmers: Building a Better Jump," GDC 2016 — https://gdcvault.com/play/1023559/Math-for-Game-Programmers-Building (already cited by SLUR's own GDD §5.6)
- Sébastien Bénard (Deepnight), "The Level Design of Dead Cells: A Hybrid Approach" — https://deepnight.net/tutorial/the-level-design-of-dead-cells-a-hybrid-approach/
- Darius Kazemi, "Spelunky's Level Generation" (interactive breakdown) — http://tinysubversions.com/spelunkyGen/index.html
- Ludus Novus, "One Measure of Bit.Trip Runner" — https://ludusnovus.net/2010/05/27/one-measure-of-bit-trip-runner/
- 34BigThings (Redout), "A Word on Racetrack Design" — https://34bigthings.com/a-word-on-racetrack-design/
- Game Developer / Gamasutra, "A Rational Approach to Racing Game Track Design" — https://www.gamedeveloper.com/design/a-rational-approach-to-racing-game-track-design
- Game Developer / Gamasutra, "Defining Boundaries: Creating Credible Obstacles in Games" — https://www.gamedeveloper.com/design/defining-boundaries-creating-credible-obstacles-in-games
- Kate Compton & Michael Mateas, "Procedural Level Design for Platform Games" — https://cdn.aaai.org/ojs/18755/18755-52-22428-1-10-20210929.pdf
- Smith, Treanor, Whitehead & Mateas, "Rhythm-Based Level Generation for 2D Platformers," FDG 2009 — https://eis.ucsc.edu/papers/smith-fdg-09.pdf (PDF unreadable by tooling; quoted only via a citing secondary source, flagged inline)
- "An Integrated Framework for AI Assisted Level Design in 2D Platformers" (cites the above) — https://arxiv.org/html/1804.09153v1
- Michael Booth, "The AI Systems of Left 4 Dead," GDC 2009 — cited via secondary summaries; direct slides/video not re-fetched in this pass, flagged inline
- RedLynx / Trials Evolution coverage — https://www.gamedeveloper.com/business/-i-trials-evolution-i-success-down-to-pleasure-over-pain-says-redlynx-s-virtala (secondary, no primary design-numbers talk located)
- Attempted and unavailable: shmuplations.com F-Zero GX developer interviews (HTTP 418, could not fetch); no primary source located for Wipeout, Race the Sun's obstacle-generation specifics, Descenders' generation algorithm, or Thumper's specific corridor/turn-frequency numbers beyond general design-philosophy quotes.

## Explicitly unresolved (do not treat as answered)

- No sourced numeric ratio for obstacle-height-to-jump-arc or gap-width-to-speed beyond SLUR's own
  `jumpReach()` derivation, which nothing here contradicts but nothing here validates either.
- No sourced "seconds of sight before arrival" number for readability at speed in any game in this pass.
- No primary developer source on F-Zero GX, Wipeout, or Redout's specific telegraphing/silhouette technique.
- No shipped, well-regarded game found using literal rhythm-group grammar composition (Tanagra/Launchpad are
  research prototypes, not shipped titles).
