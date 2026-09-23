import {
    copySimShip,
    DEFAULT_SIM_CONFIG,
    FIXED_DT,
    type PlayerInput,
    type SimShip,
    simulate,
    type Track,
    tuningForShip,
} from '@slur/shared';
import { blockWorld, restoreConfirmed } from '../game/block-state';

interface Pending {
    seq: number;
    input: PlayerInput;
    sent: boolean;
}

export const copyShip = copySimShip;

export interface Predictor {
    record( input: PlayerInput ): void;
    drainUnsent(): PlayerInput[];
    reconcile( sim: SimShip, snapshot: SimShip & { lastProcessedInput: number; shipId: string }, track: Track ): void;
}

export function createPredictor(): Predictor {
    const pending: Pending[] = [];
    return {
        record( input ) {
            pending.push( { seq: input.seq, input, sent: false } );
        },
        drainUnsent() {
            const out: PlayerInput[] = [];
            for ( const p of pending ) {
                if ( ! p.sent ) {
                    p.sent = true;
                    out.push( p.input );
                }
            }
            return out;
        },
        reconcile( sim, snapshot, track ) {
            copyShip( sim, snapshot );
            const tuning = tuningForShip( snapshot.shipId );
            const ack = snapshot.lastProcessedInput;
            while ( pending.length > 0 && pending[ 0 ].seq <= ack ) pending.shift();
            restoreConfirmed();
            for ( const p of pending )
                simulate( sim, p.input, FIXED_DT, tuning, track, DEFAULT_SIM_CONFIG, blockWorld );
        },
    };
}
