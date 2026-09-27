import { clockOf } from './flight-recorder.utils';
import { useRecorder } from './use-recorder';

export function RecIndicator() {
    const recording = useRecorder( ( v ) => v.recording );
    const seconds = useRecorder( ( v ) => v.seconds );
    if ( ! recording ) return null;
    return (
        <div className="pointer-events-none fixed top-4 right-4 z-30 flex items-center gap-2 border border-threat bg-deep/80 px-3 py-2 font-mono text-[13px] uppercase tracking-[0.2em] text-threat select-none">
            <span className="size-2 animate-pulse rounded-full bg-threat" />
            Rec { clockOf( seconds ) }
        </div>
    );
}
