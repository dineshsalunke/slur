import { Decoder, Encoder } from '@colyseus/schema';
import {
    DEFAULT_SIM_CONFIG,
    DROP_POWERUP_MESSAGE,
    END_RACE_MESSAGE,
    INPUT_MESSAGE,
    type InputMessage,
    type PowerSlotMessage,
    RESTART_MESSAGE,
    RunSim,
    type RunSimOptions,
    RunState,
    SET_CLASS_MESSAGE,
    SET_COLOR_MESSAGE,
    type SimConfig,
    START_MESSAGE,
    type TrackDescriptor,
    USE_POWERUP_MESSAGE,
} from '@slur/shared';
import type { RunRoomLike } from '../run-room-like';
import {
    LOOPBACK_MAX_FRAME_SECONDS,
    LOOPBACK_PATCH_SECONDS,
    LOOPBACK_ROOM_ID,
    LOOPBACK_SESSION_ID,
} from './loopback-room.constants';

type Handler = ( payload: unknown ) => void;

export interface LoopbackOptions extends RunSimOptions {
    name?: string;
}

export class LoopbackRoom implements RunRoomLike {
    readonly roomId = LOOPBACK_ROOM_ID;
    readonly sessionId = LOOPBACK_SESSION_ID;
    readonly sim: RunSim;
    readonly simConfig: SimConfig;
    readonly serializer: { readonly decoder: Decoder< RunState > };

    private readonly encoder: Encoder< RunState >;
    private readonly handlers = new Map< string, Set< Handler > >();
    private readonly tickListeners = new Set< () => void >();
    private readonly outbox: [ string, unknown ][] = [];
    private readonly commands: Record< string, Handler >;
    private sincePatch = 0;
    private pausedWhile: ( () => boolean ) | null = null;

    constructor( descriptor: TrackDescriptor, { name, ...options }: LoopbackOptions = {} ) {
        this.simConfig = options.config ?? DEFAULT_SIM_CONFIG;
        this.sim = new RunSim(
            descriptor,
            {
                broadcast: ( type, message ) => this.outbox.push( [ type, structuredClone( message ) ] ),
                onMeta: () => {},
                onTick: () => {
                    for ( const listener of this.tickListeners ) listener();
                },
            },
            { ...options, config: this.simConfig },
        );
        const id = this.sessionId;
        this.commands = {
            [ INPUT_MESSAGE ]: ( p ) => this.sim.input( id, p as InputMessage ),
            [ SET_CLASS_MESSAGE ]: ( p ) => this.sim.setClass( id, p ),
            [ SET_COLOR_MESSAGE ]: ( p ) => this.sim.setColor( id, p ),
            [ START_MESSAGE ]: () => this.sim.start( id ),
            [ RESTART_MESSAGE ]: () => this.sim.restart( id ),
            [ END_RACE_MESSAGE ]: () => this.sim.endRace( id ),
            [ USE_POWERUP_MESSAGE ]: ( p ) => this.sim.usePower( id, p as PowerSlotMessage ),
            [ DROP_POWERUP_MESSAGE ]: ( p ) => this.sim.dropPower( id, p as PowerSlotMessage ),
        };
        this.sim.join( id, name );
        this.encoder = new Encoder( this.sim.state );
        this.serializer = { decoder: new Decoder( new RunState() ) };
        this.serializer.decoder.decode( this.encoder.encodeAll() );
        this.encoder.discardChanges();
    }

    get state(): RunState {
        return this.serializer.decoder.state;
    }

    send( type: string, payload?: unknown ): void {
        this.commands[ type ]?.( structuredClone( payload ) );
    }

    onMessage< Payload >( type: string, callback: ( payload: Payload ) => void ): () => void {
        const set = this.handlers.get( type ) ?? new Set< Handler >();
        const handler = callback as Handler;
        set.add( handler );
        this.handlers.set( type, set );
        return () => set.delete( handler );
    }

    onTick( listener: () => void ): () => void {
        this.tickListeners.add( listener );
        return () => this.tickListeners.delete( listener );
    }

    step( seconds: number ): void {
        this.sim.advance( seconds );
        this.deliver();
        this.sincePatch += seconds;
        if ( this.sincePatch < LOOPBACK_PATCH_SECONDS ) return;
        this.sincePatch %= LOOPBACK_PATCH_SECONDS;
        this.patch();
    }

    run( paused: () => boolean = () => false ): () => void {
        this.pausedWhile = paused;
        return () => {
            if ( this.pausedWhile === paused ) this.pausedWhile = null;
        };
    }

    hostTick( seconds: number ): void {
        if ( this.pausedWhile === null || this.pausedWhile() ) return;
        this.step( Math.min( seconds, LOOPBACK_MAX_FRAME_SECONDS ) );
    }

    private deliver(): void {
        const batch = this.outbox.splice( 0 );
        for ( const [ type, payload ] of batch ) {
            for ( const handler of this.handlers.get( type ) ?? [] ) handler( payload );
        }
    }

    private patch(): void {
        if ( ! this.encoder.hasChanges ) return;
        this.serializer.decoder.decode( this.encoder.encode() );
        this.encoder.discardChanges();
    }
}
