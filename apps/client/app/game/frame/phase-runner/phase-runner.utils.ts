import type { RootState } from '@react-three/fiber';
import { recordPhaseTime, recordSystemTime } from '../frame-timing.state';
import type { FramePhase, FrameSystem } from '../schedule';

export function runPhase< C >( systems: readonly FrameSystem< C >[], ctx: C, state: RootState, delta: number ): void {
    for ( const s of systems ) s.run( ctx, state, delta );
}

export function runPhaseTimed< C >(
    phase: FramePhase,
    systems: readonly FrameSystem< C >[],
    ctx: C,
    state: RootState,
    delta: number,
): void {
    const start = performance.now();
    let mark = start;
    for ( const s of systems ) {
        s.run( ctx, state, delta );
        const now = performance.now();
        recordSystemTime( s.id, now - mark );
        mark = now;
    }
    recordPhaseTime( phase, mark - start );
}
