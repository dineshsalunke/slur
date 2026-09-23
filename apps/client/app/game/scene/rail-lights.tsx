import { useFrame } from '@react-three/fiber';
import type { Track } from '@slur/shared';
import { Fragment, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { col, num } from '../../dev/tuning';
import { segmentCount } from './track-floor';
import { buildRailRuns, type RailRun } from './track-rails';

RectAreaLightUniformsLib.init();

const SLOTS_PER_SIDE = 1;

const forward = new THREE.Vector3();
const aim = new THREE.Vector3();

const settings = {
    intensity: 0,
    span: 0,
    thickness: 0,
    lift: 0,
    stride: 0,
    offset: 0,
};

function readSettings(): void {
    settings.intensity = num( 'RailLight.intensity' );
    settings.span = num( 'RailLight.span' );
    settings.thickness = num( 'RailLight.thickness' );
    settings.lift = num( 'RailLight.lift' );
    settings.stride = num( 'RailLight.stride' );
    settings.offset = num( 'RailLight.offset' );
}

function runContaining( runs: RailRun[], z: number ): RailRun | null {
    for ( const run of runs ) {
        if ( z >= run.z0 && z <= run.z1 ) return run;
    }
    return null;
}

function place( light: THREE.RectAreaLight, runs: RailRun[], z: number ): void {
    const run = runContaining( runs, z );

    if ( ! run ) {
        light.intensity = 0;
        return;
    }

    const y = run.y + settings.lift;
    light.intensity = settings.intensity;
    light.width = settings.span;
    light.height = settings.thickness;
    light.position.set( run.x, y, THREE.MathUtils.clamp( z, run.z0, run.z1 ) );
    aim.set( 0, y, light.position.z );
    light.lookAt( aim );
}

export function RailLights( { track }: { track: Track } ) {
    const sides = useMemo( () => {
        const runs = buildRailRuns( track, segmentCount( track ) );
        return [ runs.filter( ( run ) => run.x < 0 ), runs.filter( ( run ) => run.x > 0 ) ];
    }, [ track ] );

    const lights = useMemo(
        () => Array.from( { length: SLOTS_PER_SIDE * 2 }, () => new THREE.RectAreaLight( 0xffffff, 0, 1, 1 ) ),
        [],
    );

    const applied = useRef( '' );

    useFrame( ( state ) => {
        state.camera.getWorldDirection( forward );
        const heading = forward.z >= 0 ? 1 : -1;
        readSettings();

        const next = col( 'RailLight.color' );
        const recolor = next !== applied.current;
        if ( recolor ) applied.current = next;

        for ( let side = 0; side < 2; side++ ) {
            for ( let slot = 0; slot < SLOTS_PER_SIDE; slot++ ) {
                const light = lights[ side * SLOTS_PER_SIDE + slot ];
                if ( recolor ) light.color.set( next );
                place(
                    light,
                    sides[ side ],
                    state.camera.position.z + heading * ( settings.offset + slot * settings.stride ),
                );
            }
        }
    } );

    return (
        <Fragment>
            { lights.map( ( light ) => (
                <primitive key={ light.uuid } object={ light } />
            ) ) }
        </Fragment>
    );
}
