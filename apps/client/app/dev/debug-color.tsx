import { type DebugTuningColorKey, setDebugTuningColor } from './debug-tuning';

export function DebugColor( {
    label,
    tuningKey,
    value,
    note,
}: {
    label: string;
    tuningKey: DebugTuningColorKey;
    value: string;
    note?: string;
} ) {
    return (
        <label className="mb-1 block">
            <span className="flex items-baseline justify-between text-white/55">
                <span>
                    { label }
                    { note ? <span className="ml-1 text-amber-300/70">{ note }</span> : null }
                </span>
                <span className="text-amber-200">{ value }</span>
            </span>
            <input
                type="color"
                value={ value }
                onChange={ ( e ) => setDebugTuningColor( tuningKey, e.target.value ) }
                className="h-5 w-full cursor-pointer rounded border border-white/15 bg-transparent"
            />
        </label>
    );
}
