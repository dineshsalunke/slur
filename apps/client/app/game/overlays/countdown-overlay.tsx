import type { Room } from '@colyseus/sdk';
import type { RunState } from '@slur/shared';
import { useRunView } from '../net/use-run-view';

// Big centred countdown: ceil(seconds), or "GO" as it hits zero. Ships + picks are frozen the whole time
// (the server integrates nothing during countdown), so this is pure prep signalling. Owns its own
// subscription rather than taking the value as a prop, so the ticking clock re-renders this element and
// none of its siblings (non-negotiable #10).
export function CountdownOverlay( { room }: { room: Room< RunState > } ) {
    const n = Math.ceil( useRunView( room ).countdown );
    return (
        <div className="pointer-events-none fixed inset-0 z-[25] grid place-items-center">
            <span className="font-mono text-[140px] font-black leading-none text-cyan text-shadow-count">
                { n > 0 ? n : 'GO' }
            </span>
        </div>
    );
}
