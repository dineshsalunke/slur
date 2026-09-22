import { fromUser } from './from-user';
import { type ColorKey, col, colorSpec, setCol } from './tunables';
import { useTunableVersion } from './use-tunables';

export function TuningColor( { tunable }: { tunable: ColorKey } ) {
    useTunableVersion();
    const spec = colorSpec( tunable );
    const value = col( tunable );

    return (
        <label className="flex items-center gap-2 py-0.5 text-[11px] leading-none">
            <span className="w-24 shrink-0 truncate text-neutral-400">{ spec.label }</span>
            <input
                type="color"
                autoComplete="off"
                className="h-5 min-w-0 flex-1 rounded border border-neutral-700 bg-neutral-900"
                value={ value }
                onChange={ ( e ) => {
                    if ( fromUser( e.currentTarget ) ) setCol( tunable, e.currentTarget.value );
                } }
            />
            <span className="w-14 shrink-0 text-right text-neutral-500 tabular-nums">{ value }</span>
        </label>
    );
}
