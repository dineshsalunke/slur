import { type FormEvent, useSyncExternalStore } from 'react';
import { clockStore, setLoop } from './tapper-clock';

function submit( e: FormEvent< HTMLFormElement > ) {
    e.preventDefault();
    const fd = new FormData( e.currentTarget );
    setLoop( Number( fd.get( 'from' ) ), Number( fd.get( 'to' ) ) );
}

export function LoopForm() {
    const s = useSyncExternalStore( clockStore.subscribe, clockStore.get );
    if ( ! s.song ) return null;
    return (
        <form
            key={ `${ s.loopFrom }-${ s.loopTo }` }
            onSubmit={ submit }
            className="mb-3 flex flex-wrap items-center gap-2"
        >
            loop bars
            <input name="from" type="number" defaultValue={ s.loopFrom } className="w-16 bg-deep px-2 py-1" />–
            <input name="to" type="number" defaultValue={ s.loopTo } className="w-16 bg-deep px-2 py-1" />
            <button type="submit" className="border border-line-2 px-3 py-1">
                Set loop
            </button>
            <button
                type="button"
                className="border border-line-2 px-3 py-1"
                onClick={ () => setLoop( s.fromBar, s.toBar ) }
            >
                Whole section
            </button>
            <span className="text-dim">Record punches in over the loop range onto the selected take.</span>
        </form>
    );
}
