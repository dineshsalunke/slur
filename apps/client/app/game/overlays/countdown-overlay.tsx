import type { Room } from '@colyseus/sdk';
import type { RunState } from '@slur/shared';
import { useCountdown } from '../net/run-view-store';

export function CountdownOverlay( { room }: { room: Room< RunState > } ) {
    const n = useCountdown( room );
    return (
        <div className="pointer-events-none fixed inset-0 z-[25] grid place-items-center">
            <span className="font-mono text-[140px] font-black leading-none text-cyan text-shadow-count">
                { n > 0 ? n : 'GO' }
            </span>
        </div>
    );
}
