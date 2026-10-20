import { createWorld } from 'koota';
import { afterEach, describe, expect, it } from 'vitest';
import { mirrorLocalStatus, mirrorShipStatus, mirrorSpectating } from './status-tags';
import { Dead, LocalPlayer, Remote, Sim, Spectating, Stunned } from './traits';

const world = createWorld();

afterEach( () => world.reset() );

describe( 'mirrorShipStatus', () => {
    it( 'adds Dead and Stunned from the ship values', () => {
        const e = world.spawn( Remote );
        mirrorShipStatus( e, { dead: true, stunTimer: 0.2 } );
        expect( e.has( Dead ) ).toBe( true );
        expect( e.has( Stunned ) ).toBe( true );
    } );

    it( 'removes them when the ship recovers', () => {
        const e = world.spawn( Remote, Dead, Stunned );
        mirrorShipStatus( e, { dead: false, stunTimer: 0 } );
        expect( e.has( Dead ) ).toBe( false );
        expect( e.has( Stunned ) ).toBe( false );
    } );
} );

describe( 'mirrorLocalStatus', () => {
    it( 'follows the predicted local ship', () => {
        const e = world.spawn( LocalPlayer, Sim );
        e.set( Sim, ( prev ) => ( { ...prev, dead: true } ) );
        mirrorLocalStatus( world );
        expect( e.has( Dead ) ).toBe( true );
        e.set( Sim, ( prev ) => ( { ...prev, dead: false, stunTimer: 0.5 } ) );
        mirrorLocalStatus( world );
        expect( e.has( Dead ) ).toBe( false );
        expect( e.has( Stunned ) ).toBe( true );
    } );

    it( 'leaves remote ships alone', () => {
        const e = world.spawn( Remote, Sim );
        e.set( Sim, ( prev ) => ( { ...prev, dead: true } ) );
        mirrorLocalStatus( world );
        expect( e.has( Dead ) ).toBe( false );
    } );
} );

describe( 'mirrorSpectating', () => {
    it( 'toggles the Spectating tag', () => {
        const e = world.spawn( LocalPlayer );
        mirrorSpectating( e, true );
        expect( e.has( Spectating ) ).toBe( true );
        mirrorSpectating( e, false );
        expect( e.has( Spectating ) ).toBe( false );
    } );
} );
