import { type Client, Room } from '@colyseus/core';
import {
    COLOR_COUNT,
    COUNTDOWN_SECONDS,
    createFixedStep,
    FIXED_DT,
    INPUT_MESSAGE,
    type InputMessage,
    isColorId,
    isShipId,
    makeTrack,
    PHASE,
    type PlayerInput,
    PlayerState,
    RACE_GRACE_SECONDS,
    RESTART_MESSAGE,
    type RunMetadata,
    RunState,
    raceShouldEnd,
    resetPlayerForRace,
    SET_CLASS_MESSAGE,
    SET_COLOR_MESSAGE,
    START_MESSAGE,
    START_STAGGER,
    shouldSpectateOnJoin,
    simulate,
    type Track,
    tuningForShip,
} from '@slur/shared';

// How long a dropped client may reconnect before we evict them (office WiFi / lid-close is short).
const RECONNECT_SECONDS = 20;
// Per-player input backlog cap: drop oldest past this so a flooding/lagging client can't grow it
// unbounded (~2s at 60Hz). Steady state the queue holds ~1–3 inputs.
const MAX_QUEUED_INPUTS = 120;
// Max display-name length accepted from a joiner (defends the lobby list / standings against long strings).
const MAX_NAME = 16;

// Server authority for one networked run. Owns the 4-phase lifecycle (lobby → countdown → racing →
// finished; see @slur/shared PHASE) and runs the SHARED simulate() directly on each PlayerState schema
// instance (it structurally satisfies SimShip), so every physics mutation is a tracked delta flushed at
// patchRate. Clients send seq-numbered inputs; the server records lastProcessedInput for reconciliation.
// The room publishes { hostName, phase } via setMetadata → the built-in RegisteredHandler pushes it to
// the LobbyRoom (live room list) automatically; join/leave/dispose are auto-pushed too.
export class RunRoom extends Room< { state: RunState; metadata: RunMetadata } > {
    maxClients = 12;

    // Buffered per-player inputs, drained inside the fixed-step loop (never applied on the message clock).
    private queues = new Map< string, PlayerInput[] >();

    // Fixed-timestep accumulator (shared with the client) — advances server wall-time in whole FIXED_DT
    // ticks so physics is deterministic regardless of setSimulationInterval jitter.
    private advance = createFixedStep( FIXED_DT );

    // Authoritative track — generated ONCE from the room seed (same seed the client builds from). ONE seed
    // per room for S4: every round races the same track (per-round reseed is a deliberate later follow-up).
    private track!: Track;

    onCreate(): void {
        this.state = new RunState(); // phase defaults to lobby (0)
        this.state.seed = ( Math.random() * 0xffffffff ) >>> 0; // deterministic scenery + track seed, synced to clients
        this.track = makeTrack( this.state.seed );
        this.patchRate = 50; // 20Hz network flush (default) — decoupled from the 60Hz sim
        this.refreshMetadata();

        this.onMessage< InputMessage >( INPUT_MESSAGE, ( client, msg ) => {
            const q = this.queues.get( client.sessionId );
            if ( ! q || ! msg?.inputs?.length ) return;
            for ( const input of msg.inputs ) q.push( input );
            if ( q.length > MAX_QUEUED_INPUTS ) q.splice( 0, q.length - MAX_QUEUED_INPUTS ); // drop oldest
        } );

        // Ship + colour picks are LOBBY-ONLY: GO is the lock line. The server owns the change (never
        // client-authoritative) so the sim (both ends), camera, bank, and visuals re-resolve on the next tick.
        this.onMessage( SET_CLASS_MESSAGE, ( client, shipId ) => {
            if ( this.state.phase !== PHASE.lobby || ! isShipId( shipId ) ) return;
            const p = this.state.players.get( client.sessionId );
            if ( p ) p.shipId = shipId;
        } );
        this.onMessage( SET_COLOR_MESSAGE, ( client, colorId ) => {
            if ( this.state.phase !== PHASE.lobby || ! isColorId( colorId ) ) return;
            const p = this.state.players.get( client.sessionId );
            if ( p ) p.colorId = colorId;
        } );

        // Host-only lifecycle commands. START locks the field & begins the countdown; RESTART reopens the
        // lobby. Both are validated against hostId + the current phase — a non-host or wrong-phase send is a no-op.
        this.onMessage( START_MESSAGE, ( client ) => {
            if ( client.sessionId === this.state.hostId && this.state.phase === PHASE.lobby ) this.startRace();
        } );
        this.onMessage( RESTART_MESSAGE, ( client ) => {
            if ( client.sessionId === this.state.hostId && this.state.phase === PHASE.finished ) this.resetToLobby();
        } );

        // setSimulationInterval gives wall-clock ms; the accumulator converts it to fixed ticks.
        this.setSimulationInterval( ( deltaMs ) => {
            this.advance( deltaMs / 1000, ( dt ) => this.fixedStep( dt ) );
        } );
    }

    // One fixed tick, phase-gated. Countdown just bleeds the timer (NO ship motion); racing simulates only
    // racers and ends the round when the director says so; lobby/finished hold still.
    private fixedStep( dt: number ): void {
        switch ( this.state.phase ) {
            case PHASE.countdown: {
                this.state.countdown -= dt;
                if ( this.state.countdown <= 0 ) {
                    this.state.countdown = 0;
                    this.state.phase = PHASE.racing;
                    this.queues.forEach( ( q ) => {
                        q.length = 0;
                    } ); // drop anything queued during the freeze
                    this.refreshMetadata();
                }
                break;
            }
            case PHASE.racing:
                this.stepRace( dt );
                break;
            // lobby / finished: no simulation — ships hold position.
        }
    }

    // Advance every racer by exactly one sim step (one input each — the correctness invariant the client
    // replays against), stamp finish times, then ask the director whether the round is over.
    private stepRace( dt: number ): void {
        let racerCount = 0;
        let finishedCount = 0;
        this.state.players.forEach( ( player, sessionId ) => {
            if ( player.spectating ) return; // spectators are not part of this round
            racerCount++;
            if ( player.connected ) {
                const input = this.queues.get( sessionId )?.shift();
                if ( input ) {
                    simulate( player, input, dt, tuningForShip( player.shipId ), this.track );
                    player.lastProcessedInput = input.seq;
                }
            }
            if ( player.finished ) {
                if ( player.finishTime === 0 ) player.finishTime = this.state.elapsed; // stamp the tick it latches
                finishedCount++;
            }
        } );
        this.state.elapsed += dt;
        // First finisher opens the grace window; everyone else races against it.
        if ( finishedCount > 0 && this.state.finishDeadline === 0 ) {
            this.state.finishDeadline = this.state.elapsed + RACE_GRACE_SECONDS;
        }
        if (
            raceShouldEnd( {
                elapsed: this.state.elapsed,
                finishDeadline: this.state.finishDeadline,
                racerCount,
                finishedCount,
            } )
        ) {
            this.state.phase = PHASE.finished;
            this.refreshMetadata();
        }
    }

    // lobby → countdown: everyone present becomes a racer on the start line, the field locks, timer starts.
    private startRace(): void {
        let index = 0;
        this.state.players.forEach( ( p ) => {
            p.spectating = false;
            resetPlayerForRace( p, index++ );
        } );
        this.queues.forEach( ( q ) => {
            q.length = 0;
        } );
        this.state.elapsed = 0;
        this.state.finishDeadline = 0;
        this.state.countdown = COUNTDOWN_SECONDS;
        this.state.phase = PHASE.countdown;
        this.refreshMetadata();
    }

    // finished → lobby (host "Play Again"): reset the field, re-enlist spectators, reopen ship/colour picks.
    private resetToLobby(): void {
        let index = 0;
        this.state.players.forEach( ( p ) => {
            p.spectating = false; // waiting spectators join the next round
            resetPlayerForRace( p, index++ );
        } );
        this.state.elapsed = 0;
        this.state.finishDeadline = 0;
        this.state.countdown = 0;
        this.state.phase = PHASE.lobby;
        this.refreshMetadata();
    }

    onJoin( client: Client, options?: { name?: string } ): void {
        const p = new PlayerState();
        p.name = options?.name?.trim().slice( 0, MAX_NAME ) || 'Racer';
        p.colorId = this.state.players.size % COLOR_COUNT; // distinct-ish default; changeable in the lobby
        // Race join policy: only a LOBBY joiner races this round; anyone joining a locked field spectates
        // (see shouldSpectateOnJoin — the one place Survival/S7 will branch to drop-in-beside-pack).
        p.spectating = shouldSpectateOnJoin( this.state.phase );
        if ( ! p.spectating ) {
            // Lobby joiner → put them on the start line (staggered so they don't stack).
            p.x = this.state.players.size * START_STAGGER; // same lateral stagger as resetPlayerForRace
            p.lastSafeX = p.x;
        }
        this.state.players.set( client.sessionId, p );
        this.queues.set( client.sessionId, [] );
        if ( this.state.hostId === '' ) this.state.hostId = client.sessionId; // first joiner hosts
        this.refreshMetadata();
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
            this.reassignHost();
        }
    }

    onReconnect( client: Client ): void {
        const p = this.state.players.get( client.sessionId );
        if ( p ) p.connected = true;
    }

    // Consented leave (or after a reconnection window rejects). onDrop owns the abnormal-drop cleanup.
    onLeave( client: Client ): void {
        this.queues.delete( client.sessionId );
        this.state.players.delete( client.sessionId );
        this.reassignHost();
    }

    // If the host seat is now empty, pass authority to the next remaining player (or clear it if the room
    // is empty — it will autoDispose). Keeps a live GO/Play-Again button available to someone.
    private reassignHost(): void {
        if ( this.state.hostId && this.state.players.has( this.state.hostId ) ) return;
        this.state.hostId = ( this.state.players.keys().next().value as string | undefined ) ?? '';
        this.refreshMetadata();
    }

    // Publish the room-list row (host name + phase). setMetadata → RegisteredHandler → LobbyRoom delta.
    private refreshMetadata(): void {
        const host = this.state.hostId ? this.state.players.get( this.state.hostId ) : undefined;
        void this.setMetadata( { hostName: host?.name ?? '', phase: this.state.phase } );
    }
}
