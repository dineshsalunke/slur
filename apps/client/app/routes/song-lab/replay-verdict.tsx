import { FIXED_DT } from '@slur/shared';
import { useSyncExternalStore } from 'react';
import type { LabResult } from './lab-bundle';
import { formatResult } from './lab-view';
import { replayView } from './replay-state';
import { sameResult } from './replay-step';

export function ReplayVerdict( { recorded }: { recorded: LabResult | null } ) {
    const replayed = useSyncExternalStore( replayView.subscribe, () => replayView.get().replayed );
    if ( ! recorded ) return <p className="text-threat">no recorded run for this class</p>;
    if ( ! replayed ) return <p className="text-dim">replaying…</p>;
    const match = sameResult( recorded, replayed );
    return (
        <p className={ match ? 'text-fg' : 'text-threat' }>
            { match ? 'MATCH' : 'DIVERGED' } · replayed { formatResult( replayed, FIXED_DT ) }
        </p>
    );
}
