import { useState } from 'react';
import { DebugSlider } from './debug-slider';
import { debugTuningSource, resetDebugTuning, useDebugTuning } from './debug-tuning';

const BTN = 'rounded border border-white/15 px-2 py-1 font-mono text-[11px] transition-colors hover:bg-white/10';

export function DebugPanel() {
    const tuning = useDebugTuning();
    const [ open, setOpen ] = useState( true );
    const [ copied, setCopied ] = useState( '' );

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

            <div className="mb-1 text-white/40">monoliths</div>
            <DebugSlider
                label="height"
                tuningKey="monolithHeight"
                value={ tuning.monolithHeight }
                min={ 12 }
                max={ 400 }
                step={ 2 }
            />
            <DebugSlider
                label="width"
                tuningKey="monolithWidth"
                value={ tuning.monolithWidth }
                min={ 2 }
                max={ 40 }
                step={ 0.5 }
            />
            <DebugSlider
                label="depth"
                tuningKey="monolithDepth"
                value={ tuning.monolithDepth }
                min={ 2 }
                max={ 40 }
                step={ 0.5 }
            />
            <DebugSlider
                label="gap outboard of rail"
                tuningKey="monolithGap"
                value={ tuning.monolithGap }
                min={ 0 }
                max={ 40 }
                step={ 0.5 }
            />
            <DebugSlider
                label="extends below deck"
                tuningKey="monolithBelow"
                value={ tuning.monolithBelow }
                min={ 0 }
                max={ 300 }
                step={ 5 }
            />
            <DebugSlider
                label="spacing calm"
                tuningKey="monolithSpacingCalm"
                value={ tuning.monolithSpacingCalm }
                min={ 8 }
                max={ 400 }
                step={ 2 }
            />
            <DebugSlider
                label="spacing intense"
                tuningKey="monolithSpacingIntense"
                value={ tuning.monolithSpacingIntense }
                min={ 8 }
                max={ 400 }
                step={ 2 }
            />
            <DebugSlider
                label="seam"
                tuningKey="monolithSeam"
                value={ tuning.monolithSeam }
                min={ 0 }
                max={ 4 }
                step={ 0.05 }
            />

            <div className="mt-3 flex gap-1">
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
