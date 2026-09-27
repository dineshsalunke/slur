import { BOUNCE_MESSAGE, type BounceMessage, FIXED_DT, tuningForShip } from '@slur/shared';
import { typingTarget } from '../../../dev/typing-target';
import type { LoopbackRoom } from '../../../net/loopback-room/loopback-room';
import { editorOpen } from '../test-level-canvas/pause-while-editing/pause-while-editing.state';
import { MAX_TAKES, RECORD_KEY } from './flight-recorder.constants';
import {
    breaksRun,
    emptyTake,
    eventsBetween,
    type FlightSnap,
    type FlightTake,
    pushPoint,
    snapOf,
    speedBand,
} from './flight-recorder.utils';

export interface RecorderView {
    recording: boolean;
    seconds: number;
    takes: readonly FlightTake[];
}

const listeners = new Set< () => void >();

let view: RecorderView = { recording: false, seconds: 0, takes: [] };
let current: FlightTake | null = null;
let prev: FlightSnap | null = null;
let nextId = 1;
let detach: ( () => void ) | null = null;

function publish( patch: Partial< RecorderView > ): void {
    view = { ...view, ...patch };
    for ( const listener of listeners ) listener();
}

export function subscribeRecorder( listener: () => void ): () => void {
    listeners.add( listener );
    return () => {
        listeners.delete( listener );
    };
}

export function recorderView(): RecorderView {
    return view;
}

function sample( room: LoopbackRoom ): void {
    if ( current === null ) return;
    const ship = room.sim.state.players.get( room.sessionId );
    if ( ship === undefined ) return;
    const next = snapOf( ship, ship.slots );
    if ( prev !== null ) {
        for ( const kind of eventsBetween( prev, next ) ) current.events.push( { kind, x: next.x, z: next.z } );
    }
    if ( ! next.dead ) {
        const band = speedBand( ship.vz, tuningForShip( ship.shipId ).maxCruise );
        pushPoint( current, { x: next.x, z: next.z, band }, breaksRun( prev, next ) );
    }
    prev = next;
    current.ticks += 1;
    const seconds = Math.floor( current.ticks * FIXED_DT );
    if ( seconds !== view.seconds ) publish( { seconds } );
}

export function attachRecorder( room: LoopbackRoom ): void {
    stopTake();
    detach?.();
    const offTick = room.onTick( () => sample( room ) );
    const offBump = room.onMessage< BounceMessage >( BOUNCE_MESSAGE, ( m ) => {
        if ( current !== null && m.victimId === room.sessionId )
            current.events.push( { kind: 'bump', x: m.x, z: m.z } );
    } );
    detach = () => {
        offTick();
        offBump();
    };
}

export function startTake(): void {
    if ( current !== null ) return;
    current = emptyTake( nextId++ );
    prev = null;
    publish( { recording: true, seconds: 0 } );
}

export function stopTake(): void {
    if ( current === null ) return;
    const take = current;
    current = null;
    prev = null;
    const takes = take.runs.length > 0 ? [ take, ...view.takes ].slice( 0, MAX_TAKES ) : view.takes;
    publish( { recording: false, seconds: 0, takes } );
}

export function clearTakes(): void {
    publish( { takes: [] } );
}

function recordKey( e: KeyboardEvent ): void {
    if ( e.code !== RECORD_KEY || e.repeat || e.metaKey || e.ctrlKey || e.altKey ) return;
    if ( typingTarget( e.target ) || editorOpen.on ) return;
    if ( current === null ) startTake();
    else stopTake();
}

export function attachRecordKey(): () => void {
    addEventListener( 'keydown', recordKey );
    return () => removeEventListener( 'keydown', recordKey );
}
