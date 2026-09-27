import type { PortalState } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import { hoppedAhead } from './local-hop';
import { burstPortalHop, drainMineShocks, type MineShock } from './scene/mine-shock-events';

describe( 'hoppedAhead', () => {
    it( 'counts a forward step, including across the uint8 wrap', () => {
        expect( hoppedAhead( 3, 4 ) ).toBe( true );
        expect( hoppedAhead( 255, 0 ) ).toBe( true );
    } );

    it( 'counts the first hop of a run and ignores no change and a step back', () => {
        expect( hoppedAhead( 0, 1 ) ).toBe( true );
        expect( hoppedAhead( 4, 4 ) ).toBe( false );
        expect( hoppedAhead( 4, 3 ) ).toBe( false );
    } );
} );

describe( 'burstPortalHop', () => {
    const pair: PortalState = { ax: 2, ay: 0, az: 100, bx: -4, by: 1, bz: 160, ends: 2, armA: true, armB: true };

    it( 'collapses on the entry gate and bursts on the exit gate, not on the ship', () => {
        burstPortalHop( { x: 2.5, y: 0.8, z: 99.4 }, { x: -4, y: 1.8, z: 164.9 }, [ pair ] );
        const out: MineShock[] = [];
        drainMineShocks( ( e ) => out.push( e ) );
        expect( out ).toEqual( [
            { x: 2, y: 0, z: 100, kind: 'portalIn' },
            { x: -4, y: 1, z: 160, kind: 'portalOut' },
        ] );
    } );
} );
