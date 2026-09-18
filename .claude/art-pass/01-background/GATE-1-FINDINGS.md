# Slice 1 — gate findings (2026-09-18, owner + Claude)

**Verdict: NOT passed. Do not commit the current default.** The work is sound; the tuning is not, and the
reference authority needs one correction. Everything below is measured, not eyeballed.

**Read `HANDOVER.md` first** — this supersedes only its §"Open at the gate" item 1/2, nothing else.

---

## 1. Authority correction — the backdrop outranks the boards FOR SKY

`HANDOVER.md` currently says the bitmap is "a nebula-**structure** reference only" and that board 12 still
outranks it. **That is too narrow.**

The owner confirmed (2026-09-18): **the boards were COMPOSED OVER `nebula-backdrop.jpg`.** The sky visible in
boards 12/13 *is* that file with rock painted on top. So for the **sky / far field** the backdrop outranks
the boards on **tone as well as structure** — the boards are the same image with information *removed*.

Board 12 still outranks it for **overall scene** colour, depth, composition and material. Both are true;
they address different subjects. Recorded as authority entry **0** in art-pass `INDEX.md` §2.

**The trap this closes — it cost a full review cycle today.** Judging the isolated `/iso-sky` against a
*composed* board reads occlusion as intended faintness. It produced a confident, wrong conclusion ("the
nebula should be nearly invisible") and a tuning direction that was backwards. **Never judge an isolated
ingredient against a composed board.** Find the unoccluded source first.

**Actionable defect:** `iso-lab/reference-boards.ts` lists only the 14 composed boards, so the `/iso-sky`
compare overlay **physically cannot display the one correct reference**, and it defaults to `12 · Approved
scene ★` — the most heavily occluded board of the set. **Fix this first** (see §4.1).

---

## 2. The measured target

Method — `ffprobe` + `signalstats` + a `lut` threshold. No Python (NN-1). `<t>` = luma 0–255; divide the
returned YAVG by 255 for the fraction of pixels above `t`:

```sh
ffprobe -v error -f lavfi -i "movie='<img>',format=gray,lut=y=if(gt(val\,<t>)\,255\,0),signalstats" \
  -show_entries frame_tags=lavfi.signalstats.YAVG -of default=nw=1:nk=1
```

Target is `nebula-backdrop.jpg` with the **planet cropped out** (`crop=980:941:0:0`) so it is nebula-vs-nebula.
The planet and the bright limb are **slice 2's** subject and must not inflate the slice-1 target.

| % of pixels above | **TARGET** (backdrop, no planet) | current committed default | earlier config |
|---|---|---|---|
| mean luma | **26.5** | 13.4 | 30.9 |
| >24 | **27.4%** | 0.16% | 35.2% |
| >48 | **9.9%** | 0% | 18.4% |
| >80 | **2.9%** | 0% | 10.8% |
| >120 | **0.72%** | 0% | 0.03% |
| >160 | **0.20%** | 0% | 0.017% |

**The two configs bracket the target from opposite sides.** The earlier one had ~3.7× too much mid-bright
bulk and ~24× too few bright cores — milky. The current derived default has essentially **nothing**: half
the reference's mean luma and 0.16% of pixels above 24. The `HANDOVER.md` warning that this default was
"DERIVED, NOT SEEN" was correct, and it is far too empty.

**The shape to aim for:** mostly dark, with **small hot cores** punching through. The reference's character
is a long bright tail over a dark field — not a uniform haze at any level. Crushing the mids is right;
the peaks must simultaneously be allowed to go **hot**.

**Measurement caveats, stated so they are not overstated:** captures are screenshots of a tone-mapped
canvas vs an authored 8-bit JPEG — both display-referred sRGB, so comparable, but this is a *gate*, not
colour science. The `/iso-sky` crop also contains the two black probes (~8% of area), which deflates its
numbers slightly — immaterial at 0% vs 9.9%, but do not treat the last decimal as meaningful.

---

## 3. What is NOT wrong — do not "fix" these

- **The three-layer model (mask / emission / light) is right.** The large-scale MASK is exactly the missing
  ingredient: the reference has one coherent dust band with genuinely empty space around it, where a single
  FBM + threshold gives statistically uniform coverage everywhere. Keep it.
- **`ridge` is right.** The reference's filaments are lit at their EDGES, not their cores.
- **Sharing one star bearing** across body, flare and bake is right. Keep it as the single source of truth.
- **The `rig={false}` toggle** is right, and the reasoning (a neutral directional would make the roughness
  self-test pass regardless) is exactly the standard this arc wants.
- **Black roughness probes are the honest baseline** until slice 3. Do not fake them.

---

## 4. Do this, in order

### 4.1 Make the correct reference reachable (blocks everything else)
Add `nebula-backdrop.jpg` to the `/iso-sky` compare overlay and **default this route to it**, not to board 12.
It is served by Vite at `/textures/nebula-backdrop.jpg`, while `REFERENCE_BOARDS` entries resolve through
`ART_REFS_ROUTE` → `docs/art-direction/boards/` — so this needs an explicit URL override on the entry
(e.g. an optional `url?: string` that `boardUrl()` prefers), **not** a copy of the file. Mark its
`scaleTrust` as `mood-only`. Give it a name that states its status, e.g. `★ Nebula backdrop (boards' sky)`.

Without this the reviewer cannot see the right image, which is the root cause of this failed gate.

### 4.2 Re-tune to the histogram
Use the table in §2 as the acceptance test. Report the measured numbers for whatever you land — a config
whose histogram is not in the report is not reviewable. Judge across **several orbit angles**: the field is
not uniform, and `HANDOVER.md` already notes one angle can read empty while another reads crowded. Report
the spread, not a single favourable angle.

Direction of travel from the current default: substantially **more** density and, separately, **hotter
peaks**. Both are needed — raising overall density alone reproduces the earlier milky failure.

### 4.3 Then slice 2 — celestial body + the real `DirectionalLight`
Per the brief. Note that a real part of the reference's bright tail (>120) is the **planet limb**, not the
nebula, so **do not drive the nebula alone to hit that tail** — it will over-shoot once the body lands.
Get the nebula close on the mid bands (>24 / >48 / >80) and let slice 2 supply the top end.

### 4.4 Re-gate
`/iso-sky`, bloom **on and off**, several angles, with the backdrop overlay in Split or Wipe.

*(The Bloom-blackout item in `HANDOVER.md` §3 is **already resolved** by the lane — reproduces identically on
`/iso-monolith` at a canvas matching the viewport, so it is pre-existing in `IsoLabCanvas`, not a sky bug.
Agreed it stays out of this task; file it as its own issue.)*

---

## 6. Answers to the lane's two open calls

**Q1 — "0.65 may be a touch high globally; the default angle reads quite empty."** Your instinct is right,
and the measurement is emphatic. At the current default the canvas is **0.16%** of pixels above luma 24
against a target of **27.4%**, with **0%** above 48 where the target is 9.9%, and mean luma 13.4 vs 26.5.
This is not "a touch high" — the nebula has effectively vanished. Come down substantially, and use the §2
histogram as the acceptance test rather than a judgement call.

Do **not** simply revert toward the old value: that config overshot the mid bands (10.8% above 80 vs a 2.9%
target) while still having no hot cores. The target shape is **darker overall than the old config, with a
long bright tail neither config has**. Density and peak-contrast are separate dials; move both.

**Q2 — "dust is barely doing anything."** Expected, and not a problem to solve yet. Dust silhouettes against
emission, so it cannot read while emission is this sparse. Re-judge it after §4.2 lands. Keep `strength: 0`
as the off switch. Note the reference's dark knots *within* the bright band are exactly this ingredient —
so it likely matters more than it currently looks.

**Q3 — commit granularity.** Nothing commits until the histogram gate passes; the current default must not
be the committed default. Once it passes, land it as **two commits** — slice 1, then the layer rework — as
you proposed. The four-layer model is a genuine design change and deserves its own reviewable diff.

---

## 5. Standing rules reinforced by this gate

1. **Never judge an isolated ingredient against a composed board** (art-pass `INDEX.md` §4).
2. **Measure before asserting a tonal claim.** "Too bright" was wrong in magnitude *and* direction here —
   the means were within 17% and the real fault was dynamic range.
3. **A derived default must be looked at before it is called a default.** `HANDOVER.md` flagged this against
   itself and was right to; the number was plausible and the render was empty.
