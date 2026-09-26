import type { ReactNode } from 'react';
import { useRoom } from '../../net/room-context/use-room';
import { useRunPhase } from '../net/run-view-store';

export function PhaseGate( { phases, children }: { phases: readonly number[]; children: ReactNode } ) {
    const phase = useRunPhase( useRoom() );
    return phases.includes( phase ) ? children : null;
}
