import { type DebugTuningKey, setDebugTuning } from './debug-tuning';

export function DebugSlider( {
    label,
    tuningKey,
    value,
    min,
    max,
    step,
    note,
}: {
    label: string;
    tuningKey: DebugTuningKey;
    value: number;
    min: number;
    max: number;
    step: number;
    note?: string;
} ) {
    return (
        <label className="mb-1 block">
            <span className="flex items-baseline justify-between text-white/55">
                <span>
                    { label }
                    { note ? <span className="ml-1 text-amber-300/70">{ note }</span> : null }
                </span>
                <span className="text-amber-200">{ Number( value.toFixed( 3 ) ) }</span>
            </span>
            <input
                type="range"
                min={ min }
                max={ max }
                step={ step }
                value={ value }
                onChange={ ( e ) => setDebugTuning( tuningKey, Number( e.target.value ) ) }
                className="h-1 w-full cursor-pointer appearance-none rounded bg-white/15 accent-amber-400"
            />
        </label>
    );
}
