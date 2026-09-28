import { type Client, Room } from '@colyseus/core';
import {
    DEFAULT_TRACK_GEN,
    DROP_POWERUP_MESSAGE,
    INPUT_MESSAGE,
    type InputMessage,
    isTrackGen,
    type PowerSlotMessage,
    procgenDescriptor,
    RESTART_MESSAGE,
    type RunMetadata,
    RunSim,
    type RunState,
    SET_CLASS_MESSAGE,
    SET_COLOR_MESSAGE,
    START_MESSAGE,
    USE_POWERUP_MESSAGE,
} from '@slur/shared';
import { logEvent, phaseLogger } from '../log.js';

const RECONNECT_SECONDS = 20;

export class RunRoom extends Room< { state: RunState; metadata: RunMetadata } > {
    maxClients = 12;

    sim!: RunSim;

    onCreate(): void {
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
        this.onMessage< PowerSlotMessage >( USE_POWERUP_MESSAGE, ( client, msg ) =>
            this.sim.usePower( client.sessionId, msg ),
        );
        this.onMessage< PowerSlotMessage >( DROP_POWERUP_MESSAGE, ( client, msg ) =>
            this.sim.dropPower( client.sessionId, msg ),
        );

        this.setSimulationInterval( ( deltaMs ) => this.sim.advance( deltaMs / 1000 ) );
    }

    onJoin( client: Client, options?: { name?: string } ): void {
        this.sim.join( client.sessionId, options?.name );
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
        }
    }

    onReconnect( client: Client ): void {
        this.sim.reconnect( client.sessionId );
        logEvent( 'client.reconnect', { room: this.roomId, session: client.sessionId } );
    }

    onLeave( client: Client ): void {
        this.sim.leave( client.sessionId );
        logEvent( 'client.leave', { room: this.roomId, session: client.sessionId, players: this.state.players.size } );
    }

    onDispose(): void {
        logEvent( 'room.dispose', { room: this.roomId } );
    }
}
