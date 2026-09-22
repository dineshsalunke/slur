import { useSyncExternalStore } from 'react';
import { cpuFrameMs, frameRate, subscribeFrameMeter, worstFrameMs } from './frame-meter';

export function FpsReadout() {
    const fps = useSyncExternalStore( subscribeFrameMeter, frameRate, frameRate );
    const worst = useSyncExternalStore( subscribeFrameMeter, worstFrameMs, worstFrameMs );
    const cpu = useSyncExternalStore( subscribeFrameMeter, cpuFrameMs, cpuFrameMs );
    const tone = fps >= 55 ? 'text-neutral-400' : fps >= 40 ? 'text-amber-400' : 'text-red-400';

    return (
        <span className={ `tabular-nums ${ tone }` }>
            { fps } fps · cpu { cpu } · max { worst }
        </span>
    );
}
