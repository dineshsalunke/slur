import { SHIP_ORDER } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import { LAB_DEFAULT_SHIP } from './lab-defaults';
import { DEFAULT_LAB_LAYERS } from './lab-layers';

describe( 'the lab opens on something worth judging', () => {
    it( 'shows the ship and not the debug box', () => {
        expect( DEFAULT_LAB_LAYERS.ships ).toBe( true );
        expect( DEFAULT_LAB_LAYERS.shipBox ).toBe( false );
    } );

    it( 'names a ship that still exists', () => {
        expect( SHIP_ORDER ).toContain( LAB_DEFAULT_SHIP );
    } );

    it( 'opens on the Split Crown', () => {
        expect( LAB_DEFAULT_SHIP ).toBe( 'split-crown' );
    } );
} );
