import type { RootState } from '@react-three/fiber';
import { FRAME_PHASE } from './frame-phase.constants';

export type FramePhase = keyof typeof FRAME_PHASE;

export interface FrameSystem< C > {
    id: string;
    phase: FramePhase;
    before?: readonly string[];
    after?: readonly string[];
    run: ( ctx: C, state: RootState, delta: number ) => void;
}

export type FrameSchedule< C > = readonly ( readonly [ FramePhase, readonly FrameSystem< C >[] ] )[];

interface Graph {
    next: Map< string, string[] >;
    prev: Map< string, string[] >;
}

export function buildSchedule< C >( systems: readonly FrameSystem< C >[] ): FrameSchedule< C > {
    const byId = new Map< string, FrameSystem< C > >();
    for ( const s of systems ) {
        if ( byId.has( s.id ) ) throw new Error( `frame schedule: duplicate system id "${ s.id }"` );
        byId.set( s.id, s );
    }
    const graph: Graph = { next: new Map(), prev: new Map() };
    for ( const s of systems ) {
        graph.next.set( s.id, [] );
        graph.prev.set( s.id, [] );
    }
    const link = ( from: string, to: string, owner: string ): void => {
        const a = byId.get( from );
        const b = byId.get( to );
        if ( ! a || ! b ) throw new Error( `frame schedule: "${ owner }" names unknown system "${ a ? to : from }"` );
        if ( a.phase !== b.phase ) {
            throw new Error(
                `frame schedule: "${ from }" (${ a.phase }) cannot order against "${ to }" (${ b.phase })`,
            );
        }
        graph.next.get( from )?.push( to );
        graph.prev.get( to )?.push( from );
    };
    for ( const s of systems ) {
        for ( const id of s.before ?? [] ) link( s.id, id, s.id );
        for ( const id of s.after ?? [] ) link( id, s.id, s.id );
    }
    const phases = ( Object.keys( FRAME_PHASE ) as FramePhase[] ).sort(
        ( a, b ) => FRAME_PHASE[ a ] - FRAME_PHASE[ b ],
    );
    const schedule: [ FramePhase, FrameSystem< C >[] ][] = [];
    for ( const phase of phases ) {
        const ids = systems.filter( ( s ) => s.phase === phase ).map( ( s ) => s.id );
        if ( ids.length === 0 ) continue;
        schedule.push( [ phase, sortPhase( ids, graph ).map( ( id ) => byId.get( id ) as FrameSystem< C > ) ] );
    }
    return schedule;
}

function sortPhase( ids: readonly string[], graph: Graph ): string[] {
    const waiting = new Map< string, number >();
    for ( const id of ids ) waiting.set( id, graph.prev.get( id )?.length ?? 0 );
    const ready = ids.filter( ( id ) => waiting.get( id ) === 0 );
    const order: string[] = [];
    while ( ready.length > 0 ) {
        ready.sort();
        const id = ready.shift() as string;
        waiting.delete( id );
        order.push( id );
        for ( const to of graph.next.get( id ) ?? [] ) {
            const left = ( waiting.get( to ) ?? 0 ) - 1;
            waiting.set( to, left );
            if ( left === 0 ) ready.push( to );
        }
    }
    if ( waiting.size > 0 ) throw new Error( `frame schedule: cycle ${ findCycle( waiting, graph ) }` );
    return order;
}

function findCycle( waiting: ReadonlyMap< string, number >, graph: Graph ): string {
    const path: string[] = [];
    let id = [ ...waiting.keys() ].sort()[ 0 ];
    while ( ! path.includes( id ) ) {
        path.push( id );
        id = ( graph.prev.get( id ) ?? [] ).filter( ( p ) => waiting.has( p ) ).sort()[ 0 ];
    }
    return [ ...path.slice( path.indexOf( id ) ), id ].reverse().join( ' → ' );
}

export function printSchedule< C >( name: string, schedule: FrameSchedule< C > ): void {
    for ( const [ phase, systems ] of schedule ) {
        for ( const s of systems ) console.info( `[frame:${ name }] ${ phase.padEnd( 9 ) } ${ s.id }` );
    }
}

export function scheduleSystems< C >( name: string, systems: readonly FrameSystem< C >[] ): FrameSchedule< C > {
    const schedule = buildSchedule( systems );
    if ( import.meta.env.DEV ) printSchedule( name, schedule );
    return schedule;
}
