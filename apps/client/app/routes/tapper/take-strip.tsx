import { useSyncExternalStore } from 'react';
import { NoteLane } from './note-lane';
import { takesStore } from './takes-store';
import { clockStore } from './tapper-clock';

export function TakeStrip() {
    const clock = useSyncExternalStore( clockStore.subscribe, clockStore.get );
    const { takes, selected } = useSyncExternalStore( takesStore.subscribe, takesStore.get );
    const take = takes.find( ( t ) => t.id === selected );
    if ( ! clock.song ) return null;
    const span = { fromBar: clock.fromBar, toBar: clock.toBar, beatsPerBar: clock.song.beatsPerBar };
    return (
        <section className="mb-2">
            <h2 className="mb-1 text-dim">
                { take ? `Take #${ take.id }` : 'No take selected: Record starts a new one' }
            </h2>
            <NoteLane notes={ take?.notes ?? [] } span={ span } tone="text-marigold" />
        </section>
    );
}
