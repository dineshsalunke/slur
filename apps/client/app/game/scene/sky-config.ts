// The deep-space sky's tuning surface. A plain DATA module, not a component — the displayed sky and (from
// slice 3) the environment bake both read this one object, so the two can never drift apart.
//
// Every knob is derived and human-readable: angular sizes in DEGREES, colours as hex ramp stops. Nothing here
// is a raw shader frequency or an xyz vector, because a human cannot reason about either. Vite HMR reloads
// this module without a page refresh, so tuning is an edit-and-look loop.
//
// PALETTE — cold, desaturated, low-contrast, dark: blue-grey, graphite, charcoal, deep-space blue/black. The
// warm ramp (#FFE0A0 / #FFB52E / #F59A24) belongs to the PLAYABLE layer and never appears up here. No cyan,
// no magenta, no red (board 01 still prints superseded Alert Red / Cyan / Purple swatches — those are out).

/** The base vertical ramp the nebula sits on. Three stops, sampled by view elevation. */
export interface SkyGradientConfig {
    /** Straight up. The darkest stop — depth reads as "less light overhead", not "more". */
    zenith: string;
    /** Level with the track. Carries the faint ecliptic haze, so usually the brightest of the three. */
    horizon: string;
    /** Straight down. Effectively void; the track occludes most of it in play. */
    nadir: string;
}

/**
 * The domain-warped FBM cloud. Domain warping is a SHAPE operation and is colour-neutral — Inigo Quilez's own
 * article on it never touches colour. Saturation comes entirely from what happens downstream, which is why all
 * three restraint levers below are downstream ones: a narrow hand-authored ramp, a subtle warp, few octaves.
 */
/**
 * The large-scale field that decides WHERE there is nebula at all. It multiplies density, so it can only ever
 * remove cloud, never add it.
 *
 * Without this the sky is one stationary isotropic field and is therefore statistically identical in every
 * part of the frame — which reads as wallpaper, and is why a fixed threshold made one camera angle look empty
 * and another crowded. Six octaves from a 10° base spans 10°→0.3°; the reference's dominant structure is
 * 60-90° across and simply cannot appear in that band.
 */
export interface NebulaMaskConfig {
    /** Angular size of the whole band/void structure. Measured: 120° is too compressed to threshold (p50 0.289,
     *  max 0.497); 80° gives a usable p25 0.327 → p90 0.609 spread. */
    featureSizeDeg: number;
    /** Below this the sky is void regardless of what the emission layer says. */
    threshold: number;
    /** Width of the void→band falloff. Wide, or the band gets a visible hard edge across open sky. */
    softness: number;
}

/**
 * Dust: an independent field that SUBTRACTS light, as extinction (`exp(-k·dust)`).
 *
 * This is the one layer that genuinely needs a second noise rather than a retune of the first. Emission maps
 * density to brightness monotonically, so "dense and dark" is structurally impossible there — yet opaque dark
 * clumps silhouetted in front of brighter cloud are the most characteristic feature of the look target,
 * `public/textures/nebula-backdrop.jpg`. Smooth, never ridged: ridging would make filaments OF the dark, which
 * is the opposite of the reference's soft blobby clumps.
 */
export interface NebulaDustConfig {
    featureSizeDeg: number;
    /** Measured at 25°/3 octaves: p50 0.505 · p90 0.655 · p99 0.761. A 0.55 window covers ~20% of the sky. */
    threshold: number;
    softness: number;
    /** Extinction coefficient. `exp(-strength)` is the transmission at a full clump — 1.6 ⇒ ~20% light left. */
    strength: number;
}

export interface NebulaConfig {
    /** Cold ramp indexed by density, dark → bright. Hand-authored and NARROW — never procedural hue cycling. */
    ramp: readonly [ string, string, string ];
    /**
     * Density at which the ramp starts climbing toward the HOT top stop, 0-1.
     *
     * This is the dial that separates "how much cloud" from "how bright a core gets". It was hard-coded at 0.5,
     * which meant a third of all cloud was already blending toward the top stop — so the histogram's >48/>80/>120
     * bands collapsed onto each other and the field read as a milky haze instead of dark cloud with hot cores.
     * At 0.95 a core is genuinely rare, which is the reference's character: a long bright tail over a dark field.
     */
    coreOnset: number;
    mask: NebulaMaskConfig;
    dust: NebulaDustConfig;
    /**
     * How strongly the cloud brightens toward the star, 0-1. `ridge` alone fakes edge-lighting ISOTROPICALLY —
     * it brightens every crease equally regardless of where the light is. This reads the scene's one bearing
     * instead, so the cloud and the celestial body cannot disagree about the light.
     */
    lightContrast: number;
    /** FBM octaves. Low on purpose: more octaves read as grain, not cloud. 3–5 is the useful range. */
    octaves: number;
    /**
     * Angular size of the largest cloud feature, in degrees of sky. Judge it against the FIELD OF VIEW, not
     * against the whole sphere: at 80° a single wisp is wider than a 45° frame and the cloud reads as a flat
     * gradient with no structure at all. Roughly two features per frame is what looks like a nebula.
     */
    featureSizeDeg: number;
    /**
     * Domain-warp amplitude. Deliberately far below Quilez's illustrative 4.0 — the pegwars "Rendering
     * Nebulae" writeup found the warp "ended up needing to be very subtle, or the noise field quickly
     * degenerates from a lovely blobby or wispy and cohesive image into a torrid mess". Keep under ~1.
     */
    warp: number;
    /**
     * Blend from smooth fBm (0) to ridged multifractal (1). Ridged folds the noise about its midpoint, turning
     * round blobs lit at their cores into thin bright FILAMENTS on dark cloud — the structure of
     * `public/textures/nebula-backdrop.jpg`, which is the agreed look target for the cloud itself.
     * It also changes the value distribution, so `threshold` must be re-derived whenever this moves.
     */
    ridge: number;
    /**
     * Raw noise value below which the sky is empty. Measured over 30k uniform directions at the shipped
     * settings: at `ridge: 1` the field runs p50 0.52 · p75 0.65 · p90 0.75 · p95 0.79 · p99 0.86 · max 0.96,
     * whereas at `ridge: 0` it tops out near 0.86 with a much shorter tail. Filaments want a threshold up in
     * the p80s; a smooth cloud wants the 0.40-0.55 range. Re-measure with `scratchpad/fbm2.mjs` if in doubt.
     */
    threshold: number;
    /** Width of the ramp from empty sky to full cloud. Small = hard-edged clumps, large = diffuse haze. */
    softness: number;
    /** How strongly the cloud covers the base gradient at full density, 0–1. */
    opacity: number;
}

/** drei `<Stars>` — one `Points` draw call. Camera-locked via `SkyFollow`, so the field has zero crawl. */
export interface StarFieldConfig {
    enabled: boolean;
    /** Star count. Deep space wants sparse — a dense field starts competing with the playable layer. */
    count: number;
    /** Shell radius (u). Apparent point size falls off as 1/radius, so radius and `size` are tuned together. */
    radius: number;
    /** How far stars extend inward from `radius` (u) — gives the shell thickness, not parallax. */
    depth: number;
    /** Point size factor. drei's `factor`; bigger = chunkier points. */
    size: number;
    /** 0 = pure white. Stars are one of the few things allowed to be bright, never to be colourful. */
    saturation: number;
    /** Soft radial falloff on each point — the thing that stops 1px stars aliasing under motion. Keep true. */
    fade: boolean;
    /** Twinkle rate. drei pulses the whole field in lockstep, so keep it slow enough not to read as a throb. */
    twinkleSpeed: number;
}

/**
 * The celestial body — the rim-lit limb in the upper right of `public/textures/nebula-backdrop.jpg` and of
 * board 12.
 *
 * Its position is its OWN bearing, deliberately not the star's. A body sitting on the star bearing presents a
 * fully-lit face; the crescent only exists because the light is well off to one side, putting the hemisphere
 * we can see into shadow. On the look target the lit face is DIM and only the thin limb is bright — so the
 * restraint lives in `litColor` being dark, not in dimming the rim.
 */
export interface CelestialBodyConfig {
    enabled: boolean;
    /** Where the body sits, in the same frame as the star bearing. */
    bearingDeg: number;
    elevationDeg: number;
    /** Apparent DIAMETER, in degrees of sky. Judge it against the FOV — the same trap as the nebula's
     *  feature size. The look target's body is cut off by the frame, i.e. wider than the shot. */
    angularSizeDeg: number;
    /** The sunlit surface. Cold and dark: on the look target the lit face is barely above the nebula. */
    litColor: string;
    /** The night side. Near-black, never pure black — a pure-black night side kills the silhouette. */
    shadowColor: string;
    /** The added rim term. The one thing up here allowed to be bright enough to bloom. */
    rimColor: string;
    /** Half-width of the terminator band as a `dot()` value. 0 = a hard clipped circle. */
    terminatorSoftness: number;
    /** Fresnel exponent. Higher = thinner, sharper rim. */
    rimPower: number;
    /** Rim multiplier. Above 1 it goes HDR and is the main thing in frame that crosses the bloom threshold. */
    rimStrength: number;
    /** Surface mottle, 0–1. At 0 the body is a featureless ball, which reads as a decal rather than a world. */
    detail: number;
    /** Mottle frequency, in noise cells across a body radius. */
    detailScale: number;
}

/** The one real light in the scene, aimed down the authored star bearing. */
export interface StarLightConfig {
    intensity: number;
    /** Cold white. The warm ramp belongs to the playable layer and never lights the far field. */
    color: string;
}

export interface SkyConfig {
    name: string;
    /** Dome sphere radius (u). Must sit inside the camera's far plane. Purely a containment number — the sky
     *  is camera-locked, so radius changes nothing about how distant it reads. */
    radius: number;
    /**
     * Compass bearing of the star, in degrees (0 = -Z, increasing toward +X).
     *
     * THE SINGLE SOURCE OF TRUTH FOR THE LIGHT'S DIRECTION. The dome's cloud lighting reads it now; slice 2's
     * celestial body and its `DirectionalLight`, and slice 3's bake, read the same two numbers. Anything that
     * derives a light direction independently will drift out of agreement with the sky.
     */
    starBearingDeg: number;
    /** Elevation of the star above the horizon, in degrees. */
    starElevationDeg: number;
    gradient: SkyGradientConfig;
    nebula: NebulaConfig;
    stars: StarFieldConfig;
    body: CelestialBodyConfig;
    starLight: StarLightConfig;
}

/** A noise cell on a unit direction sphere subtends ~1 radian, so this converts a feature size to frequency. */
const DEGREES_PER_RADIAN = 180 / Math.PI;

/** Feature size in degrees → the noise frequency the dome shader samples the view direction at. */
export function nebulaFrequency( featureSizeDeg: number ): number {
    return DEGREES_PER_RADIAN / featureSizeDeg;
}

/** Bearing/elevation → a unit direction, in the same frame the dome samples the view direction in. */
export function starDirection( bearingDeg: number, elevationDeg: number ): [ number, number, number ] {
    const bearing = bearingDeg / DEGREES_PER_RADIAN;
    const elevation = elevationDeg / DEGREES_PER_RADIAN;
    const horizontal = Math.cos( elevation );
    return [ horizontal * Math.sin( bearing ), Math.sin( elevation ), -horizontal * Math.cos( bearing ) ];
}

/**
 * The one sky, for now. Per-sector variants (board 06's six identities) are a future parameterisation of this
 * same shape — the language is built so they are data, but authoring six of them is not this task's job.
 */
export const DEEP_SPACE: SkyConfig = {
    name: 'Deep Space',
    radius: 2000,
    // Upper-right of a forward view, matching where the look target's rim-lit limb sits. Slice 2 places the
    // celestial body on this bearing rather than choosing its own.
    starBearingDeg: 55,
    starElevationDeg: 18,
    gradient: {
        // Darkened ~55% at the session-3 eye gate. This barely moves the >24 histogram band (the base's own
        // luma is already under 24) but it drops `mean` 23.2 → 20.3, which partly offsets the cloud coverage
        // running hot. Deep space should be near-black; the cloud, not the backdrop, carries the brightness.
        zenith: '#020407',
        horizon: '#060a10',
        nadir: '#010203',
    },
    nebula: {
        // TUNED TO THE HISTOGRAM GATE, not by eye — see GATE-1-FINDINGS.md §2 for the target and the ffprobe
        // method. Measured across 12 orbit angles (median [min-max]):
        //     mean 20.3 [16.8-28.6] · >24 30.9% [24.9-40.6] · >48 10.7% · >80 1.72% · >120 0.53% · >160 0.00%
        //     target                  mean 26.5 · >24 27.4% · >48 9.9% · >80 2.90% · >120 0.72% · >160 0.20%
        // `>24` runs ~3.5pp HOT against target and that is an accepted divergence, not an oversight: these values
        // are the owner's live eye-tune against the backdrop overlay, and the eye outranks the mirror on the art
        // call. Everything else is on target or deliberately under.
        // ⚠ that target mean is disputed: re-measuring nebula-backdrop.jpg with §2's own command and crop
        // gives 22.4, not 26.5. >80/>160 stay short DELIBERATELY — that tail is the planet limb, slice 2's job.
        //
        // Ramp stop luma (BT.709 on the sRGB bytes) is what the gate's thresholds actually see:
        //   #101620 = 20  — BELOW the >24 line on purpose, so faint cloud does not inflate the >24 band
        //   #374757 = 69  — the bulk sits here, between the >48 and >80 lines
        //   #7d93ad = 143 — the hot core, reachable only past `coreOnset`
        // The previous top stop #5d7189 has luma 110, which made >120 unreachable AT ANY DENSITY — that, not
        // the thresholds, was why both earlier configs measured 0% there.
        ramp: [ '#101620', '#374757', '#7d93ad' ],
        coreOnset: 0.96,
        // Measured over 40k uniform directions at 80°/2 octaves: p25 0.327 · p50 0.424 · p90 0.609. The window is
        // NARROW on purpose so the mask resolves to mostly-0 or mostly-1 rather than dimming the whole sky.
        // Threshold lowered 0.28 → 0.18 at the gate: the target wants ~27% of pixels carrying visible cloud, and
        // a mask voiding a quarter of the sky put that out of reach no matter how the emission dials moved.
        // 80 → 40 is the owner's live value. Measured, it is a NO-OP at `threshold 0.18`: the 80°/2-octave field
        // runs p25 0.327 against a 0.18→0.34 window, so the mask is ~0.93 by the 25th percentile and only the
        // darkest tenth of sky is touched — sweeping 80/50/35 gave visually identical frames. The layer only
        // starts carving near threshold 0.42, which costs too much coverage to afford (see HANDOVER).
        mask: { featureSizeDeg: 40, threshold: 0.18, softness: 0.16 },
        dust: { featureSizeDeg: 25, threshold: 0.55, softness: 0.2, strength: 1.6 },
        lightContrast: 0.5,
        octaves: 6,
        // 10° → 6° at the second gate. With amplitude halving per octave the BASE octave carries ~51% of the
        // field, so the bright structure was the base scale itself and read as fat cottony masses. A ridged
        // multifractal (Musgrave weight feedback) was tried first to get branching and rejected on measurement:
        // it suppresses child octaves wherever the parent is weak, which made the field chunkier, not branchier.
        featureSizeDeg: 6,
        warp: 0.55,
        ridge: 1,
        // A WIDE window on purpose. Measured at these settings the field runs p50 0.53 · p75 0.65 · p90 0.74 ·
        // p95 0.79 · p99 0.86. A narrow window here went binary — every visible pixel pinned to the top ramp
        // stop, reading as torn paper rather than as cloud.
        //
        // 0.52 → 0.65 → 0.46 → 0.448 → 0.38 across four gates. 0.65 was set by eye and measured at 0.16% of
        // pixels above luma 24 against a 27.4% target — the nebula had effectively vanished. 0.46/0.448 were
        // histogram answers. 0.38 is the owner's eye-tune and knowingly runs `>24` hot; see the block above.
        // Raising coverage alone reproduces the earlier milky failure, which is why `coreOnset` moved with it:
        // this dial sets how much sky has cloud, that one sets how rarely cloud gets hot.
        threshold: 0.38,
        softness: 0.5,
        // Just off full. Restraint lives mainly in the ramp stops, which are already dark and narrow — an
        // earlier attempt to dim hard here pushed the cloud below the point where it could be judged at all.
        // 0.92 takes the faintest cloud down a touch without that collapse.
        opacity: 0.92,
    },
    stars: {
        enabled: true,
        // Raised 2600→4500 / size 9→13: at the old values the field was present but did not register against
        // the cloud. The histogram mirror does NOT model stars, so their effect is screenshot-verified only.
        count: 4500,
        radius: 400,
        depth: 120,
        size: 13,
        saturation: 0,
        fade: true,
        twinkleSpeed: 0.3,
    },
    body: {
        enabled: true,
        // Upper-right of the game's forward view (bearing 0 = -Z), which is where the look target puts the limb.
        //
        // THE ANGLE TO THE STAR IS THE COMPOSITION. Crescent thinness is governed entirely by the separation
        // between this bearing and `starBearingDeg`, NOT by any rim knob:
        //   ~0°  → the star sits behind the body, every limb point is at the terminator, and the rim closes
        //          into a full ring — which reads as atmosphere, and hides the star behind the planet;
        //   ~90° → a half-lit gibbous, no crescent at all;
        //   ~35° → the look target: strongly night-side with a bright arc down one limb.
        // At 20° against a star at 55° the separation is ~35°, so the lit arc falls on the star side.
        bearingDeg: 28,
        elevationDeg: 15,
        // The body's CENTRE sits near the frame edge and its radius (35°) is wider than the lab's 45° vertical
        // FOV, so what is in frame is a LIMB arcing through the corner — the backdrop's composition — rather
        // than a marble floating in the middle. Geometry caps this below 90°: past a 45° half-angle the sphere
        // radius exceeds its own distance and swallows the camera.
        // FIRST NUMBER TO TUNE, and it must be re-judged in /art-lab at the game's FOV, not settled here.
        angularSizeDeg: 44,
        // Luma 34 and 6 on the sRGB bytes. The lit face sits just above the nebula's mid ramp stop (69) — on
        // the look target the body is NOT the bright thing, the 2px crescent on its edge is.
        litColor: '#23272e',
        shadowColor: '#050608',
        rimColor: '#dfeaff',
        terminatorSoftness: 0.22,
        rimPower: 5,
        // Above 1 on purpose: with the dome's brightest possible pixel at ~0.28 linear luma against a 0.42
        // bloom threshold (GRID_VOID), this rim is the only thing in the far field that can legitimately bloom.
        rimStrength: 2.2,
        detail: 0.55,
        detailScale: 4.5,
    },
    starLight: {
        intensity: 1.6,
        color: '#e8f0ff',
    },
};
