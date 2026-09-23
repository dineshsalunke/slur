import { tuningForShip } from '@slur/shared';
import { createWorld, type Entity } from 'koota';
import type * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { num } from '../../dev/tuning';
import { hoverSystem } from './hover';
import { Hover, LocalPlayer, Net, Render, Sim } from './traits';

const DT = 1 / 60;
const SETTLE_FRAMES = 600;

function hoverOf( entity: Entity ): { lift: number; applied: number } {
    const h = entity.get( Hover );
    if ( ! h ) throw new Error( 'entity has no Hover trait' );
    return h;
}

function ship( vz: number ) {
    const world = createWorld();
    const entity = world.spawn( LocalPlayer, Render, Hover, Sim, Net );
    entity.set( Sim, ( prev ) => ( { ...prev, vz } ) );
    return { world, entity, group: entity.get( Render ) as THREE.Group };
}

function settle( vz: number ): number {
    const { world, entity, group } = ship( vz );
    for ( let i = 0; i < SETTLE_FRAMES; i++ ) {
        group.position.y = 0;
        hoverSystem( world, DT );
    }
    return hoverOf( entity ).lift;
}

describe( 'hoverSystem', () => {
    it( 'reports the exact offset it wrote into the render group', () => {
        const { world, entity, group } = ship( 40 );
        for ( let i = 0; i < 120; i++ ) {
            group.position.y = 0;
            hoverSystem( world, DT );
            expect( group.position.y ).toBe( hoverOf( entity ).applied );
        }
    } );

    it( 'settles at the base lift when stopped', () => {
        expect( settle( 0 ) ).toBeCloseTo( num( 'Hover.base' ), 6 );
    } );

    it( 'settles higher the faster the ship goes', () => {
        const top = tuningForShip( 'split-crown' ).maxCruise;
        expect( settle( top ) ).toBeCloseTo( num( 'Hover.base' ) + num( 'Hover.speedLift' ), 6 );
        expect( settle( top ) ).toBeGreaterThan( settle( top / 2 ) );
        expect( settle( top / 2 ) ).toBeGreaterThan( settle( 0 ) );
    } );

    it( 'does not lift further past the ship top speed', () => {
        const top = tuningForShip( 'split-crown' ).maxCruise;
        expect( settle( top * 3 ) ).toBeCloseTo( settle( top ), 6 );
    } );
} );
