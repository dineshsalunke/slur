import { CELL, HALF_WIDTH, makeProcgenTrack, type Track } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import type { Cord } from './track-rim/track-rim';
import { CORD_RADIUS } from './track-rim/track-rim.constants';
import { buildCords, floorAt } from './track-rim/track-rim.utils';

const SEED = 20260921;
const LENGTH = 60;

const gapTrack = (): Track => makeProcgenTrack( { kind: 'procgen', seed: SEED, tier: 0, length: LENGTH } );

function sides( c: Cord ): Array< [ number, number ] > {
    const reach = CELL / 2;
    return c.alongZ
        ? [
              [ c.x - reach, c.z ],
              [ c.x + reach, c.z ],
          ]
        : [
              [ c.x, c.z - reach ],
              [ c.x, c.z + reach ],
          ];
}

describe( 'gap rim cords', () => {
    it( 'a track with gaps traces cords along its edges', () => {
        expect( buildCords( gapTrack() ).length ).toBeGreaterThan( 0 );
    } );

    it( 'every cord has floor on one side and void on the other', () => {
        const track = gapTrack();
        const bad = buildCords( track ).filter(
            ( c ) => sides( c ).filter( ( [ x, z ] ) => floorAt( track, x, z, 0 ) ).length !== 1,
        );
        expect( bad ).toEqual( [] );
    } );

    it( 'cords sit on the deck plane and overlap at the corners', () => {
        for ( const c of buildCords( gapTrack() ) ) {
            expect( c.y ).toBe( 0 );
            expect( c.length ).toBeGreaterThanOrEqual( CELL + 2 * CORD_RADIUS );
        }
    } );

    it( 'the outer boundary keeps its rail, never a cord', () => {
        const track = gapTrack();
        const onBoundary = buildCords( track ).filter(
            ( c ) => c.alongZ && Math.abs( Math.abs( c.x ) - HALF_WIDTH ) < 1e-4,
        );
        for ( const c of onBoundary ) {
            const inward = c.x < 0 ? c.x + CELL / 2 : c.x - CELL / 2;
            expect( floorAt( track, inward, c.z, 0 ) ).toBe( true );
        }
    } );
} );
