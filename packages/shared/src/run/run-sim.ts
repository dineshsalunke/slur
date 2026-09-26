import { canFire, dropPower, isSlot } from '../combat/combat-step.js';
import { HeldPower, POWER_SLOTS, type PowerSlotMessage } from '../combat/constants.js';
import { type Pickup, pickupsOf } from '../combat/pickups.js';
import { dropShield } from '../combat/shield.js';
import { COLOR_COUNT, COUNTDOWN_SECONDS, FIXED_DT, RACE_GRACE_SECONDS } from '../constants.js';
import {
    isColorId,
    PHASE,
    type RunMetadata,
    raceShouldEnd,
    resetPlayerForRace,
    shouldSpectateOnJoin,
    startGridX,
} from '../race/director.js';
import { applyDescriptor, PlayerState, RunState } from '../schema.js';
import { isShipId } from '../ship-classes.js';
import { createFixedStep } from '../sim/fixed-step.js';
import type { InputMessage } from '../sim/input.js';
import type { Track } from '../sim/space.js';
import { resolveTrack, type TrackDescriptor } from '../sim/track-provider.js';
import { createSimWorld, froundSimShip } from '../sim/types.js';
import { DEFAULT_SIM_CONFIG, type SimConfig } from '../sim-config.js';
import { type Broadcast, firePower, stepCombat } from './combat.js';
import {
    clearQueue,
    emptyQueue,
    enqueueFire,
    enqueueInputs,
    type FireIntent,
    inputsThisTick,
    type PlayerQueue,
    takeFire,
} from './input-queue.js';
import { type RaceWorld, stepRacer } from './racer.js';

const MAX_NAME = 16;

export interface RunSimHooks {
    broadcast: Broadcast;
    onMeta: ( meta: RunMetadata ) => void;
}

export interface RunSimOptions {
    countdownSeconds?: number;
}

export class RunSim {
    readonly state = new RunState();
    readonly queues = new Map< string, PlayerQueue >();

    private readonly clock = createFixedStep( FIXED_DT );
    private readonly track: Track;
    private readonly world: RaceWorld;
    private readonly pickups: Pickup[];
    private readonly pickupRespawn = new Map< string, number >();
    private readonly config: SimConfig = DEFAULT_SIM_CONFIG;
    private nextProjectileId = 0;
    private readonly countdownSeconds: number;

    constructor(
        descriptor: TrackDescriptor,
        private readonly hooks: RunSimHooks,
        options: RunSimOptions = {},
    ) {
        this.countdownSeconds = options.countdownSeconds ?? COUNTDOWN_SECONDS;
        applyDescriptor( this.state.descriptor, descriptor );
        this.track = resolveTrack( descriptor );
        this.world = { track: this.track, config: this.config, blocks: createSimWorld() };
        this.pickups = pickupsOf( this.track );
        this.refreshMetadata();
    }

    advance( seconds: number ): void {
        this.clock( seconds, ( dt ) => this.fixedStep( dt ) );
    }

    fixedStep( dt: number ): void {
        switch ( this.state.phase ) {
            case PHASE.countdown: {
                this.state.countdown -= dt;
                if ( this.state.countdown <= 0 ) {
                    this.state.countdown = 0;
                    this.state.phase = PHASE.racing;
                    this.queues.forEach( clearQueue );
                    this.refreshMetadata();
                }
                break;
            }
            case PHASE.racing:
                this.stepRace( dt );
                stepCombat(
                    {
                        state: this.state,
                        track: this.track,
                        broken: this.world.blocks.broken,
                        config: this.config,
                        broadcast: this.hooks.broadcast,
                        pickups: this.pickups,
                        pickupRespawn: this.pickupRespawn,
                    },
                    dt,
                );
                for ( const p of this.state.players.values() ) froundSimShip( p );
                break;
        }
    }

    input( sessionId: string, msg: InputMessage | undefined ): void {
        const q = this.queues.get( sessionId );
        if ( q ) enqueueInputs( q, msg?.inputs );
    }

    setClass( sessionId: string, shipId: unknown ): void {
        if ( this.state.phase !== PHASE.lobby || ! isShipId( shipId ) ) return;
        const p = this.state.players.get( sessionId );
        if ( p ) p.shipId = shipId;
    }

    setColor( sessionId: string, colorId: unknown ): void {
        if ( this.state.phase !== PHASE.lobby || ! isColorId( colorId ) ) return;
        const p = this.state.players.get( sessionId );
        if ( p ) p.colorId = colorId;
    }

    start( sessionId: string ): void {
        if ( sessionId === this.state.hostId && this.state.phase === PHASE.lobby ) this.startRace();
    }

    restart( sessionId: string ): void {
        if ( sessionId === this.state.hostId && this.state.phase === PHASE.finished ) this.resetToLobby();
    }

    usePower( sessionId: string, msg: PowerSlotMessage | undefined ): void {
        if ( this.state.phase !== PHASE.racing ) return;
        const q = this.queues.get( sessionId );
        const p = this.state.players.get( sessionId );
        if ( ! q || ! p ) return;
        enqueueFire( q, msg );
        this.fireReady( p, sessionId, q );
    }

    dropPower( sessionId: string, msg: PowerSlotMessage | undefined ): void {
        if ( this.state.phase !== PHASE.racing ) return;
        const p = this.state.players.get( sessionId );
        if ( p && isSlot( msg?.slot ) ) dropPower( p, msg.slot );
    }

    join( sessionId: string, name?: string ): void {
        const p = new PlayerState();
        p.name = name?.trim().slice( 0, MAX_NAME ) || 'Racer';
        p.colorId = this.state.players.size % COLOR_COUNT;
        p.spectating = shouldSpectateOnJoin( this.state.phase );
        if ( ! p.spectating ) {
            p.x = startGridX( this.state.players.size );
            p.lastSafeX = p.x;
        }
        this.state.players.set( sessionId, p );
        this.queues.set( sessionId, emptyQueue() );
        if ( this.state.hostId === '' ) this.state.hostId = sessionId;
        this.refreshMetadata();
    }

    drop( sessionId: string ): void {
        const p = this.state.players.get( sessionId );
        if ( p ) p.connected = false;
        this.reassignHost();
    }

    reconnect( sessionId: string ): void {
        const p = this.state.players.get( sessionId );
        if ( p ) p.connected = true;
        this.reassignHost();
    }

    leave( sessionId: string ): void {
        this.queues.delete( sessionId );
        this.state.players.delete( sessionId );
        this.reassignHost();
    }

    resetToLobby(): void {
        this.resetRun( PHASE.lobby, 0 );
    }

    clearCombat(): void {
        this.state.projectiles.clear();
        this.state.seekers.clear();
        this.state.mines.clear();
        this.state.pickupTaken.clear();
        this.state.blockBroken.clear();
        this.world.blocks.broken.clear();
        this.pickupRespawn.clear();
        this.nextProjectileId = 0;
        this.state.players.forEach( ( p ) => {
            for ( let i = 0; i < POWER_SLOTS; i++ ) p.slots[ i ] = HeldPower.none;
            dropShield( p );
        } );
    }

    private stepPlayer( player: PlayerState, sessionId: string, dt: number ): void {
        const q = this.queues.get( sessionId );
        if ( ! q ) return;
        this.fireReady( player, sessionId, q );
        for ( let n = inputsThisTick( q.inputs.length ); n > 0; n-- ) {
            const input = q.inputs.shift();
            if ( ! input ) break;
            stepRacer( this.world, player, sessionId, input, dt, this.hooks.broadcast );
            this.fireReady( player, sessionId, q );
        }
    }

    private fireReady( player: PlayerState, sessionId: string, q: PlayerQueue ): void {
        for ( let f = takeFire( q, player.lastProcessedInput ); f; f = takeFire( q, player.lastProcessedInput ) )
            this.fire( player, sessionId, f );
    }

    private fire( player: PlayerState, sessionId: string, intent: FireIntent ): void {
        if ( ! canFire( player, intent.slot ) ) return;
        const ctx = {
            state: this.state,
            track: this.track,
            broken: this.world.blocks.broken,
            config: this.config,
            broadcast: this.hooks.broadcast,
        };
        firePower( ctx, String( this.nextProjectileId++ ), player, sessionId, intent.slot, intent.dir );
    }

    private stepRace( dt: number ): void {
        let racerCount = 0;
        let finishedCount = 0;
        this.state.players.forEach( ( player, sessionId ) => {
            if ( player.spectating ) return;
            racerCount++;
            if ( player.connected ) this.stepPlayer( player, sessionId, dt );
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

    private startRace(): void {
        this.queues.forEach( clearQueue );
        if ( this.countdownSeconds > 0 ) this.resetRun( PHASE.countdown, this.countdownSeconds );
        else this.resetRun( PHASE.racing, 0 );
    }

    private resetRun( phase: number, countdown: number ): void {
        let index = 0;
        this.state.players.forEach( ( p ) => {
            p.spectating = false;
            resetPlayerForRace( p, index++ );
        } );
        this.clearCombat();
        this.state.elapsed = 0;
        this.state.finishDeadline = 0;
        this.state.countdown = countdown;
        this.state.phase = phase;
        this.refreshMetadata();
    }

    private reassignHost(): void {
        const host = this.state.players.get( this.state.hostId );
        if ( host?.connected ) return;
        let next = host ? this.state.hostId : '';
        for ( const [ id, p ] of this.state.players ) {
            if ( p.connected ) {
                next = id;
                break;
            }
        }
        if ( next === '' ) next = ( this.state.players.keys().next().value as string | undefined ) ?? '';
        if ( next === this.state.hostId ) return;
        this.state.hostId = next;
        this.refreshMetadata();
    }

    private refreshMetadata(): void {
        const host = this.state.hostId ? this.state.players.get( this.state.hostId ) : undefined;
        this.hooks.onMeta( { hostName: host?.name ?? '', phase: this.state.phase } );
    }
}
