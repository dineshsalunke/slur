# Brainstorm — "strafing should feel like vibrato on a guitar"

**Phase:** Brainstorm. Opened 2026-09-19 by the owner, mid-track-art-pass, as a *generation* question
rather than an art one. **Nothing is decided.** This note records the proposal, the critique, the
measurements that back the critique, and the counter-proposal — so the dialogue can resume cold.

---

## 1. The owner's proposal, verbatim in substance

> "I would like the navigation or strafing to feel like playing vibrato on guitar … imagine you generate
> the waveform of the song (only one half, i think waveforms are symmetry, correct me if i am wrong), we
> lay it down on the track, and that acts as the path user has to traverse. we create gaps, blocks around
> this path, so that user has to thread it as per the waveform."

Two separable things: a **goal** (vibrato feel) and a **mechanism** (audio waveform as the racing line).
The goal is good and is the real subject. The mechanism is the part under challenge.

## 2. The symmetry question, answered

**Waveforms are not symmetric.** *(Recalled — conceptual acoustics, not an actionable surface claim.)*
They are approximately **zero-mean** — DC-blocked, oscillating about zero — which is a different
property. Positive and negative excursions differ sample by sample, and some sources are strongly
asymmetric by nature (brass and voice notably so: different positive and negative peak magnitudes).

What *looks* symmetric is the **peak-envelope display** every audio editor draws: per pixel-bucket it
plots `+|peak|` and `−|peak|`, mirrored **by construction**. That mirrored blob is what people picture
when they say "the waveform of a song".

This matters for the proposal: "take one half" therefore yields the **amplitude envelope**, which is
**unsigned — always ≥ 0**. As a lateral path it only ever displaces to one side. Re-centring it means
subtracting its own mean, at which point the signal being used is no longer the waveform but a derived
control curve — and the derivation, not the audio, is doing the work.

## 3. Why waveform-as-path fails, in three

1. **Raw samples are noise at track scale.** ~8M samples for a 3-minute song against 8000u of track
   (`TRACK_SEGMENTS 400 × SEG_LEN 20`, verified-this-session in `packages/shared/src/sim/track.ts:130-131`).
   Decimating a 20 kHz-bandwidth signal to ~1 sample/unit does not yield "the shape of the song"; it
   yields aliased hash. The audible music lives in the *envelope*, not the sample-level carrier.
2. **The envelope encodes loudness, and loudness is the wrong axis.** A path driven by the envelope
   swerves one way when the music is quiet and the other when it is loud. That is a VU meter you drive
   through. It has no relationship to vibrato.
3. **It takes the vibrato away from the player.** Vibrato is the *performer's* ornament — the player
   chooses its rate and depth over a held note. A prescribed path makes the player a **plotter tracing a
   line somebody else drew**. Tracing a prescribed oscillation is Guitar Hero feel (hit what the chart
   says); vibrato is instrument feel (you decide). The proposal produces the first while naming the
   second.

## 4. The fork the proposal cannot escape

**Either the player can perceive the correlation with the music, or they cannot.**

- **Perceivable** → it is a rhythm game. ADR-006 already ruled the other way: the generator is
  *"continuous, NOT a rhythm game"* (`docs/DECISIONS.md`; repeated in `CLAUDE.md`). Laying a song's
  envelope on the track is the most literal available version of the thing that decision rejected.
- **Not perceivable** → the waveform is an expensive PRNG with structure we cannot control and the
  player cannot enjoy. `mulberry32` is cheaper and steerable.

This is not fatal to *using audio* — see §7 — but it is fatal to using it as the path.

## 5. What vibrato actually decomposes into

| Property of guitar vibrato | What it demands of SLUR |
|---|---|
| Oscillation you **settle into**, ~5–7 Hz for a guitar hand | A **regular enough** forcing rate to lock onto — not a stochastic one |
| **Small amplitude** around a held centre | Corridor centre stays put; the player oscillates ±2–4u *within* it |
| **Player-chosen** depth and rate | Oscillating is **rewarded, not mandated** — an incentive gradient, not a prescribed line |
| **Muscular** — the string pushes back | Lateral motion must have **weight**: momentum, and a cost to reversing |
| **Phrasing** — you don't vibrato every note | Sections of oscillation interleaved with hold — ADR-006's `intensityAt` envelope already does this |

The fourth row is where this lives, and it is not a track-generation property at all.

## 6. The measurements — and the finding that matters

Read this session from `packages/shared/src/constants.ts` and `packages/shared/src/sim/track.ts`.

**The ship is tuned anti-vibrato, deliberately, and the comment says so.**

`DEFAULT_TUNING`: `strafeAccel: 165`, `strafeClamp: 80`, `strafeDamp: 14`. The `strafeDamp` comment
reads: *"raised 8→14: release bleeds lateral momentum FAST → a tap-strafe settles crisply (the
'continuous-but-discrete' flick feel), **not a drift**"*.

At `strafeDamp: 14` the lateral velocity time-constant is ~71 ms — heavily overdamped, with **no
restoring force at all**, so the system has **no natural frequency**. You cannot vibrato an instrument
with no resonance. The ADR-006 playtest pass that tuned *flicks in* tuned *vibrato out*, on the same
knob, and no track geometry can recover it.

**The current forcing rate is far below the vibrato band, and is stochastic.**

`flickAt()` fires *"only if this segment rolled one AND the previous did not"* — a one-segment lookback.
So the ceiling is **one flick per two segments = one per 40u**, which at cruise (55 u/s, the speed
`02-track/README.md` §4 gates legibility at) is **1.375 Hz**. And it is *rolled*, not periodic, so a
player never settles into a rate.

**The vibrato band, converted.** At 55 u/s: 2 Hz → a feature every 27.5u · 3 Hz → 18.3u · 4 Hz → 13.75u
· 6 Hz → 9.2u. Useful handle: `SEG_LEN` is 20u, so **one feature per segment ≈ 2.75 Hz** and one per
half-segment ≈ 5.5 Hz. The knob is "features per segment", and one-per-segment already sits inside a
plausible vibrato band. *(A thumb on a keyboard is probably 2–4 Hz, not a guitarist's 5–7 — **guessed**,
and worth measuring on a human before it is built to.)*

## 7. Counter-proposal

**Vibrato is a tuning-plus-spacing problem, not a path-authoring problem.**

1. **Lower `strafeDamp` so lateral motion has weight.** This is the load-bearing change. Momentum
   carries, reversal costs something, and the hands find a rate where push and pull balance. Everything
   else is decoration without it.
2. **Make the forcing rate regular and raise it** into the target band — features per segment, derived
   from a chosen Hz and the cruise speed, rather than a per-segment probability roll.
3. **Shrink the amplitude.** Keep the corridor centre stable; the oscillation is ±2–4u *inside* it, not
   a wandering corridor. (A wandering corridor is melody; vibrato is ornament.)
4. **Reward the oscillation, don't mandate it** — the tight line through alternating features is faster,
   but a flat line survives. That is what returns the ornament to the player.
5. **Phrase it** with the existing `intensityAt` arrangement envelope.

### The real decision hiding underneath

**Flick feel and vibrato feel are opposed tunings on one knob.** High `strafeDamp` = crisp discrete
flicks (what ships). Low `strafeDamp` = continuous oscillation with body. One `DEFAULT_TUNING` cannot
be both.

**The out is that it does not have to be one.** GDD §5.5 makes ship *Class* a mechanics group with
per-ship `FlightTuning` resolved by the networked `shipId` — so crisp-vs-drifty becomes a **class
identity axis** rather than a global choice. One class flicks; another vibratos. That is a
characterisation win, not a compromise.

### And the honest test

**None of this needs music.** If it feels like vibrato with no song playing, it will feel like vibrato
with one. If it does not, a song will not save it. Build the feel first; decide about audio after.

## 8. What IS worth salvaging from the waveform idea

One thing, and it is real: **drive the arrangement envelope from a real track's energy envelope.**

ADR-006 already uses a hand-authored "Believer arrangement envelope" for `intensityAt`. Deriving that
curve from audio is the same "half a waveform" signal, relocated to the axis where its shape is actually
correct: it is **unsigned** (intensity is unsigned — the flaw in §2 becomes a virtue), **low-frequency**
(phrasing is slow, so decimation is honest rather than aliasing), and **the player never has to perceive
the correlation** for it to do its job (which dissolves §4's fork — this side of it is not a rhythm
game, it is a generator input with good statistics).

So: **waveform rejected as the path, accepted as the envelope.**

## 9. Open — for the owner

1. Is the vibrato goal worth a **ship-tuning** change, given `strafeDamp` was deliberately raised to
   8→14 for flick feel in the ADR-006 playtest pass? Or is this a **new class**, not a retune?
2. Target oscillation rate — needs a human measurement, not a derivation.
3. Does "reward but don't mandate" survive the fairness validator (FIT + GAP-REACH)? Probably yes since
   it only *adds* a faster line, but unchecked.
4. Audio-derived `intensityAt` — worth doing at all, or is the hand-authored envelope fine?
