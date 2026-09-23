import { type Client, Room } from '@colyseus/core';
import {
    aimBolt,
    applyDescriptor,
    COLOR_COUNT,
    COUNTDOWN_SECONDS,
    canFire,
    createFixedStep,
    createSimWorld,
    DEFAULT_SIM_CONFIG,
    FIXED_DT,
    HeldPower,
    hitShipsOf,
    INPUT_MESSAGE,
    type InputMessage,
    isColorId,
    isShipId,
    PHASE,
    type Pickup,
    type PlayerInput,
    PlayerState,
    Projectile,
    pickupsOf,
    procgenDescriptor,
    RACE_GRACE_SECONDS,
    RESTART_MESSAGE,
    type RunMetadata,
    RunState,
    raceShouldEnd,
    resetPlayerForRace,
    resolveTrack,
    SET_CLASS_MESSAGE,
    SET_COLOR_MESSAGE,
    type SimConfig,
    type SimWorld,
    START_MESSAGE,
    START_STAGGER,
    shouldSpectateOnJoin,
    simulate,
    stepBolts,
    stepPickups,
    stunDurationForShip,
    type Track,
    tuningForShip,
    USE_POWERUP_MESSAGE,
} from '@slur/shared';

const RECONNECT_SECONDS = 20;
const MAX_QUEUED_INPUTS = 120;
const MAX_NAME = 16;

export class RunRoom extends Room< { state: RunState; metadata: RunMetadata } > {
    maxClients = 12;

    private queues = new Map< string, PlayerInput[] >();

    private advance = createFixedStep( FIXED_DT );

    private track!: Track;

    private blocks: SimWorld = createSimWorld();

    private pickups: Pickup[] = [];
    private pickupRespawn = new Map< string, number >();
    private nextProjectileId = 0;

    private config: SimConfig = DEFAULT_SIM_CONFIG;

    onCreate(): void {
        this.state = new RunState();
        const descriptor = procgenDescriptor( ( Math.random() * 0xffffffff ) >>> 0 );
        applyDescriptor( this.state.descriptor, descriptor );
        this.track = resolveTrack( descriptor );
        this.pickups = pickupsOf( this.track );
        this.patchRate = 50;
        this.refreshMetadata();

        this.onMessage< InputMessage >( INPUT_MESSAGE, ( client, msg ) => {
            const q = this.queues.get( client.sessionId );
            if ( ! q || ! msg?.inputs?.length ) return;
            for ( const input of msg.inputs ) q.push( input );
            if ( q.length > MAX_QUEUED_INPUTS ) q.splice( 0, q.length - MAX_QUEUED_INPUTS );
        } );

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

        this.onMessage( START_MESSAGE, ( client ) => {
            if ( client.sessionId === this.state.hostId && this.state.phase === PHASE.lobby ) this.startRace();
        } );
        this.onMessage( RESTART_MESSAGE, ( client ) => {
            if ( client.sessionId === this.state.hostId && this.state.phase === PHASE.finished ) this.resetToLobby();
        } );

        this.onMessage( USE_POWERUP_MESSAGE, ( client ) => {
            if ( this.state.phase !== PHASE.racing ) return;
            const p = this.state.players.get( client.sessionId );
            if ( ! p || ! canFire( p ) ) return;
            const bolt = new Projectile();
            aimBolt( bolt, p, client.sessionId, this.config );
            this.state.projectiles.set( String( this.nextProjectileId++ ), bolt );
            p.heldPower = HeldPower.none;
        } );

        this.setSimulationInterval( ( deltaMs ) => {
            this.advance( deltaMs / 1000, ( dt ) => this.fixedStep( dt ) );
        } );
    }

    private fixedStep( dt: number ): void {
        switch ( this.state.phase ) {
            case PHASE.countdown: {
                this.state.countdown -= dt;
                if ( this.state.countdown <= 0 ) {
                    this.state.countdown = 0;
                    this.state.phase = PHASE.racing;
                    this.queues.forEach( ( q ) => {
                        q.length = 0;
                    } );
                    this.refreshMetadata();
                }
                break;
            }
            case PHASE.racing:
                this.stepRace( dt );
                this.stepWorld( dt );
                break;
        }
    }

    private stepRace( dt: number ): void {
        let racerCount = 0;
        let finishedCount = 0;
        this.state.players.forEach( ( player, sessionId ) => {
            if ( player.spectating ) return;
            racerCount++;
            if ( player.connected ) {
                const input = this.queues.get( sessionId )?.shift();
                if ( input ) {
                    simulate( player, input, dt, tuningForShip( player.shipId ), this.track, this.config, this.blocks );
                    player.lastProcessedInput = input.seq;
                }
            }
            if ( player.finished ) {
                if ( player.finishTime === 0 ) player.finishTime = this.state.elapsed;
                finishedCount++;
            }
        } );
        this.state.elapsed += dt;
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

    private stepWorld( dt: number ): void {
        const ships = hitShipsOf( this.state.players.entries() );
        stepBolts(
            this.state.projectiles,
            ships,
            this.track,
            this.blocks.broken,
            dt,
            ( strike ) => {
                const v = this.state.players.get( strike.victimId );
                if ( v ) v.stunTimer = stunDurationForShip( v.shipId, this.config );
                this.broadcast( 'hit', strike );
            },
            this.config,
        );
        this.mirrorBreaks();
        stepPickups(
            this.state.players.values(),
            this.pickups,
            this.state.pickupTaken,
            this.pickupRespawn,
            dt,
            this.config,
        );
    }

    private mirrorBreaks(): void {
        if ( this.blocks.broken.size === this.state.blockBroken.size ) return;
        for ( const id of this.blocks.broken ) {
            const key = String( id );
            if ( ! this.state.blockBroken.has( key ) ) this.state.blockBroken.set( key, true );
        }
    }

    private clearCombat(): void {
        this.state.projectiles.clear();
        this.state.pickupTaken.clear();
        this.state.blockBroken.clear();
        this.blocks.broken.clear();
        this.pickupRespawn.clear();
        this.nextProjectileId = 0;
        this.state.players.forEach( ( p ) => {
            p.heldPower = HeldPower.none;
        } );
    }

    private startRace(): void {
        let index = 0;
        this.state.players.forEach( ( p ) => {
            p.spectating = false;
            resetPlayerForRace( p, index++ );
        } );
        this.queues.forEach( ( q ) => {
            q.length = 0;
        } );
        this.clearCombat();
        this.state.elapsed = 0;
        this.state.finishDeadline = 0;
        this.state.countdown = COUNTDOWN_SECONDS;
        this.state.phase = PHASE.countdown;
        this.refreshMetadata();
    }

    private resetToLobby(): void {
        let index = 0;
        this.state.players.forEach( ( p ) => {
            p.spectating = false;
            resetPlayerForRace( p, index++ );
        } );
        this.clearCombat();
        this.state.elapsed = 0;
        this.state.finishDeadline = 0;
        this.state.countdown = 0;
        this.state.phase = PHASE.lobby;
        this.refreshMetadata();
    }

    onJoin( client: Client, options?: { name?: string } ): void {
        const p = new PlayerState();
        p.name = options?.name?.trim().slice( 0, MAX_NAME ) || 'Racer';
        p.colorId = this.state.players.size % COLOR_COUNT;
        p.spectating = shouldSpectateOnJoin( this.state.phase );
        if ( ! p.spectating ) {
            p.x = this.state.players.size * START_STAGGER;
            p.lastSafeX = p.x;
        }
        this.state.players.set( client.sessionId, p );
        this.queues.set( client.sessionId, [] );
        if ( this.state.hostId === '' ) this.state.hostId = client.sessionId;
        this.refreshMetadata();
    }

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

    onLeave( client: Client ): void {
        this.queues.delete( client.sessionId );
        this.state.players.delete( client.sessionId );
        this.reassignHost();
    }

    private reassignHost(): void {
        if ( this.state.hostId && this.state.players.has( this.state.hostId ) ) return;
        this.state.hostId = ( this.state.players.keys().next().value as string | undefined ) ?? '';
        this.refreshMetadata();
    }

    private refreshMetadata(): void {
        const host = this.state.hostId ? this.state.players.get( this.state.hostId ) : undefined;
        void this.setMetadata( { hostName: host?.name ?? '', phase: this.state.phase } );
    }
}
