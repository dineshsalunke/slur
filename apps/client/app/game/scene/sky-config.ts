// The deep-space sky's tuning surface. What you SEE and what LIGHTS are deliberately two different sources:
// `nebula-backdrop.jpg` is the image the concept boards were composed over, and a small authored
// `<Lightformer>` rig does the lighting. Both read this one object, so they cannot drift apart.

const DEGREES_PER_RADIAN = 180 / Math.PI;

/**
 * Bearing/elevation → a unit world direction. Bearing 0 is the way the ship flies (+Z) and grows toward
 * SCREEN-right, which is world −X: right = up × back = (0,1,0) × (0,0,−1). Pinned by `sky-config.test.ts`.
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
 * A 16:9 framed composition covers a CONE, so the image rides an authored spherical PATCH — on a stock
 * sphere the default equirectangular UVs wrap it 360°×180° and smear the planet across the poles.
 * `sky-config.test.ts` derives the camera coverage this has to span, including yaw.
 */
export interface SkyBackdropConfig {
    /** Which way the image's CENTRE points. */
    bearingDeg: number;
    elevationDeg: number;
    /** Angular WIDTH in degrees of sky; height follows from the image's own aspect, never stretched. */
    fovDeg: number;
    /** Alpha fade at the patch border, in degrees, so the hard edge reads as "the nebula ends" rather than
     *  as a clipping bug. In game it sits outside the frame — this is for `/iso-sky`, which orbits freely. */
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
 * Its acceptance test is the roughness probe at `/iso-sky`: a `roughness 0.2` probe beside a `0.9` probe
 * must look DIFFERENT with the lab rig off. A sky dark enough to look right cannot itself light anything.
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
    /** Backdrop patch radius (u). Camera-locked, so this is pure containment and says nothing about how
     *  distant the sky reads. Must stay under R3F's far plane of 1000, not three's 2000 — `<Canvas
     *  camera={{ … }}>` overrides only the fields it names, and no Canvas here names `far`. */
    radius: number;
    /**
     * Where the star is, in `skyDirection`'s frame. The single source of truth for the light's direction —
     * the `DirectionalLight` and the `<Lightformer>` key both read it, so they cannot drift apart.
     *
     * MEASURED from the backdrop image's terminator, not chosen: the lit limb puts the star at 79°
     * screen-azimuth from the planet centre, which maps through `backdrop` to bearing 66°, elevation 19°.
     * The light has to agree with the image or the rock field is rim-lit from a direction the sky denies.
     */
    starBearingDeg: number;
    starElevationDeg: number;
    backdrop: SkyBackdropConfig;
    stars: StarFieldConfig;
    starLight: StarLightConfig;
    environment: SkyEnvironmentConfig;
}

export const DEEP_SPACE: SkyConfig = {
    name: 'Deep Space',
    // A camera-locked patch is equidistant, so the far plane clips on DEPTH — radius above it punches a
    // hole in frame centre, as 1200 did.
    radius: 800,
    starBearingDeg: 66,
    starElevationDeg: 19,
    backdrop: {
        bearingDeg: 0,
        elevationDeg: -2,
        // Owner framing. Full coverage needs 134.3°; 120 leaves ~11.6% of frame width black on the leading
        // edge under sustained max strafe only, pinned as ACCEPTED_EDGE_MARGIN in sky-config.test.ts.
        // Widening the star field cannot fill that margin — drei <Stars> lights 0.008% of its pixels.
        fovDeg: 120,
        edgeFadeDeg: 12,
        gain: 1,
    },
    stars: {
        enabled: true,
        // The jpg has its own stars baked in; these only fill the void the patch does not cover. Turn them
        // off if they read as a second, disagreeing star field.
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
