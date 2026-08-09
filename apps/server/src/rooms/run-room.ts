import { type Client, Room } from '@colyseus/core';
import {
    createFixedStep,
    FIXED_DT,
    INPUT_MESSAGE,
    type InputMessage,
    isShipId,
    makeTrack,
    type PlayerInput,
    PlayerState,
    RunState,
    SET_CLASS_MESSAGE,
    simulate,
    type Track,
    tuningForShip,
} from '@slur/shared';

// How long a dropped client may reconnect before we evict them (office WiFi / lid-close is short).
const RECONNECT_SECONDS = 20;
// Per-player input backlog cap: drop oldest past this so a flooding/lagging client can't grow it
// unbounded (~2s at 60Hz). Steady state the queue holds ~1–3 inputs.
const MAX_QUEUED_INPUTS = 120;

// Server authority for one networked run. Runs the SHARED simulate() directly on each PlayerState
// schema instance (it structurally satisfies SimShip), so every physics mutation is a tracked delta
// flushed at patchRate. Clients send seq-numbered inputs; the server records lastProcessedInput so
// each client can reconcile (drop acked inputs, replay the rest).
export class RunRoom extends Room< { state: RunState } > {
    maxClients = 12;

    // Buffered per-player inputs, drained inside the fixed-step loop (never applied on the message
    // clock — keeps all mutation on one clock, avoids torn deltas). Keyed by sessionId.
    private queues = new Map< string, PlayerInput[] >();

    // Fixed-timestep accumulator (shared with the client) — advances server wall-time in whole
    // FIXED_DT ticks so physics is deterministic regardless of setSimulationInterval jitter.
    private advance = createFixedStep( FIXED_DT );

    // The authoritative track — generated ONCE from the room seed (same seed the client builds from),
    // so server collision and client prediction resolve on identical geometry. Not schema (never synced
    // tile-by-tile); it's a pure function of state.seed, which IS synced.
    private track!: Track;

    onCreate(): void {
        this.state = new RunState();
        this.state.seed = ( Math.random() * 0xffffffff ) >>> 0; // deterministic scenery + track seed, synced to every client
        this.track = makeTrack( this.state.seed );
        this.patchRate = 50; // 20Hz network flush (default) — decoupled from the 60Hz sim

        this.onMessage< InputMessage >( INPUT_MESSAGE, ( client, msg ) => {
            const q = this.queues.get( client.sessionId );
            if ( ! q || ! msg?.inputs?.length ) return;
            for ( const input of msg.inputs ) q.push( input );
            if ( q.length > MAX_QUEUED_INPUTS ) q.splice( 0, q.length - MAX_QUEUED_INPUTS ); // drop oldest
        } );

        // Dev class hot-swap: the client asks for a ship; the SERVER validates + owns the change (never
        // client-authoritative). The new shipId patches to every client, so the sim (both ends), camera,
        // bank, and model all re-resolve tuning/visuals from ship-classes.ts on the next tick.
        this.onMessage( SET_CLASS_MESSAGE, ( client, shipId ) => {
            if ( ! isShipId( shipId ) ) return;
            const p = this.state.players.get( client.sessionId );
            if ( p ) p.shipId = shipId;
        } );

        // setSimulationInterval gives wall-clock ms; the accumulator converts it to fixed ticks.
        this.setSimulationInterval( ( deltaMs ) => {
            this.advance( deltaMs / 1000, ( dt ) => this.fixedStep( dt ) );
        } );
    }

    // One fixed tick: drain ONE buffered input per player and advance them by exactly one sim step.
    // One simulate() per input is the correctness invariant — the client predicts + replays the same
    // way, so authority and prediction never diverge. Input production (60Hz) ≈ this fixed rate, so
    // the queue stays balanced; jitter is absorbed by the buffer.
    private fixedStep( dt: number ): void {
        this.state.players.forEach( ( player, sessionId ) => {
            if ( ! player.connected ) return; // frozen while dropped (reconnection window open)
            const q = this.queues.get( sessionId );
            const input = q?.shift();
            if ( ! input ) return; // no queued input this tick → ship holds; the input will arrive & step next tick
            simulate( player, input, dt, tuningForShip( player.shipId ), this.track );
            player.lastProcessedInput = input.seq;
            // Stamp the authoritative finish time the tick `finished` first latches (S4 owns standings).
            if ( player.finished && player.finishTime === 0 ) player.finishTime = this.state.elapsed;
        } );
        this.state.elapsed += dt;
    }

    onJoin( client: Client ): void {
        const p = new PlayerState();
        // Staggered spawn so joiners don't materialise on top of the pack (server-chosen, never client).
        p.x = this.state.players.size * 4;
        p.z = 0;
        p.lastSafeX = p.x; // spawn is in the start-safe zone → it's the first respawn anchor
        p.lastSafeZ = p.z;
        this.state.players.set( client.sessionId, p );
        this.queues.set( client.sessionId, [] );
    }

    // Abnormal disconnect: hold the seat open for a reconnection window; ghost the ship meanwhile.
    async onDrop( client: Client ): Promise< void > {
        const p = this.state.players.get( client.sessionId );
        if ( p ) p.connected = false;
        try {
            await this.allowReconnection( client, RECONNECT_SECONDS );
            if ( p ) p.connected = true;
        } catch {
            this.state.players.delete( client.sessionId );
            this.queues.delete( client.sessionId );
        }
    }

    onReconnect( client: Client ): void {
        const p = this.state.players.get( client.sessionId );
        if ( p ) p.connected = true;
    }

    // Consented leave (or after a reconnection window rejects). onDrop owns the abnormal-drop cleanup,
    // so guard against double-cleanup here.
    onLeave( client: Client ): void {
        this.queues.delete( client.sessionId );
        this.state.players.delete( client.sessionId );
    }
}
