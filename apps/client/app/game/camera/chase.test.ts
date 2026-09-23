import { createWorld } from 'koota';
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { LocalPlayer, Net, Render, Sim } from '../ecs/traits';
import { updateChaseCamera } from './chase';

const VZ = 55;
const WARMUP_FRAMES = 300;
const MEASURED_FRAMES = 900;
const STEADY_DT = 1 / 60;

function fly( deltas: number[] ): number[] {
    const world = createWorld();
    const entity = world.spawn( LocalPlayer, Render, Sim, Net );
    const group = entity.get( Render ) as THREE.Group;
    const cam = new THREE.PerspectiveCamera();
    const gaps: number[] = [];

    entity.set( Sim, ( prev ) => ( { ...prev, vz: VZ } ) );

    for ( let i = 0; i < WARMUP_FRAMES; i++ ) {
        group.position.z += VZ * STEADY_DT;
        updateChaseCamera( cam, world, STEADY_DT );
    }
    for ( const dt of deltas ) {
        group.position.z += VZ * dt;
        updateChaseCamera( cam, world, dt );
        gaps.push( group.position.z - cam.position.z );
    }
    return gaps;
}

function swing( gaps: number[] ): number {
    return Math.max( ...gaps ) - Math.min( ...gaps );
}

describe( 'updateChaseCamera', () => {
    it( 'holds the ship at a constant depth in frame through a hitch', () => {
        const deltas = Array.from( { length: MEASURED_FRAMES }, ( _, i ) => ( i % 12 === 0 ? 0.05 : STEADY_DT ) );
        expect( swing( fly( deltas ) ) ).toBeLessThan( 1e-9 );
    } );

    it( 'holds the ship at a constant depth in frame through a vsync beat', () => {
        const deltas = Array.from( { length: MEASURED_FRAMES }, ( _, i ) => ( i % 4 === 3 ? 2 / 60 : STEADY_DT ) );
        expect( swing( fly( deltas ) ) ).toBeLessThan( 1e-9 );
    } );

    it( 'holds the ship at a constant depth in frame through frame-time jitter', () => {
        let seed = 7;
        const deltas = Array.from( { length: MEASURED_FRAMES }, () => {
            seed = ( seed * 1103515245 + 12345 ) % 2147483648;
            return STEADY_DT + ( seed / 2147483648 - 0.5 ) * 0.012;
        } );
        expect( swing( fly( deltas ) ) ).toBeLessThan( 1e-9 );
    } );
} );
