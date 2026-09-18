import { DEEP_SPACE } from '../../game/scene/sky-config';

/** The live edit buffer: every `SkyConfig` knob the dome shader can retune without a recompile, plus octaves. */
export interface SkyTuning {
    zenith: string;
    horizon: string;
    nadir: string;
    ramp0: string;
    ramp1: string;
    ramp2: string;
    featureSizeDeg: number;
    warp: number;
    ridge: number;
    threshold: number;
    softness: number;
    opacity: number;
    /** A #define, so changing it recompiles the shader rather than writing a uniform. */
    octaves: number;
    /** The display-vs-bake content intensity. Slice 3 bakes at a higher value than it displays at. */
    gain: number;
    maskFeatureSizeDeg: number;
    maskThreshold: number;
    /** Set this to 0 with maskThreshold 0 to switch the mask layer off and judge the others alone. */
    maskSoftness: number;
    dustFeatureSizeDeg: number;
    dustThreshold: number;
    dustSoftness: number;
    /** 0 switches the dust layer off entirely — `exp(0) == 1`. */
    dustStrength: number;
    starBearingDeg: number;
    starElevationDeg: number;
    /** 0 switches the light layer off — the cloud goes back to being lit only by `ridge`. */
    lightContrast: number;
    /** Density at which the ramp starts climbing to the hot top stop. High = rare cores = long bright tail. */
    coreOnset: number;
}

/** The knobs that are numbers, and the knobs that are hex colours — so the panel needs no casts to write them. */
export type SkyTuningNumber = { [ K in keyof SkyTuning ]: SkyTuning[ K ] extends number ? K : never }[
    keyof SkyTuning
];
export type SkyTuningColour = { [ K in keyof SkyTuning ]: SkyTuning[ K ] extends string ? K : never }[
    keyof SkyTuning
];

/**
 * A MODULE SINGLETON, deliberately, not React state.
 *
 * These values are read PER FRAME inside `useFrame`, and a slider drag fires ~60 times a second — as React
 * state each tick would reconcile the whole scene subtree. `iso-lab.tsx` documents the same split from the
 * other side: its overlay controls ARE React state precisely because nothing reads them per frame. `/art-lab`
 * and `/art-gallery` use singletons for the same reason this one does.
 *
 * Lab-only. Nothing in the game reads it; the shipped sky reads `DEEP_SPACE` directly.
 */
/** One source for both the initial values and Reset — listing the fields twice loses a knob every time one
 *  is added, and a knob missing from Reset fails silently as "Reset didn't reset". */
function committed(): SkyTuning {
    const n = DEEP_SPACE.nebula;
    return {
        zenith: DEEP_SPACE.gradient.zenith,
        horizon: DEEP_SPACE.gradient.horizon,
        nadir: DEEP_SPACE.gradient.nadir,
        ramp0: n.ramp[ 0 ],
        ramp1: n.ramp[ 1 ],
        ramp2: n.ramp[ 2 ],
        featureSizeDeg: n.featureSizeDeg,
        warp: n.warp,
        ridge: n.ridge,
        threshold: n.threshold,
        softness: n.softness,
        opacity: n.opacity,
        octaves: n.octaves,
        gain: 1,
        maskFeatureSizeDeg: n.mask.featureSizeDeg,
        maskThreshold: n.mask.threshold,
        maskSoftness: n.mask.softness,
        dustFeatureSizeDeg: n.dust.featureSizeDeg,
        dustThreshold: n.dust.threshold,
        dustSoftness: n.dust.softness,
        dustStrength: n.dust.strength,
        starBearingDeg: DEEP_SPACE.starBearingDeg,
        starElevationDeg: DEEP_SPACE.starElevationDeg,
        lightContrast: n.lightContrast,
        coreOnset: n.coreOnset,
    };
}

export const SKY_TUNING: SkyTuning = committed();

/** Restore every knob to the committed `DEEP_SPACE` values — the "what did I actually change" escape hatch.
 *  Mutates in place: consumers hold a reference to the singleton, so reassigning it would orphan them. */
export function resetSkyTuning(): void {
    Object.assign( SKY_TUNING, committed() );
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
        '    gradient: {',
        `        zenith: '${ t.zenith }',`,
        `        horizon: '${ t.horizon }',`,
        `        nadir: '${ t.nadir }',`,
        '    },',
        '    nebula: {',
        `        ramp: [ '${ t.ramp0 }', '${ t.ramp1 }', '${ t.ramp2 }' ],`,
        `        coreOnset: ${ t.coreOnset },`,
        `        mask: { featureSizeDeg: ${ t.maskFeatureSizeDeg }, threshold: ${ t.maskThreshold }, ` +
            `softness: ${ t.maskSoftness } },`,
        `        dust: { featureSizeDeg: ${ t.dustFeatureSizeDeg }, threshold: ${ t.dustThreshold }, ` +
            `softness: ${ t.dustSoftness }, strength: ${ t.dustStrength } },`,
        `        lightContrast: ${ t.lightContrast },`,
        `        octaves: ${ t.octaves },`,
        `        featureSizeDeg: ${ t.featureSizeDeg },`,
        `        warp: ${ t.warp },`,
        `        ridge: ${ t.ridge },`,
        `        threshold: ${ t.threshold },`,
        `        softness: ${ t.softness },`,
        `        opacity: ${ t.opacity },`,
        '    },',
    ].join( '\n' );
}
