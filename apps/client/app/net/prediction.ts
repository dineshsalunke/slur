import {
    copySimShip,
    FIXED_DT,
    type PlayerInput,
    type SimShip,
    simulate,
    type Track,
    tuningForShip,
} from '@slur/shared';

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

// Snap the local sim to authoritative server truth. Thin alias over the shared, EXHAUSTIVE copier
// (copySimShip iterates SIM_SHIP_KEYS), so a new SimShip field can no longer silently miss the replay
// path — the exact bug that mispredicts derezz/respawn. Copies only SimShip fields; schema-only extras
// (finishTime, netcode bookkeeping) never leak into the local sim.
export const copyShip = copySimShip;

export interface Predictor {
    // Record a predicted input (a VALUE COPY — keyboard.ts reuses one object).
    record( input: PlayerInput ): void;
    // Inputs not yet sent; marks them sent. Fed to the batched room.send().
    drainUnsent(): PlayerInput[];
    // Reconcile local Sim against an authoritative snapshot: snap → drop acked → replay pending.
    // Replays through the SAME track AND the SAME per-ship tuning the server used (resolved from the
    // snapshot's authoritative shipId), so predicted death/finish/flight reconcile exactly.
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
            copyShip( sim, snapshot ); // snap to authoritative truth
            const tuning = tuningForShip( snapshot.shipId ); // authoritative class → identical replay math
            const ack = snapshot.lastProcessedInput;
            while ( pending.length > 0 && pending[ 0 ].seq <= ack ) pending.shift(); // drop acked
            for ( const p of pending ) simulate( sim, p.input, FIXED_DT, tuning, track ); // replay the rest
        },
    };
}
