import { useSyncExternalStore } from 'react';
import { NoteLane } from './note-lane';
import { recStore } from './recorder';
import { clockStore } from './tapper-clock';

export function LiveNotes() {
    const rec = useSyncExternalStore( recStore.subscribe, recStore.get );
    const clock = useSyncExternalStore( clockStore.subscribe, clockStore.get );
    if ( ! clock.song || rec.mode === 'off' ) return null;
    const span = { fromBar: clock.fromBar, toBar: clock.toBar, beatsPerBar: clock.song.beatsPerBar };
    return (
        <section className="mb-2">
            <h2 className="mb-1 text-threat">
                Recording bars { clock.loopFrom }–{ clock.loopTo }
            </h2>
            <NoteLane notes={ rec.live } span={ span } tone="text-cyan" />
        </section>
    );
}
