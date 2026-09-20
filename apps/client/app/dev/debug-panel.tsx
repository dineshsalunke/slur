import { useState } from 'react';
import { DebugColor } from './debug-color';
import { DebugSlider } from './debug-slider';
import { debugTuningSource, pitchDeg, resetDebugTuning, shipBelowAxisDeg, useDebugTuning } from './debug-tuning';
import { DebugVariant } from './debug-variant';

const BTN = 'rounded border border-white/15 px-2 py-1 font-mono text-[11px] transition-colors hover:bg-white/10';

/**
 * The one live tuning panel for the deck's brightness and the chase framing, mounted by the game and by
 * every lab so a value dialled in one is the value the other renders.
 */
export function DebugPanel() {
    const tuning = useDebugTuning();
    const [ open, setOpen ] = useState( true );
    const [ copied, setCopied ] = useState( '' );

    const belowAxis = shipBelowAxisDeg( tuning );
    const halfFov = tuning.camFov / 2;
    const safe = belowAxis <= halfFov;

    const copy = () => {
        const text = debugTuningSource( tuning );
        navigator.clipboard.writeText( text ).then(
            () => setCopied( 'copied' ),
            () => {
                console.log( text );
                setCopied( 'in console' );
            },
        );
    };

    if ( ! open ) {
        return (
            <button
                type="button"
                className={ `pointer-events-auto fixed top-4 right-4 z-20 bg-black/75 ${ BTN } text-white/60` }
                onClick={ () => setOpen( true ) }
            >
                tuning
            </button>
        );
    }

    return (
        <div className="pointer-events-auto fixed top-4 right-4 z-20 max-h-[92vh] w-64 overflow-y-auto rounded-lg border border-white/10 bg-black/80 p-3 font-mono text-[11px] text-white/80 backdrop-blur">
            <div className="mb-2 flex items-center justify-between">
                <span className="text-[12px] font-semibold tracking-wide text-amber-300">TUNING</span>
                <button type="button" className={ `${ BTN } text-white/50` } onClick={ () => setOpen( false ) }>
                    hide
                </button>
            </div>

            <div className="mb-1 text-white/40">bloom</div>
            <DebugSlider
                label="intensity"
                tuningKey="bloomIntensity"
                value={ tuning.bloomIntensity }
                min={ 0 }
                max={ 4 }
                step={ 0.05 }
            />
            <DebugSlider
                label="threshold"
                tuningKey="bloomThreshold"
                value={ tuning.bloomThreshold }
                min={ 0 }
                max={ 1 }
                step={ 0.01 }
            />
            <DebugSlider
                label="smoothing"
                tuningKey="bloomSmoothing"
                value={ tuning.bloomSmoothing }
                min={ 0 }
                max={ 1 }
                step={ 0.01 }
            />
            <DebugSlider
                label="radius"
                tuningKey="bloomRadius"
                value={ tuning.bloomRadius }
                min={ 0 }
                max={ 1 }
                step={ 0.02 }
                note="remounts"
            />
            <DebugSlider
                label="levels"
                tuningKey="bloomLevels"
                value={ tuning.bloomLevels }
                min={ 1 }
                max={ 9 }
                step={ 1 }
                note="remounts"
            />

            <div className="mt-2 mb-1 text-white/40">deck</div>
            <DebugSlider
                label="emissive"
                tuningKey="floorEmissiveIntensity"
                value={ tuning.floorEmissiveIntensity }
                min={ 0 }
                max={ 1 }
                step={ 0.005 }
            />
            <DebugColor label="emissive col" tuningKey="floorEmissive" value={ tuning.floorEmissive } />

            <div className="mt-2 mb-1 text-white/40">boundary shape</div>
            <DebugVariant value={ tuning.boundaryVariant } />

            <div className="mt-2 mb-1 text-white/40">marigold reference</div>
            <DebugSlider
                label="boundary"
                tuningKey="marigoldReference"
                value={ tuning.marigoldReference }
                min={ 0 }
                max={ 8 }
                step={ 0.05 }
                note="pre-bloom"
            />
            <DebugSlider
                label="width"
                tuningKey="boundaryWidth"
                value={ tuning.boundaryWidth }
                min={ 0.25 }
                max={ 4 }
                step={ 0.25 }
                note="on release"
                commitOnly
            />
            <DebugSlider
                label="wrap"
                tuningKey="boundaryWrap"
                value={ tuning.boundaryWrap }
                min={ 0.25 }
                max={ 4 }
                step={ 0.25 }
                note="on release"
                commitOnly
            />

            { /* Kept for other subjects, not for this frame: each was measured to move nothing on the deck
                (envMap 0→2, ambient 1→0), because the deck is lit by its own emissive. */ }
            <div className="mt-2 mb-1 text-white/40">surfaces</div>
            <DebugSlider
                label="floor envMap"
                tuningKey="floorEnvMapIntensity"
                value={ tuning.floorEnvMapIntensity }
                min={ 0 }
                max={ 2 }
                step={ 0.05 }
                note="inert here"
            />
            <DebugSlider
                label="ambient"
                tuningKey="ambientIntensity"
                value={ tuning.ambientIntensity }
                min={ 0 }
                max={ 2 }
                step={ 0.05 }
                note="inert here"
            />

            <div className="mt-2 mb-1 text-white/40">chase camera</div>
            <DebugSlider
                label="height"
                tuningKey="camHeight"
                value={ tuning.camHeight }
                min={ 4 }
                max={ 20 }
                step={ 0.5 }
                note="ADR-011 pins 7.5"
            />
            <DebugSlider label="back" tuningKey="camBack" value={ tuning.camBack } min={ 4 } max={ 30 } step={ 0.5 } />
            <DebugSlider
                label="lookAhead"
                tuningKey="camLookAhead"
                value={ tuning.camLookAhead }
                min={ 0 }
                max={ 40 }
                step={ 0.5 }
            />
            <DebugSlider
                label="lookAtLift"
                tuningKey="camLookAtLift"
                value={ tuning.camLookAtLift }
                min={ 0 }
                max={ 12 }
                step={ 0.5 }
            />
            <DebugSlider label="fov" tuningKey="camFov" value={ tuning.camFov } min={ 40 } max={ 100 } step={ 1 } />

            <div className="mb-2 text-[10px] leading-relaxed text-white/45">
                pitch { pitchDeg( tuning ).toFixed( 1 ) }° · ship{ ' ' }
                <span className={ safe ? 'text-amber-200' : 'text-red-400' }>{ belowAxis.toFixed( 1 ) }°</span> below
                axis · half-FOV { halfFov.toFixed( 0 ) }°
                <br />
                { safe ? 'in frame' : 'OFF THE BOTTOM EDGE' }
            </div>

            <div className="flex gap-1">
                <button type="button" className={ `${ BTN } text-amber-200` } onClick={ copy }>
                    copy values
                </button>
                <button
                    type="button"
                    className={ `${ BTN } text-white/50` }
                    onClick={ () => {
                        resetDebugTuning();
                        setCopied( '' );
                    } }
                >
                    reset
                </button>
                <span className="self-center text-[10px] text-white/40">{ copied }</span>
            </div>
        </div>
    );
}
