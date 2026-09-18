import { useReducer, useState } from 'react';
import { resetSkyTuning, SKY_TUNING, type SkyTuningColour, type SkyTuningNumber, skyConfigSnippet } from './sky-tuning';

interface Slider {
    key: SkyTuningNumber;
    label: string;
    min: number;
    max: number;
    step: number;
    hint: string;
}

/** Grouped by LAYER, because the point of the panel is to judge one layer at a time: each group's "off" switch
 *  is called out in its own hints, so a layer can be removed without hunting for which slider does it. */
const GROUPS: readonly { title: string; note: string; sliders: readonly Slider[] }[] = [
    {
        title: 'Mask — where there is nebula at all',
        note: 'Multiplies density, so it only ever carves voids. Threshold 0 = layer off.',
        sliders: [
            {
                key: 'maskFeatureSizeDeg',
                label: 'Mask feature size',
                min: 40,
                max: 160,
                step: 1,
                hint: 'Size of the band/void structure. Measured: above ~120 the field is too compressed to threshold (p50 0.289, max 0.497) and the mask stops doing anything.',
            },
            {
                key: 'maskThreshold',
                label: 'Mask threshold',
                min: 0,
                max: 0.7,
                step: 0.01,
                hint: 'Below this the sky is void whatever the emission layer says. Field runs p25 0.327 / p50 0.424 / p90 0.609. Set to 0 to switch the mask off.',
            },
            {
                key: 'maskSoftness',
                label: 'Mask softness',
                min: 0.02,
                max: 0.6,
                step: 0.01,
                hint: 'Void→band falloff width. Narrow puts a visible hard edge across open sky.',
            },
        ],
    },
    {
        title: 'Emission — the cloud itself',
        note: 'Tuned to the GATE-1 histogram, not by eye. Threshold = coverage; Core onset = peak contrast. Move both — coverage alone goes milky.',
        sliders: [
            {
                key: 'featureSizeDeg',
                label: 'Feature size',
                min: 6,
                max: 90,
                step: 1,
                hint: 'Degrees of sky per wisp. Judge against the FOV — above ~60 one wisp fills the frame and the cloud flattens to a gradient.',
            },
            {
                key: 'warp',
                label: 'Warp',
                min: 0,
                max: 1.5,
                step: 0.01,
                hint: 'Domain-warp amplitude. Subtle or the field degenerates from cohesive wisps into a torrid mess.',
            },
            {
                key: 'ridge',
                label: 'Ridge',
                min: 0,
                max: 1,
                step: 0.01,
                hint: 'Smooth blobs (0) → bright filaments on dark cloud (1). Moving this changes the value distribution, so retune Threshold with it.',
            },
            {
                key: 'threshold',
                label: 'Threshold',
                min: 0.1,
                max: 0.92,
                step: 0.01,
                hint: 'Where cloud begins. At ridge 1 the field runs p50 0.52 / p90 0.75 / p99 0.86, so filaments want the p80s. At ridge 0 use 0.40-0.55.',
            },
            {
                key: 'softness',
                label: 'Softness',
                min: 0.02,
                max: 0.5,
                step: 0.01,
                hint: 'Width of the ramp from void to full cloud. Narrow goes BINARY — every visible pixel pinned to the top ramp stop. Wide gives a dim base with rare bright ridges.',
            },
            {
                key: 'coreOnset',
                label: 'Core onset',
                min: 0.4,
                max: 0.99,
                step: 0.01,
                hint: 'Density at which the ramp climbs to the HOT top stop. This is the peak-contrast dial, independent of coverage: low = milky haze (the >48/>80/>120 histogram bands collapse together), high = rare hot cores over dark cloud, which is the reference.',
            },
            {
                key: 'opacity',
                label: 'Opacity',
                min: 0,
                max: 1,
                step: 0.01,
                hint: 'Cloud coverage over the base gradient.',
            },
        ],
    },
    {
        title: 'Light — where the star is',
        note: 'One bearing, shared with slice 2’s celestial body and directional light. Contrast 0 = layer off.',
        sliders: [
            {
                key: 'starBearingDeg',
                label: 'Star bearing',
                min: 0,
                max: 360,
                step: 1,
                hint: 'Compass bearing of the star. 0 = straight ahead (-Z), increasing toward +X.',
            },
            {
                key: 'starElevationDeg',
                label: 'Star elevation',
                min: -30,
                max: 80,
                step: 1,
                hint: 'Height of the star above the horizon.',
            },
            {
                key: 'lightContrast',
                label: 'Light contrast',
                min: 0,
                max: 1,
                step: 0.01,
                hint: 'How much brighter the cloud gets toward the star. 0 leaves the cloud lit only by `ridge`, which brightens every crease equally regardless of where the light is.',
            },
        ],
    },
    {
        title: 'Dust — what blocks the light',
        note: 'Subtractive (exp(-k·dust)), so clumps silhouette against the cloud. Strength 0 = layer off.',
        sliders: [
            {
                key: 'dustFeatureSizeDeg',
                label: 'Dust feature size',
                min: 8,
                max: 70,
                step: 1,
                hint: 'Size of a dust clump. Coarser than the emission filaments or the dust reads as grain over them rather than as something in front.',
            },
            {
                key: 'dustThreshold',
                label: 'Dust threshold',
                min: 0.2,
                max: 0.9,
                step: 0.01,
                hint: 'Where dust begins. Measured at 25°/3 octaves: p50 0.505 / p90 0.655 / p99 0.761, so 0.55 covers roughly a fifth of the sky.',
            },
            {
                key: 'dustSoftness',
                label: 'Dust softness',
                min: 0.02,
                max: 0.5,
                step: 0.01,
                hint: 'Clump edge width. Dust is blobby, not filamentary — keep this soft.',
            },
            {
                key: 'dustStrength',
                label: 'Dust strength',
                min: 0,
                max: 4,
                step: 0.05,
                hint: 'Extinction coefficient. Transmission at a full clump is exp(-strength): 1.6 leaves ~20% of the light. 0 switches dust off.',
            },
        ],
    },
    {
        title: 'Output',
        note: '',
        sliders: [
            {
                key: 'gain',
                label: 'Gain',
                min: 0.2,
                max: 6,
                step: 0.1,
                hint: 'Content intensity. Slice 3 bakes brighter than it displays.',
            },
        ],
    },
];

const SWATCHES: readonly { key: SkyTuningColour; label: string }[] = [
    { key: 'zenith', label: 'Zenith' },
    { key: 'horizon', label: 'Horizon' },
    { key: 'nadir', label: 'Nadir' },
    { key: 'ramp0', label: 'Cloud lo' },
    { key: 'ramp1', label: 'Cloud mid' },
    { key: 'ramp2', label: 'Cloud hi' },
];

const BTN = 'rounded px-2 py-1 text-xs transition-colors';

/**
 * Live tuning for the sky, as a DOM sibling of `<IsoLab>` rather than fields on the shared `IsoLabControls` —
 * the shared instrument must not grow one ingredient's knobs, or every future `/iso-*` lane widens it again.
 *
 * Writes go straight to the `SKY_TUNING` singleton; the local counter exists only so the inputs redraw with
 * their own values. Nothing here is a parent of the Canvas, so a drag reconciles no 3D at all.
 */
export function SkyTuningPanel() {
    const [ , redraw ] = useReducer( ( n: number ) => n + 1, 0 );
    const [ open, setOpen ] = useState( true );
    const [ copied, setCopied ] = useState( false );

    function writeNumber( key: SkyTuningNumber, value: number ) {
        SKY_TUNING[ key ] = value;
        setCopied( false );
        redraw();
    }

    function writeColour( key: SkyTuningColour, value: string ) {
        SKY_TUNING[ key ] = value;
        setCopied( false );
        redraw();
    }

    if ( ! open ) {
        return (
            <button
                type="button"
                onClick={ () => setOpen( true ) }
                className={ `absolute top-3 right-3 z-40 bg-slate-900/90 text-slate-200 ${ BTN }` }
            >
                ▸ Sky tuning
            </button>
        );
    }

    return (
        <div className="absolute top-3 right-3 z-40 max-h-[calc(100vh-1.5rem)] w-80 space-y-3 overflow-y-auto rounded-lg bg-slate-950/90 p-3 text-slate-200 ring-1 ring-slate-700">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold tracking-wide">Sky tuning</h2>
                <button type="button" onClick={ () => setOpen( false ) } className={ `bg-slate-800 ${ BTN }` }>
                    ▾ hide
                </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
                { SWATCHES.map( ( s ) => (
                    <label key={ s.key } className="block">
                        <span className="text-[10px] uppercase tracking-wider text-slate-500">{ s.label }</span>
                        <input
                            type="color"
                            value={ SKY_TUNING[ s.key ] }
                            onChange={ ( e ) => writeColour( s.key, e.target.value ) }
                            className="mt-1 h-6 w-full cursor-pointer rounded bg-slate-800"
                        />
                    </label>
                ) ) }
            </div>

            { GROUPS.map( ( g ) => (
                <div key={ g.title } className="space-y-2 border-t border-slate-800 pt-2">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#F59A24]">{ g.title }</h3>
                    { g.note ? <p className="text-[10px] leading-snug text-slate-500">{ g.note }</p> : null }
                    { g.sliders.map( ( s ) => (
                        <label key={ s.key } className="block" title={ s.hint }>
                            <span className="text-[11px] uppercase tracking-wider text-slate-500">
                                { s.label } · <span className="text-slate-200">{ SKY_TUNING[ s.key ] }</span>
                            </span>
                            <input
                                type="range"
                                min={ s.min }
                                max={ s.max }
                                step={ s.step }
                                value={ SKY_TUNING[ s.key ] }
                                onChange={ ( e ) => writeNumber( s.key, Number( e.target.value ) ) }
                                className="mt-1 w-full accent-[#F59A24]"
                            />
                        </label>
                    ) ) }
                </div>
            ) ) }

            <label
                className="block"
                title="A #define, so moving this recompiles the shader. Low on purpose — more octaves read as grain, not cloud."
            >
                <span className="text-[11px] uppercase tracking-wider text-slate-500">
                    Octaves · <span className="text-slate-200">{ SKY_TUNING.octaves }</span>
                </span>
                <input
                    type="range"
                    min={ 1 }
                    max={ 6 }
                    step={ 1 }
                    value={ SKY_TUNING.octaves }
                    onChange={ ( e ) => writeNumber( 'octaves', Number( e.target.value ) ) }
                    className="mt-1 w-full accent-[#F59A24]"
                />
            </label>

            <div className="flex gap-2 pt-1">
                <button
                    type="button"
                    title="Copy these values as a paste-ready sky-config.ts fragment."
                    onClick={ () => {
                        void navigator.clipboard.writeText( skyConfigSnippet() ).then( () => setCopied( true ) );
                    } }
                    className={ `${ BTN } ${ copied ? 'bg-[#F59A24] text-slate-950' : 'bg-slate-800' }` }
                >
                    { copied ? 'Copied ✓' : 'Copy config' }
                </button>
                <button
                    type="button"
                    title="Back to the committed DEEP_SPACE values."
                    onClick={ () => {
                        resetSkyTuning();
                        setCopied( false );
                        redraw();
                    } }
                    className={ `bg-slate-800 ${ BTN }` }
                >
                    Reset
                </button>
            </div>
        </div>
    );
}
