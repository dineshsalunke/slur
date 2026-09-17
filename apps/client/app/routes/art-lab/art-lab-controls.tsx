import { SEG_LEN, TRACK_SEGMENTS } from '@slur/shared';
import { Fragment, useState } from 'react';
import { labCommands, labControls } from './lab-state';

// Jump targets down the Believer arrangement envelope (ADR-006). Percentages, not segment indices, so they
// keep meaning if TRACK_SEGMENTS is retuned. The bridge/breakdown valley at ~75% is the one worth having a
// shortcut to — it is the quietest stretch and the easiest place to misjudge the art as "empty".
const JUMPS: ReadonlyArray< { label: string; frac: number } > = [
    { label: 'start', frac: 0 },
    { label: 'build', frac: 0.25 },
    { label: 'chorus', frac: 0.45 },
    { label: 'valley', frac: 0.75 },
    { label: 'final', frac: 0.9 },
];

const BTN = 'rounded border border-white/15 px-2 py-1 font-mono text-[11px] transition-colors hover:bg-white/10';
const BTN_ON = 'border-amber-400/60 bg-amber-400/15 text-amber-200';
const BTN_OFF = 'text-white/60';

/**
 * DOM control chrome for the art lab. Tailwind only, never inside the Canvas (the styling convention is
 * explicit that Tailwind is DOM-UI-only).
 *
 * Toggles here write to `labControls`, a module singleton, NOT to React state — the rig consumes them every
 * frame and must never re-render the scene. The local `useState` mirrors exist only so these buttons can
 * paint their own on/off state; that re-render is scoped to this leaf and never reaches the Canvas
 * (non-negotiable #10 — subscribe at the leaf).
 */
export function ArtLabControls( {
    seed,
    onSeed,
    envIndex,
    onEnv,
    envNames,
    bloom,
    onBloom,
}: {
    seed: number;
    onSeed: ( seed: number ) => void;
    envIndex: number;
    onEnv: ( index: number ) => void;
    envNames: readonly string[];
    bloom: boolean;
    onBloom: ( on: boolean ) => void;
} ) {
    const [ paused, setPaused ] = useState( labControls.paused );
    const [ ghost, setGhost ] = useState( labControls.ghost );

    return (
        <div className="pointer-events-auto fixed top-4 left-4 z-10 w-64 rounded-lg border border-white/10 bg-black/75 p-3 font-mono text-[11px] text-white/80 backdrop-blur">
            <div className="mb-2 text-[12px] font-semibold tracking-wide text-amber-300">SLUR · ART LAB</div>

            <div className="mb-2 flex gap-1">
                <button
                    type="button"
                    className={ `${ BTN } ${ paused ? BTN_ON : BTN_OFF }` }
                    onClick={ () => {
                        labControls.paused = ! paused;
                        setPaused( ! paused );
                    } }
                >
                    { paused ? 'paused' : 'running' }
                </button>
                <button
                    type="button"
                    className={ `${ BTN } ${ ghost ? BTN_ON : BTN_OFF }` }
                    onClick={ () => {
                        labControls.ghost = ! ghost;
                        setGhost( ! ghost );
                    } }
                >
                    { ghost ? 'ghost' : 'fly' }
                </button>
                <button
                    type="button"
                    className={ `${ BTN } ${ bloom ? BTN_ON : BTN_OFF }` }
                    onClick={ () => onBloom( ! bloom ) }
                >
                    bloom
                </button>
            </div>

            <div className="mb-1 text-white/40">environment</div>
            <div className="mb-2 flex gap-1">
                { envNames.map( ( name, i ) => (
                    <button
                        key={ name }
                        type="button"
                        className={ `${ BTN } ${ i === envIndex ? BTN_ON : BTN_OFF }` }
                        onClick={ () => onEnv( i ) }
                    >
                        { String.fromCharCode( 65 + i ) }
                    </button>
                ) ) }
            </div>

            <div className="mb-1 text-white/40">jump to</div>
            <div className="mb-2 flex flex-wrap gap-1">
                { JUMPS.map( ( j ) => (
                    <button
                        key={ j.label }
                        type="button"
                        className={ `${ BTN } ${ BTN_OFF }` }
                        onClick={ () => {
                            labCommands.jumpToZ = j.frac * TRACK_SEGMENTS * SEG_LEN;
                        } }
                    >
                        { j.label }
                    </button>
                ) ) }
            </div>

            <div className="mb-1 text-white/40">seed</div>
            <div className="mb-2 flex gap-1">
                <input
                    type="number"
                    value={ seed }
                    onChange={ ( e ) => onSeed( Number( e.target.value ) || 0 ) }
                    className="w-full rounded border border-white/15 bg-black/50 px-2 py-1 font-mono text-[11px] text-white/80"
                />
                <button type="button" className={ `${ BTN } ${ BTN_OFF }` } onClick={ () => onSeed( seed + 1 ) }>
                    +1
                </button>
            </div>

            <div className="text-[10px] leading-relaxed text-white/35">
                <Fragment>W/S throttle · A/D strafe · Space jump</Fragment>
            </div>
        </div>
    );
}
