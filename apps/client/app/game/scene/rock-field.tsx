import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Fragment, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { col, num } from '../../dev/tuning';
import { AsteroidBand } from './asteroid-band';
import { ASTEROID_BANDS, ROCK_FAR } from './asteroid-config';
import { packRockSurface, patchRock, prepareRockNormal, rockUniforms } from './asteroid-surface';
import { NEBULA_LIGHT } from './nebula-baker';

const ROCK_TEXTURES = [
    '/textures/dark-rock-diff.jpg',
    '/textures/dark-rock-arm.jpg',
    '/textures/dark-rock-normal.jpg',
];

export function RockField() {
    const [ diffuse, arm, normal ] = useTexture( ROCK_TEXTURES );
    const surface = useMemo(
        () => packRockSurface( diffuse.image as HTMLImageElement, arm.image as HTMLImageElement ),
        [ diffuse, arm ],
    );
    const uniforms = useMemo( () => rockUniforms( surface, prepareRockNormal( normal ) ), [ surface, normal ] );
    const material = useMemo( () => {
        const m = new THREE.MeshStandardMaterial( { metalness: 0, roughness: 1, fog: false } );
        patchRock( m, uniforms );
        return m;
    }, [ uniforms ] );
    const color = useRef( '' );

    // JUSTIFIED EFFECT — brackets the lifetime of a GPU texture and material we built ourselves.
    useEffect(
        () => () => {
            surface.dispose();
            material.dispose();
        },
        [ surface, material ],
    );

    useFrame( ( state ) => {
        uniforms.uRockTime.value = state.clock.elapsedTime;
        uniforms.uRockSpin.value = num( 'Rock.spin' );
        uniforms.uRockDrift.value = num( 'Rock.drift' );
        uniforms.uRockTexScale.value = num( 'Rock.textureScale' );
        uniforms.uRockNormalScale.value = num( 'Rock.normalScale' );
        uniforms.uRockRough.value = num( 'Rock.roughness' );
        uniforms.uRockDetail.value = num( 'Rock.detail' );
        uniforms.uRockFar.value = Math.min( ROCK_FAR, ( state.camera as THREE.PerspectiveCamera ).far );
        uniforms.uRockKeyDir.value.copy( NEBULA_LIGHT.direction ).normalize();
        uniforms.uRockKeyColor.value.copy( NEBULA_LIGHT.color ).multiplyScalar( num( 'Sky.keyLight' ) );
        material.envMapIntensity = num( 'Sky.environment' );
        const rock = col( 'Rock.color' );
        if ( rock !== color.current ) {
            color.current = rock;
            uniforms.uRockColor.value.set( rock );
        }
    } );

    return (
        <Fragment>
            { ASTEROID_BANDS.map( ( band ) => (
                <AsteroidBand key={ band.key } band={ band } material={ material } />
            ) ) }
        </Fragment>
    );
}
