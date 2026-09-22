import { fromUser } from './from-user';
import { type ChoiceKey, choice, choiceSpec, setChoice } from './tunables';
import { useTunableVersion } from './use-tunables';

export function TuningChoice( { tunable }: { tunable: ChoiceKey } ) {
    useTunableVersion();
    const spec = choiceSpec( tunable );

    return (
        <label className="flex items-center gap-2 py-0.5 text-[11px] leading-none">
            <span className="w-24 shrink-0 truncate text-neutral-400">{ spec.label }</span>
            <select
                autoComplete="off"
                className="min-w-0 flex-1 rounded border border-neutral-700 bg-neutral-900 px-1 py-0.5 text-neutral-200"
                value={ choice( tunable ) }
                onChange={ ( e ) => {
                    if ( fromUser( e.currentTarget ) ) setChoice( tunable, e.currentTarget.value );
                } }
            >
                { spec.options.map( ( option ) => (
                    <option key={ option } value={ option }>
                        { option }
                    </option>
                ) ) }
            </select>
        </label>
    );
}
