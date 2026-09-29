import { useFrame } from '@react-three/fiber';
import { FRAME_PHASE } from '../frame-phase.constants';
import type { FramePhase, FrameSystem } from '../schedule';
import { runPhase, runPhaseTimed } from './phase-runner.utils';

export function PhaseRunner< C >( {
    phase,
    systems,
    context,
}: {
    phase: FramePhase;
    systems: readonly FrameSystem< C >[];
    context: C;
} ) {
    useFrame( ( state, delta ) => {
        if ( import.meta.env.DEV ) runPhaseTimed( phase, systems, context, state, delta );
        else runPhase( systems, context, state, delta );
    }, FRAME_PHASE[ phase ] );
    return null;
}
