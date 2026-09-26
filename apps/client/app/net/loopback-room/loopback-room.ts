import { Decoder, Encoder } from '@colyseus/schema';
import { addEffect } from '@react-three/fiber';
import {
    DROP_POWERUP_MESSAGE,
    INPUT_MESSAGE,
    type InputMessage,
    type PowerSlotMessage,
    RESTART_MESSAGE,
    RunSim,
    RunState,
    SET_CLASS_MESSAGE,
    SET_COLOR_MESSAGE,
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

export class LoopbackRoom implements RunRoomLike {
    readonly roomId = LOOPBACK_ROOM_ID;
    readonly sessionId = LOOPBACK_SESSION_ID;
    readonly sim: RunSim;
    readonly serializer: { readonly decoder: Decoder< RunState > };

    private readonly encoder: Encoder< RunState >;
    private readonly handlers = new Map< string, Set< Handler > >();
    private readonly outbox: [ string, unknown ][] = [];
    private readonly commands: Record< string, Handler >;
    private sincePatch = 0;

    constructor( descriptor: TrackDescriptor, name?: string ) {
        this.sim = new RunSim( descriptor, {
            broadcast: ( type, message ) => this.outbox.push( [ type, structuredClone( message ) ] ),
            onMeta: () => {},
        } );
        const id = this.sessionId;
        this.commands = {
            [ INPUT_MESSAGE ]: ( p ) => this.sim.input( id, p as InputMessage ),
            [ SET_CLASS_MESSAGE ]: ( p ) => this.sim.setClass( id, p ),
            [ SET_COLOR_MESSAGE ]: ( p ) => this.sim.setColor( id, p ),
            [ START_MESSAGE ]: () => this.sim.start( id ),
            [ RESTART_MESSAGE ]: () => this.sim.restart( id ),
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

    step( seconds: number ): void {
        this.sim.advance( seconds );
        this.deliver();
        this.sincePatch += seconds;
        if ( this.sincePatch < LOOPBACK_PATCH_SECONDS ) return;
        this.sincePatch %= LOOPBACK_PATCH_SECONDS;
        this.patch();
    }

    run(): () => void {
        let last = -1;
        return addEffect( ( timestamp ) => {
            const seconds = last < 0 ? 0 : Math.min( ( timestamp - last ) / 1000, LOOPBACK_MAX_FRAME_SECONDS );
            last = timestamp;
            this.step( seconds );
        } );
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
