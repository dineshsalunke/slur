import { DEEP_SPACE, type SkyConfig } from '../../game/scene/sky-config';

/** The live edit buffer. Every knob the cheap-path sky exposes, flat, so the panel needs no nesting. */
export interface SkyTuning {
    /** Where the image's centre points, and how wide it is hung. */
    backdropBearingDeg: number;
    backdropElevationDeg: number;
    fovDeg: number;
    edgeFadeDeg: number;
    /** Multiplies the sampled texture. 1 = the reference untouched, which is the point of shipping it. */
    gain: number;
    /** Shared by the `DirectionalLight` and the `<Lightformer>` key — they cannot disagree about the light. */
    starBearingDeg: number;
    starElevationDeg: number;
    lightIntensity: number;
    lightColor: string;
    keyIntensity: number;
    keySizeDeg: number;
    keyColor: string;
    fillIntensity: number;
    fillColor: string;
    ambientIntensity: number;
    ambientColor: string;
    /** False renders the reference ungraded; true puts it in the same tonal world as the rest of the frame. */
    toneMapped: boolean;
    starsOn: boolean;
    /** THE GATE'S INSTRUMENT. Switch both off and the roughness probes must go flat; switch `envOn` back on
     *  alone and they must differentiate. That is the whole acceptance test for task 1, and it only means
     *  anything if the light can be removed. */
    lightOn: boolean;
    envOn: boolean;
}

export type SkyTuningNumber = { [ K in keyof SkyTuning ]: SkyTuning[ K ] extends number ? K : never }[
    keyof SkyTuning
];
export type SkyTuningColour = { [ K in keyof SkyTuning ]: SkyTuning[ K ] extends string ? K : never }[
    keyof SkyTuning
];
export type SkyTuningBool = { [ K in keyof SkyTuning ]: SkyTuning[ K ] extends boolean ? K : never }[ keyof SkyTuning ];

/** One source for both the initial values and Reset — listing the fields twice loses a knob every time one
 *  is added, and a knob missing from Reset fails silently as "Reset didn't reset". */
function committed(): SkyTuning {
    const b = DEEP_SPACE.backdrop;
    const e = DEEP_SPACE.environment;
    return {
        backdropBearingDeg: b.bearingDeg,
        backdropElevationDeg: b.elevationDeg,
        fovDeg: b.fovDeg,
        edgeFadeDeg: b.edgeFadeDeg,
        gain: b.gain,
        starBearingDeg: DEEP_SPACE.starBearingDeg,
        starElevationDeg: DEEP_SPACE.starElevationDeg,
        lightIntensity: DEEP_SPACE.starLight.intensity,
        lightColor: DEEP_SPACE.starLight.color,
        keyIntensity: e.keyIntensity,
        keySizeDeg: e.keySizeDeg,
        keyColor: e.keyColor,
        fillIntensity: e.fillIntensity,
        fillColor: e.fillColor,
        ambientIntensity: e.ambientIntensity,
        ambientColor: e.ambientColor,
        toneMapped: true,
        starsOn: DEEP_SPACE.stars.enabled,
        lightOn: true,
        envOn: true,
    };
}

/**
 * A MODULE SINGLETON plus a version counter, read through `useSyncExternalStore`.
 *
 * ⚠ THIS REVERSES THE PROCEDURAL PATH'S DESIGN, deliberately. That version wrote slider values straight into
 * shader uniforms inside `useFrame`, costing zero React renders, and its own comment rejected
 * `useSyncExternalStore` as "one render per tick — better, but still per-tick". That was right while the sky
 * was a shader. It is wrong now: the cheap-path sky has NO uniforms. Its knobs are geometry arguments and
 * `<Lightformer>` transforms, and the only channel to those is props. One render per change is therefore the
 * FLOOR, not a compromise — so the job becomes keeping that render cheap, which `tunedSkyConfig`'s split
 * memoisation does by keeping a backdrop drag from re-baking the environment cubemap.
 *
 * Lab-only. Nothing in the game reads it; the shipped sky reads `DEEP_SPACE` directly.
 */
export const SKY_TUNING: SkyTuning = committed();

let version = 0;
const listeners = new Set< () => void >();

export function subscribeSkyTuning( fn: () => void ): () => void {
    listeners.add( fn );
    return () => listeners.delete( fn );
}

export function skyTuningVersion(): number {
    return version;
}

/** The only write path. Bumping the version here rather than at each call site is what stops a new knob from
 *  silently not updating the scene. */
export function writeSkyTuning< K extends keyof SkyTuning >( key: K, value: SkyTuning[ K ] ): void {
    if ( key === 'backdropBearingDeg' ) {
        // PAN CARRIES THE STAR WITH IT. `starBearingDeg` was measured THROUGH this mapping (limb fit →
        // terminator → 79° screen-azimuth → bearing 66°), so it names a point in the image, not in the world.
        // Pan the image without it and the DirectionalLight plus the rig key keep aiming where the star used
        // to be — rocks rim-lit from one side while the picture implies another. Kept here, in the one write
        // path, because a panel is free to forget and this is not.
        SKY_TUNING.starBearingDeg += ( value as number ) - SKY_TUNING.backdropBearingDeg;
    }
    SKY_TUNING[ key ] = value;
    version++;
    for ( const fn of listeners ) fn();
}

/** Restore every knob to the committed `DEEP_SPACE` values — the "what did I actually change" escape hatch.
 *  Mutates in place: consumers hold a reference to the singleton, so reassigning it would orphan them. */
export function resetSkyTuning(): void {
    Object.assign( SKY_TUNING, committed() );
    version++;
    for ( const fn of listeners ) fn();
}

/** The tuning buffer as a real `SkyConfig`, so the lab renders the SHIPPED component and not a lab copy. */
export function tunedSkyConfig(): SkyConfig {
    const t = SKY_TUNING;
    return {
        ...DEEP_SPACE,
        starBearingDeg: t.starBearingDeg,
        starElevationDeg: t.starElevationDeg,
        backdrop: {
            bearingDeg: t.backdropBearingDeg,
            elevationDeg: t.backdropElevationDeg,
            fovDeg: t.fovDeg,
            edgeFadeDeg: t.edgeFadeDeg,
            gain: t.gain,
        },
        stars: { ...DEEP_SPACE.stars, enabled: t.starsOn },
        starLight: { intensity: t.lightIntensity, color: t.lightColor },
        environment: {
            ...DEEP_SPACE.environment,
            keyIntensity: t.keyIntensity,
            keySizeDeg: t.keySizeDeg,
            keyColor: t.keyColor,
            fillIntensity: t.fillIntensity,
            fillColor: t.fillColor,
            ambientIntensity: t.ambientIntensity,
            ambientColor: t.ambientColor,
        },
    };
}

/**
 * The tuned state as a paste-ready `sky-config.ts` fragment. Without this the loop ends at "it looks right on
 * my screen" and the numbers have to be transcribed by hand from a dozen sliders.
 */
export function skyConfigSnippet(): string {
    const t = SKY_TUNING;
    return [
        `    starBearingDeg: ${ t.starBearingDeg },`,
        `    starElevationDeg: ${ t.starElevationDeg },`,
        '    backdrop: {',
        `        bearingDeg: ${ t.backdropBearingDeg },`,
        `        elevationDeg: ${ t.backdropElevationDeg },`,
        `        fovDeg: ${ t.fovDeg },`,
        `        edgeFadeDeg: ${ t.edgeFadeDeg },`,
        `        gain: ${ t.gain },`,
        '    },',
        `    starLight: { intensity: ${ t.lightIntensity }, color: '${ t.lightColor }' },`,
        '    environment: {',
        `        resolution: ${ DEEP_SPACE.environment.resolution },`,
        `        keyIntensity: ${ t.keyIntensity },`,
        `        keyColor: '${ t.keyColor }',`,
        `        keySizeDeg: ${ t.keySizeDeg },`,
        `        fillIntensity: ${ t.fillIntensity },`,
        `        fillColor: '${ t.fillColor }',`,
        `        ambientIntensity: ${ t.ambientIntensity },`,
        `        ambientColor: '${ t.ambientColor }',`,
        '    },',
        `    // stars.enabled: ${ t.starsOn } · backdrop toneMapped: ${ t.toneMapped }`,
    ].join( '\n' );
}
