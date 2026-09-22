import { fromUser } from './from-user';
import { type NumberKey, num, numberSpec, setNum } from './tunables';
import { useTunableVersion } from './use-tunables';

export function TuningNumber( { tunable }: { tunable: NumberKey } ) {
    useTunableVersion();
    const spec = numberSpec( tunable );
    const value = num( tunable );
    const accept = ( e: React.ChangeEvent< HTMLInputElement > ) => {
        if ( fromUser( e.currentTarget ) ) setNum( tunable, e.currentTarget.valueAsNumber );
    };

    return (
        <label className="flex items-center gap-2 py-0.5 text-[11px] leading-none">
            <span className="w-24 shrink-0 truncate text-neutral-400">{ spec.label }</span>
            <input
                type="range"
                autoComplete="off"
                className="h-1 min-w-0 flex-1 accent-amber-400"
                min={ spec.min }
                max={ spec.max }
                step={ spec.step }
                value={ value }
                onChange={ accept }
            />
            <input
                type="number"
                autoComplete="off"
                className="w-14 shrink-0 rounded border border-neutral-700 bg-neutral-900 px-1 py-0.5 text-right text-neutral-200 tabular-nums"
                min={ spec.min }
                max={ spec.max }
                step={ spec.step }
                value={ value }
                onChange={ accept }
            />
        </label>
    );
}
