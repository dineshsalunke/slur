import { useSyncExternalStore } from 'react';
import { seekBars, togglePlay, toggleRecord } from './recorder';
import { clockStore, setClick } from './tapper-clock';

const BTN = 'border border-line-2 px-3 py-1 disabled:opacity-40';

export function TransportBar() {
    const s = useSyncExternalStore( clockStore.subscribe, clockStore.get );
    const ready = s.status === 'ready' || s.status === 'playing';
    return (
        <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={ BTN } disabled={ ! ready } onClick={ () => seekBars( -1 ) }>
                ◀ bar
            </button>
            <button type="button" className={ BTN } disabled={ ! ready } onClick={ togglePlay }>
                { s.status === 'playing' ? 'Stop' : 'Play' }
            </button>
            <button type="button" className={ BTN } disabled={ ! ready } onClick={ () => seekBars( 1 ) }>
                bar ▶
            </button>
            <button type="button" className={ `${ BTN } text-threat` } disabled={ ! ready } onClick={ toggleRecord }>
                Record
            </button>
            <label className="flex items-center gap-1">
                <input type="checkbox" checked={ s.click } onChange={ ( e ) => setClick( e.target.checked ) } />
                click
            </label>
            <span className="text-dim">
                { s.status }
                { s.song ? ` · bars ${ s.fromBar }–${ s.toBar } · ${ s.rate }×` : '' }
            </span>
            { s.error && <span className="text-threat">{ s.error }</span> }
        </div>
    );
}
