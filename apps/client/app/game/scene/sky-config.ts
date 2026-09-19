// The deep-space sky's tuning surface. A plain DATA module, not a component — the displayed sky and the
// lighting environment both read this one object, so the two can never drift apart.
//
// ⚠ THE DISPLAY AND THE LIGHT ARE DELIBERATELY TWO DIFFERENT SOURCES (CHEAP-PATH-BRIEF.md). What you SEE is
// `nebula-backdrop.jpg` — the image the concept boards were composed over, so it matches the boards by
// construction rather than by tuning. What LIGHTS is a small authored `<Lightformer>` rig. The old procedural
// dome tried to be both and is preserved on branch `art/procedural-bg`.
//
// PALETTE — cold, desaturated, low-contrast, dark. The warm ramp (#FFE0A0 / #FFB52E / #F59A24) belongs to the
// PLAYABLE layer and never appears up here.

/** A noise cell on a unit direction sphere subtends ~1 radian, so this converts a feature size to frequency. */
const DEGREES_PER_RADIAN = 180 / Math.PI;

/**
 * Bearing/elevation → a unit world direction.
 *
 * **Bearing 0 is the way the ship flies (+Z) and bearing grows toward SCREEN-RIGHT, which is world −X.**
 * That sign is not a typo and is the one thing here you cannot reason your way to: a camera looks down its own
 * −Z, so a chase cam aiming at world +Z has back = −Z, and right = up × back = (0,1,0) × (0,0,−1) = (−1,0,0).
 * Pinned by `sky-config.test.ts`.
 *
 * The previous convention was "0 = −Z", i.e. bearing 0 pointed BEHIND the player, which is why the retired
 * dome's `starBearingDeg: 55` sat behind-right of the camera while its comment claimed "upper-right of the
 * game's forward view". Both numbers were eye-tuned in a free-orbit lab where forward had no meaning.
 */
export function skyDirection( bearingDeg: number, elevationDeg: number ): [ number, number, number ] {
    const bearing = bearingDeg / DEGREES_PER_RADIAN;
    const elevation = elevationDeg / DEGREES_PER_RADIAN;
    const horizontal = Math.cos( elevation );
    return [ -horizontal * Math.sin( bearing ), Math.sin( elevation ), horizontal * Math.cos( bearing ) ];
}

/**
 * Where the backdrop image is pinned on the sky, and how wide it is hung.
 *
 * A 16:9 framed composition covers a CONE, not a sphere. Putting the jpg on a stock sphere would use the
 * sphere's DEFAULT equirectangular UVs — wrapping it 360°×180° and smearing the planet across the poles — so
 * the image rides a spherical PATCH whose angular size is authored here.
 *
 * MEASURED CAMERA COVERAGE (`camera/chase.ts`, this session): the chase cam sits 9u up and 11–14u back aiming
 * 7u ahead and 2u up, i.e. pitched **18–21° DOWN**, with vFOV 60→75 under `fovStretch`. At 16:9 that is a
 * horizontal half-angle of 46–54°, so the frame spans ~108° horizontally at top speed. The sky above the
 * track horizon is only the top ~10–20° of it; the rest of the image sits below the horizon behind the rock
 * field.
 *
 * CAMERA YAW IS PART OF THE COVERAGE BUDGET — this was missed once and shipped a 120° patch. `SkyFollow`
 * copies camera POSITION only, never rotation, so the patch is world-fixed and the camera yaws inside it.
 * Under sustained max strafe the rubberband lags by `strafeClamp / follow` = 80/16 = 5u at a look distance
 * of `back + lookAhead` = 18–21u, i.e. ~15.5° of yaw — not the ~4° a previous version of this comment
 * claimed. Coverage need is therefore 108 + 2·15.5 ≈ 138.5°, which `sky-config.test.ts` now asserts.
 */
export interface SkyBackdropConfig {
    /** Which way the image's CENTRE points. */
    bearingDeg: number;
    elevationDeg: number;
    /** Angular WIDTH of the image, in degrees of sky. Height follows from the image's own aspect — stretching
     *  a framed composition to fill a taller patch is the distortion this whole patch exists to avoid. */
    fovDeg: number;
    /** Width of the alpha fade at the patch border, in degrees. The patch has a hard edge and the void behind
     *  it is near-black; a fade reads as "the nebula ends" rather than as a clipping bug. In game the edge sits
     *  outside the frame — this is for `/iso-sky`, which orbits freely by design. */
    edgeFadeDeg: number;
    /** Multiplies the sampled texture. 1 = the reference, untouched, which is the point of shipping it. */
    gain: number;
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

/** The one real light in the scene, aimed down the authored star bearing. */
export interface StarLightConfig {
    intensity: number;
    /** Cold white. The warm ramp belongs to the playable layer and never lights the far field. */
    color: string;
}

/**
 * The authored lighting environment — three `<Lightformer>`s baked to a cubemap by drei `<Environment>`.
 *
 * This is what makes the roughness self-test at `/iso-sky` pass, and it is the acceptance test for the whole
 * task: a `roughness 0.2` probe beside a `roughness 0.9` probe must look DIFFERENT with the lab rig off. The
 * retired procedural dome never managed it — a sky dark enough to look right was too dark to light anything.
 * Decoupling the two sources is precisely what buys it.
 */
export interface SkyEnvironmentConfig {
    /** Cubemap face size. Small on purpose: this is three soft blobs, and PMREM convolves detail away anyway. */
    resolution: number;
    /** The cold rim, on the star bearing. Big and soft — it rims the far rock field's silhouette. */
    keyIntensity: number;
    keyColor: string;
    /** Angular size of the key card, in degrees. */
    keySizeDeg: number;
    /** A dim card opposite the key, so unlit faces are dark rather than pure black. */
    fillIntensity: number;
    fillColor: string;
    /** A broad low ring for ambient wrap — the "there is a galaxy out there" term. */
    ambientIntensity: number;
    ambientColor: string;
}

export interface SkyConfig {
    name: string;
    /** Backdrop patch radius (u). Camera-locked, so this says nothing about how distant the sky READS — it is
     *  pure containment, and must stay inside the camera's far plane (three's default far is 2000). */
    radius: number;
    /**
     * Where the star is, in `skyDirection`'s frame. THE SINGLE SOURCE OF TRUTH FOR THE LIGHT'S DIRECTION —
     * the `DirectionalLight` and the `<Lightformer>` key both read it, so they cannot drift apart.
     *
     * DERIVED FROM THE IMAGE, not chosen (brief §3.2 makes agreeing with the baked-in lighting a hard
     * requirement — otherwise the rock field is rim-lit from one side while the sky implies another).
     * Method, reproducible: threshold `nebula-backdrop.jpg` at luma ≥ 210, take the brightest pixel per row in
     * the upper-right quadrant, and Kasa-fit a circle to them → planet limb at centre (1679, 622) r 719 px,
     * residual rms 4.2 px. A polar sweep of that circle shows the lit arc running from the frame edge at 120°
     * to a hard terminator at **169°** (luma 211 → 81 → 34 over six degrees). A crescent's lit limb spans 180°
     * centred on the sub-stellar azimuth, so the star sits at **79° screen-azimuth** from the planet centre —
     * essentially straight above it. Mapped through `backdrop` below, that is bearing ~66°, elevation ~19°.
     *
     * The separation from the planet is a COMPOSITION choice, not a measurement: the crescent's thickness
     * implies a phase angle that is geometrically inconsistent with the planet's apparent size, which is
     * expected of an AI render and is not worth honouring. Only the azimuth is load-bearing.
     */
    starBearingDeg: number;
    starElevationDeg: number;
    backdrop: SkyBackdropConfig;
    stars: StarFieldConfig;
    starLight: StarLightConfig;
    environment: SkyEnvironmentConfig;
}

/**
 * The one sky, for now. Per-sector variants (board 06's six identities) are a future parameterisation of this
 * same shape — and on this path they are six bitmaps, which is a legitimate answer to it.
 */
export const DEEP_SPACE: SkyConfig = {
    name: 'Deep Space',
    // Well inside three's default far plane of 2000. The retired dome sat AT 2000 and was one `far` tweak away
    // from clipping; nothing is gained by the extra distance when the sky is camera-locked.
    radius: 1200,
    starBearingDeg: 66,
    starElevationDeg: 19,
    backdrop: {
        bearingDeg: 0,
        elevationDeg: 0,
        // The FLOOR, not the answer: 138.5° is the measured need (108° frame + 2·15.5° of strafe yaw, see
        // the header). Wider zooms the composition out and drifts the planet limb cornerward; narrower shows
        // void at the frame edge during a hard strafe. Frame it at the gate, not here.
        fovDeg: 140,
        edgeFadeDeg: 12,
        gain: 1,
    },
    stars: {
        enabled: true,
        // The jpg has its own stars baked in. These add parallax-free sparkle in the void the patch does not
        // cover; if they read as a second, disagreeing star field at the gate, turn them off.
        count: 2200,
        radius: 400,
        depth: 120,
        size: 10,
        saturation: 0,
        fade: true,
        twinkleSpeed: 0.3,
    },
    starLight: {
        intensity: 1.6,
        color: '#e8f0ff',
    },
    environment: {
        resolution: 128,
        keyIntensity: 3.2,
        keyColor: '#cfe0ff',
        keySizeDeg: 60,
        fillIntensity: 0.35,
        fillColor: '#20303f',
        ambientIntensity: 0.12,
        ambientColor: '#2a3646',
    },
};
