import type { RunRoomLike } from '../../net/run-room-like';
import { useCountdown } from '../net/run-view-store';

export function CountdownOverlay( { room }: { room: RunRoomLike } ) {
    const n = useCountdown( room );
    return (
        <div className="pointer-events-none fixed inset-0 z-[25] grid place-items-center">
            <span className="font-mono text-[140px] font-black leading-none text-cyan text-shadow-count">
                { n > 0 ? n : 'GO' }
            </span>
        </div>
    );
}
