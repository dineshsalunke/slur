import { useSyncExternalStore } from 'react';
import { deleteTake, exportTakes, selectTake, takesStore, undo } from './takes-store';
import { clockStore } from './tapper-clock';

const BTN = 'border border-line-2 px-2 py-0.5';

function exportAll() {
    const song = clockStore.get().song;
    exportTakes( song ? { song: song.song, bpm: song.bpm, beatsPerBar: song.beatsPerBar } : null );
}

export function TakeList() {
    const { takes, selected } = useSyncExternalStore( takesStore.subscribe, takesStore.get );
    return (
        <section className="my-4 border border-line p-3">
            <div className="mb-2 flex gap-2">
                <button type="button" className={ BTN } onClick={ undo }>
                    Undo
                </button>
                <button type="button" className={ BTN } onClick={ () => selectTake( null ) }>
                    New take
                </button>
                <button type="button" className={ BTN } onClick={ exportAll }>
                    Export JSON
                </button>
            </div>
            <ul className="flex flex-col gap-1">
                { takes.map( ( t ) => (
                    <li
                        key={ t.id }
                        className={ `flex items-center gap-2 ${ t.id === selected ? 'text-marigold' : '' }` }
                    >
                        <button type="button" className={ BTN } onClick={ () => selectTake( t.id ) }>
                            #{ t.id }
                        </button>
                        <span>
                            bars { t.fromBar }–{ t.toBar } · { t.notes.length } notes
                            { t.base !== null ? ` · from #${ t.base }` : '' } · punches{ ' ' }
                            { t.punches.map( ( p ) => `${ p.fromBar }–${ p.toBar }@${ p.rate }×` ).join( ', ' ) }
                        </span>
                        <button type="button" className={ `${ BTN } text-dim` } onClick={ () => deleteTake( t.id ) }>
                            delete
                        </button>
                    </li>
                ) ) }
            </ul>
        </section>
    );
}
