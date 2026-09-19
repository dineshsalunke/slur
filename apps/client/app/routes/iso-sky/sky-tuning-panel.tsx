import { useState, useSyncExternalStore } from 'react';
import {
    resetSkyTuning,
    SKY_TUNING,
    type SkyTuningBool,
    type SkyTuningColour,
    type SkyTuningNumber,
    skyConfigSnippet,
    skyTuningVersion,
    subscribeSkyTuning,
    writeSkyTuning,
} from './sky-tuning';

interface Slider {
    key: SkyTuningNumber;
    label: string;
    min: number;
    max: number;
    step: number;
    hint: string;
}

/** Grouped by WHAT IT AFFECTS, and the two groups are deliberately not the same thing — the display sky and
 *  the lighting environment are separate sources, which is the entire pivot. */
const GROUPS: readonly { title: string; note: string; sliders: readonly Slider[] }[] = [
    {
        title: 'Backdrop — what you see',
        note: 'The reference image itself, hung on a spherical patch. It needs no grading: it IS the target the boards were composed over.',
        sliders: [
            {
                key: 'fovDeg',
                label: 'Field of view',
                min: 70,
                max: 200,
                step: 1,
                hint: 'Angular WIDTH of the image. The chase cam frame spans ~108° at top speed (vFOV 60→75 at 16:9), so below ~110 the void shows at the frame edge and above ~130 the composition zooms out and the planet limb drifts off-frame. Height follows the image aspect and is not authored.',
            },
            {
                key: 'backdropBearingDeg',
                label: 'Pan',
                min: -90,
                max: 90,
                step: 1,
                hint: 'Which way the image centre points. 0 = straight down the track. Positive swings it toward screen-right.',
            },
            {
                key: 'backdropElevationDeg',
                label: 'Tilt',
                min: -40,
                max: 40,
                step: 1,
                hint: 'Lifts or drops the composition. The chase cam is pitched 18-21° DOWN, so only the top ~10-20° of the frame is sky — tilt decides how much of the nebula band lands in it rather than behind the rock field.',
            },
            {
                key: 'edgeFadeDeg',
                label: 'Edge fade',
                min: 0,
                max: 40,
                step: 1,
                hint: 'Alpha falloff at the patch border, so the hard edge reads as "the nebula ends" rather than as clipping. In game the edge sits outside the frame; this is for the free orbit here.',
            },
            {
                key: 'gain',
                label: 'Gain',
                min: 0.2,
                max: 3,
                step: 0.05,
                hint: 'Multiplies the texture. Leave at 1 unless the scene around it forces a compromise — every step away from 1 is a step away from the reference.',
            },
        ],
    },
    {
        title: 'Star — where the light comes from',
        note: 'DERIVED FROM THE IMAGE, not chosen: the planet limb fits a circle at (1679,622) r719px, and its lit arc dies at a hard terminator at 169°, putting the star at 79° screen-azimuth from the planet centre. Shared by the directional light and the rig key.',
        sliders: [
            {
                key: 'starBearingDeg',
                label: 'Star bearing',
                min: -180,
                max: 180,
                step: 1,
                hint: '0 = straight down the track (+Z), growing toward SCREEN-RIGHT. Note the old convention was the opposite: 0 used to mean -Z, i.e. behind the player.',
            },
            {
                key: 'starElevationDeg',
                label: 'Star elevation',
                min: -30,
                max: 80,
                step: 1,
                hint: 'Height above the horizon. The derived pair is bearing 66 / elevation 19 — up and to the right, just off the planet.',
            },
            {
                key: 'lightIntensity',
                label: 'Light intensity',
                min: 0,
                max: 6,
                step: 0.05,
                hint: 'The one real DirectionalLight. It exists because a PMREM-convolved cubemap cannot hold a small hard highlight — the rig does the soft rim, this does the crisp one.',
            },
        ],
    },
    {
        title: 'Environment rig — what actually lights',
        note: 'Three Lightformers baked to a cubemap. This is what the roughness probes test: with the light off and this on, 0.2 and 0.9 must look DIFFERENT. The procedural sky never managed it.',
        sliders: [
            {
                key: 'keyIntensity',
                label: 'Key intensity',
                min: 0,
                max: 12,
                step: 0.1,
                hint: 'The cold rim card on the star bearing. Drives the far rock field’s lit edge.',
            },
            {
                key: 'keySizeDeg',
                label: 'Key size',
                min: 10,
                max: 140,
                step: 1,
                hint: 'Angular size of the key card. Small = a hard, nearly point-like rim; large = a soft wrap that loses the direction.',
            },
            {
                key: 'fillIntensity',
                label: 'Fill intensity',
                min: 0,
                max: 3,
                step: 0.05,
                hint: 'Opposite the key. Keeps unlit faces dark rather than pure black — a pure-black face reads as a hole, not as shadow.',
            },
            {
                key: 'ambientIntensity',
                label: 'Ambient wrap',
                min: 0,
                max: 2,
                step: 0.02,
                hint: 'A big dim ring overhead. The "there is a galaxy out there" term; without it the two cards read as a photography studio.',
            },
        ],
    },
];

const SWATCHES: readonly { key: SkyTuningColour; label: string }[] = [
    { key: 'lightColor', label: 'Star' },
    { key: 'keyColor', label: 'Key' },
    { key: 'fillColor', label: 'Fill' },
    { key: 'ambientColor', label: 'Ambient' },
];

/** The falsifiable self-test lives here, not in a comment: `envOn` off must FLATTEN the probes. */
const SWITCHES: readonly { key: SkyTuningBool; label: string; hint: string }[] = [
    {
        key: 'envOn',
        label: 'Env rig',
        hint: 'The Lightformer bake. Turn it OFF with the star light off too — the roughness probes must go flat. If they still differ, something else is lighting them and the test proves nothing.',
    },
    {
        key: 'lightOn',
        label: 'Star light',
        hint: 'The real DirectionalLight. Must be OFF while judging whether the environment lights anything — it lights the probes just as happily as the rig does.',
    },
    {
        key: 'starsOn',
        label: 'Stars',
        hint: 'The drei star field. The jpg has its own stars baked in, so turn these off if they read as a second, disagreeing field.',
    },
    {
        key: 'toneMapped',
        label: 'Tone map',
        hint: 'OFF shows the reference ungraded — and the definition of done is "it IS the reference". ON puts it in the same tonal world as everything else in frame. A genuine eye call; A/B it against the board overlay.',
    },
];

const BTN = 'rounded px-2 py-1 text-xs transition-colors';

/**
 * Live tuning for the sky, as a DOM sibling of `<IsoLab>` rather than fields on the shared `IsoLabControls` —
 * the shared instrument must not grow one ingredient's knobs, or every future `/iso-*` lane widens it again.
 *
 * Writes go through `writeSkyTuning`, which bumps the version the Canvas subscribes to. The panel subscribes to
 * the same store rather than keeping a private redraw counter, so panel and scene can never disagree about what
 * the current value is.
 */
export function SkyTuningPanel() {
    useSyncExternalStore( subscribeSkyTuning, skyTuningVersion, skyTuningVersion );
    const [ open, setOpen ] = useState( true );
    const [ copied, setCopied ] = useState( false );

    function write< K extends keyof typeof SKY_TUNING >( key: K, value: ( typeof SKY_TUNING )[ K ] ) {
        writeSkyTuning( key, value );
        setCopied( false );
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

            <div className="grid grid-cols-2 gap-1">
                { SWITCHES.map( ( s ) => (
                    <button
                        key={ s.key }
                        type="button"
                        title={ s.hint }
                        onClick={ () => write( s.key, ! SKY_TUNING[ s.key ] ) }
                        className={ `${ BTN } ${
                            SKY_TUNING[ s.key ] ? 'bg-[#F59A24] text-slate-950' : 'bg-slate-800 text-slate-400'
                        }` }
                    >
                        { s.label }
                    </button>
                ) ) }
            </div>

            <div className="grid grid-cols-4 gap-2">
                { SWATCHES.map( ( s ) => (
                    <label key={ s.key } className="block">
                        <span className="text-[10px] uppercase tracking-wider text-slate-500">{ s.label }</span>
                        <input
                            type="color"
                            value={ SKY_TUNING[ s.key ] }
                            onChange={ ( e ) => write( s.key, e.target.value ) }
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
                                onChange={ ( e ) => write( s.key, Number( e.target.value ) ) }
                                className="mt-1 w-full accent-[#F59A24]"
                            />
                        </label>
                    ) ) }
                </div>
            ) ) }

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
                    } }
                    className={ `bg-slate-800 ${ BTN }` }
                >
                    Reset
                </button>
            </div>
        </div>
    );
}
