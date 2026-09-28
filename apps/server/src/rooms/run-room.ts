import {
    type AuthContext,
    type Client,
    CloseCode,
    Room,
    type RoomException,
    type RoomMethodName,
    ServerError,
} from '@colyseus/core';
import {
    CHAT_HISTORY_MESSAGE,
    CHAT_LINE_MESSAGE,
    CHAT_SEND_MESSAGE,
    DEFAULT_TRACK_GEN,
    DROP_POWERUP_MESSAGE,
    END_RACE_MESSAGE,
    INPUT_MESSAGE,
    type InputMessage,
    isPublicCreate,
    isTrackGen,
    joinToken,
    KICK_MESSAGE,
    KICK_PHASES,
    KICKED_CODE,
    KICKED_MESSAGE,
    PHASE,
    type PowerSlotMessage,
    PUBLIC_ROOM_TAKEN_CODE,
    procgenDescriptor,
    RESTART_MESSAGE,
    type RunCreateOptions,
    type RunMetadata,
    RunSim,
    type RunState,
    SERVER_FULL_CODE,
    SET_CLASS_MESSAGE,
    SET_COLOR_MESSAGE,
    START_MESSAGE,
    USE_POWERUP_MESSAGE,
} from '@slur/shared';
import { clientIp } from '../client-ip.js';
import { createQuota } from '../create-quota.js';
import { MAX_MESSAGES_PER_SECOND, SEAT_RESERVATION_SECONDS } from '../limits.js';
import { logEvent, phaseLogger } from '../log.js';
import { cleanName } from '../moderation/profanity.js';
import { ChatLog } from './chat-log.js';
import { roomCodes } from './room-codes.js';

const RECONNECT_SECONDS = 20;

export class RunRoom extends Room< { state: RunState; metadata: RunMetadata } > {
    maxClients = 12;
    maxMessagesPerSecond = MAX_MESSAGES_PER_SECOND;
    seatReservationTimeout = SEAT_RESERVATION_SECONDS;

    sim!: RunSim;

    readonly chat = new ChatLog();
    private readonly tokens = new Map< string, string >();
    private readonly kicked = new Set< string >();

    onCreate( options?: RunCreateOptions ): void {
        if ( createQuota.full() ) throw new ServerError( SERVER_FULL_CODE, 'The server is full' );
        const listed = isPublicCreate( options );
        if ( listed && roomCodes.publicRoom() !== null ) {
            throw new ServerError( PUBLIC_ROOM_TAKEN_CODE, 'Quick play is full' );
        }
        this.roomId = roomCodes.claim();
        createQuota.opened( this.roomId );
        if ( listed ) roomCodes.claimPublic( this.roomId );
        else void this.setPrivate( true );
        const envGen = process.env.SLUR_TRACK_GEN;
        const gen = isTrackGen( envGen ) ? envGen : DEFAULT_TRACK_GEN;
        const descriptor = procgenDescriptor( ( Math.random() * 0xffffffff ) >>> 0, gen );
        logEvent( 'room.create', { room: this.roomId, gen } );
        const logPhase = phaseLogger( this.roomId );
        this.sim = new RunSim( descriptor, {
            broadcast: ( type, message ) => this.broadcast( type, message ),
            onMeta: ( meta ) => {
                void this.setMetadata( meta );
                logPhase( meta.phase );
            },
        } );
        this.state = this.sim.state;
        this.patchRate = 50;

        this.onMessage< InputMessage >( INPUT_MESSAGE, ( client, msg ) => this.sim.input( client.sessionId, msg ) );
        this.onMessage( SET_CLASS_MESSAGE, ( client, shipId ) => this.sim.setClass( client.sessionId, shipId ) );
        this.onMessage( SET_COLOR_MESSAGE, ( client, colorId ) => this.sim.setColor( client.sessionId, colorId ) );
        this.onMessage( START_MESSAGE, ( client ) => this.sim.start( client.sessionId ) );
        this.onMessage( RESTART_MESSAGE, ( client ) => this.sim.restart( client.sessionId ) );
        this.onMessage( END_RACE_MESSAGE, ( client ) => this.sim.endRace( client.sessionId ) );
        this.onMessage< PowerSlotMessage >( USE_POWERUP_MESSAGE, ( client, msg ) =>
            this.sim.usePower( client.sessionId, msg ),
        );
        this.onMessage< PowerSlotMessage >( DROP_POWERUP_MESSAGE, ( client, msg ) =>
            this.sim.dropPower( client.sessionId, msg ),
        );
        this.onMessage( KICK_MESSAGE, ( client, targetId ) => this.kick( client, targetId ) );
        this.onMessage( CHAT_SEND_MESSAGE, ( client, text ) => this.postChat( client, text ) );
        this.onMessage( CHAT_HISTORY_MESSAGE, ( client ) => {
            const lines = this.chat.historyFor( client.sessionId, Date.now() );
            if ( lines ) client.send( CHAT_HISTORY_MESSAGE, lines );
        } );

        this.setSimulationInterval( ( deltaMs ) => this.sim.advance( deltaMs / 1000 ) );
    }

    onAuth( _client: Client, options: unknown, context: AuthContext ): boolean {
        const token = joinToken( options );
        if ( token && this.kicked.has( token ) )
            throw new ServerError( KICKED_CODE, 'The host removed you from this run' );
        createQuota.owned( this.roomId, clientIp( context ), Date.now() );
        return true;
    }

    onJoin( client: Client, options?: { name?: unknown } ): void {
        const token = joinToken( options );
        if ( token ) this.tokens.set( client.sessionId, token );
        this.sim.join( client.sessionId, cleanName( options?.name ) );
        logEvent( 'client.join', { room: this.roomId, session: client.sessionId, players: this.state.players.size } );
    }

    async onDrop( client: Client ): Promise< void > {
        this.sim.drop( client.sessionId );
        logEvent( 'client.drop', { room: this.roomId, session: client.sessionId } );
        try {
            await this.allowReconnection( client, RECONNECT_SECONDS );
            this.sim.reconnect( client.sessionId );
        } catch {
            this.sim.leave( client.sessionId );
            this.tokens.delete( client.sessionId );
        }
    }

    onReconnect( client: Client ): void {
        this.sim.reconnect( client.sessionId );
        logEvent( 'client.reconnect', { room: this.roomId, session: client.sessionId } );
    }

    onLeave( client: Client ): void {
        this.sim.leave( client.sessionId );
        this.chat.forget( client.sessionId );
        this.tokens.delete( client.sessionId );
        logEvent( 'client.leave', { room: this.roomId, session: client.sessionId, players: this.state.players.size } );
    }

    onDispose(): void {
        roomCodes.release( this.roomId );
        createQuota.closed( this.roomId );
        logEvent( 'room.dispose', { room: this.roomId } );
    }

    onUncaughtException( error: RoomException, method: RoomMethodName ): void {
        logEvent( 'room.error', { room: this.roomId, method, error: JSON.stringify( error.message ) } );
    }

    private kick( host: Client, targetId: unknown ): void {
        if ( host.sessionId !== this.state.hostId || typeof targetId !== 'string' || targetId === host.sessionId )
            return;
        if ( ! KICK_PHASES.includes( this.state.phase ) ) return;
        const target = this.clients.getById( targetId );
        if ( ! target ) return;
        const token = this.tokens.get( targetId );
        if ( token ) this.kicked.add( token );
        if ( this.chat.purge( targetId ) ) this.broadcast( CHAT_HISTORY_MESSAGE, this.chat.history() );
        target.send( KICKED_MESSAGE );
        target.leave( CloseCode.CONSENTED );
        logEvent( 'client.kick', { room: this.roomId, session: targetId } );
    }

    private postChat( client: Client, text: unknown ): void {
        const p = this.state.players.get( client.sessionId );
        if ( ! p || this.state.phase !== PHASE.lobby ) return;
        const line = this.chat.post( { id: client.sessionId, name: p.name, colorId: p.colorId }, text, Date.now() );
        if ( line ) this.broadcast( CHAT_LINE_MESSAGE, line );
    }
}
