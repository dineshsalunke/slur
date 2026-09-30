# ADD deviations — doc against code and against the art package

Audit of `docs/ADD.md` (388 lines) against shipped client code and `docs/art-direction/`, 2026-09-30.
Every finding quotes the ADD wording (with §), gives the contradicting file:line, and states severity:
**(a)** doc describes a contract that does not exist, **(b)** doc describes a look/behaviour the code
no longer has (or vice versa), **(c)** stale pointer or number.

This report re-checks every finding in the 2026-09-23 version (`git show 4607b2b3~1:.claude/reports/ADD-DEVIATIONS.md`)
and marks each RESOLVED or STILL OPEN, then adds new findings from the look work that landed since
(#352/#356/#362/#364 sky+HDRI+tone-mapping, #354 fake deck reflections, #369 nozzle glow, #371 mirror
removal, #344/RFC-349 S19 quality tiers). `docs/art-direction/` was read-only (`README.md`, `AUDIT.md`);
nothing in it was touched. Tug is mid-move (uncommitted) — not audited here since ADD never mentions tug.

## Summary

| Severity | Count |
|---|---|
| (a) doc describes a contract that doesn't exist | 2 |
| (b) doc/code look-and-feel mismatch | 3 |
| (c) stale pointer or number | 4 |

**Old-report disposition:** §1 (dead `handoff/`/`boards/` paths) RESOLVED. §2.1 (monolith 200–400u vs 50u)
STILL OPEN but was mis-targeted — see new Finding 1 below, which replaces it with the real shape of the
problem. §2.2 (monolith metalness) RESOLVED. §2.3 (camera knobs not commented/tunable) PARTIALLY
RESOLVED — tunable is now true, "named…in chase.ts (CHASE)" is now newly false, folded into Finding 6.
§3.1 (cyan bolts) RESOLVED. §3.2 ("one bitmap") RESOLVED. §3.3 (budget OPEN) STILL OPEN, restated as
Finding 7.

---

## 1. (a) "Environment monolith" (Obelisk · Gate · Arch, 200–400u, never track-adjacent) does not exist as shipped

ADD §4:

> *"**Environment monolith** | huge (200–400u), background-scale, framing — never track-adjacent mass |
> mistakable for a hazard"*
>
> *"monoliths (Obelisk · Gate · Arch) and asteroids... Monoliths and obstacle blocks use the deck
> material"*

ADD §9 itself hedges this row differently from the built ones — *"Monoliths (Obelisk · Gate · Arch) |
procedural — three box arrangements + scale/rotate variation | **~100%**"* (confidence, not "**BUILT**"/
"**done**" like the pillar row above it).

What shipped, read from source:

- `apps/client/app/game/scene/monolith-config.ts:41-49` — `PILLAR`: `width: 12, depth: 12, height: 50,
  below: 60`. This is the **track pillar**, ADR-018's own object, and it is correct against ADD's separate
  "Track pillar" row. It is not the 200–400u row.
- `apps/client/app/game/scene/monolith-frame.ts:26-43` — `GATE_FRAME` (`height: 240`) and `ARCH_FRAME`
  (`height: 150`). `GATE_FRAME` is wired only into `apps/client/app/game/scene/finish-gate/finish-gate.tsx:18`
  — it is the **finish gate**, not scenery. `ARCH_FRAME` is wired only into
  `apps/client/app/game/scene/monoliths.tsx:17` as `<MonolithFrames frame={ARCH_FRAME} .../>`, and ADD's own
  pillar bullet (§4) says what it is: *"An arch (#220) takes the place of a whole pillar pair at that pair's
  z. It never shifts or drops the pairs around it"* — i.e. it is track-adjacent and load-bearing-row by
  design, the opposite of "never track-adjacent."
- No "Obelisk" object exists outside a test helper: `monolith-transforms.test.ts:10` —
  `const obelisk: MonolithShapeConfig = { ...PILLAR, taper: 0.62 };` — a tapered pillar variant used only
  to exercise geometry math, never placed in a scene.

**There is no background-scale (200–400u), non-track-adjacent monolith category in the shipped scene.**
The names "Obelisk/Gate/Arch" now belong to three different, all track-adjacent, structures: the pillar,
the finish gate, and a pillar-pair replacement. §4's "never mistakable for a hazard because it's huge and
set back from the track" contract has no object to apply to.

**Suggested resolution:** rewrite ADD §4's "Environment monolith" row and §9's monolith row to describe
what shipped (pillar / arch-in-row / finish-gate, all track-adjacent, sized by ADR-018), or file the
200–400u background framing as a still-open backlog item if the owner still wants it. This is a doc
correction, not an art-package edit — `docs/art-direction/` never specified these exact numbers; hand any
correction to the *scale reference* only through `ART_SCALE_REFERENCE.md`, never edit the package.

---

## 2. (a) Ship light-trails are documented as shipped; no such feature exists in code

ADD §5: *"**Trails:** each ship leaves a fading light-trail in its hue (identity + speed read)."*
ADD §6: *"First-person is rejected: it hides your ship's hue/trail (your **identity** signal)..."*

Grepped the whole client and shared packages for any ship exhaust/identity trail:

    apps/client/app/game/scene/seeker-trail.ts       — homing-pickup trail, not a ship trail
    packages/shared/src/combat/seeker-trail.ts        — same: `recordTrail`/`trailX` are seeker-only

There is no `ship-trail`, `hull-trail`, or equivalent file, ECS trait, or shader anywhere. The only
"trail" in the codebase belongs to the homing seeker pickup (`packages/shared/src/combat/seeker.ts:304`).

This also compounds a live internal contradiction: §3 says *"The world is uniformly marigold for every
player... Hue-shifting is reserved for [opponents]... deferred"* — so "in its hue" in §5 describes a
per-player colour system that §3 explicitly defers. Even if a trail existed, "in its hue" would be wrong
under the current palette contract.

**Suggested resolution:** ADD §5's Trails line and the trail clause in §6 are aspirational, not built.
Move them under §10/§11 as an open item ("Planned: ship light-trails" — §5 already says this for
"shield shimmer, hit-spin, ship light-trails" two lines up, so §5 is self-contradictory: it lists ship
light-trails as **Planned** in one sentence and as a standing fact ("each ship leaves...") one bullet
later). Pure doc fix.

---

## 3. (b) Quality tiers turn off the bloom signature and the rock field on low — undocumented

ADD §5: *"**Bloom** (postprocessing EffectComposer) — the signature."*
ADD §8 rule 4: *"One bloom pass, tuned — not per-object glow hacks."*
ADD §1: *"the environment is vast, silent, severe... A cold, desaturated universe containing warm,
saturated gameplay energy... everything else follows from protecting it."*

`apps/client/app/quality/quality.constants.ts:21-29` — the `low` `QualityProfile`:

    low: {
        landing3d: false,
        surfaceRes: 512,
        hdriRes: '1k',
        dprCap: 1,
        msaa: false,
        post: false,
        rocks: false,
    },

`post: false` means the entire postprocessing composer — bloom included — is off on low tier. `rocks:
false` means the asteroid field (§4/§9 "Environment... asteroids") is absent. `landing3d: false` drops the
3D landing scene entirely. None of this is mentioned anywhere in ADD. On low tier, the doc's stated
"signature" look (bloom) and one of its two named environment object classes (asteroids) do not render.

**Suggested resolution:** ADD needs a short quality-tier subsection (§5 or §8) stating which visual
pillars are tier-gated and which are load-bearing at every tier — e.g. "bloom is the signature at
medium/high; low tier trades it for frame budget, see `quality.constants.ts`." Pure doc addition, no code
change implied.

---

## 4. (b) Fake deck reflections (ADR-031) and nozzle glow (ADR-033) are unmentioned in the VFX/material sections

ADD §5 (VFX list) and §9 (asset pipeline) do not mention deck reflection streaks or nozzle glow anywhere.
Both are real, owner-approved, shipped look features:

- **ADR-031** (`docs/DECISIONS.md:1592`), built in `3c576aa`/`668df76`/`f0562e7`: additive streak quads
  under every glowing element (rail sheen, block seams, pickups, exhausts) simulating a glossy-deck
  reflection the material itself cannot produce. Code: `apps/client/app/game/scene/deck-reflection/`
  (per ADR text; not separately re-verified path-by-path in this pass).
- **ADR-033** (`docs/DECISIONS.md:1672`): *"The nozzles glow in the accent; the engine light is removed."*
  `EngineLight` point light removed; nozzle emissive now driven off the accent colour instead of an
  authored peach.

ADD §4's material row for the track ("restrained gloss") and §5's VFX list predate both changes and give
no reader a way to know the deck now fakes reflections or that engine lighting comes from material
emissive rather than a light. This is a real look feature the doc simply has no section for — not a
contradiction of an existing line, but a documented, owner-approved mechanism missing from the one file
whose job is to record VFX.

**Suggested resolution:** add one bullet each to ADD §5 (VFX) summarizing the ADR-031 streaks and the
ADR-033 nozzle-glow change, pointing at the ADRs for detail. Doc addition, no art-package involvement —
neither ADR references `docs/art-direction/` numbers.

---

## 5. (c) The rear-view mirror is documented as an open UI item; it was removed 2026-09-29

ADD §7: *"Explicitly NOT frozen by the handoff (per its own `00_STATUS_AND_SCOPE.md`): final HUD/UI
treatment, **including the rear-view mirror**."*

**ADR-034** (`docs/DECISIONS.md:1693`), accepted 2026-09-29, issue #371: *"The owner said: 'lets remove
the rearview mirror please, its not adding any value.'"* Code search for `mirror`/`Mirror` under
`apps/client/app/game` and `apps/client/app/dev` returns **no matches** — the feature is gone, not
merely deprioritized.

ADD §9's DPR2 budget paragraph (added 2026-09-23, before the removal) also still lists *"rear view"* as
a line item in the mesh-hidden breakdown (`docs/ADD.md:276`) — that number is now for a feature that no
longer exists in the build.

**Suggested resolution:** delete "including the rear-view mirror" from §7 (or reframe as "was considered,
removed 2026-09-29, ADR-034") and drop "rear view" from the §9 budget sentence, or footnote it as
pre-removal. Pure doc fix; §7's own `00_STATUS_AND_SCOPE.md` pointer is otherwise fine (package file,
not verified path-by-path here — flag as unresolved from the old report's §1 category if it also turns
out stale, not independently re-checked this pass).

---

## 6. (c) Camera knob pointer: "named ... in chase.ts (CHASE)" no longer matches — knobs moved to the tuning schema

ADD §6: *"Knobs are named + commented in `apps/client/app/game/camera/chase.ts` (`CHASE`), live-tunable."*

`apps/client/app/game/camera/chase.ts` today (read in full) has **no `CHASE` object and no named
constants at all** — every knob is a bare string key read live via `num('Chase.back')`,
`num('Chase.height')`, etc. (lines 10, 28-40). The actual named, documented table lives in
`apps/client/app/dev/tuning-schema.ts:139-148`:

    'Chase.back': { value: 14, ... },
    'Chase.height': { value: 4, ... },
    'Chase.lookAhead': { value: 17, ... },
    ...

**"live-tunable" is now TRUE** (RESOLVED from the old report — `4607b2b3 feat(dev): put the chase camera
on the tuning panel`). But **"named...(CHASE)" is a new stale claim**: there is no `CHASE` identifier
anywhere in the codebase to point a reader at; the source of truth moved to `tuning-schema.ts`. Also
worth flagging: `Chase.height` defaults to `4` in the schema, while ADR-011 (`docs/DECISIONS.md:487`)
records the camera lowered "to 7.5u" — this pass did not chase down whether 4 vs 7.5 is a further
deliberate retune or drift; flagged as **inference, not verified**.

**Suggested resolution:** change the §6 pointer to `apps/client/app/dev/tuning-schema.ts` (`Chase.*`
keys), drop the `(CHASE)` parenthetical, and separately confirm whether `Chase.height: 4` vs ADR-011's
7.5u is intentional.

---

## 7. (c) §8 rule 5 perf budget is still OPEN, and the one concrete budget on record (§9) is now stale

ADD §8 rule 5: *"**Budget:** *OPEN* — set tri-count + draw-call budgets after first perf test."*
Unchanged from the 2026-09-23 report. Still true — no tri-count/draw-call budget exists in ADD, the
tuning schema, or `docs/DECISIONS.md`.

The one concrete frame-time snapshot ADD does carry (§9, added 2026-09-23, `f46eae27`) predates:
quality tiers (#344/RFC-349 S19), fake deck reflections (ADR-031, #354), nozzle glow (ADR-033, #369),
and the mirror removal (ADR-034, #371) — all of which changed draw calls or per-frame cost (ADR-031's
own consequences section reports "Draw calls: low 46 → 49, high 123 → 129" for the reflection streaks
alone). The §9 numbers ("10.0 ms with everything... deck 2.1 ms, sky 1.4 ms, rocks 0.9 ms") are a
snapshot from before four look changes that touched the render path, not a current budget.

**Suggested resolution:** keep §8 rule 5 OPEN as written (still accurate), but add a one-line note under
the §9 DPR2 paragraph that it is a pre-#354/#369/#371/quality-tier snapshot, pointing to the perf-analysis
skill for a current number rather than letting a reader treat 10.0 ms as live. Pure doc fix.

---

## 8. (c) §3's own "hand-to-owner" note cites `accent.ts` as holding the hex; it has moved

ADD §3's decisions-and-departures note: *"the brand marigold is now `#F5B024` in code (`app.css`,
`accent.ts`)"*.

Verified: `apps/client/app/app.css:18` — `--color-marigold: #f5b024;` (still correct). But
`apps/client/app/game/scene/accent.ts` no longer contains the hex; it reads `col('Accent.color')` from
the tuning store (`accent.ts:5`). The literal `'#F5B024'` now lives in
`apps/client/app/game/scene/accent.constants.ts:1` (`export const ACCENT_ANCHOR = '#F5B024';`), which
`tuning-schema.ts:198` uses as the default. Minor — the value is still correct everywhere, only the
file pointer split in two.

**Suggested resolution:** update the parenthetical to `app.css`, `accent.constants.ts`. Trivial doc fix.

---

## 9. (c) §11's "new `scene/environment.tsx` (built — env-lab)" points at a deleted route/file

ADD §11 (marked as historical research, not live direction) references `scene/environment.tsx` and
`/env-lab` three times (lines 335, 344, 352) as built artifacts of the 2026-08-10 S6 pass. Per CLAUDE.md,
`/env-lab` was deleted 2026-09-22 with the lighting strip (issue #196). Confirmed: no
`scene/environment.tsx` file exists under `apps/client/app/game/scene`, and no `env-lab` route exists
under `apps/client/app/routes`.

§11 is explicitly framed as *"kept here rather than deleted because this is the §11 research-and-history
section... History is forward-framed"* (ADD:370-371), so this is lower priority than the §0 authority
table was — a reader is told up front this section is history, not a live pointer. Still, three separate
mentions of a since-deleted route with no "(removed)" annotation invite someone to go looking for it.

**Suggested resolution:** low priority. If §11 is touched for other reasons, add "(removed 2026-09-22,
issue #196)" after the three `env-lab`/`environment.tsx` mentions. Not worth a dedicated pass on its own.

---

## What to do with this

Findings 1, 2 and 3 are the load-bearing ones: §1 says the doc asserts a whole object category and a
whole ship-identity feature that were never built, and §3 says the doc's own "signature" claim (bloom)
is false on the tier a meaningful share of players will actually run. All three are pure `docs/ADD.md`
edits — nothing here touches `docs/art-direction/`, since none of the corrections change what the art
package says, only what ADD claims the build does with it. Findings 4-9 are smaller pointer/staleness
fixes, cheapest done in one pass together with 1-3.
