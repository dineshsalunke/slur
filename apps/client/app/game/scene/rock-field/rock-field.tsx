import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Fragment, useEffect, useMemo, useRef } from 'react';
import type * as THREE from 'three';
import { col, num } from '../../../dev/tuning';
import { accent } from '../accent';
import { AsteroidBand } from '../asteroid-band/asteroid-band';
import { ASTEROID_BANDS, ROCK_FAR } from '../asteroid-config';
import { packRockSurface, patchRock, prepareRockNormal, rockUniforms } from '../asteroid-surface';
import { MeteorChunks } from '../meteor-chunks';
import { MeteorStrikes } from '../meteor-strikes';
import { NEBULA_LIGHT } from '../nebula-baker';
import { prefersReducedMotion } from '../reduced-motion';
import { ROCK_TEXTURES } from './rock-field.constants';
import { rockMaterial } from './rock-field.utils';

export function RockField() {
    const [ diffuse, arm, normal ] = useTexture( ROCK_TEXTURES );
    const surface = useMemo(
        () => packRockSurface( diffuse.image as HTMLImageElement, arm.image as HTMLImageElement ),
        [ diffuse, arm ],
    );
    const uniforms = useMemo( () => rockUniforms( surface, prepareRockNormal( normal ) ), [ surface, normal ] );
    const field = useMemo( () => {
        const m = rockMaterial();
        patchRock( m, uniforms );
        return m;
    }, [ uniforms ] );
    const loose = useMemo( () => {
        const m = rockMaterial();
        patchRock( m, uniforms, true );
        return m;
    }, [ uniforms ] );
    const color = useRef( '' );
    const still = useMemo( prefersReducedMotion, [] );

    // JUSTIFIED EFFECT — brackets the lifetime of a GPU texture and materials we built ourselves.
    useEffect(
        () => () => {
            surface.dispose();
            field.dispose();
            loose.dispose();
        },
        [ surface, field, loose ],
    );

    useFrame( ( state ) => {
        uniforms.uRockTime.value = still ? 0 : state.clock.elapsedTime;
        uniforms.uRockSpin.value = num( 'Rock.spin' );
        uniforms.uRockSpeed.value = num( 'Rock.speed' );
        uniforms.uRockCycle.value = num( 'Rock.cycle' );
        uniforms.uRockTexScale.value = num( 'Rock.textureScale' );
        uniforms.uRockNormalScale.value = num( 'Rock.normalScale' );
        uniforms.uRockRough.value = num( 'Rock.roughness' );
        uniforms.uRockDetail.value = num( 'Rock.detail' );
        uniforms.uRockFar.value = Math.min( ROCK_FAR, ( state.camera as THREE.PerspectiveCamera ).far );
        uniforms.uRockKeyDir.value.copy( NEBULA_LIGHT.direction ).normalize();
        uniforms.uRockKeyColor.value.copy( NEBULA_LIGHT.color ).multiplyScalar( num( 'Sky.keyLight' ) );
        uniforms.uRockHeatColor.value.copy( accent() ).multiplyScalar( num( 'Rock.heat' ) );
        field.envMapIntensity = num( 'Sky.environment' );
        loose.envMapIntensity = field.envMapIntensity;
        const rock = col( 'Rock.color' );
        if ( rock !== color.current ) {
            color.current = rock;
            uniforms.uRockColor.value.set( rock );
        }
    } );

    return (
        <Fragment>
            { ASTEROID_BANDS.map( ( band ) => (
                <AsteroidBand key={ band.key } band={ band } material={ field } />
            ) ) }
            <MeteorStrikes material={ loose } />
            <MeteorChunks material={ loose } />
        </Fragment>
    );
}
