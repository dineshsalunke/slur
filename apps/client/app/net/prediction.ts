import { DEFAULT_TUNING, FIXED_DT, type PlayerInput, type SimShip, simulate } from '@slur/shared';

// Client-side prediction + reconciliation for the LOCAL ship (Gambetta). The client predicts every
// input immediately via simulate() and keeps them in a pending list; when an authoritative snapshot
// arrives it snaps to server truth, drops acked inputs, and REPLAYS the rest — landing back at "now".
// Correct replay needs the FULL SimShip in the snapshot (incl. transient jump timers), which is why
// the schema syncs them.

interface Pending {
    seq: number;
    input: PlayerInput;
    sent: boolean; // batched sender marks these; unsent ones go out on the next tick
}

// Copy every SimShip field (server truth → local sim). Field-by-field so no schema-only extras leak in.
export function copyShip( dst: SimShip, src: SimShip ): void {
    dst.x = src.x;
    dst.y = src.y;
    dst.z = src.z;
    dst.vx = src.vx;
    dst.vy = src.vy;
    dst.vz = src.vz;
    dst.energy = src.energy;
    dst.grounded = src.grounded;
    dst.jumpsUsed = src.jumpsUsed;
    dst.jumpHeld = src.jumpHeld;
    dst.coyoteTimer = src.coyoteTimer;
    dst.bufferTimer = src.bufferTimer;
}

export interface Predictor {
    // Record a predicted input (a VALUE COPY — keyboard.ts reuses one object).
    record( input: PlayerInput ): void;
    // Inputs not yet sent; marks them sent. Fed to the batched room.send().
    drainUnsent(): PlayerInput[];
    // Reconcile local Sim against an authoritative snapshot: snap → drop acked → replay pending.
    reconcile( sim: SimShip, snapshot: SimShip & { lastProcessedInput: number } ): void;
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
        reconcile( sim, snapshot ) {
            copyShip( sim, snapshot ); // snap to authoritative truth
            const ack = snapshot.lastProcessedInput;
            while ( pending.length > 0 && pending[ 0 ].seq <= ack ) pending.shift(); // drop acked
            for ( const p of pending ) simulate( sim, p.input, FIXED_DT, DEFAULT_TUNING ); // replay the rest
        },
    };
}
