import { useState } from 'react';
import { type DebugTuningKey, setDebugTuning } from './debug-tuning';

export function DebugSlider( {
    label,
    tuningKey,
    value,
    min,
    max,
    step,
    note,
    commitOnly = false,
}: {
    label: string;
    tuningKey: DebugTuningKey;
    value: number;
    min: number;
    max: number;
    step: number;
    note?: string;
    commitOnly?: boolean;
} ) {
    const [ dragged, setDragged ] = useState< number | null >( null );
    const shown = dragged ?? value;

    const commit = () => {
        if ( dragged === null ) return;
        setDragged( null );
        setDebugTuning( tuningKey, dragged );
    };

    return (
        <label className="mb-1 block">
            <span className="flex items-baseline justify-between text-white/55">
                <span>
                    { label }
                    { note ? <span className="ml-1 text-amber-300/70">{ note }</span> : null }
                </span>
                <span className={ dragged === null ? 'text-amber-200' : 'text-amber-400' }>
                    { Number( shown.toFixed( 3 ) ) }
                </span>
            </span>
            <input
                type="range"
                min={ min }
                max={ max }
                step={ step }
                value={ shown }
                onChange={ ( e ) =>
                    commitOnly
                        ? setDragged( Number( e.target.value ) )
                        : setDebugTuning( tuningKey, Number( e.target.value ) )
                }
                onPointerUp={ commitOnly ? commit : undefined }
                onKeyUp={ commitOnly ? commit : undefined }
                onBlur={ commitOnly ? commit : undefined }
                className="h-1 w-full cursor-pointer appearance-none rounded bg-white/15 accent-amber-400"
            />
        </label>
    );
}
