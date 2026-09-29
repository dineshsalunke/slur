import { describe, expect, it } from 'vitest';
import { buildSchedule, type FrameSchedule, type FrameSystem } from './schedule';

const noop = (): void => {};

const sys = ( id: string, phase: FrameSystem< null >[ 'phase' ], order: Partial< FrameSystem< null > > = {} ) => ( {
    id,
    phase,
    run: noop,
    ...order,
} );

const ids = ( schedule: FrameSchedule< null > ) =>
    schedule.map( ( [ phase, list ] ) => [ phase, list.map( ( s ) => s.id ) ] );

const SYSTEMS: FrameSystem< null >[] = [
    sys( 'camera', 'sync', { after: [ 'hover', 'fade' ] } ),
    sys( 'render', 'sync' ),
    sys( 'remote', 'sync' ),
    sys( 'hover', 'sync', { after: [ 'render', 'remote' ] } ),
    sys( 'fade', 'sync' ),
    sys( 'flight', 'simulate' ),
    sys( 'audio', 'react' ),
    sys( 'late', 'cleanup' ),
    sys( 'early', 'sync', { before: [ 'render' ] } ),
];

function shuffled< T >( list: readonly T[], seed: number ): T[] {
    const out = [ ...list ];
    let s = seed;
    for ( let i = out.length - 1; i > 0; i-- ) {
        s = ( s * 1103515245 + 12345 ) % 2147483648;
        const j = s % ( i + 1 );
        [ out[ i ], out[ j ] ] = [ out[ j ], out[ i ] ];
    }
    return out;
}

describe( 'buildSchedule', () => {
    it( 'orders by phase, then declared order, then id', () => {
        expect( ids( buildSchedule( SYSTEMS ) ) ).toEqual( [
            [ 'simulate', [ 'flight' ] ],
            [ 'sync', [ 'early', 'fade', 'remote', 'render', 'hover', 'camera' ] ],
            [ 'react', [ 'audio' ] ],
            [ 'cleanup', [ 'late' ] ],
        ] );
    } );

    it( 'gives the same schedule for any registration order', () => {
        const expected = ids( buildSchedule( SYSTEMS ) );
        for ( let seed = 1; seed <= 50; seed++ ) {
            expect( ids( buildSchedule( shuffled( SYSTEMS, seed ) ) ) ).toEqual( expected );
        }
    } );

    it( 'throws on a cycle and names it', () => {
        const cyclic = [
            sys( 'a', 'sync', { after: [ 'c' ] } ),
            sys( 'b', 'sync', { after: [ 'a' ] } ),
            sys( 'c', 'sync', { after: [ 'b' ] } ),
            sys( 'd', 'sync', { after: [ 'c' ] } ),
        ];
        expect( () => buildSchedule( cyclic ) ).toThrow( 'frame schedule: cycle a → b → c → a' );
    } );

    it( 'throws on a duplicate id', () => {
        expect( () => buildSchedule( [ sys( 'a', 'sync' ), sys( 'a', 'view' ) ] ) ).toThrow(
            'duplicate system id "a"',
        );
    } );

    it( 'throws on an unknown id', () => {
        expect( () => buildSchedule( [ sys( 'a', 'sync', { after: [ 'ghost' ] } ) ] ) ).toThrow(
            '"a" names unknown system "ghost"',
        );
    } );

    it( 'throws when an order crosses phases', () => {
        expect( () => buildSchedule( [ sys( 'a', 'simulate' ), sys( 'b', 'sync', { after: [ 'a' ] } ) ] ) ).toThrow(
            'cannot order against',
        );
    } );
} );
