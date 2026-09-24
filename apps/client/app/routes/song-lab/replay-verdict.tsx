import { useSyncExternalStore } from 'react';
import { type LabResult, sameResult } from '../../../song-lab/bundle';
import { formatResult } from './lab-view';
import { replayView } from './replay-state';

export function ReplayVerdict( { recorded }: { recorded: LabResult | null } ) {
    const replayed = useSyncExternalStore( replayView.subscribe, () => replayView.get().replayed );
    if ( ! recorded ) return <p className="text-threat">no recorded run for this class</p>;
    if ( ! replayed ) return <p className="text-dim">live replay running…</p>;
    const match = sameResult( replayed, recorded );
    return (
        <p className={ match ? 'text-fg' : 'text-threat' }>
            live { match ? 'MATCH' : 'DIVERGED' } · { formatResult( replayed ) }
        </p>
    );
}
